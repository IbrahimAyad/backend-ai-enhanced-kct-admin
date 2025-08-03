import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExportConfig {
  type: 'products' | 'customers' | 'orders' | 'analytics' | 'inventory';
  format: 'csv' | 'pdf' | 'excel';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  filters: {
    status?: string[];
    category?: string[];
    includeImages?: boolean;
    includeVariants?: boolean;
  };
}

export const ExportManager = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [config, setConfig] = useState<ExportConfig>({
    type: 'products',
    format: 'csv',
    dateRange: { from: null, to: null },
    filters: {}
  });

  const exportTypes = [
    { value: 'products', label: 'Products', icon: Package, description: 'Product catalog with variants and pricing' },
    { value: 'customers', label: 'Customers', icon: Users, description: 'Customer profiles and contact information' },
    { value: 'orders', label: 'Orders', icon: ShoppingCart, description: 'Order history with line items' },
    { value: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Sales metrics and performance data' },
    { value: 'inventory', label: 'Inventory', icon: Package, description: 'Stock levels and movement history' }
  ];

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: FileText, description: 'Comma-separated values' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Portable document format' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const steps = [
        'Validating configuration...',
        'Querying database...',
        'Processing data...',
        'Generating file...',
        'Finalizing export...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setExportProgress((i + 1) * 20);
        
        toast({
          title: "Export Progress",
          description: steps[i],
        });
      }

      // Generate mock file
      const filename = `${config.type}_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.${config.format}`;
      
      // Create and download mock file
      const content = generateMockFileContent();
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${filename} has been downloaded successfully`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred during the export process",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const generateMockFileContent = () => {
    switch (config.type) {
      case 'products':
        return `SKU,Name,Category,Price,Stock,Status
NS-001,Navy 3-Piece Suit,Suits & Blazers,1299,12,Active
WDS-002,White Dress Shirt,Shirts & Tops,89,45,Active
SNT-003,Silk Navy Tie,Accessories,70,23,Active`;
      
      case 'customers':
        return `ID,Name,Email,Phone,Total Orders,Total Spent
1,John Smith,john.smith@email.com,+1-555-0123,5,6495
2,Mike Johnson,mike.j@email.com,+1-555-0124,3,2697
3,David Wilson,david.w@email.com,+1-555-0125,8,12350`;
      
      case 'orders':
        return `Order ID,Customer,Date,Items,Total,Status
ORD-001,John Smith,2024-01-15,3,1299,Completed
ORD-002,Mike Johnson,2024-01-16,2,899,Shipped
ORD-003,David Wilson,2024-01-17,5,2499,Processing`;
      
      default:
        return 'Export data would appear here...';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Export Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.value}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-colors",
                    config.type === type.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => setConfig(prev => ({ ...prev, type: type.value as any }))}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{type.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Format Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">File Format</Label>
          <div className="grid grid-cols-3 gap-3">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              return (
                <div
                  key={format.value}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-colors text-center",
                    config.format === format.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => setConfig(prev => ({ ...prev, format: format.value as any }))}
                >
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium text-sm">{format.label}</div>
                  <div className="text-xs text-muted-foreground">{format.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Date Range (Optional)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !config.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.from ? format(config.dateRange.from, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.from || undefined}
                    onSelect={(date) => setConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, from: date || null }
                    }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !config.dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.to ? format(config.dateRange.to, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.to || undefined}
                    onSelect={(date) => setConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, to: date || null }
                    }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <Separator />

        {/* Advanced Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Advanced Options</Label>
          <div className="space-y-3">
            {config.type === 'products' && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeImages"
                    checked={config.filters.includeImages || false}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, includeImages: checked as boolean }
                    }))}
                  />
                  <Label htmlFor="includeImages" className="text-sm">Include product images</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeVariants"
                    checked={config.filters.includeVariants || false}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, includeVariants: checked as boolean }
                    }))}
                  />
                  <Label htmlFor="includeVariants" className="text-sm">Include all variants</Label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Export Progress</Label>
              <span className="text-sm text-muted-foreground">{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
          </div>
        )}

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export {config.type} as {config.format.toUpperCase()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};