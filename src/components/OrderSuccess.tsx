import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle } from 'lucide-react';
import { KCTMenswearAPI, type Order } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      loadOrder();
    }
  }, [sessionId]);

  const loadOrder = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const orderData = await KCTMenswearAPI.getOrder({ session_id: sessionId });
      setOrder(orderData);
    } catch (error: any) {
      console.error('Error loading order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details. Please check your email for order confirmation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground">
              We couldn't find your order details. Please check your email for order confirmation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Success Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold">Order Confirmed!</h1>
                  <p className="text-lg text-muted-foreground">
                    Thank you for your purchase. Your order has been successfully placed.
                  </p>
                </div>
                <div className="flex justify-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium">Order Number</p>
                    <p className="text-muted-foreground">{order.order_number}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Status</p>
                    <Badge variant="secondary" className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Email:</span> {order.customer?.email || order.guest_email}</p>
                  {order.customer?.first_name && (
                    <p>
                      <span className="font-medium">Name:</span> {order.customer.first_name} {order.customer.last_name}
                    </p>
                  )}
                  {order.customer?.phone && (
                    <p><span className="font-medium">Phone:</span> {order.customer.phone}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Items Ordered</h3>
                <div className="space-y-3">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-start p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        {item.customization && Object.keys(item.customization).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(item.customization).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value as string}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.total_price)}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.totals?.subtotal || order.subtotal)}</span>
                  </div>
                  {(order.totals?.tax || order.tax_amount) > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatPrice(order.totals?.tax || order.tax_amount)}</span>
                    </div>
                  )}
                  {(order.totals?.shipping || order.shipping_amount) > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatPrice(order.totals?.shipping || order.shipping_amount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>{formatPrice(order.totals?.total || order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div>
                  <h3 className="font-semibold mb-3">Shipping Address</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p>{order.shipping_address.line1}</p>
                    {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                    <p>
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                    </p>
                    <p>{order.shipping_address.country}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">What's Next?</h3>
                <p className="text-muted-foreground">
                  You'll receive an email confirmation shortly. We'll notify you when your order ships.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}