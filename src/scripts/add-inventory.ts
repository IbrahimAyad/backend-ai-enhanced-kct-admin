import { supabase } from '../lib/shared/supabase-products';

async function addInventoryToAllProducts() {
  console.log('🔄 Starting inventory update...');
  
  try {
    // First, check if we have product_variants table
    const { data: variantsExist } = await supabase
      .from('product_variants')
      .select('id')
      .limit(1);
    
    if (variantsExist) {
      console.log('✅ Using product_variants table for inventory');
      
      // Update all product variants
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, inventory_count');
      
      if (variantsError) {
        console.error('Error fetching variants:', variantsError);
        return;
      }
      
      console.log(`Found ${variants?.length || 0} variants to update`);
      
      // Update each variant's inventory
      for (const variant of variants || []) {
        const currentInventory = variant.inventory_count || 0;
        const newInventory = currentInventory + 10;
        
        const { error } = await supabase
          .from('product_variants')
          .update({ inventory_count: newInventory })
          .eq('id', variant.id);
        
        if (error) {
          console.error(`Error updating variant ${variant.id}:`, error);
        } else {
          console.log(`✅ Updated variant ${variant.id}: ${currentInventory} → ${newInventory}`);
        }
      }
    } else {
      console.log('⚠️ No product_variants found, checking for direct product inventory...');
      
      // If no variants, check if products have direct inventory field
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, total_inventory');
      
      if (productsError) {
        console.error('Error fetching products:', productsError);
        return;
      }
      
      console.log(`Found ${products?.length || 0} products`);
      
      // Since products don't have direct inventory, we'll create variants for them
      console.log('📦 Creating default variants with inventory...');
      
      for (const product of products || []) {
        // Check if variant already exists
        const { data: existingVariant } = await supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', product.id)
          .single();
        
        if (!existingVariant) {
          // Create a default variant with inventory
          const { error: createError } = await supabase
            .from('product_variants')
            .insert({
              product_id: product.id,
              name: 'Default',
              sku: `${product.id}-default`,
              price: 0, // Will use product's base price
              inventory_count: 10,
              status: 'active'
            });
          
          if (createError) {
            console.error(`Error creating variant for ${product.name}:`, createError);
          } else {
            console.log(`✅ Created variant with 10 inventory for: ${product.name}`);
          }
        } else {
          console.log(`⏭️ Variant already exists for: ${product.name}`);
        }
      }
    }
    
    // Check if inventory table exists and needs updating
    const { data: inventoryTable } = await supabase
      .from('inventory')
      .select('id')
      .limit(1);
    
    if (inventoryTable !== null) {
      console.log('📊 Updating inventory table...');
      
      // Get all inventory records
      const { data: inventoryRecords, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, quantity');
      
      if (!inventoryError && inventoryRecords) {
        for (const record of inventoryRecords) {
          const currentQty = record.quantity || 0;
          const newQty = currentQty + 10;
          
          const { error } = await supabase
            .from('inventory')
            .update({ quantity: newQty })
            .eq('id', record.id);
          
          if (error) {
            console.error(`Error updating inventory record ${record.id}:`, error);
          } else {
            console.log(`✅ Updated inventory record ${record.id}: ${currentQty} → ${newQty}`);
          }
        }
      }
    }
    
    console.log('🎉 Inventory update complete!');
    
    // Verify the update
    const { data: verifyData } = await supabase
      .from('product_variants')
      .select('inventory_count')
      .gt('inventory_count', 0);
    
    console.log(`\n📊 Verification: ${verifyData?.length || 0} variants have inventory > 0`);
    
  } catch (error) {
    console.error('❌ Error updating inventory:', error);
  }
}

// Run the function
addInventoryToAllProducts();