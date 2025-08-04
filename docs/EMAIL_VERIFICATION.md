# Email Verification System

## Overview

The KCT Menswear email verification system ensures that users have valid email addresses and helps prevent spam accounts. The system is integrated with Supabase Auth and uses custom Edge Functions for sending verification emails.

## Components

### 1. Edge Function: `send-verification-email`
- **Location**: `/supabase/functions/send-verification-email/index.ts`
- **Purpose**: Sends beautifully formatted verification emails
- **Provider**: SendGrid
- **Features**:
  - Professional HTML email template
  - 24-hour expiration notice
  - Security-focused design
  - Email logging for analytics

### 2. React Hook: `useEmailVerification`
- **Location**: `/src/hooks/useEmailVerification.ts`
- **Features**:
  - Check verification status
  - Send verification emails
  - Verify email tokens
  - Real-time status updates

### 3. UI Components

#### EmailVerificationBanner
- **Location**: `/src/components/auth/EmailVerificationBanner.tsx`
- **Usage**: Shows in admin dashboard when email is unverified
- **Features**:
  - Non-intrusive warning banner
  - One-click resend functionality
  - Auto-hides when verified

#### VerifyEmail Page
- **Location**: `/src/pages/VerifyEmail.tsx`
- **Route**: `/verify-email`
- **Features**:
  - Handles email verification links
  - Shows success/error states
  - Auto-redirects after verification
  - Resend option for expired links

## Database Schema

### Customers Table Extensions
```sql
email_verified_at TIMESTAMPTZ       -- When email was verified
email_verification_sent_at TIMESTAMPTZ  -- Last verification email sent
```

### Email Logs
- Tracks all verification emails sent
- Stores status (pending, sent, failed)
- Links to customer records

## Implementation Flow

### 1. User Registration
```typescript
// User signs up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Verification email is automatically sent
```

### 2. Sending Verification Email
```typescript
// Using the hook
const { sendVerificationEmail } = useEmailVerification();
await sendVerificationEmail();

// Direct Edge Function call
await supabase.functions.invoke('send-verification-email', {
  body: {
    email: user.email,
    userId: user.id,
    verificationUrl: `${window.location.origin}/verify-email?token=${token}`
  }
});
```

### 3. Verifying Email
```typescript
// Using the hook
const { verifyEmail } = useEmailVerification();
const success = await verifyEmail(token);

// Supabase Auth verification
await supabase.auth.verifyOtp({
  token_hash: token,
  type: 'email'
});
```

## Environment Variables

```env
# Required for Edge Function
KCT-Email-Key=your-sendgrid-api-key
# OR
SENDGRID_API_KEY=your-sendgrid-api-key
```

## Security Considerations

1. **Token Expiration**: Verification links expire after 24 hours
2. **Rate Limiting**: Prevents spam by limiting verification email sends
3. **Secure Tokens**: Uses Supabase's secure OTP system
4. **HTTPS Only**: Verification links use HTTPS in production
5. **Email Logging**: All email sends are logged for audit

## Testing

### Manual Testing
1. Create a new user account
2. Check for verification banner in admin dashboard
3. Click "Send Verification Email"
4. Check email inbox
5. Click verification link
6. Verify redirect and success message

### Automated Testing
```typescript
// Test verification flow
describe('Email Verification', () => {
  it('should send verification email', async () => {
    const { sendVerificationEmail } = renderHook(() => useEmailVerification());
    await act(async () => {
      await sendVerificationEmail();
    });
    // Assert email was sent
  });

  it('should verify email with valid token', async () => {
    const { verifyEmail } = renderHook(() => useEmailVerification());
    const result = await verifyEmail('valid-token');
    expect(result).toBe(true);
  });
});
```

## Troubleshooting

### Email Not Sending
1. Check SendGrid API key is configured
2. Verify sender email is authenticated in SendGrid
3. Check Edge Function logs: `supabase functions logs send-verification-email`

### Verification Link Not Working
1. Check if token has expired (24 hours)
2. Verify URL format is correct
3. Check browser console for errors

### Banner Not Showing
1. Ensure user is logged in
2. Check if email is already verified
3. Verify hook is imported correctly

## Best Practices

1. **Always verify emails** for new user registrations
2. **Resend limits**: Implement rate limiting (e.g., 1 email per 5 minutes)
3. **Clear messaging**: Inform users about 24-hour expiration
4. **Graceful failures**: Handle expired/invalid tokens properly
5. **Mobile friendly**: Ensure emails render well on all devices

## Future Enhancements

1. **Custom expiration times** based on security requirements
2. **Multi-language support** for international users
3. **A/B testing** different email templates
4. **Analytics dashboard** for verification rates
5. **Webhook integration** for real-time verification status