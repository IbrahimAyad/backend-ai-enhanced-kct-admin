import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { verifyEmail, sendVerificationEmail, isVerified } = useEmailVerification();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    // Handle Supabase magic link verification
    if (tokenHash && type === 'email') {
      handleVerification(tokenHash);
    } else if (token) {
      handleVerification(token);
    } else {
      setVerificationStatus('error');
      setErrorMessage('No verification token found');
    }
  }, [searchParams]);

  const handleVerification = async (token: string) => {
    try {
      const success = await verifyEmail(token);
      if (success) {
        setVerificationStatus('success');
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/admin');
        }, 3000);
      } else {
        setVerificationStatus('error');
        setErrorMessage('Verification failed. The link may have expired.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setErrorMessage('An error occurred during verification.');
    }
  };

  const handleResendEmail = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    await sendVerificationEmail();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {verificationStatus === 'pending' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600">Verifying your email address...</p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">Email Verified!</h3>
              <p className="text-gray-600 mb-4">
                Your email has been successfully verified.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to dashboard in 3 seconds...
              </p>
              <Button 
                onClick={() => navigate('/admin')}
                className="mt-4"
              >
                Go to Dashboard Now
              </Button>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-semibold mb-2">Verification Failed</h3>
              <p className="text-gray-600 mb-6">
                {errorMessage}
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </Button>
                <Button 
                  onClick={() => navigate('/admin')}
                  variant="default"
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}