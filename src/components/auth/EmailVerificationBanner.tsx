import { useState } from 'react';
import { AlertCircle, Mail, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { useAuth } from '@/contexts/AuthContext';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const { isVerified, isLoading, sendVerificationEmail } = useEmailVerification();
  const [sending, setSending] = useState(false);

  // Don't show banner if no user, loading, or already verified
  if (!user || isLoading || isVerified) {
    return null;
  }

  const handleSendVerification = async () => {
    setSending(true);
    await sendVerificationEmail();
    setSending(false);
  };

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Verify your email address</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-amber-700 mb-3">
          Please verify your email address to access all features and ensure account security.
        </p>
        <Button 
          onClick={handleSendVerification}
          disabled={sending}
          size="sm"
          variant="outline"
          className="border-amber-300 hover:bg-amber-100"
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Verification Email
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}