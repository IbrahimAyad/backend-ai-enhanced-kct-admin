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
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const url = new URL(req.url)
    const endpoint = url.pathname.split('/').pop()
    const timeframe = url.searchParams.get('timeframe') || '30d'

    const timeframeMap: Record<string, string> = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
      '1y': '1 year'
    }

    const interval = timeframeMap[timeframe] || '30 days'

    if (endpoint === 'overview') {
      const analytics = await getAnalyticsOverview(supabase, interval)
      return new Response(
        JSON.stringify(analytics),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (endpoint === 'products') {
      const productAnalytics = await getProductAnalytics(supabase, interval)
      return new Response(
        JSON.stringify(productAnalytics),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (endpoint === 'bundles') {
      const bundleAnalytics = await getBundleAnalytics(supabase, interval)
      return new Response(
        JSON.stringify(bundleAnalytics),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (endpoint === 'customers') {
      const customerAnalytics = await getCustomerAnalytics(supabase, interval)
      return new Response(
        JSON.stringify(customerAnalytics),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (endpoint === 'search') {
      const searchAnalytics = await getSearchAnalytics(supabase, interval)
      return new Response(
        JSON.stringify(searchAnalytics),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })

  } catch (error) {
    console.error('Error in analytics-dashboard:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getAnalyticsOverview(supabase: any, interval: string) {
  const since = `NOW() - INTERVAL '${interval}'`

  // Get total sales and revenue
  const { data: salesData } = await supabase.rpc('get_sales_overview', { 
    since_date: since 
  })

  // Get user engagement metrics
  const { data: engagementData } = await supabase
    .from('analytics_events')
    .select('event_type, customer_id')
    .gte('created_at', new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)))

  const engagement = {
    total_sessions: new Set(engagementData?.map(e => e.customer_id)).size || 0,
    page_views: engagementData?.filter(e => e.event_type === 'page_view').length || 0,
    product_views: engagementData?.filter(e => e.event_type === 'product_view').length || 0,
    cart_additions: engagementData?.filter(e => e.event_type === 'add_to_cart').length || 0
  }

  // Get top performing products
  const { data: topProducts } = await supabase
    .from('product_analytics')
    .select(`
      product_id,
      SUM(views) as total_views,
      SUM(purchases) as total_purchases,
      SUM(revenue) as total_revenue,
      products!inner(name, category)
    `)
    .gte('date', new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)))
    .order('total_revenue', { ascending: false })
    .limit(10)

  // Get conversion funnel
  const conversionFunnel = {
    product_views: engagement.product_views,
    cart_additions: engagement.cart_additions,
    purchases: salesData?.total_orders || 0,
    conversion_rate: engagement.product_views > 0 
      ? ((salesData?.total_orders || 0) / engagement.product_views * 100).toFixed(2)
      : '0.00'
  }

  return {
    timeframe: interval,
    sales: salesData || { total_orders: 0, total_revenue: 0, avg_order_value: 0 },
    engagement,
    top_products: topProducts || [],
    conversion_funnel: conversionFunnel
  }
}

async function getProductAnalytics(supabase: any, interval: string) {
  const { data: productMetrics } = await supabase
    .from('product_analytics')
    .select(`
      product_id,
      date,
      views,
      add_to_carts,
      purchases,
      revenue,
      products!inner(name, category, base_price)
    `)
    .gte('date', new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)))
    .order('date', { ascending: true })

  // Group by product and calculate totals
  const productSummary = (productMetrics || []).reduce((acc: any, metric: any) => {
    const productId = metric.product_id
    if (!acc[productId]) {
      acc[productId] = {
        product: metric.products,
        total_views: 0,
        total_cart_adds: 0,
        total_purchases: 0,
        total_revenue: 0,
        conversion_rate: 0
      }
    }
    
    acc[productId].total_views += metric.views || 0
    acc[productId].total_cart_adds += metric.add_to_carts || 0
    acc[productId].total_purchases += metric.purchases || 0
    acc[productId].total_revenue += metric.revenue || 0
    
    return acc
  }, {})

  // Calculate conversion rates
  Object.values(productSummary).forEach((product: any) => {
    if (product.total_views > 0) {
      product.conversion_rate = (product.total_purchases / product.total_views * 100).toFixed(2)
    }
  })

  return {
    products: Object.values(productSummary),
    daily_metrics: productMetrics || []
  }
}

async function getBundleAnalytics(supabase: any, interval: string) {
  const { data: bundleMetrics } = await supabase
    .from('bundle_analytics')
    .select(`
      bundle_id,
      conversion_step,
      discount_applied,
      final_price,
      created_at,
      bundles!inner(name, bundle_type)
    `)
    .gte('created_at', new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)))

  const bundlePerformance = (bundleMetrics || []).reduce((acc: any, metric: any) => {
    const bundleId = metric.bundle_id
    if (!acc[bundleId]) {
      acc[bundleId] = {
        bundle: metric.bundles,
        views: 0,
        customizations: 0,
        cart_adds: 0,
        purchases: 0,
        total_revenue: 0,
        avg_discount: 0
      }
    }

    switch (metric.conversion_step) {
      case 'viewed':
        acc[bundleId].views++
        break
      case 'customized':
        acc[bundleId].customizations++
        break
      case 'added_to_cart':
        acc[bundleId].cart_adds++
        break
      case 'purchased':
        acc[bundleId].purchases++
        acc[bundleId].total_revenue += metric.final_price || 0
        break
    }

    return acc
  }, {})

  return {
    bundle_performance: Object.values(bundlePerformance),
    conversion_funnel: bundleMetrics || []
  }
}

async function getCustomerAnalytics(supabase: any, interval: string) {
  // Get customer acquisition and retention metrics
  const { data: customerMetrics } = await supabase
    .from('customer_loyalty')
    .select(`
      customer_id,
      current_tier_id,
      lifetime_spend,
      points_balance,
      loyalty_tiers!inner(name)
    `)

  const { data: newCustomers } = await supabase
    .from('auth.users')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)))

  // Calculate customer segments
  const segments = {
    total_customers: customerMetrics?.length || 0,
    new_customers: newCustomers?.length || 0,
    by_tier: (customerMetrics || []).reduce((acc: any, customer: any) => {
      const tier = customer.loyalty_tiers?.name || 'No Tier'
      acc[tier] = (acc[tier] || 0) + 1
      return acc
    }, {}),
    avg_lifetime_value: customerMetrics?.length > 0
      ? (customerMetrics.reduce((sum: number, c: any) => sum + (c.lifetime_spend || 0), 0) / customerMetrics.length).toFixed(2)
      : '0.00'
  }

  return segments
}

async function getSearchAnalytics(supabase: any, interval: string) {
  const { data: searchData } = await supabase
    .from('search_analytics')
    .select('search_query, search_type, results_count, resulted_in_purchase')
    .gte('created_at', new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)))

  const searchMetrics = {
    total_searches: searchData?.length || 0,
    avg_results: searchData?.length > 0
      ? (searchData.reduce((sum: number, s: any) => sum + (s.results_count || 0), 0) / searchData.length).toFixed(1)
      : '0.0',
    search_conversion_rate: searchData?.length > 0
      ? (searchData.filter(s => s.resulted_in_purchase).length / searchData.length * 100).toFixed(2)
      : '0.00',
    popular_queries: getPopularQueries(searchData || []),
    search_types: (searchData || []).reduce((acc: any, search: any) => {
      acc[search.search_type] = (acc[search.search_type] || 0) + 1
      return acc
    }, {})
  }

  return searchMetrics
}

function getPopularQueries(searchData: any[]): Array<{query: string, count: number}> {
  const queryCount = searchData.reduce((acc: any, search: any) => {
    const query = search.search_query.toLowerCase().trim()
    acc[query] = (acc[query] || 0) + 1
    return acc
  }, {})

  return Object.entries(queryCount)
    .map(([query, count]) => ({ query, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}