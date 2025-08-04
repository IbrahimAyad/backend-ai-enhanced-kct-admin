# KCT Menswear Admin Dashboard - Production Ready Plan

## 🎯 Overview
The admin dashboard UI is well-built but currently uses mock data. This plan outlines the steps to connect all components to real Supabase data and make it production-ready.

## 📊 Current Status
- ✅ Authentication working
- ✅ UI components built
- ✅ Routing configured
- ❌ 70-80% of data is mock/hardcoded
- ❌ No real-time features
- ❌ No Stripe integration
- ❌ No file storage system

## 🚀 Production Readiness Phases

### **Phase 1: Core Database & Infrastructure (Week 1-2)**

#### 1.1 Database Schema Setup
```sql
-- Products table with all required fields
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost DECIMAL(10,2),
  sku TEXT UNIQUE,
  barcode TEXT,
  weight DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants for sizes/colors
CREATE TABLE product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price DECIMAL(10,2),
  size TEXT,
  color TEXT,
  material TEXT,
  inventory_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory tracking
CREATE TABLE inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'adjustment', 'sale', 'return', 'restock'
  reason TEXT,
  reference_id UUID, -- order_id or adjustment_id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enhanced customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  tags TEXT[],
  notes TEXT,
  total_spent DECIMAL(10,2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  accepts_marketing BOOLEAN DEFAULT false,
  tax_exempt BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders with proper structure
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  fulfillment_status TEXT DEFAULT 'unfulfilled',
  currency TEXT DEFAULT 'USD',
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order line items
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  fulfilled_quantity INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2 File Storage Setup (R2/S3)
- Configure Supabase Storage buckets for product images
- Set up image optimization pipeline
- Implement bulk upload functionality

#### 1.3 Environment Configuration
- Set up production environment variables
- Configure Stripe API keys
- Set up email service (Resend/SendGrid)

### **Phase 2: Core Functionality (Week 3-4)**

#### 2.1 Product Management
**Files to update:**
- `src/components/admin/ProductManagement.tsx`
- `src/components/admin/ProductGrid.tsx`
- `src/lib/productImages.ts`

**Implementation:**
```typescript
// Replace mock data with real Supabase queries
const { data: products, error } = await supabase
  .from('products')
  .select(`
    *,
    product_variants (*)
  `)
  .order('created_at', { ascending: false });
```

#### 2.2 Order Management
**Files to update:**
- `src/components/admin/OrderManagement.tsx`
- `src/components/admin/AdminOrderManagement.tsx`
- `src/components/admin/OrderTimeline.tsx`

**Implementation:**
- Connect to real orders table
- Implement order status updates
- Add order fulfillment workflow

#### 2.3 Customer Management
**Files to update:**
- `src/components/admin/CustomerManagement.tsx`
- `src/components/admin/Customer360View.tsx`

**Implementation:**
- Real customer data integration
- Customer segmentation logic
- Purchase history tracking

#### 2.4 Inventory Management
**Files to update:**
- `src/components/admin/InventoryManagement.tsx`
- `src/components/admin/EnhancedInventory.tsx`

**Implementation:**
- Real-time stock tracking
- Low stock alerts
- Inventory movement history

### **Phase 3: Stripe Integration (Week 5)**

#### 3.1 Payment Processing
**Files to update:**
- `src/components/admin/StripeOrderManagement.tsx`
- `supabase/functions/create-checkout-secure/index.ts`

**Implementation:**
```typescript
// Stripe webhook handler
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Update order payment status
      break;
    case 'checkout.session.completed':
      // Create order in database
      break;
  }
}
```

#### 3.2 Product Sync
- Sync products to Stripe catalog
- Handle price updates
- Manage payment methods

### **Phase 4: Analytics & Real-time Features (Week 6)**

#### 4.1 Dashboard Analytics
**Files to update:**
- `src/pages/AdminDashboard.tsx` (remove hardcoded stats)
- `src/components/admin/RealTimeAnalytics.tsx`
- `src/components/admin/EnhancedDashboardWidgets.tsx`

**Implementation:**
```typescript
// Real dashboard stats
const { data: stats } = await supabase.rpc('get_dashboard_stats');

// Real-time subscriptions
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'orders' },
    (payload) => {
      // Update dashboard in real-time
    }
  )
  .subscribe();
```

#### 4.2 Reporting System
- Implement report generation
- Add export functionality
- Create analytics views

### **Phase 5: Advanced Features (Week 7-8)**

#### 5.1 Email System
**Files to update:**
- `src/components/admin/EmailCampaignAnalytics.tsx`
- `src/components/admin/MarketingAutomation.tsx`

**Implementation:**
- Integrate Resend/SendGrid
- Set up transactional emails
- Create email templates

#### 5.2 AI Features
**Files to update:**
- `src/components/ai/RecommendationEngine.tsx`
- `src/components/admin/PredictiveAnalytics.tsx`

**Implementation:**
- Connect to AI API
- Implement recommendation logic
- Add predictive analytics

#### 5.3 Wedding & Custom Orders
**Files to update:**
- `src/components/admin/BundleManagement.tsx`
- `src/components/admin/CustomOrdersManagement.tsx`

### **Phase 6: Testing & Optimization (Week 9)**

#### 6.1 Performance Optimization
- Implement pagination
- Add caching strategies
- Optimize queries

#### 6.2 Testing
- Unit tests for critical functions
- Integration tests for API endpoints
- E2E tests for key workflows

## 📋 Task Priority List

### **Immediate Actions (This Week)**
1. Create all database tables with proper schema
2. Set up file storage buckets
3. Configure production environment variables
4. Remove hardcoded data from AdminDashboard.tsx

### **High Priority (Next 2 Weeks)**
1. Implement real product management
2. Connect order management to database
3. Set up Stripe integration
4. Implement real-time dashboard updates

### **Medium Priority (Weeks 3-4)**
1. Email system integration
2. Customer segmentation
3. Inventory tracking
4. Basic reporting

### **Low Priority (Later)**
1. AI recommendations
2. Advanced analytics
3. A/B testing
4. Workflow automation

## 🛠️ Technical Implementation Details

### Database Queries to Replace Mock Data

1. **Dashboard Stats** (AdminDashboard.tsx:379-418)
```typescript
const loadDashboardStats = async () => {
  const { data: stats } = await supabase.rpc('get_dashboard_stats');
  setDashboardStats({
    totalOrders: stats?.total_orders || 0,
    totalRevenue: stats?.total_revenue || 0,
    totalCustomers: stats?.total_customers || 0,
    avgOrderValue: stats?.avg_order_value || 0
  });
};
```

2. **Recent Orders** (AdminDashboard.tsx:294-299)
```typescript
const { data: recentOrders } = await supabase
  .from('orders')
  .select('*, customer:customers(*)')
  .order('created_at', { ascending: false })
  .limit(5);
```

3. **Inventory Alerts** (AdminDashboard.tsx:331-336)
```typescript
const { data: lowStock } = await supabase
  .from('product_variants')
  .select('*, product:products(*)')
  .lt('inventory_quantity', 10)
  .order('inventory_quantity', { ascending: true });
```

## 🚦 Success Metrics

- All dashboard data comes from real database
- Zero hardcoded/mock data in production
- Real-time updates working
- Stripe payments processing
- Email notifications sending
- File uploads working
- < 3 second page load times
- 99.9% uptime

## 🤝 Next Steps

1. Review and approve this plan
2. Set up development database with schema
3. Begin Phase 1 implementation
4. Weekly progress reviews
5. Deploy to staging for testing
6. Production deployment

This plan will transform the admin dashboard from a UI prototype to a fully functional, production-ready business management system.