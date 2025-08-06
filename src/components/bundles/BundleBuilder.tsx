import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Plus, Minus, Percent, DollarSign, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProductImageUrl } from '@/lib/shared/supabase-products';

interface BundleBuilderProps {
  initialProducts?: any[];
  bundleType?: string;
  onBundleUpdate?: (bundle: BundleCalculation) => void;
}

interface BundleCalculation {
  original_total: number;
  discount_percentage: number;
  discount_amount: number;
  final_total: number;
  applied_bundle: any;
  savings: number;
  items_count: number;
}

export const BundleBuilder: React.FC<BundleBuilderProps> = ({
  initialProducts = [],
  bundleType = 'complete_outfit',
  onBundleUpdate
}) => {
  const [selectedProducts, setSelectedProducts] = useState<any[]>(initialProducts);
  const [bundleCalculation, setBundleCalculation] = useState<BundleCalculation | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedProducts.length > 0) {
      calculateBundle();
      getSuggestions();
    }
  }, [selectedProducts]);

  const calculateBundle = async () => {
    if (selectedProducts.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/bundles/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          product_ids: selectedProducts.map(p => p.id),
          bundle_type: bundleType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate bundle');
      }

      const calculation = await response.json();
      setBundleCalculation(calculation);
      
      if (onBundleUpdate) {
        onBundleUpdate(calculation);
      }
    } catch (error) {
      console.error('Error calculating bundle:', error);
      toast({
        title: "Error",
        description: "Failed to calculate bundle pricing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async () => {
    if (selectedProducts.length === 0) return;

    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/bundles/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          selected_products: selectedProducts.map(p => p.id),
          occasion: bundleType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addProductToBundle = (product: any) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(prev => [...prev, product]);
      toast({
        title: "Product added to bundle",
        description: `${product.name} has been added to your bundle`
      });
    }
  };

  const removeProductFromBundle = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    toast({
      title: "Product removed",
      description: "Product has been removed from your bundle"
    });
  };

  const getDiscountTier = () => {
    if (!bundleCalculation?.applied_bundle?.discount_tiers) return null;
    
    const tiers = bundleCalculation.applied_bundle.discount_tiers;
    const currentCount = selectedProducts.length;
    
    return tiers.find((tier: any) => currentCount >= tier.min_items) || null;
  };

  const getNextTier = () => {
    if (!bundleCalculation?.applied_bundle?.discount_tiers) return null;
    
    const tiers = bundleCalculation.applied_bundle.discount_tiers;
    const currentCount = selectedProducts.length;
    
    return tiers.find((tier: any) => currentCount < tier.min_items) || null;
  };

  return (
    <div className="space-y-6">
      {/* Bundle Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Bundle Builder
          </CardTitle>
          <CardDescription>
            Add items to your bundle and save with automatic discounts
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Bundle ({selectedProducts.length} items)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {product.images && product.images[0] && (
                    <img 
                      src={getProductImageUrl(product.images[0])}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">${product.base_price}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeProductFromBundle(product.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Bundle Pricing */}
      {bundleCalculation && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Percent className="h-5 w-5" />
              Bundle Savings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Original Total:</span>
              <span className="line-through">${bundleCalculation.original_total.toFixed(2)}</span>
            </div>
            
            {bundleCalculation.discount_percentage > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Bundle Discount:</span>
                  <span className="text-green-600 font-medium">
                    -{bundleCalculation.discount_percentage}% (-${bundleCalculation.discount_amount.toFixed(2)})
                  </span>
                </div>
                <Separator />
              </>
            )}
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Bundle Total:</span>
              <span className="text-primary">${bundleCalculation.final_total.toFixed(2)}</span>
            </div>

            {bundleCalculation.savings > 0 && (
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">
                  🎉 You're saving ${bundleCalculation.savings.toFixed(2)}!
                </p>
              </div>
            )}

            {/* Tier Progress */}
            {getNextTier() && (
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  Add {getNextTier().min_items - selectedProducts.length} more item(s) to unlock {getNextTier().discount}% discount!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggested Products */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Complete Your Look
            </CardTitle>
            <CardDescription>
              {loadingSuggestions ? 'Finding perfect matches...' : 'Add these items to complete your bundle'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.slice(0, 6).map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    {product.images && product.images[0] && (
                      <img 
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {product.complementarity_score > 0.7 && (
                      <Badge className="absolute top-2 left-2 bg-green-100 text-green-800">
                        Great Match
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm mb-1">{product.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">${product.base_price}</p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => addProductToBundle(product)}
                      disabled={selectedProducts.some(p => p.id === product.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Bundle
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bundle Actions */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Button className="flex-1" size="lg">
                <DollarSign className="h-4 w-4 mr-2" />
                Add Bundle to Cart
              </Button>
              <Button variant="outline" size="lg">
                Save Bundle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};