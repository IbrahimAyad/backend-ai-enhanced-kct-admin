import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Package, Edit3, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { KCTMenswearAPI, type SavedOutfit } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface SavedOutfitsModalProps {
  children: React.ReactNode;
}

export function SavedOutfitsModal({ children }: SavedOutfitsModalProps) {
  const { user } = useAuth();
  const { items } = useCart();
  const { toast } = useToast();
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    occasion: '',
    is_public: false,
  });

  useEffect(() => {
    if (user) {
      loadOutfits();
    }
  }, [user]);

  const loadOutfits = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userOutfits = await KCTMenswearAPI.getSavedOutfits(user.id);
      setOutfits(userOutfits);
    } catch (error) {
      console.error('Error loading outfits:', error);
      toast({
        title: "Error",
        description: "Failed to load saved outfits.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOutfit = async () => {
    if (!user || !formData.name.trim() || items.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a name and ensure your cart has items.",
        variant: "destructive",
      });
      return;
    }

    try {
      const outfitItems = items.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      }));

      await KCTMenswearAPI.saveOutfit(user.id, {
        name: formData.name.trim(),
        items: outfitItems,
        occasion: formData.occasion || undefined,
        is_public: formData.is_public,
      });

      await loadOutfits();
      setShowCreateForm(false);
      setFormData({ name: '', occasion: '', is_public: false });
      
      toast({
        title: "Outfit saved",
        description: "Your outfit has been saved successfully.",
      });
    } catch (error: any) {
      console.error('Error saving outfit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save outfit.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      await KCTMenswearAPI.deleteOutfit(outfitId);
      setOutfits(prev => prev.filter(o => o.id !== outfitId));
      
      toast({
        title: "Outfit deleted",
        description: "Outfit has been removed from your collection.",
      });
    } catch (error: any) {
      console.error('Error deleting outfit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete outfit.",
        variant: "destructive",
      });
    }
  };

  const occasions = [
    'Business',
    'Casual',
    'Formal',
    'Wedding',
    'Date Night',
    'Interview',
    'Party',
    'Other'
  ];

  if (!user) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign in to save outfits</h3>
            <p className="text-muted-foreground">Create and save outfit combinations for different occasions</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Saved Outfits
            {outfits.length > 0 && (
              <Badge variant="secondary">
                {outfits.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="my-outfits" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-outfits">My Outfits</TabsTrigger>
            <TabsTrigger value="create-outfit">Create Outfit</TabsTrigger>
          </TabsList>

          <TabsContent value="my-outfits" className="space-y-4">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                    </div>
                  ))}
                </div>
              ) : outfits.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No saved outfits</h3>
                  <p className="text-muted-foreground">Create your first outfit from your cart</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outfits.map((outfit) => (
                    <div key={outfit.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{outfit.name}</h3>
                          {outfit.is_public ? (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOutfit(outfit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {outfit.occasion && (
                        <Badge variant="outline" className="text-xs">
                          {outfit.occasion}
                        </Badge>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        {outfit.items.length} item{outfit.items.length === 1 ? '' : 's'}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Created {new Date(outfit.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create-outfit" className="space-y-4">
            <div className="p-4 border rounded-lg space-y-4">
              <h3 className="font-semibold">Create New Outfit</h3>
              
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Add items to your cart to create an outfit
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="outfit-name">Outfit Name</Label>
                    <Input
                      id="outfit-name"
                      placeholder="e.g., Business Meeting Outfit"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occasion">Occasion (Optional)</Label>
                    <Select
                      value={formData.occasion}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, occasion: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an occasion" />
                      </SelectTrigger>
                      <SelectContent>
                        {occasions.map(occasion => (
                          <SelectItem key={occasion} value={occasion}>
                            {occasion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="public-outfit"
                      checked={formData.is_public}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                    />
                    <Label htmlFor="public-outfit">Make outfit public</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Items in this outfit ({items.length})</Label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {items.map((item) => (
                        <div key={`${item.product_id}-${item.variant_id}`} className="text-sm p-2 bg-muted rounded">
                          {item.product?.name || 'Unknown Product'} x{item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateOutfit}
                    disabled={!formData.name.trim()}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Save Outfit
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}