import { useState } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Crown, Users, MapPin, Palette } from 'lucide-react';
import { format } from 'date-fns';
import { KCTMenswearAPI } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CreateWeddingModalProps {
  children: React.ReactNode;
}

export function CreateWeddingModal({ children }: CreateWeddingModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [weddingCode, setWeddingCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    couple_names: '',
    event_date: undefined as Date | undefined,
    venue_name: '',
    party_size: 5,
    color_scheme: {
      primary: 'Navy',
      accent: 'Burgundy'
    },
    coordinator_email: '',
    coordinator_phone: ''
  });

  const handleCreateWedding = async () => {
    if (!formData.couple_names || !formData.event_date || !formData.coordinator_email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const wedding = await KCTMenswearAPI.createWedding({
        couple_names: formData.couple_names,
        event_date: formData.event_date.toISOString().split('T')[0],
        venue_name: formData.venue_name || undefined,
        party_size: formData.party_size,
        color_scheme: formData.color_scheme,
        coordinator_email: formData.coordinator_email,
        coordinator_phone: formData.coordinator_phone || undefined,
      });

      setWeddingCode(wedding.wedding_code);
      
      toast({
        title: "Wedding Created!",
        description: `Your wedding code is ${wedding.wedding_code}. Share this with your party members.`,
      });
    } catch (error: any) {
      console.error('Error creating wedding:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create wedding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (size: number) => {
    return size >= 10 ? 20 : size >= 7 ? 15 : size >= 5 ? 10 : 5;
  };

  const colors = [
    'Navy', 'Black', 'Charcoal', 'Burgundy', 'Forest Green', 
    'Royal Blue', 'Deep Purple', 'Chocolate Brown', 'Midnight Blue'
  ];

  if (weddingCode) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Wedding Created!
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="p-6 bg-muted rounded-lg">
              <h3 className="text-2xl font-bold mb-2">Wedding Code</h3>
              <div className="text-4xl font-mono font-bold text-primary">
                {weddingCode}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Share this code with your wedding party members so they can join and submit their measurements.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={() => navigator.clipboard.writeText(weddingCode)}
                variant="outline"
                className="flex-1"
              >
                Copy Code
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  setWeddingCode(null);
                  setFormData({
                    couple_names: '',
                    event_date: undefined,
                    venue_name: '',
                    party_size: 5,
                    color_scheme: { primary: 'Navy', accent: 'Burgundy' },
                    coordinator_email: '',
                    coordinator_phone: ''
                  });
                }}
                className="flex-1"
              >
                Create Another
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Create Wedding Event
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="couple-names">Couple Names *</Label>
              <Input
                id="couple-names"
                placeholder="John & Jane Smith"
                value={formData.couple_names}
                onChange={(e) => setFormData(prev => ({ ...prev, couple_names: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Wedding Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.event_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.event_date ? format(formData.event_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.event_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, event_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue (Optional)</Label>
              <Input
                id="venue"
                placeholder="The Grand Ballroom"
                value={formData.venue_name}
                onChange={(e) => setFormData(prev => ({ ...prev, venue_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="party-size">Party Size</Label>
              <Input
                id="party-size"
                type="number"
                min="2"
                max="20"
                value={formData.party_size}
                onChange={(e) => setFormData(prev => ({ ...prev, party_size: parseInt(e.target.value) || 5 }))}
              />
              <Badge variant="secondary" className="text-xs">
                {calculateDiscount(formData.party_size)}% group discount
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordinator-email">Coordinator Email *</Label>
              <Input
                id="coordinator-email"
                type="email"
                placeholder="coordinator@email.com"
                value={formData.coordinator_email}
                onChange={(e) => setFormData(prev => ({ ...prev, coordinator_email: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinator-phone">Coordinator Phone (Optional)</Label>
            <Input
              id="coordinator-phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.coordinator_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, coordinator_phone: e.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Scheme
            </Label>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Primary Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <Badge
                      key={color}
                      variant={formData.color_scheme.primary === color ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        color_scheme: { ...prev.color_scheme, primary: color }
                      }))}
                    >
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Accent Color (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.filter(c => c !== formData.color_scheme.primary).map(color => (
                    <Badge
                      key={color}
                      variant={formData.color_scheme.accent === color ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        color_scheme: { ...prev.color_scheme, accent: color }
                      }))}
                    >
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateWedding}
            disabled={loading || !formData.couple_names || !formData.event_date || !formData.coordinator_email}
            className="w-full"
          >
            {loading ? "Creating Wedding..." : "Create Wedding Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}