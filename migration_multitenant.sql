-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1E2A7A',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add tenant_id to existing tables
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 3. Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 4. Tenants Policies
-- Anyone can read tenants (needed for public menu to load colors/logo based on subdomain)
DROP POLICY IF EXISTS "Tenants are publicly viewable." ON public.tenants;
CREATE POLICY "Tenants are publicly viewable." ON public.tenants FOR SELECT USING (true);

-- Only authenticated users matching the tenant_id in their metadata can update the tenant
DROP POLICY IF EXISTS "Users can update their own tenant." ON public.tenants;
CREATE POLICY "Users can update their own tenant." ON public.tenants FOR UPDATE USING (
  (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid = id
);

-- 5. Categories Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone." ON public.categories;
DROP POLICY IF EXISTS "Categories insert policy" ON public.categories;
DROP POLICY IF EXISTS "Categories update policy" ON public.categories;
DROP POLICY IF EXISTS "Categories delete policy" ON public.categories;

CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories insert policy" ON public.categories FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid = tenant_id
);
CREATE POLICY "Categories update policy" ON public.categories FOR UPDATE USING (
  auth.role() = 'authenticated' AND (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid = tenant_id
);
CREATE POLICY "Categories delete policy" ON public.categories FOR DELETE USING (
  auth.role() = 'authenticated' AND (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid = tenant_id
);

-- 6. Products Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are viewable by everyone." ON public.products;
DROP POLICY IF EXISTS "Products insert policy" ON public.products;
DROP POLICY IF EXISTS "Products update policy" ON public.products;
DROP POLICY IF EXISTS "Products delete policy" ON public.products;

CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Products insert policy" ON public.products FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid = tenant_id
);
CREATE POLICY "Products update policy" ON public.products FOR UPDATE USING (
  auth.role() = 'authenticated' AND (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid = tenant_id
);
CREATE POLICY "Products delete policy" ON public.products FOR DELETE USING (
  auth.role() = 'authenticated' AND (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid = tenant_id
);

-- 7. Storage bucket config for tenant-based isolation
-- Drop existing policies if any
DROP POLICY IF EXISTS "Images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Tenant users can upload images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated' AND 
  (auth.jwt() -> 'user_metadata' ->> 'tenant_id') = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Tenant users can update images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated' AND 
  (auth.jwt() -> 'user_metadata' ->> 'tenant_id') = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Tenant users can delete images" ON storage.objects FOR DELETE USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated' AND 
  (auth.jwt() -> 'user_metadata' ->> 'tenant_id') = (string_to_array(name, '/'))[1]
);
