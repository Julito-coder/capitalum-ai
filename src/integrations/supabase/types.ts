export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acquisition_data: {
        Row: {
          agency_fee_amount: number | null
          agency_fee_pct: number | null
          bank_fees: number | null
          brokerage_fees: number | null
          created_at: string
          furniture_amount: number | null
          guarantee_fees: number | null
          id: string
          notary_fee_amount: number | null
          notary_fee_estimated: boolean | null
          price_net_seller: number
          project_id: string
          total_project_cost: number | null
          updated_at: string
          works_amount: number | null
          works_schedule_months: number | null
        }
        Insert: {
          agency_fee_amount?: number | null
          agency_fee_pct?: number | null
          bank_fees?: number | null
          brokerage_fees?: number | null
          created_at?: string
          furniture_amount?: number | null
          guarantee_fees?: number | null
          id?: string
          notary_fee_amount?: number | null
          notary_fee_estimated?: boolean | null
          price_net_seller?: number
          project_id: string
          total_project_cost?: number | null
          updated_at?: string
          works_amount?: number | null
          works_schedule_months?: number | null
        }
        Update: {
          agency_fee_amount?: number | null
          agency_fee_pct?: number | null
          bank_fees?: number | null
          brokerage_fees?: number | null
          created_at?: string
          furniture_amount?: number | null
          guarantee_fees?: number | null
          id?: string
          notary_fee_amount?: number | null
          notary_fee_estimated?: boolean | null
          price_net_seller?: number
          project_id?: string
          total_project_cost?: number | null
          updated_at?: string
          works_amount?: number | null
          works_schedule_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acquisition_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "real_estate_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_pinned: boolean
          last_profile_snapshot_at: string | null
          messages: Json
          model_used: string | null
          summary: string | null
          tags: string[] | null
          tool_calls: Json | null
          topic: string | null
          total_tokens: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          last_profile_snapshot_at?: string | null
          messages?: Json
          model_used?: string | null
          summary?: string | null
          tags?: string[] | null
          tool_calls?: Json | null
          topic?: string | null
          total_tokens?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          last_profile_snapshot_at?: string | null
          messages?: Json
          model_used?: string | null
          summary?: string | null
          tags?: string[] | null
          tool_calls?: Json | null
          topic?: string | null
          total_tokens?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string | null
          account_type: string | null
          balance: number
          bank_name: string | null
          created_at: string
          currency: string
          iban_masked: string | null
          id: string
          is_active: boolean
          last_update: string | null
          powens_account_id: number
          powens_connection_id: number | null
          raw: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_type?: string | null
          balance?: number
          bank_name?: string | null
          created_at?: string
          currency?: string
          iban_masked?: string | null
          id?: string
          is_active?: boolean
          last_update?: string | null
          powens_account_id: number
          powens_connection_id?: number | null
          raw?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_type?: string | null
          balance?: number
          bank_name?: string | null
          created_at?: string
          currency?: string
          iban_masked?: string | null
          id?: string
          is_active?: boolean
          last_update?: string | null
          powens_account_id?: number
          powens_connection_id?: number | null
          raw?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string
          currency: string
          id: string
          label: string | null
          original_label: string | null
          powens_transaction_id: number
          raw: Json | null
          tx_date: string
          type: string | null
          user_id: string
          value_date: string | null
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          label?: string | null
          original_label?: string | null
          powens_transaction_id: number
          raw?: Json | null
          tx_date: string
          type?: string | null
          user_id: string
          value_date?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          label?: string | null
          original_label?: string | null
          powens_transaction_id?: number
          raw?: Json | null
          tx_date?: string
          type?: string | null
          user_id?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_accounts: {
        Row: {
          account_type: string
          country: string | null
          created_at: string
          id: string
          identifiers: Json | null
          is_foreign_account: boolean | null
          name: string
          notes: string | null
          tax_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string
          country?: string | null
          created_at?: string
          id?: string
          identifiers?: Json | null
          is_foreign_account?: boolean | null
          name: string
          notes?: string | null
          tax_year?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          country?: string | null
          created_at?: string
          id?: string
          identifiers?: Json | null
          is_foreign_account?: boolean | null
          name?: string
          notes?: string | null
          tax_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_checklist_items: {
        Row: {
          completed_at: string | null
          created_at: string
          evidence_doc_url: string | null
          id: string
          label: string
          module: string | null
          status: string | null
          tax_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          evidence_doc_url?: string | null
          id?: string
          label: string
          module?: string | null
          status?: string | null
          tax_year?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          evidence_doc_url?: string | null
          id?: string
          label?: string
          module?: string | null
          status?: string | null
          tax_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_tax_computations: {
        Row: {
          audit_trail: Json | null
          computed_lines: Json | null
          created_at: string
          gains_eur: number | null
          id: string
          losses_eur: number | null
          method: string | null
          net_gain_eur: number | null
          portfolio_value_eur: number | null
          status: string | null
          tax_year: number
          total_acquisitions_eur: number | null
          total_cessions_eur: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audit_trail?: Json | null
          computed_lines?: Json | null
          created_at?: string
          gains_eur?: number | null
          id?: string
          losses_eur?: number | null
          method?: string | null
          net_gain_eur?: number | null
          portfolio_value_eur?: number | null
          status?: string | null
          tax_year?: number
          total_acquisitions_eur?: number | null
          total_cessions_eur?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audit_trail?: Json | null
          computed_lines?: Json | null
          created_at?: string
          gains_eur?: number | null
          id?: string
          losses_eur?: number | null
          method?: string | null
          net_gain_eur?: number | null
          portfolio_value_eur?: number | null
          status?: string | null
          tax_year?: number
          total_acquisitions_eur?: number | null
          total_cessions_eur?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_transactions: {
        Row: {
          account_id: string | null
          asset_from: string
          asset_to: string
          classification: string | null
          created_at: string
          fees_asset: string | null
          fees_eur: number | null
          fees_qty: number | null
          fiat_value_eur: number | null
          flags: string[] | null
          id: string
          is_taxable: boolean | null
          notes: string | null
          qty_from: number
          qty_to: number
          source: string | null
          source_file_name: string | null
          tax_year: number
          tx_timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          asset_from?: string
          asset_to?: string
          classification?: string | null
          created_at?: string
          fees_asset?: string | null
          fees_eur?: number | null
          fees_qty?: number | null
          fiat_value_eur?: number | null
          flags?: string[] | null
          id?: string
          is_taxable?: boolean | null
          notes?: string | null
          qty_from?: number
          qty_to?: number
          source?: string | null
          source_file_name?: string | null
          tax_year?: number
          tx_timestamp: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          asset_from?: string
          asset_to?: string
          classification?: string | null
          created_at?: string
          fees_asset?: string | null
          fees_eur?: number | null
          fees_qty?: number | null
          fiat_value_eur?: number | null
          flags?: string[] | null
          id?: string
          is_taxable?: boolean | null
          notes?: string | null
          qty_from?: number
          qty_to?: number
          source?: string | null
          source_file_name?: string | null
          tax_year?: number
          tx_timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crypto_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_bulletins: {
        Row: {
          action_description: string
          action_effort_minutes: number | null
          action_gain_cents: number | null
          action_id: string
          action_status: string
          action_title: string
          action_type: string
          bulletin_date: string
          created_at: string
          cumulative_gain_cents: number
          id: string
          news_body: string | null
          news_context: string | null
          news_title: string | null
          next_deadline_json: Json | null
          skip_reason: string | null
          user_id: string
          viewed_at: string | null
          weekly_delta_cents: number
        }
        Insert: {
          action_description: string
          action_effort_minutes?: number | null
          action_gain_cents?: number | null
          action_id: string
          action_status?: string
          action_title: string
          action_type: string
          bulletin_date: string
          created_at?: string
          cumulative_gain_cents?: number
          id?: string
          news_body?: string | null
          news_context?: string | null
          news_title?: string | null
          next_deadline_json?: Json | null
          skip_reason?: string | null
          user_id: string
          viewed_at?: string | null
          weekly_delta_cents?: number
        }
        Update: {
          action_description?: string
          action_effort_minutes?: number | null
          action_gain_cents?: number | null
          action_id?: string
          action_status?: string
          action_title?: string
          action_type?: string
          bulletin_date?: string
          created_at?: string
          cumulative_gain_cents?: number
          id?: string
          news_body?: string | null
          news_context?: string | null
          news_title?: string | null
          next_deadline_json?: Json | null
          skip_reason?: string | null
          user_id?: string
          viewed_at?: string | null
          weekly_delta_cents?: number
        }
        Relationships: []
      }
      elio_agent_usage: {
        Row: {
          created_at: string
          date: string
          id: string
          last_message_at: string | null
          messages_count: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          last_message_at?: string | null
          messages_count?: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          last_message_at?: string | null
          messages_count?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financing_data: {
        Row: {
          amortization_table: Json | null
          created_at: string
          deferment_months: number | null
          deferment_type: string | null
          down_payment: number | null
          down_payment_allocation: string | null
          duration_months: number | null
          id: string
          insurance_mode: string | null
          insurance_value: number | null
          loan_amount: number | null
          monthly_payment: number | null
          nominal_rate: number | null
          project_id: string
          total_insurance: number | null
          total_interest: number | null
          updated_at: string
        }
        Insert: {
          amortization_table?: Json | null
          created_at?: string
          deferment_months?: number | null
          deferment_type?: string | null
          down_payment?: number | null
          down_payment_allocation?: string | null
          duration_months?: number | null
          id?: string
          insurance_mode?: string | null
          insurance_value?: number | null
          loan_amount?: number | null
          monthly_payment?: number | null
          nominal_rate?: number | null
          project_id: string
          total_insurance?: number | null
          total_interest?: number | null
          updated_at?: string
        }
        Update: {
          amortization_table?: Json | null
          created_at?: string
          deferment_months?: number | null
          deferment_type?: string | null
          down_payment?: number | null
          down_payment_allocation?: string | null
          duration_months?: number | null
          id?: string
          insurance_mode?: string | null
          insurance_value?: number | null
          loan_amount?: number | null
          monthly_payment?: number | null
          nominal_rate?: number | null
          project_id?: string
          total_insurance?: number | null
          total_interest?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "real_estate_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_ht: number
          amount_ttc: number
          client_address: string | null
          client_email: string | null
          client_name: string
          client_siret: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          status: string
          tva_rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ht?: number
          amount_ttc?: number
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_siret?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          tva_rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_siret?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          tva_rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_revenue: {
        Row: {
          created_at: string
          expenses: number
          id: string
          month: number
          notes: string | null
          revenue: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          expenses?: number
          id?: string
          month: number
          notes?: string | null
          revenue?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          expenses?: number
          id?: string
          month?: number
          notes?: string | null
          revenue?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      notification_dispatch_log: {
        Row: {
          channel: string
          event_key: string
          event_type: string
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          event_key: string
          event_type: string
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          event_key?: string
          event_type?: string
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          message: string
          priority: number
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message: string
          priority?: number
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message?: string
          priority?: number
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      operating_costs: {
        Row: {
          accounting_annual: number | null
          cfe_annual: number | null
          condo_nonrecoverable_annual: number | null
          costs_growth_rate: number | null
          created_at: string
          id: string
          insurance_annual: number | null
          letting_fees_annual: number | null
          maintenance_mode: string | null
          maintenance_value: number | null
          management_pct: number | null
          other_costs: Json | null
          project_id: string
          property_tax_annual: number | null
          property_tax_growth_rate: number | null
          updated_at: string
          utilities_annual: number | null
        }
        Insert: {
          accounting_annual?: number | null
          cfe_annual?: number | null
          condo_nonrecoverable_annual?: number | null
          costs_growth_rate?: number | null
          created_at?: string
          id?: string
          insurance_annual?: number | null
          letting_fees_annual?: number | null
          maintenance_mode?: string | null
          maintenance_value?: number | null
          management_pct?: number | null
          other_costs?: Json | null
          project_id: string
          property_tax_annual?: number | null
          property_tax_growth_rate?: number | null
          updated_at?: string
          utilities_annual?: number | null
        }
        Update: {
          accounting_annual?: number | null
          cfe_annual?: number | null
          condo_nonrecoverable_annual?: number | null
          costs_growth_rate?: number | null
          created_at?: string
          id?: string
          insurance_annual?: number | null
          letting_fees_annual?: number | null
          maintenance_mode?: string | null
          maintenance_value?: number | null
          management_pct?: number | null
          other_costs?: Json | null
          project_id?: string
          property_tax_annual?: number | null
          property_tax_growth_rate?: number | null
          updated_at?: string
          utilities_annual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operating_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "real_estate_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_occupier_data: {
        Row: {
          avoided_rent_monthly: number | null
          created_at: string
          existing_credits_monthly: number
          household_income_monthly: number
          household_members: Json
          id: string
          optimist_growth_rate: number | null
          other_charges_monthly: number
          project_id: string
          prudent_growth_rate: number | null
          remaining_liquidity: number
          scenario_type: string | null
          updated_at: string
          value_growth_rate: number | null
        }
        Insert: {
          avoided_rent_monthly?: number | null
          created_at?: string
          existing_credits_monthly?: number
          household_income_monthly?: number
          household_members?: Json
          id?: string
          optimist_growth_rate?: number | null
          other_charges_monthly?: number
          project_id: string
          prudent_growth_rate?: number | null
          remaining_liquidity?: number
          scenario_type?: string | null
          updated_at?: string
          value_growth_rate?: number | null
        }
        Update: {
          avoided_rent_monthly?: number | null
          created_at?: string
          existing_credits_monthly?: number
          household_income_monthly?: number
          household_members?: Json
          id?: string
          optimist_growth_rate?: number | null
          other_charges_monthly?: number
          project_id?: string
          prudent_growth_rate?: number | null
          remaining_liquidity?: number
          scenario_type?: string | null
          updated_at?: string
          value_growth_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_occupier_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "real_estate_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      powens_connections: {
        Row: {
          auth_token: string
          created_at: string
          id: string
          last_sync_at: string | null
          powens_user_id: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_token: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          powens_user_id: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_token?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          powens_user_id?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accounting_software: string | null
          address_city: string | null
          address_postal_code: string | null
          address_street: string | null
          age_range: string | null
          ai_analysis_consent: boolean | null
          annual_bonus: number | null
          annual_rental_works: number | null
          annual_revenue_ht: number | null
          ape_code: string | null
          avatar_url: string | null
          birth_year: number | null
          capital_gains_2025: number | null
          children_count: number | null
          children_details: Json | null
          company_creation_date: string | null
          company_name: string | null
          complementary_pensions: Json | null
          contract_start_date: string | null
          contract_type: string | null
          created_at: string
          crowdfunding_investments: number | null
          crypto_pnl_2025: number | null
          crypto_wallet_address: string | null
          cto_capital_gains: number | null
          cto_dividends: number | null
          declares_in_france: boolean | null
          employer_name: string | null
          employer_siret: string | null
          family_status: string | null
          financial_objectives: string[] | null
          first_name: string | null
          fiscal_status: string | null
          full_name: string | null
          gdpr_consent: boolean | null
          gdpr_consent_date: string | null
          gross_monthly_salary: number | null
          has_company_health_insurance: boolean | null
          has_investments: boolean | null
          has_meal_vouchers: boolean | null
          has_real_expenses: boolean | null
          has_rental_income: boolean | null
          housing_status: string | null
          housing_zone: string | null
          id: string
          ifi_liable: boolean | null
          income_range: string | null
          is_employee: boolean | null
          is_homeowner: boolean | null
          is_investor: boolean | null
          is_retired: boolean | null
          is_self_employed: boolean | null
          life_insurance_balance: number | null
          life_insurance_contributions: number | null
          life_insurance_withdrawals: number | null
          liquidation_date: string | null
          main_pension_annual: number | null
          monthly_rent: number | null
          monthly_revenue_freelance: number | null
          mortgage_remaining: number | null
          net_monthly_salary: number | null
          nif: string | null
          office_rent: number | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_current_step: number | null
          onboarding_partial: boolean | null
          overtime_annual: number | null
          patrimony_range: string | null
          pea_balance: number | null
          pea_contributions_2025: number | null
          pee_amount: number | null
          perco_amount: number | null
          phone: string | null
          primary_objective: string | null
          professional_status: string | null
          professional_supplies: number | null
          real_expenses_amount: number | null
          recent_donations: Json | null
          reference_tax_income: number | null
          rental_properties: Json | null
          rental_scheme: string | null
          residence_duration_years: number | null
          risk_tolerance: string | null
          scpi_investments: number | null
          siret: string | null
          social_charges_paid: number | null
          spouse_income: number | null
          stock_options_value: number | null
          supplementary_income: number | null
          tax_bracket: string | null
          tax_profile_updated_at: string | null
          thirteenth_month: number | null
          top_clients: Json | null
          updated_at: string
          user_id: string
          vehicle_expenses: number | null
        }
        Insert: {
          accounting_software?: string | null
          address_city?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          age_range?: string | null
          ai_analysis_consent?: boolean | null
          annual_bonus?: number | null
          annual_rental_works?: number | null
          annual_revenue_ht?: number | null
          ape_code?: string | null
          avatar_url?: string | null
          birth_year?: number | null
          capital_gains_2025?: number | null
          children_count?: number | null
          children_details?: Json | null
          company_creation_date?: string | null
          company_name?: string | null
          complementary_pensions?: Json | null
          contract_start_date?: string | null
          contract_type?: string | null
          created_at?: string
          crowdfunding_investments?: number | null
          crypto_pnl_2025?: number | null
          crypto_wallet_address?: string | null
          cto_capital_gains?: number | null
          cto_dividends?: number | null
          declares_in_france?: boolean | null
          employer_name?: string | null
          employer_siret?: string | null
          family_status?: string | null
          financial_objectives?: string[] | null
          first_name?: string | null
          fiscal_status?: string | null
          full_name?: string | null
          gdpr_consent?: boolean | null
          gdpr_consent_date?: string | null
          gross_monthly_salary?: number | null
          has_company_health_insurance?: boolean | null
          has_investments?: boolean | null
          has_meal_vouchers?: boolean | null
          has_real_expenses?: boolean | null
          has_rental_income?: boolean | null
          housing_status?: string | null
          housing_zone?: string | null
          id?: string
          ifi_liable?: boolean | null
          income_range?: string | null
          is_employee?: boolean | null
          is_homeowner?: boolean | null
          is_investor?: boolean | null
          is_retired?: boolean | null
          is_self_employed?: boolean | null
          life_insurance_balance?: number | null
          life_insurance_contributions?: number | null
          life_insurance_withdrawals?: number | null
          liquidation_date?: string | null
          main_pension_annual?: number | null
          monthly_rent?: number | null
          monthly_revenue_freelance?: number | null
          mortgage_remaining?: number | null
          net_monthly_salary?: number | null
          nif?: string | null
          office_rent?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: number | null
          onboarding_partial?: boolean | null
          overtime_annual?: number | null
          patrimony_range?: string | null
          pea_balance?: number | null
          pea_contributions_2025?: number | null
          pee_amount?: number | null
          perco_amount?: number | null
          phone?: string | null
          primary_objective?: string | null
          professional_status?: string | null
          professional_supplies?: number | null
          real_expenses_amount?: number | null
          recent_donations?: Json | null
          reference_tax_income?: number | null
          rental_properties?: Json | null
          rental_scheme?: string | null
          residence_duration_years?: number | null
          risk_tolerance?: string | null
          scpi_investments?: number | null
          siret?: string | null
          social_charges_paid?: number | null
          spouse_income?: number | null
          stock_options_value?: number | null
          supplementary_income?: number | null
          tax_bracket?: string | null
          tax_profile_updated_at?: string | null
          thirteenth_month?: number | null
          top_clients?: Json | null
          updated_at?: string
          user_id: string
          vehicle_expenses?: number | null
        }
        Update: {
          accounting_software?: string | null
          address_city?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          age_range?: string | null
          ai_analysis_consent?: boolean | null
          annual_bonus?: number | null
          annual_rental_works?: number | null
          annual_revenue_ht?: number | null
          ape_code?: string | null
          avatar_url?: string | null
          birth_year?: number | null
          capital_gains_2025?: number | null
          children_count?: number | null
          children_details?: Json | null
          company_creation_date?: string | null
          company_name?: string | null
          complementary_pensions?: Json | null
          contract_start_date?: string | null
          contract_type?: string | null
          created_at?: string
          crowdfunding_investments?: number | null
          crypto_pnl_2025?: number | null
          crypto_wallet_address?: string | null
          cto_capital_gains?: number | null
          cto_dividends?: number | null
          declares_in_france?: boolean | null
          employer_name?: string | null
          employer_siret?: string | null
          family_status?: string | null
          financial_objectives?: string[] | null
          first_name?: string | null
          fiscal_status?: string | null
          full_name?: string | null
          gdpr_consent?: boolean | null
          gdpr_consent_date?: string | null
          gross_monthly_salary?: number | null
          has_company_health_insurance?: boolean | null
          has_investments?: boolean | null
          has_meal_vouchers?: boolean | null
          has_real_expenses?: boolean | null
          has_rental_income?: boolean | null
          housing_status?: string | null
          housing_zone?: string | null
          id?: string
          ifi_liable?: boolean | null
          income_range?: string | null
          is_employee?: boolean | null
          is_homeowner?: boolean | null
          is_investor?: boolean | null
          is_retired?: boolean | null
          is_self_employed?: boolean | null
          life_insurance_balance?: number | null
          life_insurance_contributions?: number | null
          life_insurance_withdrawals?: number | null
          liquidation_date?: string | null
          main_pension_annual?: number | null
          monthly_rent?: number | null
          monthly_revenue_freelance?: number | null
          mortgage_remaining?: number | null
          net_monthly_salary?: number | null
          nif?: string | null
          office_rent?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: number | null
          onboarding_partial?: boolean | null
          overtime_annual?: number | null
          patrimony_range?: string | null
          pea_balance?: number | null
          pea_contributions_2025?: number | null
          pee_amount?: number | null
          perco_amount?: number | null
          phone?: string | null
          primary_objective?: string | null
          professional_status?: string | null
          professional_supplies?: number | null
          real_expenses_amount?: number | null
          recent_donations?: Json | null
          reference_tax_income?: number | null
          rental_properties?: Json | null
          rental_scheme?: string | null
          residence_duration_years?: number | null
          risk_tolerance?: string | null
          scpi_investments?: number | null
          siret?: string | null
          social_charges_paid?: number | null
          spouse_income?: number | null
          stock_options_value?: number | null
          supplementary_income?: number | null
          tax_bracket?: string | null
          tax_profile_updated_at?: string | null
          thirteenth_month?: number | null
          top_clients?: Json | null
          updated_at?: string
          user_id?: string
          vehicle_expenses?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      real_estate_projects: {
        Row: {
          city: string | null
          created_at: string
          dpe: string | null
          floor: number | null
          horizon_years: number | null
          id: string
          is_new: boolean | null
          ownership_type: string | null
          postal_code: string | null
          property_type: string | null
          rooms: number | null
          status: string | null
          strategy: string | null
          surface_m2: number
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
          zone_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          dpe?: string | null
          floor?: number | null
          horizon_years?: number | null
          id?: string
          is_new?: boolean | null
          ownership_type?: string | null
          postal_code?: string | null
          property_type?: string | null
          rooms?: number | null
          status?: string | null
          strategy?: string | null
          surface_m2?: number
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
          zone_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          dpe?: string | null
          floor?: number | null
          horizon_years?: number | null
          id?: string
          is_new?: boolean | null
          ownership_type?: string | null
          postal_code?: string | null
          property_type?: string | null
          rooms?: number | null
          status?: string | null
          strategy?: string | null
          surface_m2?: number
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          zone_id?: string | null
        }
        Relationships: []
      }
      rental_income_data: {
        Row: {
          created_at: string
          default_rate: number | null
          id: string
          is_seasonal: boolean | null
          project_id: string
          recoverable_charges: number | null
          rent_growth_rate: number | null
          rent_monthly: number | null
          seasonal_avg_night: number | null
          seasonal_cleaning_fees: number | null
          seasonal_occupancy_rate: number | null
          seasonal_platform_fees: number | null
          updated_at: string
          vacancy_rate: number | null
        }
        Insert: {
          created_at?: string
          default_rate?: number | null
          id?: string
          is_seasonal?: boolean | null
          project_id: string
          recoverable_charges?: number | null
          rent_growth_rate?: number | null
          rent_monthly?: number | null
          seasonal_avg_night?: number | null
          seasonal_cleaning_fees?: number | null
          seasonal_occupancy_rate?: number | null
          seasonal_platform_fees?: number | null
          updated_at?: string
          vacancy_rate?: number | null
        }
        Update: {
          created_at?: string
          default_rate?: number | null
          id?: string
          is_seasonal?: boolean | null
          project_id?: string
          recoverable_charges?: number | null
          rent_growth_rate?: number | null
          rent_monthly?: number | null
          seasonal_avg_night?: number | null
          seasonal_cleaning_fees?: number | null
          seasonal_occupancy_rate?: number | null
          seasonal_platform_fees?: number | null
          updated_at?: string
          vacancy_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_income_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "real_estate_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_data: {
        Row: {
          capital_gain_tax_rate: number | null
          created_at: string
          id: string
          net_sale_proceeds: number | null
          project_id: string
          property_growth_rate: number | null
          resale_agency_pct: number | null
          resale_other_fees: number | null
          resale_year: number | null
          updated_at: string
        }
        Insert: {
          capital_gain_tax_rate?: number | null
          created_at?: string
          id?: string
          net_sale_proceeds?: number | null
          project_id: string
          property_growth_rate?: number | null
          resale_agency_pct?: number | null
          resale_other_fees?: number | null
          resale_year?: number | null
          updated_at?: string
        }
        Update: {
          capital_gain_tax_rate?: number | null
          created_at?: string
          id?: string
          net_sale_proceeds?: number | null
          project_id?: string
          property_growth_rate?: number | null
          resale_agency_pct?: number | null
          resale_other_fees?: number | null
          resale_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "real_estate_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_results: {
        Row: {
          break_even_price: number | null
          break_even_rate: number | null
          break_even_rent: number | null
          calculated_at: string
          cashflow_series: Json | null
          created_at: string
          dscr: number | null
          gross_yield: number | null
          id: string
          irr: number | null
          monthly_cashflow_after_tax: number | null
          monthly_cashflow_before_tax: number | null
          monthly_effort: number | null
          net_net_yield: number | null
          net_patrimony: number | null
          net_yield: number | null
          patrimony_series: Json | null
          project_id: string
          sensitivity_data: Json | null
          updated_at: string
        }
        Insert: {
          break_even_price?: number | null
          break_even_rate?: number | null
          break_even_rent?: number | null
          calculated_at?: string
          cashflow_series?: Json | null
          created_at?: string
          dscr?: number | null
          gross_yield?: number | null
          id?: string
          irr?: number | null
          monthly_cashflow_after_tax?: number | null
          monthly_cashflow_before_tax?: number | null
          monthly_effort?: number | null
          net_net_yield?: number | null
          net_patrimony?: number | null
          net_yield?: number | null
          patrimony_series?: Json | null
          project_id: string
          sensitivity_data?: Json | null
          updated_at?: string
        }
        Update: {
          break_even_price?: number | null
          break_even_rate?: number | null
          break_even_rent?: number | null
          calculated_at?: string
          cashflow_series?: Json | null
          created_at?: string
          dscr?: number | null
          gross_yield?: number | null
          id?: string
          irr?: number | null
          monthly_cashflow_after_tax?: number | null
          monthly_cashflow_before_tax?: number | null
          monthly_effort?: number | null
          net_net_yield?: number | null
          net_patrimony?: number | null
          net_yield?: number | null
          patrimony_series?: Json | null
          project_id?: string
          sensitivity_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "real_estate_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_config: {
        Row: {
          amortization_components: Json | null
          amortization_enabled: boolean | null
          annual_tax_override: number | null
          capital_gain_mode: string | null
          capital_gain_rate: number | null
          costs_deductible: boolean | null
          created_at: string
          deficit_enabled: boolean | null
          exploitation_start_date: string | null
          id: string
          interest_deductible: boolean | null
          project_id: string
          regime_key: string | null
          social_rate: number | null
          tax_mode: string | null
          tmi_rate: number | null
          updated_at: string
        }
        Insert: {
          amortization_components?: Json | null
          amortization_enabled?: boolean | null
          annual_tax_override?: number | null
          capital_gain_mode?: string | null
          capital_gain_rate?: number | null
          costs_deductible?: boolean | null
          created_at?: string
          deficit_enabled?: boolean | null
          exploitation_start_date?: string | null
          id?: string
          interest_deductible?: boolean | null
          project_id: string
          regime_key?: string | null
          social_rate?: number | null
          tax_mode?: string | null
          tmi_rate?: number | null
          updated_at?: string
        }
        Update: {
          amortization_components?: Json | null
          amortization_enabled?: boolean | null
          annual_tax_override?: number | null
          capital_gain_mode?: string | null
          capital_gain_rate?: number | null
          costs_deductible?: boolean | null
          created_at?: string
          deficit_enabled?: boolean | null
          exploitation_start_date?: string | null
          id?: string
          interest_deductible?: boolean | null
          project_id?: string
          regime_key?: string | null
          social_rate?: number | null
          tax_mode?: string | null
          tmi_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_config_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "real_estate_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_form_2086_drafts: {
        Row: {
          assumptions: string | null
          computation_id: string | null
          created_at: string
          current_step: number | null
          data_checksum: string | null
          field_mapping: Json | null
          foreign_accounts_summary: Json | null
          form_data: Json | null
          id: string
          identity_snapshot: Json | null
          notes: string | null
          ready_for_report: boolean | null
          regime: string | null
          reported_at: string | null
          status: string | null
          tax_year: number
          taxable_events_summary: Json | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          assumptions?: string | null
          computation_id?: string | null
          created_at?: string
          current_step?: number | null
          data_checksum?: string | null
          field_mapping?: Json | null
          foreign_accounts_summary?: Json | null
          form_data?: Json | null
          id?: string
          identity_snapshot?: Json | null
          notes?: string | null
          ready_for_report?: boolean | null
          regime?: string | null
          reported_at?: string | null
          status?: string | null
          tax_year?: number
          taxable_events_summary?: Json | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          assumptions?: string | null
          computation_id?: string | null
          created_at?: string
          current_step?: number | null
          data_checksum?: string | null
          field_mapping?: Json | null
          foreign_accounts_summary?: Json | null
          form_data?: Json | null
          id?: string
          identity_snapshot?: Json | null
          notes?: string | null
          ready_for_report?: boolean | null
          regime?: string | null
          reported_at?: string | null
          status?: string | null
          tax_year?: number
          taxable_events_summary?: Json | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_form_2086_drafts_computation_id_fkey"
            columns: ["computation_id"]
            isOneToOne: false
            referencedRelation: "crypto_tax_computations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_scan_history: {
        Row: {
          created_at: string
          critical_errors_count: number
          errors: Json
          errors_count: number
          extracted_data: Json | null
          file_name: string | null
          form_type: string
          id: string
          optimizations: Json
          optimizations_count: number
          scan_source: string
          score: number
          total_potential_savings: number
          total_risk_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          critical_errors_count?: number
          errors?: Json
          errors_count?: number
          extracted_data?: Json | null
          file_name?: string | null
          form_type?: string
          id?: string
          optimizations?: Json
          optimizations_count?: number
          scan_source?: string
          score?: number
          total_potential_savings?: number
          total_risk_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          critical_errors_count?: number
          errors?: Json
          errors_count?: number
          extracted_data?: Json | null
          file_name?: string | null
          form_type?: string
          id?: string
          optimizations?: Json
          optimizations_count?: number
          scan_source?: string
          score?: number
          total_potential_savings?: number
          total_risk_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      urssaf_contributions: {
        Row: {
          contribution_amount: number
          created_at: string
          id: string
          is_paid: boolean
          month: number
          notes: string | null
          paid_date: string | null
          quarter: number
          revenue_declared: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          contribution_amount?: number
          created_at?: string
          id?: string
          is_paid?: boolean
          month: number
          notes?: string | null
          paid_date?: string | null
          quarter: number
          revenue_declared?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          contribution_amount?: number
          created_at?: string
          id?: string
          is_paid?: boolean
          month?: number
          notes?: string | null
          paid_date?: string | null
          quarter?: number
          revenue_declared?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      user_deadline_tracking: {
        Row: {
          completed_at: string | null
          created_at: string
          deadline_key: string
          guide_progress: Json | null
          id: string
          ignored_reason: string | null
          notes: string | null
          status: string
          updated_at: string
          uploaded_proof_url: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deadline_key: string
          guide_progress?: Json | null
          id?: string
          ignored_reason?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          uploaded_proof_url?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deadline_key?: string
          guide_progress?: Json | null
          id?: string
          ignored_reason?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          uploaded_proof_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_recommendations: {
        Row: {
          accepted_at: string | null
          completed_at: string | null
          created_at: string
          dismissed_at: string | null
          dismissed_reason: string | null
          estimated_gain: number
          id: string
          recommendation_key: string
          snoozed_until: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          dismissed_reason?: string | null
          estimated_gain?: number
          id?: string
          recommendation_key: string
          snoozed_until?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          dismissed_reason?: string | null
          estimated_gain?: number
          id?: string
          recommendation_key?: string
          snoozed_until?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_recurring_deadlines: {
        Row: {
          amount: number | null
          category: string
          contract_ref: string | null
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          next_date: string
          notes: string | null
          provider: string | null
          source: string
          source_document_path: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          category?: string
          contract_ref?: string | null
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          next_date: string
          notes?: string | null
          provider?: string | null
          source?: string
          source_document_path?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          category?: string
          contract_ref?: string | null
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          next_date?: string
          notes?: string | null
          provider?: string | null
          source?: string
          source_document_path?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current_streak: number
          last_opened_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_opened_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_opened_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      zone_data: {
        Row: {
          charges_estimate: number | null
          city: string
          country: string | null
          created_at: string
          id: string
          postal_code_prefix: string | null
          price_per_m2_default: number | null
          property_tax_estimate: number | null
          region: string | null
          rent_per_m2_default: number | null
          updated_at: string
          vacancy_default: number | null
          zone_category: string | null
        }
        Insert: {
          charges_estimate?: number | null
          city: string
          country?: string | null
          created_at?: string
          id?: string
          postal_code_prefix?: string | null
          price_per_m2_default?: number | null
          property_tax_estimate?: number | null
          region?: string | null
          rent_per_m2_default?: number | null
          updated_at?: string
          vacancy_default?: number | null
          zone_category?: string | null
        }
        Update: {
          charges_estimate?: number | null
          city?: string
          country?: string | null
          created_at?: string
          id?: string
          postal_code_prefix?: string | null
          price_per_m2_default?: number | null
          property_tax_estimate?: number | null
          region?: string | null
          rent_per_m2_default?: number | null
          updated_at?: string
          vacancy_default?: number | null
          zone_category?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
