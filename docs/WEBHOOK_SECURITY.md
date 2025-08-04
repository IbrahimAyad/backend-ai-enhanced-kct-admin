# Webhook Security Implementation Guide

## Overview

This document outlines the comprehensive webhook security measures implemented in the KCT Menswear system. The implementation follows industry best practices to prevent common webhook vulnerabilities.

## Security Features Implemented

### 1. Signature Verification

**Implementation**: HMAC-SHA256 signature verification
**Files**: 
- `/supabase/functions/_shared/webhook-security.ts`
- `/supabase/functions/stripe-webhook-secure/index.ts`
- `/supabase/functions/kct-webhook-secure/index.ts`

**How it works**:
```typescript
// KCT webhooks use custom HMAC verification
const signature = req.headers.get("x-kct-signature");
const timestamp = req.headers.get("x-kct-timestamp");
const isValid = await validateWebhookSignature(body, signature, secret, timestamp);

// Stripe webhooks use Stripe's built-in verification
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

### 2. Rate Limiting

**Implementation**: Token bucket algorithm with sliding window
**Limits**: 10 requests per minute per IP address

**Features**:
- Per-IP rate limiting
- Configurable limits
- Automatic cleanup of old entries
- Returns `Retry-After` header when rate limited

### 3. Replay Attack Protection

**Implementation**: Webhook ID tracking with 24-hour window
**Features**:
- Prevents duplicate webhook processing
- Automatic cleanup of old entries
- Returns 409 Conflict for duplicate webhooks

### 4. Input Validation

**Implementation**: Comprehensive validation for all webhook payloads
**File**: `/supabase/functions/_shared/validation.ts`

**Validation includes**:
- Email format validation
- Amount validation (non-negative, decimal places)
- Order items validation
- Address validation
- String sanitization (XSS prevention)

### 5. CORS Restrictions

**Implementation**: Allowlist-based CORS headers
**File**: `/supabase/functions/_shared/cors.ts`

**Features**:
- No CORS headers for webhook endpoints by default
- Specific origin allowlist for other endpoints
- Replaces wildcard `*` with explicit origins

### 6. Error Handling

**Implementation**: Sanitized error responses
**Features**:
- Internal errors logged with full details
- External responses return generic messages
- Prevents information disclosure

### 7. Audit Logging

**Implementation**: Comprehensive webhook event logging
**Table**: `webhook_logs`

**Tracked data**:
- Webhook ID
- Source (stripe, kct, etc.)
- Event type
- Full payload
- Processing status
- IP address
- Timestamps

## Environment Variables

### Required for Stripe Webhooks
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Required for KCT Webhooks
```env
KCT_WEBHOOK_SECRET=your-secret-key-here
```

### General Requirements
```env
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Webhook Headers

### KCT Webhook Headers
```
x-kct-signature: sha256=<hmac-signature>
x-kct-timestamp: <unix-timestamp>
x-kct-webhook-id: <unique-webhook-id>
```

### Stripe Webhook Headers
```
stripe-signature: t=<timestamp>,v1=<signature>
```

## Security Best Practices

### 1. Secret Management
- Store webhook secrets in environment variables
- Rotate secrets regularly (every 90 days)
- Use different secrets for different environments

### 2. HTTPS Only
- Always use HTTPS for webhook endpoints
- Reject non-HTTPS requests in production

### 3. Timeout Configuration
- Set reasonable timeouts (30 seconds)
- Implement idempotency for retries

### 4. Monitoring
- Monitor webhook failure rates
- Alert on repeated signature failures (possible attack)
- Track processing times

## Testing Webhook Security

### 1. Test Valid Webhook
```bash
# Generate test signature
TIMESTAMP=$(date +%s)
BODY='{"event_type":"order.created","data":{"order_id":"123"}}'
SIGNATURE=$(echo -n "$TIMESTAMP.$BODY" | openssl dgst -sha256 -hmac "your-secret" | sed 's/^.* //')

# Send test webhook
curl -X POST https://your-domain.supabase.co/functions/v1/kct-webhook-secure \
  -H "x-kct-signature: sha256=$SIGNATURE" \
  -H "x-kct-timestamp: $TIMESTAMP" \
  -H "x-kct-webhook-id: test-$(date +%s)" \
  -H "Content-Type: application/json" \
  -d "$BODY"
```

### 2. Test Invalid Signature
```bash
# Should return 401 Unauthorized
curl -X POST https://your-domain.supabase.co/functions/v1/kct-webhook-secure \
  -H "x-kct-signature: sha256=invalid" \
  -H "x-kct-timestamp: $(date +%s)" \
  -H "x-kct-webhook-id: test-invalid" \
  -d '{"test":"data"}'
```

### 3. Test Rate Limiting
```bash
# Send 11 requests rapidly (should get rate limited on 11th)
for i in {1..11}; do
  curl -X POST https://your-domain.supabase.co/functions/v1/kct-webhook-secure \
    -H "x-kct-signature: sha256=test" \
    -w "\\nStatus: %{http_code}\\n"
done
```

## Migration from Insecure Webhooks

### Step 1: Deploy Secure Endpoints
1. Deploy new secure webhook functions
2. Test thoroughly in development

### Step 2: Update Webhook URLs
1. Update Stripe webhook endpoint in Stripe Dashboard
2. Update KCT webhook endpoint in KCT system

### Step 3: Monitor Both Endpoints
1. Keep old endpoints active temporarily
2. Log deprecation warnings
3. Monitor traffic to both

### Step 4: Decommission Old Endpoints
1. After confirming all traffic moved
2. Remove old insecure endpoints
3. Update documentation

## Troubleshooting

### Common Issues

**1. Signature Verification Failures**
- Check webhook secret is correct
- Ensure body is raw (not parsed JSON)
- Verify timestamp is recent

**2. Rate Limiting Issues**
- Check IP address detection
- Verify rate limit configuration
- Consider increasing limits if legitimate

**3. Replay Protection Failures**
- Check webhook ID uniqueness
- Verify timestamp handling
- Clear old webhook IDs if needed

### Debug Mode

Enable debug logging:
```typescript
// In webhook function
const DEBUG = Deno.env.get("WEBHOOK_DEBUG") === "true";
if (DEBUG) {
  console.log("Webhook headers:", Object.fromEntries(req.headers));
  console.log("Webhook body:", body);
}
```

## Security Checklist

- [ ] Webhook secrets stored in environment variables
- [ ] Signature verification implemented
- [ ] Rate limiting active
- [ ] Replay protection enabled
- [ ] Input validation on all fields
- [ ] CORS properly restricted
- [ ] Error messages sanitized
- [ ] Audit logging configured
- [ ] HTTPS enforced
- [ ] Monitoring alerts set up
- [ ] Regular secret rotation scheduled
- [ ] Documentation updated

## Future Enhancements

1. **IP Allowlisting**: Restrict webhooks to known IP ranges
2. **Webhook Signing Key Rotation**: Automated key rotation
3. **Advanced Rate Limiting**: Different limits per event type
4. **Webhook Retry Logic**: Exponential backoff for failures
5. **Distributed Rate Limiting**: Redis-based rate limiting
6. **Webhook Analytics Dashboard**: Visual monitoring