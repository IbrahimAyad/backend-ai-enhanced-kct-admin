import { useState } from 'react';
import { uploadProductImage, deleteFile } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface ProductImage {
  id?: string;
  url: string;
  path: string;
  alt_text?: string;
  is_primary?: boolean;
}

export function useProductImageUpload(productId?: string) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);

  const uploadImages = async (files: FileList): Promise<ProductImage[]> => {
    setUploading(true);
    const uploadedImages: ProductImage[] = [];

    try {
      // Use a temporary product ID if none provided (for new products)
      const tempProductId = productId || `temp-${Date.now()}`;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image`,
            variant: "destructive"
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 5MB limit`,
            variant: "destructive"
          });
          continue;
        }

        const result = await uploadProductImage(
          file, 
          tempProductId,
          i === 0 ? 'primary' : 'gallery'
        );

        if (result.error) {
          toast({
            title: "Upload failed",
            description: result.error,
            variant: "destructive"
          });
          continue;
        }

        uploadedImages.push({
          url: result.url,
          path: result.path,
          alt_text: file.name.split('.')[0],
          is_primary: i === 0
        });
      }

      setImages(prev => [...prev, ...uploadedImages]);
      
      if (uploadedImages.length > 0) {
        toast({
          title: "Success",
          description: `Uploaded ${uploadedImages.length} image(s)`
        });
      }

      return uploadedImages;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images",
        variant: "destructive"
      });
      return [];
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (image: ProductImage) => {
    try {
      // Delete from storage
      const deleted = await deleteFile('product-images', image.path);
      
      if (deleted) {
        setImages(prev => prev.filter(img => img.path !== image.path));
        toast({
          title: "Image removed",
          description: "Image deleted successfully"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete image",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error", 
        description: "Failed to delete image",
        variant: "destructive"
      });
    }
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      
      // Update primary status
      return updated.map((img, index) => ({
        ...img,
        is_primary: index === 0
      }));
    });
  };

  return {
    images,
    setImages,
    uploading,
    uploadImages,
    removeImage,
    reorderImages
  };
}