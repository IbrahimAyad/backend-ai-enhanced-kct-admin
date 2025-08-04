import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateWeddingModal } from '@/components/wedding/CreateWeddingModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { CartSheet } from '@/components/cart/CartSheet';
import { WishlistSheet } from '@/components/wishlist/WishlistSheet';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { KCTMenswearAPI, type Wedding } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, MapPin, Plus, Crown, Heart, Shield, BarChart, CheckCircle, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

const WeddingsPage = () => {
  const { user, loading: authLoading, session } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { toast } = useToast();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [allWeddings, setAllWeddings] = useState<Wedding[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('user');

  console.log('Wedding page - User:', JSON.stringify({
    user: user?.email, 
    loading: authLoading,
    session: !!session,
    userId: user?.id
  }), 'Is Admin:', isAdmin); // Debug logging

  useEffect(() => {
    if (authLoading) {
      return; // Don't do anything while authentication is loading
    }
    
    if (user) {
      loadUserWeddings();
      if (isAdmin) {
        loadAllWeddings();
        loadStatistics();
      }
    } else {
      setLoading(false);
    }
  }, [user, isAdmin, authLoading]);

  const loadUserWeddings = async () => {
    try {
      if (user?.email) {
        const userWeddings = await KCTMenswearAPI.getUserWeddings(user.email);
        setWeddings(userWeddings || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load weddings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllWeddings = async () => {
    try {
      const allWeddingsData = await KCTMenswearAPI.getAllWeddings();
      setAllWeddings(allWeddingsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load all weddings",
        variant: "destructive",
      });
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await KCTMenswearAPI.getWeddingStatistics();
      setStatistics(stats);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive",
      });
    }
  };

  const handleJoinWedding = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wedding code",
        variant: "destructive",
      });
      return;
    }

    setJoinLoading(true);
    try {
      const wedding = await KCTMenswearAPI.getWeddingByCode(joinCode.toUpperCase());
      if (wedding) {
        // Redirect to join page
        window.location.href = `/weddings/${joinCode.toUpperCase()}/join`;
      } else {
        toast({
          title: "Wedding Not Found",
          description: "Please check the wedding code and try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to find wedding",
        variant: "destructive",
      });
    } finally {
      setJoinLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
    // Only show sign-in prompt if we're not loading and definitely no user
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold">KCT Menswear</h1>
                  <Badge variant="secondary">MVP</Badge>
                </div>
                
                {/* Main Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                  <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                    Shop
                  </Link>
                  <Link to="/weddings" className="text-sm font-medium text-primary font-semibold flex items-center gap-1">
                    <Crown className="h-4 w-4" />
                    Weddings
                  </Link>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <WishlistSheet>
                  <Button variant="outline" size="sm" className="relative">
                    <Heart className="h-4 w-4" />
                  </Button>
                </WishlistSheet>
                
                <CartSheet>
                  <Button variant="outline" size="sm" className="relative">
                    <ShoppingBag className="h-4 w-4" />
                  </Button>
                </CartSheet>
                
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Heart className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Wedding Party Management</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Coordinate your wedding party outfits with ease. Get group discounts, track measurements, 
              and ensure everyone looks perfect for your special day.
            </p>
            <div className="bg-card border rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Please sign in to access wedding features</h3>
              <p className="text-muted-foreground">
                Create or join a wedding party to coordinate outfits, track orders, and get group discounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold">KCT Menswear</h1>
                <Badge variant="secondary">MVP</Badge>
              </div>
              
              {/* Main Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                  Shop
                </Link>
                <Link to="/weddings" className="text-sm font-medium text-primary font-semibold flex items-center gap-1">
                  <Crown className="h-4 w-4" />
                  Weddings
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <WishlistSheet>
                <Button variant="outline" size="sm" className="relative">
                  <Heart className="h-4 w-4" />
                </Button>
              </WishlistSheet>
              
              <CartSheet>
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingBag className="h-4 w-4" />
                </Button>
              </CartSheet>
              
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Heart className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Wedding Party Management</h1>
            <p className="text-xl text-muted-foreground">
              Coordinate your wedding party outfits with ease
            </p>
            {isAdmin && (
              <Badge variant="outline" className="mt-4 bg-blue-50 text-blue-700">
                <Shield className="h-3 w-3 mr-1" />
                Admin Access
              </Badge>
            )}
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="user">My Weddings</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="user" className="space-y-8">
              {/* Quick Actions */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Create Wedding Party
                    </CardTitle>
                    <CardDescription>
                      Start coordinating your wedding party outfits and get group discounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CreateWeddingModal>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Wedding
                      </Button>
                    </CreateWeddingModal>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Join Wedding Party
                    </CardTitle>
                    <CardDescription>
                      Enter your wedding code to join an existing party
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Enter wedding code (e.g. KCT001)"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                    <Button 
                      className="w-full" 
                      onClick={handleJoinWedding}
                      disabled={joinLoading}
                    >
                      {joinLoading ? "Finding Wedding..." : "Join Wedding Party"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* User's Weddings */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Your Weddings</h2>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading your weddings...</p>
                  </div>
                ) : weddings.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No weddings yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Create a new wedding party or join an existing one to get started
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {weddings.map((wedding) => (
                      <Card key={wedding.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">{wedding.couple_names}</h3>
                                <Badge variant="outline">Code: {wedding.wedding_code}</Badge>
                                <Badge variant={wedding.status === 'planning' ? 'secondary' : 'default'}>
                                  {wedding.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(wedding.event_date), 'MMM dd, yyyy')}
                                </div>
                                {wedding.venue_name && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {wedding.venue_name}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {wedding.party_size} members
                                </div>
                              </div>
                            </div>
                            <Link to={`/weddings/${wedding.wedding_code}`}>
                              <Button>View Dashboard</Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Admin Dashboard Tab */}
            {isAdmin && (
              <TabsContent value="admin" className="space-y-8">
                {/* Admin Statistics */}
                {statistics && (
                  <div className="grid md:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Crown className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold">{statistics.totalWeddings}</p>
                        <p className="text-sm text-muted-foreground">Total Weddings</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-2xl font-bold">{statistics.totalMembers}</p>
                        <p className="text-sm text-muted-foreground">Total Members</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-2xl font-bold">{statistics.upcomingWeddings}</p>
                        <p className="text-sm text-muted-foreground">Upcoming Weddings</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <p className="text-2xl font-bold">{statistics.completedMeasurements}</p>
                        <p className="text-sm text-muted-foreground">Completed Measurements</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* All Weddings List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      All Wedding Parties
                    </CardTitle>
                    <CardDescription>
                      Manage and monitor all wedding parties in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading weddings...</p>
                      </div>
                    ) : allWeddings.length === 0 ? (
                      <div className="text-center py-8">
                        <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No weddings created yet</h3>
                        <p className="text-muted-foreground">Wedding parties will appear here once created</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {allWeddings.map((wedding) => (
                          <Card key={wedding.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold">{wedding.couple_names}</h3>
                                    <Badge variant="outline">Code: {wedding.wedding_code}</Badge>
                                    <Badge variant={wedding.status === 'planning' ? 'secondary' : 'default'}>
                                      {wedding.status}
                                    </Badge>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                      {wedding.discount_percentage}% discount
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {format(new Date(wedding.event_date), 'MMM dd, yyyy')}
                                    </div>
                                    {wedding.venue_name && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {wedding.venue_name}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      {wedding.party_size} members planned
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      {(wedding as any).wedding_members?.length || 0} joined
                                    </div>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Coordinator: </span>
                                    <span className="font-medium">{wedding.coordinator_email}</span>
                                    {wedding.coordinator_phone && (
                                      <>
                                        <span className="text-muted-foreground"> • </span>
                                        <span>{wedding.coordinator_phone}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link to={`/weddings/${wedding.wedding_code}`}>
                                    <Button variant="outline" size="sm">View Details</Button>
                                  </Link>
                                  <Button variant="outline" size="sm">
                                    Contact Coordinator
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Benefits Section - shown on user tab */}
          {activeTab === 'user' && (
            <div className="mt-16 text-center">
              <h2 className="text-2xl font-bold mb-8">Wedding Party Benefits</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Group Discounts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Save 5-20% on your total order based on party size
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Coordinated Styling</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Ensure everyone's outfit matches your wedding theme
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Timeline Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Automated reminders for measurements and fittings
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeddingsPage;