import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { KCTMenswearAPI, type Wedding, type WeddingMember } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Users, 
  MapPin, 
  CheckCircle, 
  Clock, 
  DollarSign,
  MessageCircle,
  AlertCircle,
  Crown,
  Shirt,
  Calendar as CalendarIcon,
  Send
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const WeddingDashboard = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [members, setMembers] = useState<WeddingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (code) {
      loadWedding();
    }
  }, [code]);

  const loadWedding = async () => {
    if (!code) return;
    
    try {
      const weddingData = await KCTMenswearAPI.getWeddingByCode(code);
      if (weddingData) {
        setWedding(weddingData);
        const membersData = await KCTMenswearAPI.getWeddingMembers(weddingData.id);
        setMembers(membersData);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load wedding details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (members.length === 0) return 0;
    const completedMeasurements = members.filter(m => m.measurement_status === 'complete').length;
    return Math.round((completedMeasurements / members.length) * 100);
  };

  const getRoleIcon = (role: string) => {
    if (role === 'groom') return <Crown className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'default';
      case 'pending': return 'secondary';
      case 'in_progress': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
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
    return <Navigate to="/weddings" replace />;
  }

  const daysUntilWedding = differenceInDays(new Date(wedding.event_date), new Date());
  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-background">
      {/* Wedding Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Wedding Portal</h1>
              <p className="text-primary-foreground/80">
                {daysUntilWedding > 0 ? `${daysUntilWedding} days until the big day!` : 'Today is the day!'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-foreground/80">Wedding Date</p>
              <p className="text-xl font-semibold">
                {format(new Date(wedding.event_date), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Party Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Party Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          {getStatusIcon(member.measurement_status)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{member.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Measurements</span>
                          <Badge variant={getStatusColor(member.measurement_status)}>
                            {member.measurement_status === 'complete' ? 'Complete' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Suit Ordered</span>
                          <Badge variant={getStatusColor(member.outfit_status)}>
                            {member.outfit_status === 'complete' ? 'Complete' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Send Reminder
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progress Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-sm text-muted-foreground">Party Members</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">
                    {members.filter(m => m.measurement_status === 'complete').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Measurements Complete</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="text-2xl font-bold text-primary">{progress}%</div>
                  </div>
                  <Progress value={progress} className="mb-2" />
                  <p className="text-sm text-muted-foreground">Progress</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Wedding Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timeline Items */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Send Party Invitations</h3>
                      <p className="text-sm text-muted-foreground">April 16, 2024</p>
                    </div>
                    <Badge variant="outline">task</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Collect Measurements</h3>
                      <p className="text-sm text-muted-foreground">May 16, 2024</p>
                    </div>
                    <Badge variant="outline">task</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Order Suits</h3>
                      <p className="text-sm text-muted-foreground">June 15, 2024</p>
                    </div>
                    <Badge variant="secondary">milestone</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold">First Fitting</h3>
                      <p className="text-sm text-muted-foreground">July 15, 2024</p>
                    </div>
                    <Badge variant="outline">task</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Final Fitting</h3>
                      <p className="text-sm text-muted-foreground">August 7, 2024</p>
                    </div>
                    <Badge variant="outline">task</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Crown className="h-6 w-6 text-yellow-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Wedding Day</h3>
                      <p className="text-sm text-muted-foreground">August 14, 2024</p>
                    </div>
                    <Badge variant="secondary">milestone</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-bold">$6500.00</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Spent</p>
                    <p className="text-2xl font-bold text-red-600">$0.00</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-bold text-green-600">$6500.00</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b">
                    <h3 className="font-semibold">Suits</h3>
                    <span className="text-muted-foreground">$0.00 / $5000.00</span>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b">
                    <h3 className="font-semibold">Accessories</h3>
                    <span className="text-muted-foreground">$0.00 / $1000.00</span>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b">
                    <h3 className="font-semibold">Alterations</h3>
                    <span className="text-muted-foreground">$0.00 / $500.00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Group Messages</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Group messaging coming soon</h3>
                <p className="text-muted-foreground mb-6">
                  Stay connected with your wedding party
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Shirt className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">Browse Collections</h3>
                      <p className="text-xs text-muted-foreground">
                        Explore curated wedding styles for your party
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">Coordinate Group</h3>
                      <p className="text-xs text-muted-foreground">
                        Manage invitations, sizes, and orders
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">Custom Design</h3>
                      <p className="text-xs text-muted-foreground">
                        Create unique suits for your special day
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Shirt className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">Wedding Studio</h3>
                      <p className="text-xs text-muted-foreground">
                        AI-powered wedding visualization
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Crown className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">Style Guide</h3>
                      <p className="text-xs text-muted-foreground">
                        Discover your perfect wedding style
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WeddingDashboard;