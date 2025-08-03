import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, Users, MapPin, Clock, Edit2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Event {
  id: string;
  name: string;
  type: 'wedding' | 'corporate' | 'special' | 'trunk_show';
  date: string;
  location: string;
  attendees: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  description?: string;
}

export const EventsManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Placeholder data for now
      const mockEvents: Event[] = [
        {
          id: "1",
          name: "Spring Wedding Showcase",
          type: "wedding",
          date: "2024-02-15T14:00:00Z",
          location: "Grand Ballroom, Downtown Hotel",
          attendees: 45,
          status: "upcoming",
          description: "Exclusive showcase of our spring wedding collection"
        },
        {
          id: "2",
          name: "Corporate Style Consultation",
          type: "corporate",
          date: "2024-01-20T10:00:00Z",
          location: "Business District Office",
          attendees: 12,
          status: "completed",
          description: "Professional wardrobe consultation for executives"
        },
        {
          id: "3",
          name: "Trunk Show - Italian Suits",
          type: "trunk_show",
          date: "2024-02-28T16:00:00Z",
          location: "Main Showroom",
          attendees: 30,
          status: "upcoming",
          description: "Exclusive trunk show featuring Italian designer suits"
        }
      ];
      
      setEvents(mockEvents);
      
      toast({
        title: "Events Loaded",
        description: "Events data loaded successfully"
      });
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'ongoing': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: Event['type']) => {
    switch (type) {
      case 'wedding': return '💒';
      case 'corporate': return '🏢';
      case 'special': return '⭐';
      case 'trunk_show': return '👔';
      default: return '📅';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Events Management</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.status === 'upcoming').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Attendees</p>
                <p className="text-2xl font-bold">
                  {events.reduce((sum, event) => sum + event.attendees, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => 
                    new Date(e.date).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Events List</CardTitle>
                <div className="relative">
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events
                  .filter(event => 
                    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.location.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getTypeIcon(event.type)}</div>
                        <div>
                          <div className="font-medium">{event.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center space-x-4">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.location}
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {event.attendees} attendees
                            </span>
                          </div>
                          {event.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {events
                  .filter(event => event.status === 'upcoming')
                  .map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getTypeIcon(event.type)}</div>
                        <div>
                          <div className="font-medium">{event.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()} • {event.location}
                          </div>
                        </div>
                      </div>
                      <Badge variant="default">Upcoming</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {events
                  .filter(event => event.status === 'completed')
                  .map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getTypeIcon(event.type)}</div>
                        <div>
                          <div className="font-medium">{event.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()} • {event.attendees} attendees
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};