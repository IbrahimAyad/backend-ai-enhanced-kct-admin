import { useState } from 'react';
import { 
  Package, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Tag,
  DollarSign,
  Eye,
  EyeOff,
  Copy,
  Archive,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  base_price: number;
  price?: number; // Keep both for compatibility
  status: 'active' | 'draft' | 'archived';
  category: string;
  stock: number;
}

interface BulkProductActionsProps {
  selectedProducts: string[];
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  onDeselectAll: () => void;
}

export function BulkProductActions({
  selectedProducts,
  products,
  onUpdateProducts,
  onDeselectAll
}: BulkProductActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    price: '',
    category: '',
    status: '',
    discountPercent: '',
    tags: ''
  });
  const { toast } = useToast();

  if (selectedProducts.length === 0) return null;

  const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
  const totalValue = selectedProductsData.reduce((sum, product) => sum + product.base_price, 0);
  const statusCounts = selectedProductsData.reduce((acc, product) => {
    acc[product.status] = (acc[product.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleBulkStatusUpdate = async (newStatus: string) => {
    setIsProcessing(true);
    try {
      const updatedProducts = products.map(product =>
        selectedProducts.includes(product.id)
          ? { ...product, status: newStatus as Product['status'] }
          : product
      );
      
      onUpdateProducts(updatedProducts);
      toast({
        title: "Products Updated",
        description: `${selectedProducts.length} products marked as ${newStatus}`,
      });
      onDeselectAll();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!bulkEditData.price && !bulkEditData.discountPercent) return;
    
    setIsProcessing(true);
    try {
      const updatedProducts = products.map(product => {
        if (!selectedProducts.includes(product.id)) return product;
        
        let newPrice = product.base_price;
        if (bulkEditData.price) {
          newPrice = parseFloat(bulkEditData.price);
        } else if (bulkEditData.discountPercent) {
          const discount = parseFloat(bulkEditData.discountPercent);
          newPrice = product.base_price * (1 - discount / 100);
        }
        
        return { ...product, base_price: newPrice };
      });
      
      onUpdateProducts(updatedProducts);
      toast({
        title: "Prices Updated",
        description: `Updated prices for ${selectedProducts.length} products`,
      });
      setBulkEditData({ ...bulkEditData, price: '', discountPercent: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update prices",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCategoryUpdate = async () => {
    if (!bulkEditData.category) return;
    
    setIsProcessing(true);
    try {
      const updatedProducts = products.map(product =>
        selectedProducts.includes(product.id)
          ? { ...product, category: bulkEditData.category }
          : product
      );
      
      onUpdateProducts(updatedProducts);
      toast({
        title: "Categories Updated",
        description: `Updated category for ${selectedProducts.length} products`,
      });
      setBulkEditData({ ...bulkEditData, category: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update categories",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      const updatedProducts = products.filter(p => !selectedProducts.includes(p.id));
      onUpdateProducts(updatedProducts);
      toast({
        title: "Products Deleted",
        description: `${selectedProducts.length} products deleted`,
      });
      onDeselectAll();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete products",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportProducts = () => {
    const csvContent = [
      ['Name', 'SKU', 'Price', 'Status', 'Category', 'Stock'],
      ...selectedProductsData.map(product => [
        product.name,
        product.sku,
        product.base_price.toString(),
        product.status,
        product.category,
        product.stock.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Export Complete",
      description: `Exported ${selectedProducts.length} products to CSV`,
    });
  };

  const handleDuplicateProducts = async () => {
    setIsProcessing(true);
    try {
      const duplicatedProducts = selectedProductsData.map(product => ({
        ...product,
        id: `${product.id}-copy`,
        name: `${product.name} (Copy)`,
        sku: `${product.sku}-COPY`,
        status: 'draft' as Product['status']
      }));
      
      onUpdateProducts([...products, ...duplicatedProducts]);
      toast({
        title: "Products Duplicated",
        description: `Created ${selectedProducts.length} product copies`,
      });
      onDeselectAll();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate products",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">
              {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            className="h-8 px-2 text-xs"
          >
            Clear Selection
          </Button>
        </div>
        
        {/* Selected Products Summary */}
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedProductsData.slice(0, 3).map(product => (
            <Badge key={product.id} variant="secondary" className="text-xs">
              {product.name}
            </Badge>
          ))}
          {selectedProducts.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{selectedProducts.length - 3} more
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Value</p>
            <p className="font-semibold">${totalValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Price</p>
            <p className="font-semibold">${(totalValue / selectedProducts.length).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Active</p>
            <p className="font-semibold">{statusCounts.active || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Draft</p>
            <p className="font-semibold">{statusCounts.draft || 0}</p>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Status Updates */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate('active')}
              disabled={isProcessing}
              className="h-8"
            >
              <Eye className="h-3 w-3 mr-1" />
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate('draft')}
              disabled={isProcessing}
              className="h-8"
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate('archived')}
              disabled={isProcessing}
              className="h-8"
            >
              <Archive className="h-3 w-3 mr-1" />
              Archive
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Bulk Edit Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Edit className="h-3 w-3 mr-1" />
                Bulk Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Edit Products</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-price">Set Price ($)</Label>
                  <Input
                    id="bulk-price"
                    type="number"
                    placeholder="Enter new price"
                    value={bulkEditData.price}
                    onChange={(e) => setBulkEditData({ ...bulkEditData, price: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Or apply discount:</p>
                  <Input
                    type="number"
                    placeholder="Discount percentage"
                    value={bulkEditData.discountPercent}
                    onChange={(e) => setBulkEditData({ ...bulkEditData, discountPercent: e.target.value })}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleBulkPriceUpdate}
                    disabled={!bulkEditData.price && !bulkEditData.discountPercent}
                    className="w-full"
                  >
                    Update Prices
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="bulk-category">Category</Label>
                  <Select onValueChange={(value) => setBulkEditData({ ...bulkEditData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suits">Suits</SelectItem>
                      <SelectItem value="shirts">Shirts</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="shoes">Shoes</SelectItem>
                      <SelectItem value="formal">Formal Wear</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    onClick={handleBulkCategoryUpdate}
                    disabled={!bulkEditData.category}
                    className="w-full"
                  >
                    Update Category
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Other Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicateProducts}
            disabled={isProcessing}
            className="h-8"
          >
            <Copy className="h-3 w-3 mr-1" />
            Duplicate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportProducts}
            className="h-8"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isProcessing}
            className="h-8"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
