import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from "../_shared/cors.ts";
import { sanitizeString, sanitizeObject } from "../_shared/validation.ts";
import { createRateLimitedEndpoint, createUserTieredLimits } from '../_shared/rate-limit-middleware.ts';
import { sanitizeErrorMessage } from "../_shared/webhook-security.ts";

// Environment validation
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase configuration");
  throw new Error("Server configuration");
}

// Create rate limited endpoint handlers
const rateLimitedEndpoints = createRateLimitedEndpoint(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Valid values for validation
const VALID_RECOMMENDATION_TYPES = ['outfit', 'complete_look', 'upsell', 'cross_sell'];
const VALID_OCCASIONS = [
  'wedding', 'business', 'casual', 'formal', 'party', 'date', 
  'interview', 'graduation', 'holiday', 'general'
];
const VALID_SEASONS = ['spring', 'summer', 'fall', 'winter', 'year-round'];
const VALID_BUDGET_RANGES = ['budget', 'moderate', 'premium', 'luxury', 'flexible'];
const VALID_STYLES = ['classic', 'modern', 'trendy', 'conservative', 'bold'];
const VALID_BODY_TYPES = ['slim', 'athletic', 'regular', 'broad', 'tall', 'short'];

interface RecommendationContext {
  occasion?: string;
  season?: string;
  budget_range?: string;
  style_preference?: string;
  existing_items?: string[];
  body_type?: string;
}

interface RecommendationRequest {
  recommendation_type: string;
  context: RecommendationContext;
}

/**
 * Main AI recommendations handler
 */
async function handleAIRecommendations(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase client with auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Parse and validate request body
    let body: RecommendationRequest;
    try {
      body = await req.json();
    } catch {
      throw new Error('Invalid JSON payload');
    }

    // Validate recommendation type
    if (!body.recommendation_type || 
        !VALID_RECOMMENDATION_TYPES.includes(body.recommendation_type)) {
      throw new Error('Invalid recommendation type');
    }

    // Validate and sanitize context
    const context: RecommendationContext = {};

    if (body.context) {
      // Validate occasion
      if (body.context.occasion) {
        const occasion = sanitizeString(body.context.occasion, 50).toLowerCase();
        if (VALID_OCCASIONS.includes(occasion)) {
          context.occasion = occasion;
        } else {
          throw new Error('Invalid occasion');
        }
      }

      // Validate season
      if (body.context.season) {
        const season = sanitizeString(body.context.season, 20).toLowerCase();
        if (VALID_SEASONS.includes(season)) {
          context.season = season;
        } else {
          throw new Error('Invalid season');
        }
      }

      // Validate budget range
      if (body.context.budget_range) {
        const budget = sanitizeString(body.context.budget_range, 20).toLowerCase();
        if (VALID_BUDGET_RANGES.includes(budget)) {
          context.budget_range = budget;
        } else {
          throw new Error('Invalid budget range');
        }
      }

      // Validate style preference
      if (body.context.style_preference) {
        const style = sanitizeString(body.context.style_preference, 50).toLowerCase();
        if (VALID_STYLES.includes(style)) {
          context.style_preference = style;
        } else {
          throw new Error('Invalid style preference');
        }
      }

      // Validate body type
      if (body.context.body_type) {
        const bodyType = sanitizeString(body.context.body_type, 20).toLowerCase();
        if (VALID_BODY_TYPES.includes(bodyType)) {
          context.body_type = bodyType;
        } else {
          throw new Error('Invalid body type');
        }
      }

      // Validate existing items (limit to 10 items)
      if (body.context.existing_items && Array.isArray(body.context.existing_items)) {
        context.existing_items = body.context.existing_items
          .slice(0, 10)
          .map(item => sanitizeString(String(item), 100))
          .filter(item => item.length > 0);
      }
    }

    // Get user's style profile
    const { data: styleProfile } = await supabase
      .from('style_profiles')
      .select('*')
      .eq('customer_id', user.id)
      .single();

    // Get available products (limit to active products)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, name, category, base_price, images, description,
        product_variants!inner(id, price, attributes)
      `)
      .eq('status', 'active')
      .limit(100); // Limit products to prevent large prompts

    if (productsError || !products || products.length === 0) {
      throw new Error('No products available for recommendations');
    }

    // Check if OpenAI is configured
    if (!OPENAI_API_KEY) {
      // Fallback to rule-based recommendations
      const fallbackRecommendations = generateRuleBasedRecommendations(
        body.recommendation_type,
        context,
        styleProfile,
        products
      );

      return new Response(
        JSON.stringify({
          recommendation: {
            customer_id: user.id,
            recommendation_type: body.recommendation_type,
            context,
            recommended_items: fallbackRecommendations,
            confidence_score: 0.6,
            ai_generated: false
          },
          items: fallbackRecommendations.map((rec: any) => ({
            ...products.find(p => p.id === rec.product_id),
            recommendation_reason: rec.reason,
            priority: rec.priority
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate AI recommendations with timeout
    const prompt = generateSafePrompt(body.recommendation_type, context, styleProfile, products);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a professional menswear stylist. Provide JSON-formatted outfit recommendations based on available products. Only recommend products from the provided list.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error('OpenAI API error:', errorData);
        throw new Error('AI service temporarily unavailable');
      }

      const aiResult = await openaiResponse.json();
      const recommendations = parseAndValidateAIResponse(
        aiResult.choices[0].message.content, 
        products
      );

      // Calculate confidence score
      const confidenceScore = calculateConfidenceScore(context, styleProfile, recommendations);

      // Store recommendation in database
      const { data: savedRecommendation, error: saveError } = await supabase
        .from('recommendations')
        .insert({
          customer_id: user.id,
          recommendation_type: body.recommendation_type,
          context: context,
          recommended_items: recommendations,
          confidence_score: confidenceScore,
          ai_generated: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (saveError) {
        console.error('Failed to save recommendation:', saveError);
        // Continue without saving rather than failing
      }

      return new Response(
        JSON.stringify({
          recommendation: savedRecommendation || {
            customer_id: user.id,
            recommendation_type: body.recommendation_type,
            context,
            recommended_items: recommendations,
            confidence_score: confidenceScore,
            ai_generated: true
          },
          items: recommendations.map((rec: any) => ({
            ...products.find(p => p.id === rec.product_id),
            recommendation_reason: rec.reason,
            priority: rec.priority
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (aiError) {
      clearTimeout(timeoutId);
      console.error('AI generation error:', aiError);
      
      // Fallback to rule-based recommendations
      const fallbackRecommendations = generateRuleBasedRecommendations(
        body.recommendation_type,
        context,
        styleProfile,
        products
      );

      return new Response(
        JSON.stringify({
          recommendation: {
            customer_id: user.id,
            recommendation_type: body.recommendation_type,
            context,
            recommended_items: fallbackRecommendations,
            confidence_score: 0.5,
            ai_generated: false
          },
          items: fallbackRecommendations.map((rec: any) => ({
            ...products.find(p => p.id === rec.product_id),
            recommendation_reason: rec.reason,
            priority: rec.priority
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in ai-recommendations:', error);
    
    const errorMessage = sanitizeErrorMessage(error);
    const statusCode = error.message?.includes('Unauthorized') ? 401 :
                      error.message?.includes('Invalid') ? 400 :
                      error.message?.includes('Rate limit') ? 429 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

function generateSafePrompt(
  type: string,
  context: RecommendationContext,
  styleProfile: any,
  products: any[]
): string {
  // Limit product descriptions to prevent prompt injection
  const productsList = products
    .slice(0, 50) // Limit to 50 products
    .map(p => {
      const safeName = sanitizeString(p.name, 100);
      const safeCategory = sanitizeString(p.category, 50);
      const safeDesc = sanitizeString(p.description || '', 200);
      return `${p.id}: ${safeName} (${safeCategory}) - $${p.base_price} - ${safeDesc}`;
    })
    .join('\n');

  const sanitizedContext = {
    occasion: context.occasion || 'general',
    season: context.season || 'year-round',
    budget: context.budget_range || 'flexible',
    style: context.style_preference || styleProfile?.style_personality || 'classic',
    bodyType: context.body_type || styleProfile?.body_type || 'regular',
    colors: Array.isArray(styleProfile?.color_preferences) 
      ? styleProfile.color_preferences.slice(0, 5).map((c: any) => sanitizeString(String(c), 20))
      : [],
    existing: context.existing_items?.slice(0, 5).join(', ') || 'none specified'
  };

  return `
Based on the following information, recommend menswear products:

RECOMMENDATION TYPE: ${type}
OCCASION: ${sanitizedContext.occasion}
SEASON: ${sanitizedContext.season}
BUDGET: ${sanitizedContext.budget}
STYLE: ${sanitizedContext.style}
BODY TYPE: ${sanitizedContext.bodyType}
PREFERRED COLORS: ${sanitizedContext.colors.join(', ') || 'no preference'}
EXISTING ITEMS: ${sanitizedContext.existing}

AVAILABLE PRODUCTS:
${productsList}

Return a JSON object with a "recommendations" array containing 3-6 products:
{
  "recommendations": [
    {
      "product_id": "uuid-here",
      "reason": "Brief explanation (max 100 chars)",
      "priority": 1,
      "complements": ["other-product-uuid"]
    }
  ]
}

Only recommend products from the provided list. Ensure all product_ids are valid UUIDs from the list above.`;
}

function parseAndValidateAIResponse(aiResponse: string, products: any[]): any[] {
  try {
    const parsed = JSON.parse(aiResponse);
    
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('Invalid AI response format');
    }

    // Validate and sanitize recommendations
    const validRecommendations = parsed.recommendations
      .slice(0, 6) // Max 6 recommendations
      .filter((rec: any) => {
        // Must have valid product_id that exists in our products
        if (!rec.product_id || !products.some(p => p.id === rec.product_id)) {
          return false;
        }
        
        // Must have priority between 1-3
        const priority = parseInt(rec.priority);
        if (isNaN(priority) || priority < 1 || priority > 3) {
          return false;
        }
        
        return true;
      })
      .map((rec: any) => ({
        product_id: rec.product_id,
        reason: sanitizeString(rec.reason || 'Recommended based on your preferences', 200),
        priority: parseInt(rec.priority),
        complements: Array.isArray(rec.complements) 
          ? rec.complements.filter((id: any) => products.some(p => p.id === id)).slice(0, 3)
          : []
      }));

    if (validRecommendations.length === 0) {
      throw new Error('No valid recommendations from AI');
    }

    return validRecommendations;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw error;
  }
}

function generateRuleBasedRecommendations(
  type: string,
  context: RecommendationContext,
  styleProfile: any,
  products: any[]
): any[] {
  // Simple rule-based fallback recommendations
  const recommendations: any[] = [];
  
  // Filter products by context
  let filtered = [...products];
  
  // Filter by occasion
  if (context.occasion === 'formal' || context.occasion === 'wedding') {
    filtered = filtered.filter(p => 
      p.category === 'Suits' || p.category === 'Formal' || p.category === 'Wedding'
    );
  } else if (context.occasion === 'casual') {
    filtered = filtered.filter(p => 
      p.category === 'Casual' || p.category === 'Shirts'
    );
  }
  
  // Filter by budget
  if (context.budget_range === 'budget') {
    filtered.sort((a, b) => a.base_price - b.base_price);
  } else if (context.budget_range === 'luxury') {
    filtered.sort((a, b) => b.base_price - a.base_price);
  }
  
  // Take top products based on type
  const numRecommendations = type === 'complete_look' ? 4 : 3;
  
  filtered.slice(0, numRecommendations).forEach((product, index) => {
    recommendations.push({
      product_id: product.id,
      reason: `Selected for ${context.occasion || 'your'} occasion based on ${context.style_preference || 'classic'} style`,
      priority: index + 1,
      complements: []
    });
  });
  
  return recommendations;
}

function calculateConfidenceScore(
  context: RecommendationContext,
  styleProfile: any,
  recommendations: any[]
): number {
  let score = 0.5; // Base score

  // Context completeness
  if (context.occasion) score += 0.1;
  if (context.season) score += 0.05;
  if (context.budget_range) score += 0.05;
  if (context.style_preference) score += 0.05;
  if (context.body_type) score += 0.05;

  // Style profile data
  if (styleProfile) {
    if (styleProfile.style_personality) score += 0.05;
    if (styleProfile.color_preferences?.length > 0) score += 0.05;
  }

  // Recommendation quality
  if (recommendations.length >= 3) score += 0.05;
  if (recommendations.some(r => r.complements?.length > 0)) score += 0.05;

  return Math.min(0.95, Math.max(0.1, score));
}

// Create tiered rate limiting for AI recommendations:
// - Admin users: 500 requests/minute
// - Authenticated users: 100 requests/minute (api default)
// - Anonymous users: 20 requests/minute (stricter for AI)
const tieredRateLimits = [
  {
    condition: (req: Request) => {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) return false;
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role === 'admin' || payload.app_metadata?.role === 'admin';
      } catch {
        return false;
      }
    },
    options: {
      endpointType: 'admin' as const,
      identifierType: 'user' as const,
      errorMessage: 'Admin rate limit exceeded.'
    }
  },
  {
    condition: (req: Request) => {
      const authHeader = req.headers.get('authorization');
      return !!(authHeader && authHeader.startsWith('Bearer '));
    },
    options: {
      endpointType: 'api' as const,
      identifierType: 'user' as const,
      errorMessage: 'AI recommendation rate limit exceeded.'
    }
  },
  {
    condition: () => true, // Catch all for anonymous users
    options: {
      config: {
        maxRequests: 20,
        windowMs: 60 * 1000 // 1 minute
      },
      endpointType: 'api' as const,
      identifierType: 'ip' as const,
      errorMessage: 'AI recommendation rate limit exceeded. Please sign in for higher limits.'
    }
  }
];

// Apply tiered rate limiting to the handler
const protectedHandler = rateLimitedEndpoints.tiered(handleAIRecommendations, tieredRateLimits);

// Serve the protected endpoint
serve(protectedHandler);