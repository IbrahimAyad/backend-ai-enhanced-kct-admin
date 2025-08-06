import { useEffect, useState } from 'react';
import { testSupabaseConnection, fetchProductsWithImages } from '@/lib/shared/supabase-products';

export default function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [products, setProducts] = useState<any>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function runTest() {
      try {
        // Test connection
        const connection = await testSupabaseConnection();
        setConnectionStatus(connection);

        // Fetch products
        const productsResult = await fetchProductsWithImages({ limit: 3 });
        setProducts(productsResult);
        
        if (!productsResult.success) {
          setProductsError(productsResult.error || 'Failed to fetch products');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    runTest();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Testing Supabase Connection...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <pre className="overflow-auto text-sm">
          {JSON.stringify(connectionStatus, null, 2)}
        </pre>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-400 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 text-red-700">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-8 p-4 bg-blue-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Products Found</h2>
        <p className="mb-2">Success: {products?.success ? '✓' : '✗'}</p>
        <p className="mb-2">Total products: {products?.data?.length || 0}</p>
        {productsError && (
          <div className="text-red-600 mb-2">
            Error: {productsError}
          </div>
        )}
        {products?.data?.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">First Product:</h3>
            <pre className="overflow-auto text-sm bg-white p-2 rounded">
              {JSON.stringify(products.data[0], null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Environment Variables:</p>
        <ul className="list-disc list-inside">
          <li>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing'}</li>
          <li>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}</li>
        </ul>
      </div>
    </div>
  );
}