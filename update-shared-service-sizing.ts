// Addition to src/lib/shared/supabase-products.ts
// These interfaces and functions should be added to the existing file

// New interfaces for smart sizing system
export interface SizeTemplate {
  id: string;
  category: string;
  subcategory?: string;
  template_name: string;
  sizes: any; // JSONB structure varies by category
  display_type: 'grid' | 'dropdown' | 'two_step';
  is_default: boolean;
  is_active: boolean;
}

export interface ProductSmartTag {
  id: string;
  product_id: string;
  tag_type: 'occasion' | 'style' | 'season' | 'body_type' | 'recommendation';
  tag_value: string;
  confidence_score: number;
  source: 'manual' | 'ai' | 'user_behavior';
}

export interface SizeRecommendation {
  id: string;
  product_id: string;
  customer_measurements: any;
  recommended_size: string;
  confidence_score: number;
  reasoning: string;
}

export interface SmartRecommendation {
  id: string;
  base_product_id: string;
  recommended_product_id: string;
  recommendation_type: 'frequently_together' | 'similar_style' | 'complete_look' | 'size_alternative';
  strength: number;
  reasoning: string;
  recommended_product?: Product; // Populated via join
}

// Enhanced Product interface with smart features
export interface EnhancedProduct extends Product {
  smart_tags?: ProductSmartTag[];
  size_template?: SizeTemplate;
  recommendations?: SmartRecommendation[];
  size_recommendation?: string;
  popularity_score?: number;
}

/**
 * Get size template for a product category
 */
export async function getSizeTemplate(category: string, subcategory?: string) {
  try {
    let query = supabase
      .from('size_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true);

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    query = query.order('is_default', { ascending: false });

    const { data, error } = await query.limit(1).single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error('getSizeTemplate error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate product variants from size template
 */
export async function generateVariantsFromTemplate(productId: string, templateId: string) {
  try {
    // Get the template
    const { data: template, error: templateError } = await supabase
      .from('size_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    const variants = [];
    const sizes = template.sizes;

    // Generate variants based on category
    switch (template.category) {
      case 'suits':
        // Generate all suit sizes (Short, Regular, Long)
        ['short', 'regular', 'long'].forEach(length => {
          if (sizes[length]) {
            sizes[length].forEach((size: string) => {
              variants.push({
                product_id: productId,
                sku: `${productId.substring(0, 8)}-${size}`,
                size_display: size,
                size_data: {
                  chest: parseInt(size),
                  length: length.charAt(0).toUpperCase()
                },
                option1: size,
                fit_type: length,
                inventory_quantity: 0,
                stock_quantity: 0,
                price: 0, // Will be set by admin
                status: 'active'
              });
            });
          }
        });
        break;

      case 'dress_shirts':
        // Generate neck/sleeve combinations
        if (sizes.fit_types) {
          sizes.fit_types.forEach((fit: string) => {
            sizes.neck_sizes.forEach((neck: string) => {
              sizes.sleeve_lengths.forEach((sleeve: string) => {
                const sizeDisplay = `${neck}/${sleeve}`;
                variants.push({
                  product_id: productId,
                  sku: `${productId.substring(0, 8)}-${neck}-${sleeve.replace('-', '')}-${fit}`,
                  size_display: sizeDisplay,
                  size_data: {
                    neck: neck,
                    sleeve: sleeve,
                    fit: fit
                  },
                  option1: sizeDisplay,
                  option2: fit,
                  fit_type: fit,
                  inventory_quantity: 0,
                  stock_quantity: 0,
                  price: 0,
                  status: 'active'
                });
              });
            });
          });
        }
        break;

      case 'sweaters':
        // Generate standard sizes
        sizes.sizes.forEach((size: string) => {
          variants.push({
            product_id: productId,
            sku: `${productId.substring(0, 8)}-${size}`,
            size_display: size,
            size_data: { size: size },
            option1: size,
            inventory_quantity: 0,
            stock_quantity: 0,
            price: 0,
            status: 'active'
          });
        });
        break;

      case 'dress_shoes':
        // Generate shoe sizes
        sizes.whole_sizes.forEach((size: number) => {
          // Whole size
          variants.push({
            product_id: productId,
            sku: `${productId.substring(0, 8)}-${size}`,
            size_display: size.toString(),
            size_data: { size: size, width: 'D' },
            option1: size.toString(),
            inventory_quantity: 0,
            stock_quantity: 0,
            price: 0,
            status: 'active'
          });

          // Half size if enabled
          if (sizes.half_sizes_available) {
            variants.push({
              product_id: productId,
              sku: `${productId.substring(0, 8)}-${size}5`,
              size_display: `${size}.5`,
              size_data: { size: size + 0.5, width: 'D' },
              option1: `${size}.5`,
              inventory_quantity: 0,
              stock_quantity: 0,
              price: 0,
              status: 'active'
            });
          }
        });
        break;
    }

    // Insert variants
    const { data, error } = await supabase
      .from('product_variants')
      .insert(variants)
      .select();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error('generateVariantsFromTemplate error:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get product with smart features (tags, recommendations, etc.)
 */
export async function getEnhancedProduct(slugOrId: string): Promise<{
  success: boolean;
  data: EnhancedProduct | null;
  error: string | null;
}> {
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        images:product_images(*),
        variants:product_variants(*),
        smart_tags:product_smart_tags(*),
        recommendations:smart_recommendations!base_product_id(
          *,
          recommended_product:products!recommended_product_id(*)
        )
      `)
      .eq('slug', slugOrId)
      .single();

    if (productError) {
      // Try by ID if slug fails
      const { data: productById, error: idError } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          variants:product_variants(*),
          smart_tags:product_smart_tags(*),
          recommendations:smart_recommendations!base_product_id(
            *,
            recommended_product:products!recommended_product_id(*)
          )
        `)
        .eq('id', slugOrId)
        .single();

      if (idError) throw idError;
      
      return {
        success: true,
        data: productById as EnhancedProduct,
        error: null
      };
    }

    // Sort images and calculate enhanced fields
    if (product?.images) {
      product.images.sort((a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order);
    }

    return {
      success: true,
      data: product as EnhancedProduct,
      error: null
    };
  } catch (error) {
    console.error('getEnhancedProduct error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get smart recommendations for a product
 */
export async function getProductRecommendations(productId: string, type?: string) {
  try {
    let query = supabase
      .from('smart_recommendations')
      .select(`
        *,
        recommended_product:products!recommended_product_id(
          *,
          images:product_images(*)
        )
      `)
      .eq('base_product_id', productId);

    if (type) {
      query = query.eq('recommendation_type', type);
    }

    query = query.order('strength', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('getProductRecommendations error:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get size recommendation for customer measurements
 */
export async function getSizeRecommendation(productId: string, measurements: any) {
  try {
    // This would integrate with AI/ML model
    // For now, return basic recommendation based on category
    const { data: product } = await getProduct(productId);
    
    if (!product.success || !product.data) {
      throw new Error('Product not found');
    }

    const category = product.data.category;
    let recommendedSize = null;

    // Basic size recommendation logic
    if (category?.includes('suit') || category?.includes('blazer')) {
      const chest = measurements.chest || 40;
      recommendedSize = `${chest}R`; // Default to Regular
    } else if (category?.includes('shirt')) {
      const neck = measurements.neck || 16;
      recommendedSize = `${neck}/34-35`; // Default sleeve
    }

    return {
      success: true,
      data: {
        recommended_size: recommendedSize,
        confidence_score: 0.8,
        reasoning: 'Based on provided measurements'
      },
      error: null
    };
  } catch (error) {
    console.error('getSizeRecommendation error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}