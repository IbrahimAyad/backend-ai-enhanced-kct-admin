import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

// In-memory store for rate limiting and replay protection
const requestStore = new Map<string, { count: number; timestamps: number[] }>();
const processedWebhooks = new Map<string, number>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute
const REPLAY_PROTECTION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Validates webhook signature using HMAC-SHA256
 */
export async function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp?: string
): Promise<WebhookValidationResult> {
  if (!signature || !secret) {
    return { isValid: false, error: "Missing signature or secret" };
  }

  // Validate timestamp if provided (prevents replay attacks)
  if (timestamp) {
    const timestampMs = parseInt(timestamp) * 1000;
    const currentMs = Date.now();
    
    if (isNaN(timestampMs)) {
      return { isValid: false, error: "Invalid timestamp format" };
    }
    
    const age = Math.abs(currentMs - timestampMs);
    if (age > WEBHOOK_TIMESTAMP_TOLERANCE_MS) {
      return { isValid: false, error: "Webhook timestamp too old" };
    }
  }

  try {
    // Create the signed payload
    const signedPayload = timestamp ? `${timestamp}.${payload}` : payload;
    
    // Calculate expected signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Compare signatures (timing-safe comparison)
    const providedSig = signature.replace('sha256=', '').toLowerCase();
    const expectedSig = expectedSignature.toLowerCase();
    
    if (providedSig.length !== expectedSig.length) {
      return { isValid: false, error: "Invalid signature format" };
    }
    
    let isValid = true;
    for (let i = 0; i < providedSig.length; i++) {
      if (providedSig[i] !== expectedSig[i]) {
        isValid = false;
      }
    }
    
    return { isValid };
  } catch (error) {
    return { isValid: false, error: "Signature verification failed" };
  }
}

/**
 * Implements rate limiting for webhook endpoints
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const record = requestStore.get(identifier) || { count: 0, timestamps: [] };
  
  // Clean old timestamps
  record.timestamps = record.timestamps.filter(
    ts => now - ts < RATE_LIMIT_WINDOW_MS
  );
  
  if (record.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestTimestamp = Math.min(...record.timestamps);
    const retryAfter = Math.ceil((oldestTimestamp + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Add current request
  record.timestamps.push(now);
  record.count = record.timestamps.length;
  requestStore.set(identifier, record);
  
  // Clean up old entries periodically
  if (requestStore.size > 1000) {
    for (const [key, value] of requestStore.entries()) {
      if (value.timestamps.length === 0) {
        requestStore.delete(key);
      }
    }
  }
  
  return { allowed: true };
}

/**
 * Prevents replay attacks by tracking processed webhook IDs
 */
export function checkReplayProtection(webhookId: string): boolean {
  const now = Date.now();
  
  // Clean old entries
  for (const [id, timestamp] of processedWebhooks.entries()) {
    if (now - timestamp > REPLAY_PROTECTION_WINDOW_MS) {
      processedWebhooks.delete(id);
    }
  }
  
  // Check if webhook was already processed
  if (processedWebhooks.has(webhookId)) {
    return false;
  }
  
  // Mark as processed
  processedWebhooks.set(webhookId, now);
  return true;
}

/**
 * Validates webhook payload structure
 */
export function validateWebhookPayload(
  payload: any,
  requiredFields: string[]
): { isValid: boolean; missingFields?: string[] } {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, missingFields: ['payload'] };
  }
  
  const missingFields = requiredFields.filter(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], payload);
    return value === undefined || value === null;
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields.length > 0 ? missingFields : undefined
  };
}

/**
 * Sanitizes error messages for external responses
 */
export function sanitizeErrorMessage(error: any): string {
  // Log detailed error internally
  console.error('Webhook error:', error);
  
  // Return generic message externally
  if (error?.message?.includes('rate limit')) {
    return 'Rate limit exceeded';
  } else if (error?.message?.includes('signature')) {
    return 'Invalid webhook signature';
  } else if (error?.message?.includes('replay')) {
    return 'Duplicate webhook';
  }
  
  return 'Webhook processing failed';
}

/**
 * Creates secure CORS headers for webhook endpoints
 */
export function createSecureWebhookHeaders(allowedOrigins?: string[]): Record<string, string> {
  // For webhooks, we typically don't need CORS at all
  // But if needed, restrict to specific origins
  if (allowedOrigins && allowedOrigins.length > 0) {
    return {
      'Access-Control-Allow-Origin': allowedOrigins[0], // Must be specific origin
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'content-type, x-webhook-signature, x-webhook-timestamp',
      'Access-Control-Max-Age': '86400',
    };
  }
  
  // No CORS headers for webhooks by default (most secure)
  return {
    'Content-Type': 'application/json',
  };
}