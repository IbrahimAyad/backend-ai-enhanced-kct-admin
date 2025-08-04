import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function TestLogin() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('count').limit(1);
      if (error) {
        setResult(`Connection Error: ${JSON.stringify(error)}`);
      } else {
        setResult("Connection successful!");
      }
    } catch (e: any) {
      setResult(`Exception: ${e.message}`);
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'support@kctmenswear.com',
        password: '127598'
      });
      if (error) {
        setResult(`Login Error: ${JSON.stringify(error)}`);
      } else {
        setResult(`Login successful! User: ${data.user?.email}`);
        // Try to get session
        const { data: session } = await supabase.auth.getSession();
        setResult(prev => prev + `\nSession: ${session.session ? 'Active' : 'No session'}`);
      }
    } catch (e: any) {
      setResult(`Exception: ${e.message}`);
    }
    setLoading(false);
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: session } = await supabase.auth.getSession();
    setResult(`Current user: ${user?.email || 'None'}\nSession: ${session.session ? 'Active' : 'No session'}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConnection} disabled={loading} className="w-full">
            Test Connection
          </Button>
          <Button onClick={testLogin} disabled={loading} className="w-full">
            Test Login
          </Button>
          <Button onClick={checkAuth} disabled={loading} className="w-full">
            Check Current Auth
          </Button>
          {result && (
            <pre className="p-4 bg-gray-100 rounded text-sm overflow-auto">
              {result}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}