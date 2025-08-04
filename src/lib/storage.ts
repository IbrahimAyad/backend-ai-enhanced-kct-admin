import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  file: File,
  path?: string
): Promise<UploadResult> {
  try {
    // Generate unique filename if path not provided
    const fileName = path || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: '', path: '', error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      url: '', 
      path: '', 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Upload product image
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  imageType: 'primary' | 'gallery' = 'gallery'
): Promise<UploadResult> {
  const folder = `products/${productId}`;
  const fileName = `${imageType}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const path = `${folder}/${fileName}`;
  
  return uploadFile('product-images', file, path);
}

/**
 * Upload customer avatar
 */
export async function uploadCustomerAvatar(
  file: File,
  customerId: string
): Promise<UploadResult> {
  const folder = `${customerId}`;
  const fileName = `avatar-${Date.now()}.${file.name.split('.').pop()}`;
  const path = `${folder}/${fileName}`;
  
  return uploadFile('customer-avatars', file, path);
}

/**
 * Get storage URL for a file
 */
export function getStorageUrl(bucket: string, path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return publicUrl;
}

/**
 * List files in a folder
 */
export async function listFiles(bucket: string, folder: string) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
      });

    if (error) {
      console.error('List files error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
}