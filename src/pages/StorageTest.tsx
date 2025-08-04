import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useProductImageUpload } from '@/hooks/useProductImageUpload';

export default function StorageTest() {
  const { toast } = useToast();
  const [bucketStatus, setBucketStatus] = useState<any>({});
  const [checking, setChecking] = useState(false);
  const { images, uploading, uploadImages, removeImage } = useProductImageUpload();

  const checkBuckets = async () => {
    setChecking(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Try to list files in buckets to verify they exist
      const buckets = ['product-images', 'customer-avatars'];
      const status: any = {};

      for (const bucket of buckets) {
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .list('', { limit: 1 });
          
          status[bucket] = {
            exists: !error,
            error: error?.message,
            public: true // These buckets should be public
          };
        } catch (err) {
          status[bucket] = {
            exists: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          };
        }
      }

      setBucketStatus(status);
      
      const allExist = Object.values(status).every((s: any) => s.exists);
      
      toast({
        title: allExist ? "Storage Ready" : "Storage Setup Required",
        description: allExist 
          ? "All storage buckets are configured" 
          : "Some buckets need to be created",
        variant: allExist ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error checking buckets:', error);
      toast({
        title: "Error",
        description: "Failed to check storage buckets",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await uploadImages(files);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Storage Configuration Test</h1>
          <Button onClick={checkBuckets} disabled={checking}>
            {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Check Buckets
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Storage Bucket Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(bucketStatus).map(([bucket, status]: [string, any]) => (
                <div key={bucket} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {status.exists ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{bucket}</p>
                      {status.error && (
                        <p className="text-sm text-muted-foreground">{status.error}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={status.exists ? "default" : "destructive"}>
                    {status.exists ? "Ready" : "Not Found"}
                  </Badge>
                </div>
              ))}
            </div>

            {Object.keys(bucketStatus).length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Click "Check Buckets" to verify storage configuration
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Image Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Select images to test upload functionality (max 5MB each)
              </p>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading images...</span>
              </div>
            )}

            {images.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Uploaded Images:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={image.alt_text}
                        className="w-full h-40 object-cover rounded border"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImage(image)}
                        >
                          Remove
                        </Button>
                      </div>
                      {image.is_primary && (
                        <Badge className="absolute top-2 left-2">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>If buckets are not found, run <code className="bg-muted px-1 py-0.5 rounded">setup-storage-buckets.sql</code> in Supabase SQL Editor to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Create product-images bucket (5MB limit, public)</li>
                <li>Create customer-avatars bucket (2MB limit, public)</li>
                <li>Set up RLS policies for secure access</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}