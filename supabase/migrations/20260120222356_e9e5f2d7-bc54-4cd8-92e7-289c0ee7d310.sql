-- Create table for tax scan history
CREATE TABLE public.tax_scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scan metadata
  form_type TEXT NOT NULL DEFAULT '2042',
  file_name TEXT,
  scan_source TEXT NOT NULL DEFAULT 'upload', -- 'upload' or 'questionnaire'
  
  -- Results
  score INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  critical_errors_count INTEGER NOT NULL DEFAULT 0,
  optimizations_count INTEGER NOT NULL DEFAULT 0,
  total_potential_savings NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_risk_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Full result data (JSON)
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  optimizations JSONB NOT NULL DEFAULT '[]'::jsonb,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_scan_history ENABLE ROW LEVEL SECURITY;

-- Users can only view their own scan history
CREATE POLICY "Users can view their own scan history"
ON public.tax_scan_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own scan history
CREATE POLICY "Users can insert their own scan history"
ON public.tax_scan_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scan history
CREATE POLICY "Users can delete their own scan history"
ON public.tax_scan_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_tax_scan_history_user_id ON public.tax_scan_history(user_id);
CREATE INDEX idx_tax_scan_history_created_at ON public.tax_scan_history(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_tax_scan_history_updated_at
BEFORE UPDATE ON public.tax_scan_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();