import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Rate limiting algorithms
export enum RateLimitAlgorithm {
  TOKEN_BUCKET = 'token_bucket',
  SLIDING_WINDOW = 'sliding_window',
  FIXED_WINDOW = 'fixed_window'
}

// Rate limit configuration
export interface RateLimitConfig {
  algorithm: RateLimitAlgorithm;
  maxRequests: number;
  windowMs: number;
  burstLimit?: number; // For token bucket
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (identifier: string) => void;
}

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  totalHits: number;
}

// Default configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints (stricter)
  auth: {
    algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // Password reset (very strict)
  password_reset: {
    algorithm: RateLimitAlgorithm.FIXED_WINDOW,
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  
  // Email sending (prevent spam)
  email: {
    algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    burstLimit: 5,
  },
  
  // API endpoints (moderate)
  api: {
    algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Checkout/payment (careful balance)
  checkout: {
    algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    burstLimit: 3,
  },
  
  // Search/read operations (more lenient)
  search: {
    algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Webhooks (external services)
  webhook: {
    algorithm: RateLimitAlgorithm.FIXED_WINDOW,
    maxRequests: 1000,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Admin operations (trusted but limited)
  admin: {
    algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
    maxRequests: 500,
    windowMs: 60 * 1000, // 1 minute
  }
} as const;

// In-memory fallback store (for when database is unavailable)
const memoryStore = new Map<string, {
  count: number;
  timestamps: number[];
  resetTime: number;
  tokens?: number; // For token bucket
  lastRefill?: number; // For token bucket
}>();

export class RateLimiter {
  private supabase: any;
  private useDatabase: boolean;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.useDatabase = !!(supabaseUrl && supabaseKey);
    
    if (this.useDatabase) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });
    }
  }

  /**
   * Check rate limit for a given identifier and configuration
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig,
    endpointType?: keyof typeof RATE_LIMIT_CONFIGS
  ): Promise<RateLimitResult> {
    // Use preset config if endpoint type is provided
    const finalConfig = endpointType 
      ? { ...RATE_LIMIT_CONFIGS[endpointType], ...config }
      : config;

    try {
      // Try database-backed rate limiting first
      if (this.useDatabase) {
        return await this.checkDatabaseRateLimit(identifier, finalConfig);
      }
    } catch (error) {
      console.warn('Database rate limiting failed, falling back to memory:', error);
    }

    // Fallback to in-memory rate limiting
    return this.checkMemoryRateLimit(identifier, finalConfig);
  }

  /**
   * Database-backed rate limiting (distributed)
   */
  private async checkDatabaseRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const resetTime = now + config.windowMs;

    switch (config.algorithm) {
      case RateLimitAlgorithm.SLIDING_WINDOW:
        return await this.slidingWindowDatabase(identifier, config, now, windowStart, resetTime);
      
      case RateLimitAlgorithm.FIXED_WINDOW:
        return await this.fixedWindowDatabase(identifier, config, now, resetTime);
      
      case RateLimitAlgorithm.TOKEN_BUCKET:
        return await this.tokenBucketDatabase(identifier, config, now, resetTime);
      
      default:
        throw new Error(`Unsupported algorithm: ${config.algorithm}`);
    }
  }

  /**
   * Sliding window algorithm using database
   */
  private async slidingWindowDatabase(
    identifier: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number,
    resetTime: number
  ): Promise<RateLimitResult> {
    // Clean old entries and count current requests
    const { data: currentRequests, error: selectError } = await this.supabase
      .from('rate_limit_requests')
      .select('id, timestamp')
      .eq('identifier', identifier)
      .gte('timestamp', new Date(windowStart).toISOString())
      .order('timestamp', { ascending: false });

    if (selectError) {
      throw selectError;
    }

    const totalHits = currentRequests?.length || 0;
    const remaining = Math.max(0, config.maxRequests - totalHits);

    if (totalHits >= config.maxRequests) {
      const oldestRequest = currentRequests[currentRequests.length - 1];
      const retryAfter = oldestRequest 
        ? Math.ceil((new Date(oldestRequest.timestamp).getTime() + config.windowMs - now) / 1000)
        : Math.ceil(config.windowMs / 1000);

      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter,
        totalHits
      };
    }

    // Record this request
    const { error: insertError } = await this.supabase
      .from('rate_limit_requests')
      .insert({
        identifier,
        timestamp: new Date(now).toISOString(),
        endpoint_type: 'api' // Could be dynamic
      });

    if (insertError) {
      console.warn('Failed to record rate limit request:', insertError);
    }

    // Cleanup old entries periodically (1% chance)
    if (Math.random() < 0.01) {
      await this.cleanupOldEntries();
    }

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: remaining - 1,
      resetTime,
      totalHits: totalHits + 1
    };
  }

  /**
   * Fixed window algorithm using database
   */
  private async fixedWindowDatabase(
    identifier: string,
    config: RateLimitConfig,
    now: number,
    resetTime: number
  ): Promise<RateLimitResult> {
    const windowKey = `${identifier}:${Math.floor(now / config.windowMs)}`;

    // Get or create window record
    const { data: windowRecord, error: selectError } = await this.supabase
      .from('rate_limit_windows')
      .select('*')
      .eq('window_key', windowKey)
      .single();

    let currentCount = 0;
    
    if (!selectError && windowRecord) {
      currentCount = windowRecord.request_count;
    }

    if (currentCount >= config.maxRequests) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
        totalHits: currentCount
      };
    }

    // Increment counter
    const { error: upsertError } = await this.supabase
      .from('rate_limit_windows')
      .upsert({
        window_key: windowKey,
        identifier,
        request_count: currentCount + 1,
        window_start: new Date(Math.floor(now / config.windowMs) * config.windowMs).toISOString(),
        expires_at: new Date(resetTime).toISOString()
      });

    if (upsertError) {
      console.warn('Failed to update rate limit window:', upsertError);
    }

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - (currentCount + 1),
      resetTime,
      totalHits: currentCount + 1
    };
  }

  /**
   * Token bucket algorithm using database
   */
  private async tokenBucketDatabase(
    identifier: string,
    config: RateLimitConfig,
    now: number,
    resetTime: number
  ): Promise<RateLimitResult> {
    const burstLimit = config.burstLimit || config.maxRequests;
    const refillRate = config.maxRequests / (config.windowMs / 1000); // tokens per second

    // Get or create bucket record
    const { data: bucket, error: selectError } = await this.supabase
      .from('rate_limit_buckets')
      .select('*')
      .eq('identifier', identifier)
      .single();

    let tokens = burstLimit;
    let lastRefill = now;

    if (!selectError && bucket) {
      const timePassed = (now - new Date(bucket.last_refill).getTime()) / 1000;
      tokens = Math.min(burstLimit, bucket.tokens + timePassed * refillRate);
      lastRefill = new Date(bucket.last_refill).getTime();
    }

    if (tokens < 1) {
      const timeToRefill = (1 - tokens) / refillRate;
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(timeToRefill),
        totalHits: burstLimit - Math.floor(tokens)
      };
    }

    // Consume token
    const newTokens = tokens - 1;
    
    const { error: upsertError } = await this.supabase
      .from('rate_limit_buckets')
      .upsert({
        identifier,
        tokens: newTokens,
        last_refill: new Date(now).toISOString(),
        max_tokens: burstLimit,
        refill_rate: refillRate
      });

    if (upsertError) {
      console.warn('Failed to update token bucket:', upsertError);
    }

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: Math.floor(newTokens),
      resetTime,
      totalHits: burstLimit - Math.floor(newTokens)
    };
  }

  /**
   * In-memory rate limiting fallback
   */
  private checkMemoryRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now();
    let record = memoryStore.get(identifier);

    if (!record) {
      record = {
        count: 0,
        timestamps: [],
        resetTime: now + config.windowMs,
        tokens: config.burstLimit || config.maxRequests,
        lastRefill: now
      };
    }

    switch (config.algorithm) {
      case RateLimitAlgorithm.SLIDING_WINDOW:
        return this.slidingWindowMemory(identifier, config, record, now);
      
      case RateLimitAlgorithm.FIXED_WINDOW:
        return this.fixedWindowMemory(identifier, config, record, now);
      
      case RateLimitAlgorithm.TOKEN_BUCKET:
        return this.tokenBucketMemory(identifier, config, record, now);
      
      default:
        throw new Error(`Unsupported algorithm: ${config.algorithm}`);
    }
  }

  /**
   * Sliding window in memory
   */
  private slidingWindowMemory(
    identifier: string,
    config: RateLimitConfig,
    record: any,
    now: number
  ): RateLimitResult {
    const windowStart = now - config.windowMs;
    
    // Clean old timestamps
    record.timestamps = record.timestamps.filter((ts: number) => ts > windowStart);
    
    if (record.timestamps.length >= config.maxRequests) {
      const oldestTimestamp = Math.min(...record.timestamps);
      const retryAfter = Math.ceil((oldestTimestamp + config.windowMs - now) / 1000);
      
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: oldestTimestamp + config.windowMs,
        retryAfter,
        totalHits: record.timestamps.length
      };
    }

    // Add current request
    record.timestamps.push(now);
    record.resetTime = now + config.windowMs;
    memoryStore.set(identifier, record);

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - record.timestamps.length,
      resetTime: record.resetTime,
      totalHits: record.timestamps.length
    };
  }

  /**
   * Fixed window in memory
   */
  private fixedWindowMemory(
    identifier: string,
    config: RateLimitConfig,
    record: any,
    now: number
  ): RateLimitResult {
    const windowKey = Math.floor(now / config.windowMs);
    const currentWindowKey = record.windowKey || windowKey;

    // Reset if new window
    if (windowKey !== currentWindowKey) {
      record.count = 0;
      record.windowKey = windowKey;
      record.resetTime = (windowKey + 1) * config.windowMs;
    }

    if (record.count >= config.maxRequests) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
        totalHits: record.count
      };
    }

    record.count++;
    memoryStore.set(identifier, record);

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime,
      totalHits: record.count
    };
  }

  /**
   * Token bucket in memory
   */
  private tokenBucketMemory(
    identifier: string,
    config: RateLimitConfig,
    record: any,
    now: number
  ): RateLimitResult {
    const burstLimit = config.burstLimit || config.maxRequests;
    const refillRate = config.maxRequests / (config.windowMs / 1000);

    // Refill tokens
    const timePassed = (now - (record.lastRefill || now)) / 1000;
    record.tokens = Math.min(burstLimit, (record.tokens || burstLimit) + timePassed * refillRate);
    record.lastRefill = now;

    if (record.tokens < 1) {
      const timeToRefill = (1 - record.tokens) / refillRate;
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: now + timeToRefill * 1000,
        retryAfter: Math.ceil(timeToRefill),
        totalHits: burstLimit - Math.floor(record.tokens)
      };
    }

    // Consume token
    record.tokens--;
    memoryStore.set(identifier, record);

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: Math.floor(record.tokens),
      resetTime: now + config.windowMs,
      totalHits: burstLimit - Math.floor(record.tokens)
    };
  }

  /**
   * Clean up old database entries
   */
  private async cleanupOldEntries(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
      // Clean old requests
      await this.supabase
        .from('rate_limit_requests')
        .delete()
        .lt('timestamp', oneDayAgo);

      // Clean expired windows
      await this.supabase
        .from('rate_limit_windows')
        .delete()
        .lt('expires_at', new Date().toISOString());

      // Clean old buckets (keep them longer as they maintain state)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await this.supabase
        .from('rate_limit_buckets')
        .delete()
        .lt('last_refill', oneWeekAgo);

    } catch (error) {
      console.warn('Failed to cleanup old rate limit entries:', error);
    }
  }

  /**
   * Get rate limit status without consuming
   */
  async getRateLimitStatus(
    identifier: string,
    config: RateLimitConfig
  ): Promise<Omit<RateLimitResult, 'allowed'>> {
    // This would be similar to checkRateLimit but without consuming/recording
    // Implementation would depend on the specific algorithm
    const result = await this.checkRateLimit(identifier, { ...config, maxRequests: config.maxRequests + 1 });
    return {
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.resetTime,
      totalHits: result.totalHits
    };
  }

  /**
   * Reset rate limit for identifier (admin function)
   */
  async resetRateLimit(identifier: string): Promise<void> {
    if (this.useDatabase) {
      await Promise.all([
        this.supabase.from('rate_limit_requests').delete().eq('identifier', identifier),
        this.supabase.from('rate_limit_windows').delete().eq('identifier', identifier),
        this.supabase.from('rate_limit_buckets').delete().eq('identifier', identifier)
      ]);
    }
    
    memoryStore.delete(identifier);
  }
}

/**
 * Generate rate limit identifier from request
 */
export function generateRateLimitIdentifier(
  req: Request,
  type: 'ip' | 'user' | 'api_key' | 'combined' = 'ip'
): string {
  const ip = req.headers.get('x-forwarded-for') || 
            req.headers.get('x-real-ip') || 
            'unknown';

  const userAgent = req.headers.get('user-agent') || 'unknown';
  const authHeader = req.headers.get('authorization');
  
  switch (type) {
    case 'ip':
      return `ip:${ip}`;
    
    case 'user':
      if (authHeader) {
        // Extract user ID from JWT if possible (simplified)
        try {
          const token = authHeader.replace('Bearer ', '');
          const payload = JSON.parse(atob(token.split('.')[1]));
          return `user:${payload.sub || payload.user_id || ip}`;
        } catch {
          return `ip:${ip}`;
        }
      }
      return `ip:${ip}`;
    
    case 'api_key':
      const apiKey = req.headers.get('x-api-key');
      return apiKey ? `api:${apiKey}` : `ip:${ip}`;
    
    case 'combined':
      const fingerprint = btoa(`${ip}:${userAgent.slice(0, 50)}`);
      return `combined:${fingerprint}`;
    
    default:
      return `ip:${ip}`;
  }
}

/**
 * Create standard rate limit headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}