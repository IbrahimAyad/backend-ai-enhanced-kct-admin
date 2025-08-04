-- Setup Supabase Storage Buckets for Images
-- Run this in Supabase SQL Editor

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
  ('customer-avatars', 'customer-avatars', true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for product-images bucket
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'product-images' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'product-images' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'product-images' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Create RLS policies for customer-avatars bucket
CREATE POLICY "Anyone can view customer avatars" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'customer-avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'customer-avatars' 
    AND (
      -- User uploading their own avatar
      (storage.foldername(name))[1] = auth.uid()::text
      OR 
      -- Admin uploading any avatar
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
        AND is_active = true
      )
    )
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'customer-avatars' 
    AND (
      -- User updating their own avatar
      (storage.foldername(name))[1] = auth.uid()::text
      OR 
      -- Admin updating any avatar
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
        AND is_active = true
      )
    )
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'customer-avatars' 
    AND (
      -- User deleting their own avatar
      (storage.foldername(name))[1] = auth.uid()::text
      OR 
      -- Admin deleting any avatar
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
        AND is_active = true
      )
    )
  );

-- Verify buckets were created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('product-images', 'customer-avatars');

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;