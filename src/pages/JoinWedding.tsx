import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { KCTMenswearAPI, type Wedding } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Heart, Users, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const JoinWedding = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  });

  const roles = [
    { value: 'groom', label: 'Groom' },
    { value: 'best_man', label: 'Best Man' },
    { value: 'groomsman', label: 'Groomsman' },
    { value: 'usher', label: 'Usher' },
    { value: 'father_of_bride', label: 'Father of Bride' },
    { value: 'father_of_groom', label: 'Father of Groom' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (code) {
      loadWedding();
    }
  }, [code]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const loadWedding = async () => {
    if (!code) return;
    
    try {
      const weddingData = await KCTMenswearAPI.getWeddingByCode(code);
      setWedding(weddingData);
    } catch (error: any) {
      toast({
        title: "Wedding Not Found",
        description: "Please check the wedding code and try again",
        variant: "destructive",
      });
      navigate('/weddings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!wedding || !formData.name || !formData.email || !formData.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await KCTMenswearAPI.addWeddingMember(wedding.id, {
        role: formData.role,
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      });

      toast({
        title: "Successfully Joined!",
        description: `Welcome to ${wedding.couple_names}'s wedding party`,
      });

      navigate(`/weddings/${code}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join wedding party",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading wedding details...</p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Wedding not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/weddings')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Weddings
          </Button>

          {/* Wedding Info */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle className="text-2xl">Join Wedding Party</CardTitle>
              <CardDescription>
                You've been invited to join {wedding.couple_names}'s wedding party
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(wedding.event_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                {wedding.venue_name && (
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{wedding.venue_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{wedding.party_size} members</span>
                </div>
              </div>
              
              {wedding.color_scheme && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Wedding Colors</p>
                  <div className="flex justify-center gap-2">
                    <Badge variant="outline">
                      Primary: {(wedding.color_scheme as any).primary}
                    </Badge>
                    <Badge variant="outline">
                      Accent: {(wedding.color_scheme as any).accent}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Join Form */}
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>
                Please provide your details to join the wedding party
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role in Wedding *</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {!user && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      You'll need to create an account to join the wedding party and track your order progress.
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                >
                  {submitting ? 'Joining Wedding Party...' : 'Join Wedding Party'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Group Benefits */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Wedding Party Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{wedding.discount_percentage}% OFF</Badge>
                  <span>Group discount on your order</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Free</Badge>
                  <span>Coordinated styling and color matching</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Included</Badge>
                  <span>Timeline reminders and fitting notifications</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        defaultTab="signup"
      />
    </div>
  );
};

export default JoinWedding;