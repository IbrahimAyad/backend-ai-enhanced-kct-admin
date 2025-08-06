import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { fetchProductsWithImages, supabase as sharedSupabase } from '@/lib/shared/supabase-products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, Users, Package, ShoppingBag, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function DataImportExport() {
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState('');
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'customers' | 'products') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
    };
    reader.readAsText(file);
  }, []);

  const parseCsvToJson = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const importCustomers = async () => {
    if (!csvData) {
      toast({
        title: "No data",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const jsonData = parseCsvToJson(csvData);
      
      const { data, error } = await supabase.rpc('import_customers_from_csv', {
        csv_data: jsonData
      });

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Imported ${data.imported} customers with ${data.errors} errors`,
      });
      
      setCsvData('');
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('email, first_name, last_name, phone, company, stripe_customer_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const headers = ['email', 'first_name', 'last_name', 'phone', 'company', 'stripe_customer_id', 'created_at'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kct-customers-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `Exported ${data.length} customers`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_number,
          guest_email,
          status,
          total,
          currency,
          created_at,
          stripe_checkout_session_id,
          customers (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const csvContent = [
        'Order Number,Customer Email,Customer Name,Status,Total,Currency,Order Date,Stripe Session ID',
        ...data.map((order: any) => [
          `"${order.order_number || ''}"`,
          `"${order.customers?.email || order.guest_email || ''}"`,
          `"${order.customers ? (order.customers.first_name + ' ' + order.customers.last_name).trim() : 'Guest'}"`,
          `"${order.status || ''}"`,
          `"${order.total || 0}"`,
          `"${order.currency || 'USD'}"`,
          `"${order.created_at || ''}"`,
          `"${order.stripe_checkout_session_id || ''}"`
        ].join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kct-orders-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `Exported ${data.length} orders`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportProducts = async () => {
    setLoading(true);
    try {
      // Use shared service to fetch all products
      const result = await fetchProductsWithImages({ limit: 1000 });
      
      if (!result.success) throw new Error(result.error || 'Failed to fetch products');
      
      const data = result.data;

      // Convert to CSV
      const headers = ['sku', 'name', 'description', 'category', 'base_price', 'status', 'stripe_product_id', 'created_at'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kct-products-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `Exported ${data.length} products`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Import & Export</h1>
        <p className="text-muted-foreground">Manage your real business data - import from CSV files or export current data</p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Customers from CSV
              </CardTitle>
              <CardDescription>
                Upload a CSV file with customer data. Required columns: email, first_name, last_name, phone, company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer-csv">Customer CSV File</Label>
                <Input
                  id="customer-csv"
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, 'customers')}
                />
              </div>
              
              {csvData && (
                <div>
                  <Label>Preview Data</Label>
                  <Textarea
                    value={csvData.substring(0, 500) + (csvData.length > 500 ? '...' : '')}
                    readOnly
                    className="font-mono text-sm"
                    rows={6}
                  />
                </div>
              )}

              <Button 
                onClick={importCustomers}
                disabled={loading || !csvData}
                className="w-full"
              >
                {loading ? 'Importing...' : 'Import Customers'}
              </Button>

              <div className="text-sm text-muted-foreground">
                <strong>CSV Format Example:</strong><br />
                email,first_name,last_name,phone,company<br />
                john@example.com,John,Doe,555-1234,ABC Corp<br />
                jane@example.com,Jane,Smith,555-5678,XYZ Inc
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Export Customers
                </CardTitle>
                <CardDescription>
                  Download all customer data as CSV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={exportCustomers}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Exporting...' : 'Export Customers'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Export Orders
                </CardTitle>
                <CardDescription>
                  Download all order data as CSV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={exportOrders}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Exporting...' : 'Export Orders'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Export Products
                </CardTitle>
                <CardDescription>
                  Download all product data as CSV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={exportProducts}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Exporting...' : 'Export Products'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Export Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Customers:</strong> Includes email, name, phone, company, and Stripe customer ID</p>
              <p>• <strong>Orders:</strong> Includes order number, customer info, status, total, and Stripe session ID</p>
              <p>• <strong>Products:</strong> Includes SKU, name, description, category, price, and Stripe product ID</p>
              <p>• All exports are in CSV format compatible with Excel, Google Sheets, and other tools</p>
              <p>• Files are named with today's date for easy organization</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}