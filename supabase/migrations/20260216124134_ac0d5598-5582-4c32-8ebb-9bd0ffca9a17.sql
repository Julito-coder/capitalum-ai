
-- Table pour tracker le statut utilisateur sur chaque échéance
CREATE TABLE public.user_deadline_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deadline_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  ignored_reason TEXT,
  notes TEXT,
  uploaded_proof_url TEXT,
  guide_progress JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, deadline_key)
);

-- Enable RLS
ALTER TABLE public.user_deadline_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own deadline tracking"
ON public.user_deadline_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deadline tracking"
ON public.user_deadline_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deadline tracking"
ON public.user_deadline_tracking FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deadline tracking"
ON public.user_deadline_tracking FOR DELETE
USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_user_deadline_tracking_updated_at
BEFORE UPDATE ON public.user_deadline_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
