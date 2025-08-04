import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TestSupabaseConnection() {
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const runTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // 1. Check Supabase client config
      results.supabaseUrl = supabase.supabaseUrl || 'NOT SET';
      results.hasAnonKey = !!supabase.supabaseKey;

      // 2. Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      results.session = session ? 'Active' : 'No session';
      results.sessionError = sessionError?.message;
      results.userId = session?.user?.id || 'Not logged in';
      results.userEmail = session?.user?.email || 'Not logged in';

      // 3. Test products query
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      results.productsAccess = productsError ? `Error: ${productsError.message}` : 'Success';
      
      // 4. Test admin status
      if (session?.user?.id) {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        results.isAdmin = adminData ? 'Yes' : 'No';
        results.adminError = adminError?.message;
      }

      // 5. Check environment variables
      results.envCheck = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing',
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
      };

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setStatus(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getIcon = (value: string) => {
    if (value?.includes('Success') || value?.includes('✓') || value === 'Active' || value === 'Yes') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (value?.includes('Error') || value?.includes('✗') || value === 'No session') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Supabase Connection Test
            <Button onClick={runTests} disabled={loading} size="sm">
              Rerun Tests
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p>Running tests...</p>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold">Environment</h3>
                <div className="pl-4 space-y-1">
                  <p className="flex items-center gap-2">
                    {getIcon(status.envCheck?.VITE_SUPABASE_URL)}
                    VITE_SUPABASE_URL: {status.envCheck?.VITE_SUPABASE_URL}
                  </p>
                  <p className="flex items-center gap-2">
                    {getIcon(status.envCheck?.VITE_SUPABASE_ANON_KEY)}
                    VITE_SUPABASE_ANON_KEY: {status.envCheck?.VITE_SUPABASE_ANON_KEY}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    URL: {status.supabaseUrl}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Authentication</h3>
                <div className="pl-4 space-y-1">
                  <p className="flex items-center gap-2">
                    {getIcon(status.session)}
                    Session: {status.session}
                  </p>
                  <p className="text-sm">User ID: {status.userId}</p>
                  <p className="text-sm">Email: {status.userEmail}</p>
                  <p className="flex items-center gap-2">
                    {getIcon(status.isAdmin)}
                    Admin Status: {status.isAdmin || 'Not checked'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Database Access</h3>
                <div className="pl-4 space-y-1">
                  <p className="flex items-center gap-2">
                    {getIcon(status.productsAccess)}
                    Products Table: {status.productsAccess}
                  </p>
                </div>
              </div>

              {status.error && (
                <div className="p-3 bg-red-50 text-red-700 rounded">
                  Error: {status.error}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}