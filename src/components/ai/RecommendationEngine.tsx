import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Star, TrendingUp, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProductImageUrl } from '@/lib/shared/supabase-products';

interface RecommendationEngineProps {
  onRecommendationSelected?: (products: any[]) => void;
}

interface RecommendationContext {
  occasion: string;
  season: string;
  budget_range: string;
  style_preference: string;
}

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  onRecommendationSelected
}) => {
  const [context, setContext] = useState<RecommendationContext>({
    occasion: '',
    season: '',
    budget_range: '',
    style_preference: ''
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGetRecommendations = async () => {
    if (!context.occasion) {
      toast({
        title: "Please select an occasion",
        description: "We need to know the occasion to provide the best recommendations",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/recommend-outfit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          recommendation_type: 'outfit',
          context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.items || []);
      
      toast({
        title: "Recommendations ready!",
        description: `Found ${data.items?.length || 0} perfect matches for you`,
      });

      if (onRecommendationSelected) {
        onRecommendationSelected(data.items || []);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to get recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPriorityIcon = (priority: number) => {
    switch (priority) {
      case 1: return <Star className="h-4 w-4 text-yellow-500" />;
      case 2: return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default: return <Heart className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Recommendation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Style Recommendations
          </CardTitle>
          <CardDescription>
            Tell us about your needs and we'll recommend the perfect outfit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Occasion</label>
              <Select value={context.occasion} onValueChange={(value) => 
                setContext(prev => ({ ...prev, occasion: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select occasion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="business">Business Meeting</SelectItem>
                  <SelectItem value="formal_dinner">Formal Dinner</SelectItem>
                  <SelectItem value="cocktail_party">Cocktail Party</SelectItem>
                  <SelectItem value="date_night">Date Night</SelectItem>
                  <SelectItem value="job_interview">Job Interview</SelectItem>
                  <SelectItem value="graduation">Graduation</SelectItem>
                  <SelectItem value="casual_work">Casual Work</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Season</label>
              <Select value={context.season} onValueChange={(value) => 
                setContext(prev => ({ ...prev, season: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spring">Spring</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                  <SelectItem value="fall">Fall</SelectItem>
                  <SelectItem value="winter">Winter</SelectItem>
                  <SelectItem value="year_round">Year Round</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Budget Range</label>
              <Select value={context.budget_range} onValueChange={(value) => 
                setContext(prev => ({ ...prev, budget_range: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget ($200-500)</SelectItem>
                  <SelectItem value="mid_range">Mid-Range ($500-1000)</SelectItem>
                  <SelectItem value="premium">Premium ($1000-2000)</SelectItem>
                  <SelectItem value="luxury">Luxury ($2000+)</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Style Preference</label>
              <Select value={context.style_preference} onValueChange={(value) => 
                setContext(prev => ({ ...prev, style_preference: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic & Timeless</SelectItem>
                  <SelectItem value="modern">Modern & Trendy</SelectItem>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="fashion_forward">Fashion Forward</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="bold">Bold & Statement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGetRecommendations}
            disabled={loading || !context.occasion}
            className="w-full"
          >
            {loading ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Getting Recommendations...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations Display */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Personalized Recommendations</CardTitle>
            <CardDescription>
              Our AI has curated these items specifically for your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((item, index) => (
                <Card key={item.id || index} className="overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    {item.images && item.images[0] && (
                      <img 
                        src={getProductImageUrl(item)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {getPriorityIcon(item.priority)}
                      <Badge className={`text-xs ${getConfidenceColor(item.confidence_score || 0.7)}`}>
                        {Math.round((item.confidence_score || 0.7) * 100)}% match
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      ${item.base_price}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {item.recommendation_reason}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                      <Button size="sm" className="flex-1">
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};