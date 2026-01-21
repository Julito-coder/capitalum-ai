-- Create table for monthly revenue tracking
CREATE TABLE public.monthly_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  revenue NUMERIC NOT NULL DEFAULT 0,
  expenses NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month)
);

-- Enable RLS
ALTER TABLE public.monthly_revenue ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own monthly revenue"
ON public.monthly_revenue
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly revenue"
ON public.monthly_revenue
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly revenue"
ON public.monthly_revenue
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly revenue"
ON public.monthly_revenue
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_monthly_revenue_updated_at
BEFORE UPDATE ON public.monthly_revenue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();