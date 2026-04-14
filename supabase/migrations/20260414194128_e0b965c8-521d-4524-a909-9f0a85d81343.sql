
-- Table for user recurring personal deadlines (contracts, subscriptions, etc.)
CREATE TABLE public.user_recurring_deadlines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  amount NUMERIC,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  next_date DATE NOT NULL,
  provider TEXT,
  contract_ref TEXT,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  source_document_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.user_recurring_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring deadlines"
  ON public.user_recurring_deadlines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring deadlines"
  ON public.user_recurring_deadlines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring deadlines"
  ON public.user_recurring_deadlines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring deadlines"
  ON public.user_recurring_deadlines FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_recurring_deadlines;
