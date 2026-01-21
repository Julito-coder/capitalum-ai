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
      profiles: {
        Row: {
          accounting_software: string | null
          address_city: string | null
          address_postal_code: string | null
          address_street: string | null
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
          employer_name: string | null
          employer_siret: string | null
          family_status: string | null
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
          id: string
          ifi_liable: boolean | null
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
          mortgage_remaining: number | null
          net_monthly_salary: number | null
          nif: string | null
          office_rent: number | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_current_step: number | null
          overtime_annual: number | null
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
          rental_properties: Json | null
          rental_scheme: string | null
          residence_duration_years: number | null
          scpi_investments: number | null
          siret: string | null
          social_charges_paid: number | null
          spouse_income: number | null
          stock_options_value: number | null
          supplementary_income: number | null
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
          employer_name?: string | null
          employer_siret?: string | null
          family_status?: string | null
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
          id?: string
          ifi_liable?: boolean | null
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
          mortgage_remaining?: number | null
          net_monthly_salary?: number | null
          nif?: string | null
          office_rent?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: number | null
          overtime_annual?: number | null
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
          rental_properties?: Json | null
          rental_scheme?: string | null
          residence_duration_years?: number | null
          scpi_investments?: number | null
          siret?: string | null
          social_charges_paid?: number | null
          spouse_income?: number | null
          stock_options_value?: number | null
          supplementary_income?: number | null
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
          employer_name?: string | null
          employer_siret?: string | null
          family_status?: string | null
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
          id?: string
          ifi_liable?: boolean | null
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
          mortgage_remaining?: number | null
          net_monthly_salary?: number | null
          nif?: string | null
          office_rent?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: number | null
          overtime_annual?: number | null
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
          rental_properties?: Json | null
          rental_scheme?: string | null
          residence_duration_years?: number | null
          scpi_investments?: number | null
          siret?: string | null
          social_charges_paid?: number | null
          spouse_income?: number | null
          stock_options_value?: number | null
          supplementary_income?: number | null
          tax_profile_updated_at?: string | null
          thirteenth_month?: number | null
          top_clients?: Json | null
          updated_at?: string
          user_id?: string
          vehicle_expenses?: number | null
        }
        Relationships: []
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
