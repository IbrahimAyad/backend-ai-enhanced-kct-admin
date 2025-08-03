// Script to Update Stripe Products with R2 Images
// Run this with Node.js after installing stripe package: npm install stripe
const stripe = require('stripe')('your_stripe_secret_key'); // Replace with your secret key

// R2 Base URL
const R2_BASE_URL = "https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev";

// Map of product IDs to their main image paths
const productImageMap = {
  // Navy Suit
  "prod_SlQuqaI2IR6FRm": `${R2_BASE_URL}/navy/navy-3-main.jpg`,
  
  // Beige Suit  
  "prod_SlRx1FInciqpks": `${R2_BASE_URL}/beige/beige-main.jpg`,
  
  // Black Suit
  "prod_SlRxbBl5ZnnoDy": `${R2_BASE_URL}/black/blacksuit3p.jpg`,
  
  // Brown Suit
  "prod_SlRxCr1EySVGFB": `${R2_BASE_URL}/brown/brown-main.jpg`,
  
  // Burgundy Suit
  "prod_SlRyyerfBI04Gd": `${R2_BASE_URL}/burgundy/three-piece-burgundy-main.jpg`,
  
  // Charcoal Grey Suit
  "prod_SlRy7hTZZH1SA3": `${R2_BASE_URL}/char-grey/dark-grey-main.jpg`,
  
  // Dark Brown Suit
  "prod_SlRzSHXkrMqRAz": `${R2_BASE_URL}/dark-brown/dark-brown-main.jpg`,
  
  // Emerald Suit
  "prod_SlRzjrSQicROMU": `${R2_BASE_URL}/emerald/emerald-main.jpg`,
  
  // Hunter Green Suit
  "prod_SlRzUC4Qc8DB6A": `${R2_BASE_URL}/hunter-green/hunter-main.jpg`,
  
  // Indigo Suit
  "prod_SlS04B64q1VSDL": `${R2_BASE_URL}/indigo/indigo-main.jpg`,
  
  // Light Grey Suit
  "prod_SlS0s1WVSYRMpA": `${R2_BASE_URL}/light-grey/light-grey-main.jpg`,
  
  // Midnight Blue Suit
  "prod_SlS0Q2HVvKSrro": `${R2_BASE_URL}/midnight-blue/midnight-blue-main.jpg`,
  
  // Sand Suit
  "prod_SlS17gP6o4ORY9": `${R2_BASE_URL}/sand/sand-main.jpg`,
  
  // Tan Suit
  "prod_SlS1G2jUIjPQXv": `${R2_BASE_URL}/tan/tan-main.jpg`
};

// Function to update a single product
async function updateProductImage(productId, imageUrl) {
  try {
    const product = await stripe.products.update(productId, {
      images: [imageUrl]
    });
    console.log(`✅ Updated ${product.name} with image`);
    return product;
  } catch (error) {
    console.error(`❌ Error updating product ${productId}:`, error.message);
    return null;
  }
}

// Main function to update all products
async function updateAllProducts() {
  console.log('Starting Stripe product image updates...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [productId, imageUrl] of Object.entries(productImageMap)) {
    const result = await updateProductImage(productId, imageUrl);
    if (result) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== Update Complete ===');
  console.log(`✅ Successfully updated: ${successCount} products`);
  console.log(`❌ Errors: ${errorCount} products`);
}

// Alternative: Update using cURL commands (if you prefer command line)
function generateCurlCommands() {
  console.log('=== cURL Commands to Update Products ===\n');
  
  for (const [productId, imageUrl] of Object.entries(productImageMap)) {
    console.log(`curl https://api.stripe.com/v1/products/${productId} \\`);
    console.log(`  -u "sk_live_YOUR_SECRET_KEY_HERE:" \\`);
    console.log(`  -d "images[0]"="${imageUrl}"`);
    console.log('');
  }
}

// Run the updates
if (require.main === module) {
  // Uncomment the method you want to use:
  
  // Method 1: Update via API
  updateAllProducts();
  
  // Method 2: Generate cURL commands
  // generateCurlCommands();
}

// Export for use in other scripts
module.exports = {
  updateProductImage,
  updateAllProducts,
  productImageMap
};