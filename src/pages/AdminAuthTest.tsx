import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Shield, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function AdminAuthTest() {
  const { user } = useAuth();
  const { isAdmin, adminUser, loading, hasPermission } = useAdminAuth();
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const results: any = {};

    try {
      // Test 1: Check customers access
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id')
        .limit(10);
      
      results.customersAccess = {
        success: !customersError,
        count: customers?.length || 0,
        error: customersError?.message
      };

      // Test 2: Check orders access
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .limit(10);
      
      results.ordersAccess = {
        success: !ordersError,
        count: orders?.length || 0,
        error: ordersError?.message
      };

      // Test 3: Check products write access
      const { error: productsError } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      results.productsAccess = {
        success: !productsError,
        canRead: !productsError,
        error: productsError?.message
      };

      // Test 4: Check admin_users access
      const { data: admins, error: adminsError } = await supabase
        .from('admin_users')
        .select('id')
        .limit(1);
      
      results.adminTableAccess = {
        success: !adminsError,
        canRead: !adminsError,
        error: adminsError?.message
      };

    } catch (error) {
      console.error('Test error:', error);
    }

    setTestResults(results);
    setTesting(false);
  };

  useEffect(() => {
    if (user && !loading) {
      runTests();
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Admin Authentication Test</h1>
      
      {/* User Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>
              <span>{user?.email || 'Not logged in'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">User ID:</span>
              <span className="text-xs font-mono">{user?.id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Authenticated:</span>
              <Badge variant={user ? 'success' : 'secondary'}>
                {user ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Is Admin:</span>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <Badge variant={isAdmin ? 'success' : 'destructive'}>
                  {isAdmin ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
            
            {adminUser && (
              <>
                <div className="flex justify-between">
                  <span className="font-medium">Role:</span>
                  <Badge>{adminUser.role}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Permissions:</span>
                  <span className="text-sm">{adminUser.permissions.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Active:</span>
                  <Badge variant={adminUser.is_active ? 'success' : 'secondary'}>
                    {adminUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permission Tests Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Permission Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['products', 'orders', 'customers', 'inventory', 'analytics'].map(permission => (
              <div key={permission} className="flex items-center justify-between">
                <span className="font-medium capitalize">{permission}:</span>
                <div className="flex items-center gap-2">
                  {hasPermission(permission) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {hasPermission(permission) ? 'Granted' : 'Denied'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Access Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Database Access Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests} 
            disabled={testing}
            className="mb-4"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Database Tests'
            )}
          </Button>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-3">
              {Object.entries(testResults).map(([test, result]: [string, any]) => (
                <div key={test} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{test}:</span>
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  {result.count !== undefined && (
                    <div className="text-sm text-gray-600">
                      Records accessible: {result.count}
                    </div>
                  )}
                  {result.error && (
                    <div className="text-sm text-red-600">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Create a user account if you haven't already</li>
            <li>Run: <code className="bg-gray-100 px-2 py-1 rounded">npx tsx scripts/setup-admin.ts your-email@example.com</code></li>
            <li>Refresh this page to see updated admin status</li>
            <li>Check that all permission tests show as "Granted"</li>
            <li>Run database tests to verify RLS policies</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}