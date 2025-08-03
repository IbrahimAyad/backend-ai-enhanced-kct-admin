import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Search, 
  Filter, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Eye,
  Edit,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface InventoryItem {
  id: string;
  product_id: string;
  sku: string;
  size?: string;
  color?: string;
  material?: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_point: number;
  reorder_quantity: number;
  max_stock_level: number;
  cost_per_unit?: number;
  wholesale_price?: number;
  retail_price?: number;
  warehouse_location?: string;
  bin_location?: string;
  supplier_id?: string;
  supplier_sku?: string;
  condition: 'new' | 'used' | 'damaged' | 'returned';
  quality_grade: 'A' | 'B' | 'C' | 'D';
  status: 'active' | 'discontinued' | 'out_of_stock' | 'backorder';
  created_at: string;
  updated_at: string;
  last_received_date?: string;
  last_sold_date?: string;
  product?: {
    name: string;
    category: string;
  };
}

interface InventoryMovement {
  id: string;
  inventory_id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer';
  reason: 'purchase' | 'sale' | 'return' | 'damage' | 'loss' | 'adjustment' | 'transfer' | 'initial_stock';
  quantity_changed: number;
  quantity_before: number;
  quantity_after: number;
  reference_type?: string;
  reference_id?: string;
  unit_cost?: number;
  total_cost?: number;
  notes?: string;
  created_at: string;
}

export function InventoryManagement() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockLevelFilter, setStockLevelFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    loadInventory();
    loadMovements();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          product:products(name, category)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading inventory:', error);
        toast({
          title: "Error",
          description: "Failed to load inventory",
          variant: "destructive"
        });
        return;
      }

      setInventory(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "Info",
          description: "No inventory items found. Add some inventory to get started.",
        });
      }

    } catch (error) {
      console.error('Error loading inventory:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading movements:', error);
        return;
      }

      setMovements(data || []);
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  };

  const adjustInventory = async (itemId: string, quantityChange: number, reason: string, notes?: string) => {
    try {
      const item = inventory.find(i => i.id === itemId);
      if (!item) return;

      const newQuantity = item.quantity_on_hand + quantityChange;
      
      // Update inventory quantity
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ 
          quantity_on_hand: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Create movement record
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([{
          inventory_id: itemId,
          movement_type: quantityChange > 0 ? 'in' : quantityChange < 0 ? 'out' : 'adjustment',
          reason: reason as any,
          quantity_changed: quantityChange,
          quantity_before: item.quantity_on_hand,
          quantity_after: newQuantity,
          notes: notes
        }]);

      if (movementError) throw movementError;

      // Update local state
      setInventory(prev => prev.map(invItem => 
        invItem.id === itemId 
          ? { 
              ...invItem, 
              quantity_on_hand: newQuantity,
              quantity_available: newQuantity - invItem.quantity_reserved
            }
          : invItem
      ));

      setShowAdjustmentDialog(false);
      setAdjustmentItem(null);
      
      toast({
        title: "Success",
        description: "Inventory adjustment recorded"
      });

      loadMovements();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      toast({
        title: "Error",
        description: "Failed to adjust inventory",
        variant: "destructive"
      });
    }
  };

  const updateInventoryItem = async (itemId: string, updates: Partial<InventoryItem>) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      setInventory(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, ...updates }
          : item
      ));

      toast({
        title: "Success",
        description: "Inventory item updated"
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive"
      });
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.color?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    let matchesStockLevel = true;
    if (stockLevelFilter === 'low') {
      matchesStockLevel = item.quantity_available <= item.reorder_point;
    } else if (stockLevelFilter === 'out') {
      matchesStockLevel = item.quantity_available <= 0;
    } else if (stockLevelFilter === 'overstocked') {
      matchesStockLevel = item.quantity_on_hand > item.max_stock_level;
    }
    
    return matchesSearch && matchesStatus && matchesStockLevel;
  });

  const inventoryStats = {
    totalItems: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + ((item.retail_price || 0) * item.quantity_on_hand), 0),
    lowStock: inventory.filter(item => item.quantity_available <= item.reorder_point).length,
    outOfStock: inventory.filter(item => item.quantity_available <= 0).length,
    overstocked: inventory.filter(item => item.quantity_on_hand > item.max_stock_level).length
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStockLevelColor = (item: InventoryItem) => {
    if (item.quantity_available <= 0) return 'bg-red-100 text-red-800';
    if (item.quantity_available <= item.reorder_point) return 'bg-yellow-100 text-yellow-800';
    if (item.quantity_on_hand > item.max_stock_level) return 'bg-purple-100 text-purple-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockLevelIcon = (item: InventoryItem) => {
    if (item.quantity_available <= 0) return <XCircle className="h-4 w-4" />;
    if (item.quantity_available <= item.reorder_point) return <AlertTriangle className="h-4 w-4" />;
    if (item.quantity_on_hand > item.max_stock_level) return <TrendingUp className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'discontinued': return 'bg-gray-100 text-gray-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'backorder': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              <SelectItem value="backorder">Backorder</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={stockLevelFilter} onValueChange={setStockLevelFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock Levels</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
              <SelectItem value="overstocked">Overstocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold">{inventoryStats.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold">{formatCurrency(inventoryStats.totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold">{inventoryStats.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-xl font-bold">{inventoryStats.outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overstocked</p>
                <p className="text-xl font-bold">{inventoryStats.overstocked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items ({filteredInventory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>On Hand</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Reorder Point</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map(item => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.sku}</TableCell>
                        
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                            <p className="text-xs text-muted-foreground">{item.product?.category}</p>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-sm">
                          {[item.size, item.color, item.material].filter(Boolean).join(' / ') || 'N/A'}
                        </TableCell>
                        
                        <TableCell className="font-medium">{item.quantity_on_hand}</TableCell>
                        <TableCell>{item.quantity_reserved}</TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={`gap-1 ${getStockLevelColor(item)}`}>
                              {getStockLevelIcon(item)}
                              {item.quantity_available}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>{item.reorder_point}</TableCell>
                        
                        <TableCell>
                          {formatCurrency((item.retail_price || 0) * item.quantity_on_hand)}
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedItem(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAdjustmentItem(item);
                                setShowAdjustmentDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredInventory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No inventory items found</p>
                    <p className="text-sm">Add inventory items or adjust your filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Quantity Change</TableHead>
                      <TableHead>Before</TableHead>
                      <TableHead>After</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map(movement => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-sm">
                          {formatDate(movement.created_at)}
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={movement.movement_type === 'in' ? 'default' : 'destructive'}>
                            {movement.movement_type}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="capitalize">{movement.reason}</TableCell>
                        
                        <TableCell className={`font-medium ${
                          movement.quantity_changed > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.quantity_changed > 0 ? '+' : ''}{movement.quantity_changed}
                        </TableCell>
                        
                        <TableCell>{movement.quantity_before}</TableCell>
                        <TableCell>{movement.quantity_after}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.notes || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {movements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stock movements found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {adjustmentItem?.sku}</DialogTitle>
          </DialogHeader>
          
          {adjustmentItem && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const quantity = parseInt(formData.get('quantity') as string);
              const reason = formData.get('reason') as string;
              const notes = formData.get('notes') as string;
              
              adjustInventory(adjustmentItem.id, quantity, reason, notes);
            }} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Stock: {adjustmentItem.quantity_on_hand}</label>
              </div>
              
              <div>
                <label className="text-sm font-medium">Quantity Change *</label>
                <Input 
                  name="quantity" 
                  type="number" 
                  placeholder="Enter positive number to add, negative to subtract"
                  required 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Reason *</label>
                <Select name="reason" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase/Receiving</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="loss">Loss/Theft</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input name="notes" placeholder="Optional notes" />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAdjustmentDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Adjust Stock</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inventory Item Details</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Product Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SKU:</span>
                      <span className="font-medium">{selectedItem.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product:</span>
                      <span>{selectedItem.product?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{selectedItem.product?.category || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{selectedItem.size || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Color:</span>
                      <span>{selectedItem.color || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Stock Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">On Hand:</span>
                      <span className="font-medium">{selectedItem.quantity_on_hand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reserved:</span>
                      <span>{selectedItem.quantity_reserved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available:</span>
                      <span className="font-medium">{selectedItem.quantity_available}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reorder Point:</span>
                      <span>{selectedItem.reorder_point}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Stock:</span>
                      <span>{selectedItem.max_stock_level}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Pricing</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost:</span>
                      <span>{formatCurrency(selectedItem.cost_per_unit || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wholesale:</span>
                      <span>{formatCurrency(selectedItem.wholesale_price || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Retail:</span>
                      <span className="font-medium">{formatCurrency(selectedItem.retail_price || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Value:</span>
                      <span className="font-bold">
                        {formatCurrency((selectedItem.retail_price || 0) * selectedItem.quantity_on_hand)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Location & Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Warehouse:</span>
                      <span>{selectedItem.warehouse_location || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bin:</span>
                      <span>{selectedItem.bin_location || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Condition:</span>
                      <span className="capitalize">{selectedItem.condition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Grade:</span>
                      <span>{selectedItem.quality_grade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={getStatusColor(selectedItem.status)}>
                        {selectedItem.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}