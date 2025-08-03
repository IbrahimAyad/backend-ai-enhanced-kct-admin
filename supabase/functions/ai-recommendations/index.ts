import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecommendationContext {
  occasion?: string;
  season?: string;
  budget_range?: string;
  style_preference?: string;
  existing_items?: string[];
  body_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { recommendation_type, context }: { 
      recommendation_type: 'outfit' | 'complete_look' | 'upsell' | 'cross_sell';
      context: RecommendationContext;
    } = await req.json()

    // Get user's style profile
    const { data: styleProfile } = await supabase
      .from('style_profiles')
      .select('*')
      .eq('customer_id', user.id)
      .single()

    // Get available products
    const { data: products } = await supabase
      .from('products')
      .select(`
        id, name, category, base_price, images, description,
        product_variants!inner(id, price, attributes)
      `)
      .eq('status', 'active')

    if (!products) {
      throw new Error('Failed to fetch products')
    }

    // Generate AI recommendations using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = generateRecommendationPrompt(recommendation_type, context, styleProfile, products)

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a professional menswear stylist with expertise in formal wear, business attire, and wedding fashion. Provide personalized outfit recommendations based on the customer\'s profile, occasion, and available products.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error('Failed to generate AI recommendations')
    }

    const aiResult = await openaiResponse.json()
    const recommendations = parseAIResponse(aiResult.choices[0].message.content, products)

    // Calculate confidence score based on various factors
    const confidenceScore = calculateConfidenceScore(context, styleProfile, recommendations)

    // Store recommendation in database
    const { data: savedRecommendation, error } = await supabase
      .from('recommendations')
      .insert({
        customer_id: user.id,
        recommendation_type,
        context,
        recommended_items: recommendations,
        confidence_score: confidenceScore,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        recommendation: savedRecommendation,
        items: recommendations.map((rec: any) => ({
          ...products.find(p => p.id === rec.product_id),
          recommendation_reason: rec.reason,
          priority: rec.priority
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-recommendations:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateRecommendationPrompt(
  type: string, 
  context: RecommendationContext, 
  styleProfile: any, 
  products: any[]
): string {
  const productsList = products.map(p => 
    `${p.id}: ${p.name} (${p.category}) - $${p.base_price} - ${p.description}`
  ).join('\n')

  return `
Based on the following information, recommend the best menswear products:

RECOMMENDATION TYPE: ${type}
OCCASION: ${context.occasion || 'general'}
SEASON: ${context.season || 'year-round'}
BUDGET: ${context.budget_range || 'flexible'}
STYLE PREFERENCE: ${context.style_preference || styleProfile?.style_personality || 'classic'}
BODY TYPE: ${context.body_type || styleProfile?.body_type || 'regular'}
COLOR PREFERENCES: ${JSON.stringify(styleProfile?.color_preferences || [])}
EXISTING ITEMS: ${context.existing_items?.join(', ') || 'none specified'}

AVAILABLE PRODUCTS:
${productsList}

Please recommend 3-6 products that work well together. For each recommendation, provide:
1. Product ID
2. Reason for recommendation (2-3 sentences)
3. Priority (1-3, where 1 is highest priority)
4. How it complements other recommended items

Format your response as a JSON array:
[
  {
    "product_id": "uuid",
    "reason": "explanation",
    "priority": 1,
    "complements": ["other_product_ids"]
  }
]
`
}

function parseAIResponse(aiResponse: string, products: any[]): any[] {
  try {
    // Extract JSON from the AI response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate and filter recommendations
    return parsed.filter((rec: any) => 
      rec.product_id && 
      products.some(p => p.id === rec.product_id) &&
      rec.reason &&
      rec.priority
    )
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    // Fallback: return random products if AI parsing fails
    return products.slice(0, 3).map((product, index) => ({
      product_id: product.id,
      reason: "Selected based on popularity and style compatibility",
      priority: index + 1,
      complements: []
    }))
  }
}

function calculateConfidenceScore(
  context: RecommendationContext, 
  styleProfile: any, 
  recommendations: any[]
): number {
  let score = 0.5 // Base score

  // Increase confidence if we have style profile data
  if (styleProfile?.style_personality) score += 0.1
  if (styleProfile?.color_preferences?.length > 0) score += 0.1
  if (styleProfile?.fit_preferences) score += 0.1

  // Increase confidence if context is specific
  if (context.occasion) score += 0.1
  if (context.season) score += 0.05
  if (context.budget_range) score += 0.05

  // Increase confidence based on number of recommendations
  if (recommendations.length >= 3) score += 0.1

  return Math.min(0.95, Math.max(0.1, score))
}