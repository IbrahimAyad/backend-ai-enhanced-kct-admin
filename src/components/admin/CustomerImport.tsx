import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Users,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerRow {
  customer_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  accepts_email_marketing?: string;
  accepts_sms_marketing?: string;
  total_spent?: string;
  total_orders?: string;
  customer_tier?: string;
  engagement_score?: string;
  jacket_size?: string;
  jacket_size_confidence?: string;
  vest_size?: string;
  vest_size_confidence?: string;
  shirt_size?: string;
  shirt_size_confidence?: string;
  shoe_size?: string;
  shoe_size_confidence?: string;
  pants_size?: string;
  pants_size_confidence?: string;
  size_profile_completeness?: string;
  average_order_value?: string;
  repeat_customer?: string;
  vip_status?: string;
  high_value_first_order?: string;
  primary_occasion?: string;
  first_purchase_date?: string;
  last_purchase_date?: string;
  days_since_last_purchase?: string;
  default_address_address1?: string;
  default_address_city?: string;
  default_address_province_code?: string;
  default_address_country_code?: string;
  default_address_zip?: string;
  note?: string;
  tags?: string;
  [key: string]: string | undefined;
}

interface ImportResult {
  success: number;
  errors: number;
  warnings: number;
  details: {
    successfulImports: any[];
    errors: { row: number; error: string; data: any }[];
    warnings: { row: number; warning: string; data: any }[];
  };
}

interface CustomerImportProps {
  onImportComplete?: (result: ImportResult) => void;
}

export function CustomerImport({ onImportComplete }: CustomerImportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CustomerRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSVPreview(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
    }
  };

  const parseCSVPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
      
      const previewData: CustomerRow[] = [];
      const errors: string[] = [];

      // Parse first 5 rows for preview
      for (let i = 1; i <= Math.min(6, lines.length - 1); i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length === headers.length) {
          const row: CustomerRow = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          previewData.push(row);
        }
      }

      // Validate required fields
      const requiredFields = ['email'];
      const missingFields = requiredFields.filter(field => 
        !headers.includes(field) && !headers.includes(field.replace('_', ' '))
      );

      if (missingFields.length > 0) {
        errors.push(`Missing required columns: ${missingFields.join(', ')}`);
      }

      setPreview(previewData);
      setValidationErrors(errors);
    };
    reader.readAsText(file);
  };

  const processImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);

    try {
      const csv = await file.text();
      const lines = csv.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
      
      const result: ImportResult = {
        success: 0,
        errors: 0,
        warnings: 0,
        details: {
          successfulImports: [],
          errors: [],
          warnings: []
        }
      };

      // Import customer data
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length !== headers.length) {
          result.errors++;
          result.details.errors.push({
            row: i + 1,
            error: 'Column count mismatch',
            data: values
          });
          continue;
        }

        const customerData: any = {};
        headers.forEach((header, index) => {
          customerData[header] = values[index];
        });

        try {
          // Validate email
          if (!customerData.email || !customerData.email.includes('@')) {
            result.errors++;
            result.details.errors.push({
              row: i + 1,
              error: 'Invalid email address',
              data: customerData
            });
            continue;
          }

          // Transform data for database
          const transformedCustomer = {
            email: customerData.email,
            user_metadata: {
              first_name: customerData.first_name || '',
              last_name: customerData.last_name || '',
              phone: customerData.phone || '',
              accepts_email_marketing: customerData.accepts_email_marketing === 'yes',
              accepts_sms_marketing: customerData.accepts_sms_marketing === 'yes',
              customer_tier: customerData.customer_tier || 'Bronze',
              engagement_score: parseFloat(customerData.engagement_score || '0'),
              sizes: {
                jacket: {
                  size: customerData.jacket_size || '',
                  confidence: parseFloat(customerData.jacket_size_confidence || '0')
                },
                vest: {
                  size: customerData.vest_size || '',
                  confidence: parseFloat(customerData.vest_size_confidence || '0')
                },
                shirt: {
                  size: customerData.shirt_size || '',
                  confidence: parseFloat(customerData.shirt_size_confidence || '0')
                },
                shoe: {
                  size: customerData.shoe_size || '',
                  confidence: parseFloat(customerData.shoe_size_confidence || '0')
                },
                pants: {
                  size: customerData.pants_size || '',
                  confidence: parseFloat(customerData.pants_size_confidence || '0')
                }
              },
              size_profile_completeness: parseFloat(customerData.size_profile_completeness || '0'),
              purchase_history: {
                total_spent: parseFloat(customerData.total_spent || '0'),
                total_orders: parseInt(customerData.total_orders || '0'),
                average_order_value: parseFloat(customerData.average_order_value || '0'),
                repeat_customer: customerData.repeat_customer === 'yes',
                vip_status: customerData.vip_status === 'yes',
                high_value_first_order: customerData.high_value_first_order === 'yes',
                primary_occasion: customerData.primary_occasion || '',
                first_purchase_date: customerData.first_purchase_date || '',
                last_purchase_date: customerData.last_purchase_date || '',
                days_since_last_purchase: parseInt(customerData.days_since_last_purchase || '0')
              },
              address: {
                address1: customerData.default_address_address1 || '',
                city: customerData.default_address_city || '',
                province_code: customerData.default_address_province_code || '',
                country_code: customerData.default_address_country_code || 'US',
                zip: customerData.default_address_zip || ''
              },
              notes: customerData.note || '',
              tags: customerData.tags ? customerData.tags.split(';') : []
            }
          };

          // Here you would actually save to Supabase
          // For now, we'll simulate the import
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate API call

          result.success++;
          result.details.successfulImports.push(transformedCustomer);

        } catch (error) {
          result.errors++;
          result.details.errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: customerData
          });
        }

        setProgress(Math.round((i / (lines.length - 1)) * 100));
      }

      setImportResult(result);
      setActiveTab('results');
      onImportComplete?.(result);

      toast({
        title: "Import completed",
        description: `Successfully imported ${result.success} customers with ${result.errors} errors`,
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "There was an error processing your file",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'customer_id', 'first_name', 'last_name', 'email', 'phone',
      'accepts_email_marketing', 'accepts_sms_marketing', 'total_spent', 'total_orders',
      'customer_tier', 'engagement_score', 'jacket_size', 'jacket_size_confidence',
      'vest_size', 'vest_size_confidence', 'shirt_size', 'shirt_size_confidence',
      'shoe_size', 'shoe_size_confidence', 'pants_size', 'pants_size_confidence',
      'size_profile_completeness', 'average_order_value', 'repeat_customer',
      'vip_status', 'high_value_first_order', 'primary_occasion',
      'first_purchase_date', 'last_purchase_date', 'days_since_last_purchase',
      'default_address_address1', 'default_address_city', 'default_address_province_code',
      'default_address_country_code', 'default_address_zip', 'note', 'tags'
    ];

    const csvContent = headers.join(',') + '\n' +
      'CUST001,John,Doe,john.doe@email.com,555-0123,yes,no,2450.00,12,Gold,85,42R,95,38R,90,16.5x34,95,10.5,90,32x32,85,204.17,yes,no,yes,formal,2023-01-15,2024-01-10,20,"123 Main St","New York",NY,US,10001,"Preferred customer","vip;formal"';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setFile(null);
    setPreview([]);
    setImportResult(null);
    setValidationErrors([]);
    setActiveTab('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Customers
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Customer Data</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="preview" disabled={!preview.length || validationErrors.length > 0}>Preview</TabsTrigger>
            <TabsTrigger value="results" disabled={!importResult}>Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  CSV File Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose CSV File
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={downloadTemplate}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      File selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </AlertDescription>
                  </Alert>
                )}

                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {validationErrors.map((error, index) => (
                          <div key={index}>{error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Required columns:</strong> email</p>
                  <p><strong>Optional columns:</strong> first_name, last_name, phone, customer_tier, sizes, purchase_history, etc.</p>
                  <p><strong>Supported tiers:</strong> Bronze, Silver, Gold, Platinum</p>
                </div>

                {file && preview.length > 0 && validationErrors.length === 0 && (
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={() => setActiveTab('preview')} 
                      className="gap-2"
                      size="lg"
                    >
                      Continue to Preview →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {preview.map((row, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>Name:</strong> {row.first_name} {row.last_name}</div>
                          <div><strong>Email:</strong> {row.email}</div>
                          <div><strong>Tier:</strong> {row.customer_tier || 'Bronze'}</div>
                          <div><strong>Total Spent:</strong> ${row.total_spent || '0'}</div>
                          <div><strong>Orders:</strong> {row.total_orders || '0'}</div>
                          <div><strong>VIP:</strong> {row.vip_status || 'no'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="mt-4 flex justify-between items-center">
                  <Button variant="outline" onClick={resetImport}>
                    Reset
                  </Button>
                  <Button 
                    onClick={processImport}
                    disabled={importing || validationErrors.length > 0}
                    className="gap-2"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Import {preview.length} Customers
                      </>
                    )}
                  </Button>
                </div>

                {importing && (
                  <div className="mt-4">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {importResult && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Success</span>
                      </div>
                      <div className="text-2xl font-bold">{importResult.success}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Errors</span>
                      </div>
                      <div className="text-2xl font-bold">{importResult.errors}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Warnings</span>
                      </div>
                      <div className="text-2xl font-bold">{importResult.warnings}</div>
                    </CardContent>
                  </Card>
                </div>

                {importResult.details.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">Import Errors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {importResult.details.errors.map((error, index) => (
                            <Alert key={index} variant="destructive">
                              <AlertDescription>
                                <strong>Row {error.row}:</strong> {error.error}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetImport}>
                    Import Another File
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}