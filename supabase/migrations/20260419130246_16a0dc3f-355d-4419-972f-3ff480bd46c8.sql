-- Table de tracking d'usage de l'agent (pour suivi coûts, le rate limiting sera ad-hoc dans l'edge function)
CREATE TABLE public.elio_agent_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  messages_count int NOT NULL DEFAULT 0,
  tokens_used int NOT NULL DEFAULT 0,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.elio_agent_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON public.elio_agent_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON public.elio_agent_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON public.elio_agent_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_elio_agent_usage_updated_at
  BEFORE UPDATE ON public.elio_agent_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_elio_agent_usage_user_date ON public.elio_agent_usage(user_id, date DESC);

-- Extension de ai_conversations
ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS tool_calls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_tokens int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model_used text;