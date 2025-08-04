import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface EmailVerificationState {
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (token: string) => Promise<boolean>;
  checkVerificationStatus: () => Promise<void>;
}

export function useEmailVerification(): EmailVerificationState {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check verification status on mount and when user changes
  useEffect(() => {
    if (user) {
      checkVerificationStatus();
    } else {
      setIsLoading(false);
      setIsVerified(false);
    }
  }, [user]);

  const checkVerificationStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if user's email is verified in Supabase Auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setIsVerified(authUser.email_confirmed_at !== null);
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
      setError('Failed to check verification status');
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (!user || !user.email) {
      toast({
        title: "Error",
        description: "No user email found",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Generate verification link using Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (signInError) {
        throw signInError;
      }

      // Also send a custom verification email via Edge Function
      const verificationUrl = `${window.location.origin}/verify-email?token=${data.user?.id}`;
      
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'send-verification-email',
        {
          body: {
            email: user.email,
            userId: user.id,
            verificationUrl
          }
        }
      );

      if (functionError) {
        console.error('Edge function error:', functionError);
        // Don't throw here - the OTP email was still sent
      }

      toast({
        title: "Verification email sent",
        description: "Please check your email and click the verification link.",
      });
    } catch (err) {
      console.error('Error sending verification email:', err);
      const message = err instanceof Error ? err.message : 'Failed to send verification email';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Verify the email using the token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (verifyError) {
        throw verifyError;
      }

      // Refresh the user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      if (session) {
        setIsVerified(true);
        toast({
          title: "Email verified!",
          description: "Your email has been successfully verified.",
        });
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error verifying email:', err);
      const message = err instanceof Error ? err.message : 'Failed to verify email';
      setError(message);
      toast({
        title: "Verification failed",
        description: message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isVerified,
    isLoading,
    error,
    sendVerificationEmail,
    verifyEmail,
    checkVerificationStatus
  };
}