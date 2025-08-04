import { RateLimiter, RateLimitConfig, generateRateLimitIdentifier, createRateLimitHeaders, RATE_LIMIT_CONFIGS } from './rate-limiting.ts';
import { getCorsHeaders } from './cors.ts';
import { sanitizeErrorMessage } from './webhook-security.ts';

export interface RateLimitMiddlewareOptions {
  config?: Partial<RateLimitConfig>;
  endpointType?: keyof typeof RATE_LIMIT_CONFIGS;
  identifierType?: 'ip' | 'user' | 'api_key' | 'combined';
  customIdentifier?: (req: Request) => string;
  skipCondition?: (req: Request) => boolean;
  onLimitReached?: (identifier: string, req: Request) => void;
  errorMessage?: string;
  enableHeaders?: boolean;
}

export interface ProtectedEndpointHandler {
  (req: Request, rateLimitResult?: any): Promise<Response>;
}

/**
 * Rate limiting middleware that can be applied to any Edge Function
 */
export class RateLimitMiddleware {
  private rateLimiter: RateLimiter;
  
  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.rateLimiter = new RateLimiter(supabaseUrl, supabaseKey);
  }

  /**
   * Protect an endpoint with rate limiting
   */
  async protect(
    req: Request,
    handler: ProtectedEndpointHandler,
    options: RateLimitMiddlewareOptions = {}
  ): Promise<Response> {
    const {
      config = {},
      endpointType = 'api',
      identifierType = 'ip',
      customIdentifier,
      skipCondition,
      onLimitReached,
      errorMessage = 'Rate limit exceeded',
      enableHeaders = true
    } = options;

    try {
      // Skip rate limiting if condition is met
      if (skipCondition && skipCondition(req)) {
        return await handler(req);
      }

      // Generate identifier
      const identifier = customIdentifier 
        ? customIdentifier(req)
        : generateRateLimitIdentifier(req, identifierType);

      // Check rate limit
      const rateLimitResult = await this.rateLimiter.checkRateLimit(
        identifier,
        config,
        endpointType
      );

      // Create headers
      const rateLimitHeaders = enableHeaders ? createRateLimitHeaders(rateLimitResult) : {};
      const corsHeaders = getCorsHeaders(req.headers.get('origin'));
      const headers = { ...corsHeaders, ...rateLimitHeaders };

      // If rate limited
      if (!rateLimitResult.allowed) {
        // Call custom callback
        if (onLimitReached) {
          onLimitReached(identifier, req);
        }

        // Log rate limit hit
        console.warn(`Rate limit exceeded for ${identifier}`, {
          endpoint: req.url,
          method: req.method,
          userAgent: req.headers.get('user-agent'),
          identifier,
          limit: rateLimitResult.limit,
          retryAfter: rateLimitResult.retryAfter
        });

        return new Response(
          JSON.stringify({
            error: errorMessage,
            retryAfter: rateLimitResult.retryAfter
          }),
          {
            status: 429,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Rate limit passed, call the handler
      const response = await handler(req, rateLimitResult);

      // Add rate limit headers to successful response
      if (enableHeaders && response.headers) {
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;

    } catch (error) {
      console.error('Rate limiting middleware error:', error);
      
      // On error, allow the request through (fail open)
      // but log the error for monitoring
      return await handler(req);
    }
  }

  /**
   * Create a wrapper function for easy integration
   */
  createProtectedHandler(
    handler: ProtectedEndpointHandler,
    options: RateLimitMiddlewareOptions = {}
  ) {
    return async (req: Request): Promise<Response> => {
      return this.protect(req, handler, options);
    };
  }

  /**
   * Multi-tier rate limiting (e.g., different limits for authenticated users)
   */
  async protectWithTiers(
    req: Request,
    handler: ProtectedEndpointHandler,
    tiers: {
      condition: (req: Request) => boolean;
      options: RateLimitMiddlewareOptions;
    }[]
  ): Promise<Response> {
    // Find matching tier
    const tier = tiers.find(t => t.condition(req));
    
    if (!tier) {
      // No tier matches, use default
      return this.protect(req, handler, {
        endpointType: 'api',
        identifierType: 'ip'
      });
    }

    return this.protect(req, handler, tier.options);
  }

  /**
   * Get current rate limit status without consuming
   */
  async getStatus(
    req: Request,
    options: RateLimitMiddlewareOptions = {}
  ): Promise<any> {
    const {
      config = {},
      endpointType = 'api',
      identifierType = 'ip',
      customIdentifier
    } = options;

    const identifier = customIdentifier 
      ? customIdentifier(req)
      : generateRateLimitIdentifier(req, identifierType);

    return this.rateLimiter.getRateLimitStatus(identifier, config);
  }

  /**
   * Reset rate limit (admin function)
   */
  async resetLimit(identifier: string): Promise<void> {
    return this.rateLimiter.resetRateLimit(identifier);
  }
}

/**
 * Pre-configured middleware instances for different endpoint types
 */
export const createRateLimitedEndpoint = (
  supabaseUrl?: string,
  supabaseKey?: string
) => {
  const middleware = new RateLimitMiddleware(supabaseUrl, supabaseKey);

  return {
    // Authentication endpoints (5 requests per 15 minutes)
    auth: (handler: ProtectedEndpointHandler) =>
      middleware.createProtectedHandler(handler, {
        endpointType: 'auth',
        identifierType: 'ip',
        errorMessage: 'Too many authentication attempts. Please try again later.'
      }),

    // Password reset (3 requests per hour)
    passwordReset: (handler: ProtectedEndpointHandler) =>
      middleware.createProtectedHandler(handler, {
        endpointType: 'password_reset',
        identifierType: 'ip',
        errorMessage: 'Too many password reset requests. Please try again later.'
      }),

    // Email sending (10 requests per minute)
    email: (handler: ProtectedEndpointHandler) =>
      middleware.createProtectedHandler(handler, {
        endpointType: 'email',
        identifierType: 'user',
        errorMessage: 'Too many emails sent. Please wait before sending more.'
      }),

    // API endpoints (100 requests per minute)
    api: (handler: ProtectedEndpointHandler) =>
      middleware.createProtectedHandler(handler, {
        endpointType: 'api',
        identifierType: 'combined',
        errorMessage: 'API rate limit exceeded. Please slow down your requests.'
      }),

    // Checkout/payment (10 requests per minute, burst of 3)
    checkout: (handler: ProtectedEndpointHandler) =>
      middleware.createProtectedHandler(handler, {
        endpointType: 'checkout',
        identifierType: 'user',
        errorMessage: 'Too many checkout attempts. Please wait before trying again.'
      }),

    // Search/read operations (200 requests per minute)
    search: (handler: ProtectedEndpointHandler) =>
      middleware.createProtectedHandler(handler, {
        endpointType: 'search',
        identifierType: 'combined',
        errorMessage: 'Search rate limit exceeded. Please slow down your requests.'
      }),

    // Webhooks (1000 requests per minute)
    webhook: (handler: ProtectedEndpointHandler) =>
      middleware.createProtectedHandler(handler, {
        endpointType: 'webhook',
        identifierType: 'ip',
        errorMessage: 'Webhook rate limit exceeded.',
        enableHeaders: false // Webhooks typically don't need rate limit headers
      }),

    // Admin operations (500 requests per minute)
    admin: (handler: ProtectedEndpointHandler) =>
      middleware.createProtectedHandler(handler, {
        endpointType: 'admin',
        identifierType: 'user',
        errorMessage: 'Admin API rate limit exceeded.'
      }),

    // Custom rate limiting
    custom: (handler: ProtectedEndpointHandler, options: RateLimitMiddlewareOptions) =>
      middleware.createProtectedHandler(handler, options),

    // Multi-tier rate limiting
    tiered: (
      handler: ProtectedEndpointHandler,
      tiers: {
        condition: (req: Request) => boolean;
        options: RateLimitMiddlewareOptions;
      }[]
    ) => async (req: Request) => middleware.protectWithTiers(req, handler, tiers)
  };
};

/**
 * Utility functions for common rate limiting scenarios
 */

/**
 * Check if request is from authenticated user
 */
export function isAuthenticated(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  return !!(authHeader && authHeader.startsWith('Bearer '));
}

/**
 * Check if request is from admin user (simplified check)
 */
export function isAdmin(req: Request): boolean {
  // This would need to be expanded with proper JWT verification
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'admin' || payload.app_metadata?.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Check if request has API key
 */
export function hasApiKey(req: Request): boolean {
  return !!req.headers.get('x-api-key');
}

/**
 * Create tiered rate limiting based on user type
 */
export function createUserTieredLimits(
  endpointType: keyof typeof RATE_LIMIT_CONFIGS = 'api'
): {
  condition: (req: Request) => boolean;
  options: RateLimitMiddlewareOptions;
}[] {
  return [
    // Admin users get higher limits
    {
      condition: isAdmin,
      options: {
        endpointType: 'admin',
        identifierType: 'user',
        errorMessage: 'Admin rate limit exceeded.'
      }
    },
    // Authenticated users get moderate limits
    {
      condition: isAuthenticated,
      options: {
        endpointType,
        identifierType: 'user',
        errorMessage: 'User rate limit exceeded.'
      }
    },
    // Anonymous users get basic limits
    {
      condition: () => true, // Catch all
      options: {
        endpointType,
        identifierType: 'ip',
        errorMessage: 'Anonymous user rate limit exceeded.'
      }
    }
  ];
}

/**
 * Error handler for rate limiting errors
 */
export function handleRateLimitError(error: any, req: Request): Response {
  console.error('Rate limiting error:', error);
  
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const sanitizedError = sanitizeErrorMessage(error);
  
  return new Response(
    JSON.stringify({
      error: 'Service temporarily unavailable',
      details: sanitizedError
    }),
    {
      status: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    }
  );
}