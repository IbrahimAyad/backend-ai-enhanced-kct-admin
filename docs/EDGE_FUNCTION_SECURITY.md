# Edge Function Security Implementation Guide

## Overview

This document outlines the comprehensive security measures implemented across all Edge Functions in the KCT Menswear system. Each function has been hardened with multiple layers of security.

## Security Features Implemented

### 1. Input Validation ✅

Every Edge Function now includes comprehensive input validation:

- **Email Validation**: RFC-compliant email format checking
- **UUID Validation**: Proper format verification for all IDs
- **Amount Validation**: Non-negative values, decimal precision
- **String Sanitization**: XSS prevention, length limits
- **Array Bounds**: Maximum items to prevent DoS
- **URL Validation**: Domain allowlisting for redirects

### 2. Rate Limiting ✅

All functions implement token bucket rate limiting:

- **Default**: 10 requests per minute per IP
- **Configurable**: Different limits for different endpoints
- **Headers**: Returns `Retry-After` when rate limited
- **IP Detection**: Supports proxy headers

### 3. Authentication & Authorization ✅

- **Bearer Token Validation**: All protected endpoints
- **Service Role Verification**: For internal calls
- **Admin User Checks**: For administrative functions
- **User Context**: Proper user isolation

### 4. Error Handling ✅

- **Sanitized External Errors**: Generic messages to prevent info leakage
- **Detailed Internal Logging**: Full errors logged server-side
- **Proper Status Codes**: 400, 401, 403, 429, 500
- **Graceful Degradation**: Fallbacks for external service failures

### 5. CORS Security ✅

- **Origin Allowlist**: Replaces wildcard `*`
- **Allowed Origins**: localhost, kctmenswear.com domains
- **Method Restrictions**: Only required HTTP methods
- **No CORS for Webhooks**: Enhanced security

## Secured Edge Functions

### Payment & Commerce

#### 1. **create-checkout-secure**
- **Validates**: Cart items, quantities, prices, customer email
- **Limits**: Max 50 items, $1000 order limit
- **Features**: Stock reservation, UUID validation
- **Protection**: Rate limiting, sanitized URLs

#### 2. **stripe-webhook-secure**
- **Validates**: Stripe signature, replay protection
- **Logging**: Webhook events tracked
- **Features**: Idempotency, dispute handling
- **Protection**: No CORS, IP logging

#### 3. **kct-webhook-secure**
- **Validates**: HMAC signature, timestamp validation
- **Features**: Custom signature verification
- **Protection**: Replay protection, rate limiting

### Product & Catalog

#### 4. **get-products-secure**
- **Validates**: Category, search terms, pagination
- **Limits**: Max 100 products per request
- **Features**: Safe SQL queries, caching
- **Protection**: Input sanitization

#### 5. **bundle-builder-secure**
- **Validates**: Product IDs, bundle types
- **Limits**: Max 10 products per bundle
- **Features**: Complementarity scoring
- **Protection**: UUID validation

### AI & Recommendations

#### 6. **ai-recommendations-secure**
- **Validates**: Context fields, occasions, styles
- **Features**: Fallback to rule-based, timeout protection
- **Limits**: Prompt size limits, 30s timeout
- **Protection**: Sanitized AI prompts

### Email Services

#### 7. **email-service-secure**
- **Validates**: Email formats, content length
- **Features**: Email logging, multi-recipient
- **Protection**: Admin-only access, rate limiting

#### 8. **send-order-confirmation-secure**
- **Validates**: Order data, addresses, items
- **Features**: Image URL validation, total verification
- **Protection**: Authorization required

#### 9. **send-welcome-email-secure**
- **Validates**: Email format, customer name
- **Features**: First-time vs returning user handling
- **Protection**: Rate limiting, authorization required

#### 10. **send-password-reset-secure**
- **Validates**: Email format, reset URLs, token format
- **Features**: Domain allowlist, IP logging, 1-hour expiry
- **Protection**: Service role only, stricter rate limiting

#### 11. **send-abandoned-cart-secure**
- **Validates**: Cart items, quantities, prices, URLs
- **Features**: Image URL validation, cart total verification
- **Protection**: Rate limiting, domain allowlist for cart URLs

#### 12. **send-marketing-campaign-secure**
- **Validates**: Campaign content, customer segments, CTA URLs
- **Features**: Batch processing, admin-only access, unsubscribe links
- **Protection**: Admin permission required, batch rate limiting

## Security Patterns Used

### Input Validation Pattern
```typescript
// Email validation
const emailValidation = validateEmail(input.email);
if (!emailValidation.isValid) {
  throw new Error('Invalid email format');
}

// Amount validation
const amountValidation = validateAmount(input.price, { 
  min: 0, 
  max: 10000 
});

// UUID validation
if (!isValidUUID(input.productId)) {
  throw new Error('Invalid product ID');
}
```

### Rate Limiting Pattern
```typescript
const rateLimitResult = checkRateLimit(`${endpoint}:${clientIp}`);
if (!rateLimitResult.allowed) {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded" }), 
    { 
      status: 429,
      headers: {
        "Retry-After": String(rateLimitResult.retryAfter || 60)
      }
    }
  );
}
```

### Error Handling Pattern
```typescript
try {
  // Function logic
} catch (error) {
  console.error('Detailed error:', error); // Internal logging
  
  const errorMessage = sanitizeErrorMessage(error);
  const statusCode = determineStatusCode(error);
  
  return new Response(
    JSON.stringify({ error: errorMessage }), // Generic external error
    { status: statusCode }
  );
}
```

## Environment Variables

### Required for All Functions
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Email Functions
```env
SENDGRID_API_KEY=SG...
VERIFIED_SENDER_EMAIL=noreply@kctmenswear.com
SENDER_NAME=KCT Menswear
```

### Payment Functions
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
KCT_WEBHOOK_SECRET=your-secret
```

### AI Functions
```env
OPENAI_API_KEY=sk-...
```

## Testing Security

### 1. Test Rate Limiting
```bash
# Should get 429 on 11th request
for i in {1..11}; do
  curl -X POST https://your-domain.supabase.co/functions/v1/get-products-secure \
    -H "Content-Type: application/json" \
    -w "\nStatus: %{http_code}\n"
done
```

### 2. Test Input Validation
```bash
# Should get 400 Bad Request
curl -X POST https://your-domain.supabase.co/functions/v1/create-checkout-secure \
  -H "Content-Type: application/json" \
  -d '{"items": [{"quantity": -1}]}'
```

### 3. Test Authentication
```bash
# Should get 401 Unauthorized
curl -X POST https://your-domain.supabase.co/functions/v1/ai-recommendations-secure \
  -H "Content-Type: application/json" \
  -d '{"recommendation_type": "outfit"}'
```

## Security Checklist

- [x] All inputs validated and sanitized
- [x] Rate limiting implemented  
- [x] Authentication required where needed
- [x] Errors sanitized for external responses
- [x] CORS restricted to allowed origins
- [x] Environment variables validated on startup
- [x] Timeouts set for external API calls
- [x] Replay protection for webhooks
- [x] SQL injection prevention
- [x] XSS prevention in outputs

## Best Practices

1. **Always Validate Input**: Never trust user input
2. **Fail Fast**: Validate early in the request lifecycle
3. **Log Everything**: Detailed internal logs, generic external errors
4. **Use Allowlists**: For categories, types, domains
5. **Limit Everything**: Quantities, amounts, array sizes
6. **Sanitize Output**: Prevent XSS in responses
7. **Version Your APIs**: For backward compatibility
8. **Monitor & Alert**: Track error rates and patterns

## Future Enhancements

1. **API Key Authentication**: For partner integrations
2. **Request Signing**: For critical operations
3. **Distributed Rate Limiting**: Redis-based
4. **WAF Integration**: CloudFlare or AWS WAF
5. **Audit Logging**: Comprehensive activity tracking
6. **Encryption at Rest**: For sensitive data
7. **API Versioning**: Proper version management
8. **Circuit Breakers**: For external service calls