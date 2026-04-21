
-- Table des bulletins quotidiens
CREATE TABLE public.daily_bulletins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bulletin_date DATE NOT NULL,
  action_type TEXT NOT NULL,
  action_id TEXT NOT NULL,
  action_title TEXT NOT NULL,
  action_description TEXT NOT NULL,
  action_gain_cents INTEGER,
  action_effort_minutes INTEGER,
  action_status TEXT NOT NULL DEFAULT 'pending',
  news_title TEXT,
  news_body TEXT,
  news_context TEXT,
  next_deadline_json JSONB,
  cumulative_gain_cents INTEGER NOT NULL DEFAULT 0,
  weekly_delta_cents INTEGER NOT NULL DEFAULT 0,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, bulletin_date)
);

CREATE INDEX idx_daily_bulletins_user_date ON public.daily_bulletins(user_id, bulletin_date DESC);

ALTER TABLE public.daily_bulletins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bulletins"
  ON public.daily_bulletins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bulletins"
  ON public.daily_bulletins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bulletins"
  ON public.daily_bulletins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table des streaks utilisateur
CREATE TABLE public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_opened_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streak"
  ON public.user_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak"
  ON public.user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
  ON public.user_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
