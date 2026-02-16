
-- =============================================
-- Module Crypto 2086 — Schema
-- =============================================

-- 1) Crypto Accounts (exchanges / wallets)
CREATE TABLE public.crypto_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tax_year INTEGER NOT NULL DEFAULT 2025,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'exchange', -- exchange / wallet
  country TEXT DEFAULT 'FR',
  is_foreign_account BOOLEAN DEFAULT false,
  identifiers JSONB DEFAULT '{}'::jsonb, -- { exchangeName, walletAddressMasked }
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crypto accounts" ON public.crypto_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own crypto accounts" ON public.crypto_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crypto accounts" ON public.crypto_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own crypto accounts" ON public.crypto_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_crypto_accounts_updated_at BEFORE UPDATE ON public.crypto_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Crypto Transactions
CREATE TABLE public.crypto_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tax_year INTEGER NOT NULL DEFAULT 2025,
  account_id UUID REFERENCES public.crypto_accounts(id) ON DELETE SET NULL,
  tx_timestamp TIMESTAMPTZ NOT NULL,
  asset_from TEXT NOT NULL DEFAULT '',
  asset_to TEXT NOT NULL DEFAULT '',
  qty_from NUMERIC NOT NULL DEFAULT 0,
  qty_to NUMERIC NOT NULL DEFAULT 0,
  fiat_value_eur NUMERIC,
  fees_eur NUMERIC DEFAULT 0,
  fees_asset TEXT,
  fees_qty NUMERIC DEFAULT 0,
  source TEXT DEFAULT 'manual', -- manual / import
  source_file_name TEXT,
  classification TEXT DEFAULT 'crypto_to_fiat', -- crypto_to_fiat, crypto_to_crypto, payment, income, airdrop, mining, staking, gift, transfer
  is_taxable BOOLEAN DEFAULT true,
  flags TEXT[] DEFAULT '{}', -- missing_rate, missing_fee, suspected_duplicate, transfer_pair_candidate
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crypto transactions" ON public.crypto_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own crypto transactions" ON public.crypto_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crypto transactions" ON public.crypto_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own crypto transactions" ON public.crypto_transactions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_crypto_transactions_user_year ON public.crypto_transactions(user_id, tax_year);
CREATE INDEX idx_crypto_transactions_timestamp ON public.crypto_transactions(tx_timestamp);

CREATE TRIGGER update_crypto_transactions_updated_at BEFORE UPDATE ON public.crypto_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Crypto Tax Computations
CREATE TABLE public.crypto_tax_computations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tax_year INTEGER NOT NULL DEFAULT 2025,
  method TEXT DEFAULT 'FR_150_VH_bis',
  total_cessions_eur NUMERIC DEFAULT 0,
  total_acquisitions_eur NUMERIC DEFAULT 0,
  portfolio_value_eur NUMERIC DEFAULT 0,
  gains_eur NUMERIC DEFAULT 0,
  losses_eur NUMERIC DEFAULT 0,
  net_gain_eur NUMERIC DEFAULT 0,
  computed_lines JSONB DEFAULT '[]'::jsonb,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft', -- draft / validated
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_tax_computations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crypto computations" ON public.crypto_tax_computations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own crypto computations" ON public.crypto_tax_computations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crypto computations" ON public.crypto_tax_computations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own crypto computations" ON public.crypto_tax_computations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_crypto_tax_computations_updated_at BEFORE UPDATE ON public.crypto_tax_computations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Tax Form 2086 Drafts
CREATE TABLE public.tax_form_2086_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tax_year INTEGER NOT NULL DEFAULT 2025,
  computation_id UUID REFERENCES public.crypto_tax_computations(id) ON DELETE SET NULL,
  identity_snapshot JSONB DEFAULT '{}'::jsonb,
  foreign_accounts_summary JSONB DEFAULT '[]'::jsonb,
  taxable_events_summary JSONB DEFAULT '[]'::jsonb,
  field_mapping JSONB DEFAULT '{}'::jsonb, -- case3AN, case3BN, etc.
  regime TEXT DEFAULT 'pfu', -- pfu / bareme
  notes TEXT,
  assumptions TEXT,
  ready_for_report BOOLEAN DEFAULT false,
  reported_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft', -- draft / in_review / ready / reported / archived
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_form_2086_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own 2086 drafts" ON public.tax_form_2086_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own 2086 drafts" ON public.tax_form_2086_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own 2086 drafts" ON public.tax_form_2086_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own 2086 drafts" ON public.tax_form_2086_drafts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tax_form_2086_drafts_updated_at BEFORE UPDATE ON public.tax_form_2086_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Crypto Task Checklist Items
CREATE TABLE public.crypto_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tax_year INTEGER NOT NULL DEFAULT 2025,
  module TEXT DEFAULT '2086',
  label TEXT NOT NULL,
  status TEXT DEFAULT 'todo', -- todo / done
  evidence_doc_url TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checklist items" ON public.crypto_checklist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own checklist items" ON public.crypto_checklist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own checklist items" ON public.crypto_checklist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own checklist items" ON public.crypto_checklist_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_crypto_checklist_items_updated_at BEFORE UPDATE ON public.crypto_checklist_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
