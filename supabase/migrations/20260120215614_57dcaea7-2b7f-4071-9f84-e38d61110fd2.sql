-- Create storage bucket for tax documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('tax-documents', 'tax-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for tax documents bucket
CREATE POLICY "Users can upload their own tax documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tax-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own tax documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tax-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own tax documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tax-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add tax profile fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS family_status TEXT DEFAULT 'single',
ADD COLUMN IF NOT EXISTS birth_year INTEGER,
ADD COLUMN IF NOT EXISTS professional_status TEXT DEFAULT 'employee',
ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_rental_income BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_investments BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_profile_updated_at TIMESTAMP WITH TIME ZONE;