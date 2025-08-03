import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Check, 
  Printer, 
  Mail, 
  Package, 
  Truck, 
  X, 
  MoreHorizontal,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingMethod: string;
  createdAt: string;
  source: 'web' | 'phone' | 'wedding' | 'in-store';
}

interface BulkOrderActionsProps {
  selectedOrders: string[];
  orders: Order[];
  onUpdateOrders: (orderIds: string[], updates: Partial<Order>) => void;
  onDeselectAll: () => void;
}

export const BulkOrderActions = ({ selectedOrders, orders, onUpdateOrders, onDeselectAll }: BulkOrderActionsProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>('processing');

  const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));

  const handleBulkStatusUpdate = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      onUpdateOrders(selectedOrders, { status: newStatus });
      toast({
        title: "Status Updated",
        description: `${selectedOrders.length} orders updated to ${newStatus}`,
      });
      setShowStatusDialog(false);
      onDeselectAll();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintLabels = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate printing
      
      // Generate and download mock shipping labels
      const content = selectedOrdersData.map(order => 
        `SHIPPING LABEL\n
Order: ${order.orderNumber}
Customer: ${order.customer}
Email: ${order.email}
Method: ${order.shippingMethod}
Items: ${order.items}
Total: $${order.total}
        
-----------------------------------\n`
      ).join('\n');
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping_labels_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Labels Generated",
        description: `Shipping labels for ${selectedOrders.length} orders downloaded`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate shipping labels",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmails = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate email sending
      toast({
        title: "Emails Sent",
        description: `Order updates sent to ${selectedOrders.length} customers`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send emails",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportOrders = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const csvContent = [
        'Order Number,Customer,Email,Items,Total,Status,Payment Status,Created',
        ...selectedOrdersData.map(order => 
          `${order.orderNumber},${order.customer},${order.email},${order.items},$${order.total},${order.status},${order.paymentStatus},${order.createdAt}`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected_orders_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${selectedOrders.length} orders exported to CSV`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export orders",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedOrders.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={true} onCheckedChange={onDeselectAll} />
              <span className="font-medium">
                {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedOrdersData.map(order => (
                <Badge key={order.id} variant="outline" className="text-xs">
                  {order.orderNumber}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Update */}
            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isProcessing}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Order Status</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>New Status</Label>
                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Order['status'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkStatusUpdate} disabled={isProcessing}>
                      {isProcessing ? 'Updating...' : 'Update Status'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Print Labels */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrintLabels}
              disabled={isProcessing}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Labels
            </Button>

            {/* Send Emails */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSendEmails}
              disabled={isProcessing}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Updates
            </Button>

            {/* Export */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportOrders}
              disabled={isProcessing}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {/* Clear Selection */}
            <Button variant="ghost" size="sm" onClick={onDeselectAll}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats for Selected Orders */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="font-semibold">
              ${selectedOrdersData.reduce((sum, order) => sum + order.total, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Value</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">
              {selectedOrdersData.reduce((sum, order) => sum + order.items, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">
              {selectedOrdersData.filter(order => order.status === 'processing').length}
            </div>
            <div className="text-xs text-muted-foreground">Processing</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">
              {selectedOrdersData.filter(order => order.status === 'shipped').length}
            </div>
            <div className="text-xs text-muted-foreground">Shipped</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};