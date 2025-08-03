import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    if (action === 'calculate' && req.method === 'POST') {
      const { product_ids, bundle_type } = await req.json()

      // Get products with their variants
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id, name, category, base_price,
          product_variants!inner(id, price, attributes)
        `)
        .in('id', product_ids)

      if (productsError) throw productsError

      // Get applicable bundles
      const { data: bundles, error: bundlesError } = await supabase
        .from('bundles')
        .select('*')
        .eq('is_active', true)
        .or(`bundle_type.eq.${bundle_type || 'complete_outfit'},bundle_type.eq.custom`)

      if (bundlesError) throw bundlesError

      const calculation = calculateBundleDiscount(products, bundles)

      // Track analytics if user is logged in
      if (user) {
        await supabase.from('bundle_analytics').insert({
          customer_id: user.id,
          session_id: req.headers.get('x-session-id'),
          items_selected: product_ids,
          total_original_price: calculation.original_total,
          discount_applied: calculation.discount_amount,
          final_price: calculation.final_total,
          conversion_step: 'calculated'
        })
      }

      return new Response(
        JSON.stringify(calculation),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'suggestions' && req.method === 'POST') {
      const { selected_products, target_category, occasion } = await req.json()

      // Get complementary products based on selected items
      const suggestions = await getComplementaryProducts(supabase, selected_products, target_category, occasion)

      return new Response(
        JSON.stringify({ suggestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'popular-combinations' && req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '10')
      
      const { data: combinations, error } = await supabase
        .from('outfit_combinations')
        .select('*')
        .order('purchase_count', { ascending: false })
        .limit(limit)

      if (error) throw error

      return new Response(
        JSON.stringify({ combinations }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })

  } catch (error) {
    console.error('Error in bundle-builder:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calculateBundleDiscount(products: any[], bundles: any[]) {
  const originalTotal = products.reduce((sum, product) => {
    const lowestPrice = Math.min(...product.product_variants.map((v: any) => v.price))
    return sum + lowestPrice
  }, 0)

  let bestDiscount = 0
  let appliedBundle = null

  for (const bundle of bundles) {
    const discount = calculateDiscountForBundle(products, bundle)
    if (discount > bestDiscount) {
      bestDiscount = discount
      appliedBundle = bundle
    }
  }

  const discountAmount = (originalTotal * bestDiscount) / 100
  const finalTotal = originalTotal - discountAmount

  return {
    original_total: originalTotal,
    discount_percentage: bestDiscount,
    discount_amount: discountAmount,
    final_total: finalTotal,
    applied_bundle: appliedBundle,
    savings: discountAmount,
    items_count: products.length
  }
}

function calculateDiscountForBundle(products: any[], bundle: any): number {
  const productCount = products.length

  // Check if bundle requirements are met
  if (productCount < bundle.min_items) {
    return 0
  }

  // Check category requirements
  if (bundle.required_categories && bundle.required_categories.length > 0) {
    const productCategories = products.map(p => p.category)
    const hasAllRequired = bundle.required_categories.every((cat: string) => 
      productCategories.includes(cat)
    )
    if (!hasAllRequired) {
      return 0
    }
  }

  // Apply discount based on type
  if (bundle.discount_type === 'percentage') {
    return bundle.discount_value
  }

  if (bundle.discount_type === 'tiered' && bundle.discount_tiers) {
    const applicableTier = bundle.discount_tiers
      .filter((tier: any) => productCount >= tier.min_items)
      .sort((a: any, b: any) => b.min_items - a.min_items)[0]
    
    return applicableTier ? applicableTier.discount : 0
  }

  return 0
}

async function getComplementaryProducts(
  supabase: any, 
  selectedProducts: string[], 
  targetCategory?: string, 
  occasion?: string
) {
  let query = supabase
    .from('products')
    .select(`
      id, name, category, base_price, images,
      product_variants!inner(id, price, attributes)
    `)
    .eq('status', 'active')
    .not('id', 'in', `(${selectedProducts.join(',')})`)

  if (targetCategory) {
    query = query.eq('category', targetCategory)
  }

  const { data: products, error } = await query.limit(20)

  if (error) throw error

  // Score products based on complementarity
  const scoredProducts = products.map((product: any) => {
    let score = Math.random() * 0.3 // Base randomness

    // Boost score for commonly paired categories
    const categoryPairings: Record<string, string[]> = {
      'suits': ['shirts', 'ties', 'shoes', 'accessories'],
      'shirts': ['ties', 'suits', 'accessories'],
      'ties': ['suits', 'shirts', 'accessories'],
      'shoes': ['suits', 'socks', 'accessories']
    }

    for (const selectedId of selectedProducts) {
      const selectedProduct = products.find((p: any) => p.id === selectedId)
      if (selectedProduct) {
        const complementaryCategories = categoryPairings[selectedProduct.category] || []
        if (complementaryCategories.includes(product.category)) {
          score += 0.4
        }
      }
    }

    // Boost score for occasion appropriateness
    if (occasion) {
      const occasionKeywords = occasion.toLowerCase().split(' ')
      const productText = (product.name + ' ' + product.description).toLowerCase()
      
      for (const keyword of occasionKeywords) {
        if (productText.includes(keyword)) {
          score += 0.2
        }
      }
    }

    return { ...product, complementarity_score: score }
  })

  return scoredProducts
    .sort((a, b) => b.complementarity_score - a.complementarity_score)
    .slice(0, 10)
}