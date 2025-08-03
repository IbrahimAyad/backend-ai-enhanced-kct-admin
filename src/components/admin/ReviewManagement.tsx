import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  Search, 
  Filter, 
  ThumbsUp, 
  ThumbsDown,
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  product_id: string;
  product_name: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_avatar?: string;
  rating: number;
  title: string;
  comment: string;
  fit_rating?: string;
  quality_rating?: number;
  style_rating?: number;
  verified_purchase: boolean;
  helpful_votes: number;
  total_votes: number;
  status: 'pending' | 'published' | 'rejected' | 'flagged';
  created_at: string;
  updated_at: string;
  admin_response?: string;
}

export function ReviewManagement() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Import supabase here to avoid dependency issues
      const { supabase } = await import('@/lib/supabase');
      
      // Fetch reviews with related product data first
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          *,
          products(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        toast({
          title: "Error",
          description: "Failed to load reviews from database",
          variant: "destructive"
        });
        return;
      }

      // If no reviews found, show empty state
      if (!reviews || reviews.length === 0) {
        setReviews([]);
        toast({
          title: "No Reviews",
          description: "No reviews found in database"
        });
        return;
      }

      // Get unique customer IDs
      const customerIds = [...new Set(reviews.map(r => r.customer_id))];
      
      // Fetch customer data separately
      const { data: customers, error: customerError } = await supabase
        .from('auth.users')
        .select('id, email, user_metadata')
        .in('id', customerIds);

      if (customerError) {
        console.log('Customer fetch error (using fallback):', customerError);
      }

      // Transform the data to match our interface
      const transformedReviews: Review[] = reviews.map(review => {
        const customer = customers?.find(c => c.id === review.customer_id);
        const customerName = customer?.user_metadata?.full_name || 
                           `${customer?.user_metadata?.first_name || ''} ${customer?.user_metadata?.last_name || ''}`.trim() ||
                           'Unknown Customer';
        
        return {
          id: review.id,
          product_id: review.product_id,
          product_name: review.products?.name || 'Unknown Product',
          customer_id: review.customer_id,
          customer_name: customerName,
          customer_email: customer?.email || 'Unknown Email',
          customer_avatar: customer?.user_metadata?.avatar_url,
          rating: review.rating,
          title: review.title || 'No title',
          comment: review.comment,
          fit_rating: review.fit_rating,
          quality_rating: review.quality_rating,
          style_rating: review.style_rating,
          verified_purchase: review.verified_purchase || false,
          helpful_votes: review.helpful_votes || 0,
          total_votes: review.total_votes || 0,
          status: review.status || 'pending',
          created_at: review.created_at,
          updated_at: review.updated_at,
          admin_response: review.admin_response
        };
      });

      setReviews(transformedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  const reviewStats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    published: reviews.filter(r => r.status === 'published').length,
    flagged: reviews.filter(r => r.status === 'flagged').length,
    avgRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
    verifiedPurchases: reviews.filter(r => r.verified_purchase).length
  };

  const handleUpdateReviewStatus = async (reviewId: string, newStatus: Review['status']) => {
    try {
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, status: newStatus, updated_at: new Date().toISOString() }
          : review
      ));

      toast({
        title: "Success",
        description: `Review ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating review status:', error);
      toast({
        title: "Error",
        description: "Failed to update review status",
        variant: "destructive"
      });
    }
  };

  const handleSubmitAdminResponse = async () => {
    if (!selectedReview || !adminResponse.trim()) return;

    try {
      setReviews(prev => prev.map(review => 
        review.id === selectedReview.id 
          ? { ...review, admin_response: adminResponse, updated_at: new Date().toISOString() }
          : review
      ));

      setSelectedReview(prev => prev ? { ...prev, admin_response: adminResponse } : null);
      setAdminResponse('');

      toast({
        title: "Success",
        description: "Admin response added"
      });
    } catch (error) {
      console.error('Error adding admin response:', error);
      toast({
        title: "Error",
        description: "Failed to add admin response",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'flagged': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Review['status']) => {
    switch (status) {
      case 'pending': return <Eye className="h-4 w-4" />;
      case 'published': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'flagged': return <Flag className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Review Management</h2>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">{reviewStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Eye className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{reviewStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{reviewStats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{reviewStats.avgRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{reviewStats.verifiedPurchases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReviews.map(review => (
              <div 
                key={review.id} 
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedReview(review)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.customer_avatar} />
                      <AvatarFallback>
                        {getInitials(review.customer_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{review.customer_name}</p>
                        {review.verified_purchase && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <Badge className={getStatusColor(review.status)}>
                          {getStatusIcon(review.status)}
                          {review.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.product_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(review.created_at)}
                      </p>
                      {review.helpful_votes > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {review.helpful_votes}/{review.total_votes} helpful
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">{review.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {review.comment}
                  </p>
                  
                  {(review.fit_rating || review.quality_rating || review.style_rating) && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {review.fit_rating && (
                        <span>Fit: {review.fit_rating.replace('_', ' ')}</span>
                      )}
                      {review.quality_rating && (
                        <span>Quality: {review.quality_rating}/5</span>
                      )}
                      {review.style_rating && (
                        <span>Style: {review.style_rating}/5</span>
                      )}
                    </div>
                  )}
                </div>

                {review.status === 'pending' && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateReviewStatus(review.id, 'published');
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateReviewStatus(review.id, 'rejected');
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateReviewStatus(review.id, 'flagged');
                      }}
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      Flag
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-6">
              {/* Review Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedReview.customer_avatar} />
                  <AvatarFallback>
                    {getInitials(selectedReview.customer_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold">{selectedReview.customer_name}</h3>
                    {selectedReview.verified_purchase && (
                      <Badge variant="outline">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified Purchase
                      </Badge>
                    )}
                    <Badge className={getStatusColor(selectedReview.status)}>
                      {selectedReview.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedReview.customer_email}</p>
                  <p className="text-sm text-muted-foreground">{selectedReview.product_name}</p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {renderStars(selectedReview.rating)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(selectedReview.created_at)}
                  </p>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-lg">{selectedReview.title}</h4>
                  <p className="mt-2">{selectedReview.comment}</p>
                </div>

                {/* Detailed Ratings */}
                {(selectedReview.fit_rating || selectedReview.quality_rating || selectedReview.style_rating) && (
                  <div className="space-y-2">
                    <h5 className="font-medium">Detailed Ratings</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedReview.fit_rating && (
                        <div className="text-center p-3 bg-muted rounded">
                          <p className="text-sm text-muted-foreground">Fit</p>
                          <p className="font-medium capitalize">
                            {selectedReview.fit_rating.replace('_', ' ')}
                          </p>
                        </div>
                      )}
                      {selectedReview.quality_rating && (
                        <div className="text-center p-3 bg-muted rounded">
                          <p className="text-sm text-muted-foreground">Quality</p>
                          <p className="font-medium">{selectedReview.quality_rating}/5</p>
                        </div>
                      )}
                      {selectedReview.style_rating && (
                        <div className="text-center p-3 bg-muted rounded">
                          <p className="text-sm text-muted-foreground">Style</p>
                          <p className="font-medium">{selectedReview.style_rating}/5</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Helpfulness */}
                {selectedReview.total_votes > 0 && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {selectedReview.helpful_votes} helpful
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4" />
                      {selectedReview.total_votes - selectedReview.helpful_votes} not helpful
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Response */}
              <div className="space-y-4">
                {selectedReview.admin_response ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <h5 className="font-medium mb-2">Admin Response</h5>
                    <p className="text-sm">{selectedReview.admin_response}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h5 className="font-medium">Add Admin Response</h5>
                    <Textarea
                      placeholder="Write a response to this review..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                    />
                    <Button onClick={handleSubmitAdminResponse} disabled={!adminResponse.trim()}>
                      Submit Response
                    </Button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Select 
                  value={selectedReview.status} 
                  onValueChange={(value: Review['status']) => 
                    handleUpdateReviewStatus(selectedReview.id, value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}