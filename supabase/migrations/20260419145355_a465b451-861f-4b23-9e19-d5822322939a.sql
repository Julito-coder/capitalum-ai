-- 1. Connexion Powens (1 par user)
CREATE TABLE public.powens_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  powens_user_id BIGINT NOT NULL,
  auth_token TEXT NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.powens_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own powens connection"
  ON public.powens_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own powens connection"
  ON public.powens_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_powens_connections_updated
  BEFORE UPDATE ON public.powens_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Comptes bancaires
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  powens_account_id BIGINT NOT NULL,
  powens_connection_id BIGINT,
  bank_name TEXT,
  account_name TEXT,
  account_type TEXT,
  iban_masked TEXT,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  last_update TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  raw JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, powens_account_id)
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bank accounts"
  ON public.bank_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own bank accounts"
  ON public.bank_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_bank_accounts_user ON public.bank_accounts(user_id);

CREATE TRIGGER trg_bank_accounts_updated
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Transactions
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  powens_transaction_id BIGINT NOT NULL,
  tx_date DATE NOT NULL,
  value_date DATE,
  label TEXT,
  original_label TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  category TEXT,
  type TEXT,
  raw JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, powens_transaction_id)
);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
  ON public.bank_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own transactions"
  ON public.bank_transactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_bank_tx_user_date ON public.bank_transactions(user_id, tx_date DESC);
CREATE INDEX idx_bank_tx_account ON public.bank_transactions(account_id);