# RLS Migration Guide for KCT Menswear

## Current Status

### Tables WITH RLS Enabled ✅
- admin_users
- analytics_events
- collection_analytics
- collection_filters
- collection_products
- customer_loyalty
- customers (after our migration)
- loyalty_tiers
- outfit_combinations
- points_transactions
- product_analytics
- product_images
- product_relationships
- product_variants
- recommendations
- referrals
- review_votes
- search_analytics
- style_profiles

### Tables WITHOUT RLS ❌ (Need to Enable)
- **cart_items** - Critical for security
- **orders** - Critical for security
- **order_items** - Critical for security
- **products** - Needs public read, admin write
- **inventory** - Needs public read, admin write
- **inventory_movements** - Admin only
- **user_profiles** - User-specific data
- **reviews** - Public read (approved), user write
- **bundles** - Public read, admin write
- **bundle_analytics** - Analytics data
- **smart_collections** - Public read, admin write

## Migration Order

### Step 1: Fix Customers Table ✅
Run: `003_add_auth_user_id_and_rls.sql`
- Adds auth_user_id column
- Links existing customers to auth users
- Enables RLS with proper policies

### Step 2: Check Table Structures
Run: `005_check_critical_tables_structure.sql`
- Verify column names in each table
- Check foreign key relationships

### Step 3: Enable RLS on Remaining Tables
Run: `006_enable_rls_remaining_tables.sql`
- Enables RLS on all critical tables
- Adds proper policies for each table
- Handles different access patterns

## RLS Policy Patterns

### 1. User-Owned Data (customers, user_profiles, cart_items)
- Users can only see/edit their own records
- Admins can see/edit all records

### 2. Public Read, Admin Write (products, inventory, bundles)
- Everyone can view active/public items
- Only admins can create/update/delete

### 3. Order Data (orders, order_items)
- Users can view their own orders
- Only system/admin can create orders
- Admins can update order status

### 4. Admin-Only (inventory_movements, analytics)
- Only admins with specific permissions can access

### 5. Reviews (special case)
- Public can see approved reviews
- Users can create/edit their own reviews
- Admins can moderate all reviews

## Testing RLS Policies

After applying migrations, test with these queries:

```sql
-- Test as a regular user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-uuid-here';

-- Should only see own data
SELECT * FROM customers;
SELECT * FROM orders;
SELECT * FROM cart_items;

-- Should see all active products
SELECT * FROM products WHERE status = 'active';

-- Test as admin
SET LOCAL request.jwt.claim.sub TO 'admin-user-uuid';
-- Should see everything
SELECT * FROM customers;
SELECT * FROM orders;
```

## Common Issues and Solutions

### Issue: Column doesn't exist
**Solution**: The migration checks for column existence and adds if missing

### Issue: Policy already exists
**Solution**: Migrations drop existing policies before creating new ones

### Issue: Permission denied
**Solution**: Check if user is properly authenticated and has correct role

### Issue: Can't see any data
**Solution**: Verify auth_user_id is properly set in the customers table

## Security Best Practices

1. **Always use auth.uid()** for user identification
2. **Check admin_users table** for admin access
3. **Use EXISTS queries** for better performance
4. **Grant minimal permissions** - only what's needed
5. **Test policies thoroughly** before production

## Next Steps After RLS

1. **Create missing tables**:
   - email_logs
   - customer_segments
   - order_status_history
   - inventory_reservations (proper implementation)

2. **Add indexes** for performance:
   - Foreign key columns
   - Columns used in RLS policies

3. **Set up monitoring**:
   - Track RLS policy violations
   - Monitor query performance

4. **Document access patterns** for each table

## Rollback Plan

If issues occur, disable RLS:
```sql
-- Disable RLS on specific table
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Or drop all policies
DROP POLICY ALL ON table_name;
```

Remember: RLS is enforced at the database level, providing true security even if application code is compromised.