CREATE TABLE public.user_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recommendation_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  estimated_gain NUMERIC NOT NULL DEFAULT 0,
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  dismissed_reason TEXT,
  snoozed_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, recommendation_key)
);

ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations"
ON public.user_recommendations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations"
ON public.user_recommendations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
ON public.user_recommendations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations"
ON public.user_recommendations FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_user_recommendations_updated_at
BEFORE UPDATE ON public.user_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_recommendations_user_status ON public.user_recommendations(user_id, status);

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_recommendations;