// Navy suit placeholder
export const navySuitImage = `https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop&crop=center`;

// Brown suit placeholder  
export const brownSuitImage = `https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop&crop=center`;

// Black suit placeholder
export const blackSuitImage = `https://images.unsplash.com/photo-1489370603040-dc6c28a66ced?w=400&h=400&fit=crop&crop=center`;

// Grey suit placeholder
export const greySuitImage = `https://images.unsplash.com/photo-1566479179817-c0e905e3a9a5?w=400&h=400&fit=crop&crop=center`;

// Beige suit placeholder
export const beigeSuitImage = `https://images.unsplash.com/photo-1619831894448-0f6d5b87ccbc?w=400&h=400&fit=crop&crop=center`;

// Default product placeholder
export const defaultProductImage = `https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop&crop=center`;

// Map of common product image names to placeholders
export const productImageMap: Record<string, string> = {
  'navy-3-main.jpg': navySuitImage,
  'beige-main.jpg': beigeSuitImage,
  'dark-grey-main.jpg': greySuitImage,
  'three-piece-burgundy-main.jpg': brownSuitImage,
  'brown-main.jpg': brownSuitImage,
  'blacksuit3p.jpg': blackSuitImage,
  'dark-brown-main.jpg': brownSuitImage,
  'emerald-main.jpg': greySuitImage,
  'hunter-main.jpg': greySuitImage,
  'light-grey-main.jpg': greySuitImage,
  'indigo-main.jpg': navySuitImage,
  'midnight-blue-main.jpg': navySuitImage,
  'sand-main.jpg': beigeSuitImage,
  'tan-main.jpg': beigeSuitImage,
};

// Function to get placeholder image for any product image name
export const getProductImageUrl = (imageName?: string): string => {
  if (!imageName) return defaultProductImage;
  
  // If it's already a full URL, return as is
  if (imageName.startsWith('http')) return imageName;
  
  // Check if we have a placeholder for this image name
  return productImageMap[imageName] || defaultProductImage;
};