// Simulation immo simplifiée — porté de src/lib/simulationEngine.ts (version condensée)

export interface SimulateRealEstateInput {
  property_price: number;
  monthly_rent: number;
  loan_duration_years: number;
  down_payment: number;
}

export interface SimulateRealEstateResult {
  property_price: number;
  loan_amount: number;
  monthly_payment: number;
  monthly_rent: number;
  monthly_cashflow: number;
  gross_yield_pct: number;
  net_yield_pct: number;
  total_interest: number;
  total_charges_estimated: number;
  notary_fees: number;
}

const NOMINAL_RATE = 0.035; // 3.5% par défaut
const INSURANCE_RATE = 0.003; // 0.3%
const NOTARY_RATE = 0.08; // 8% ancien
const CHARGES_PCT_RENT = 0.20; // 20% du loyer (taxe foncière, charges, vacance, maintenance)

function monthlyPayment(principal: number, annualRate: number, months: number): number {
  if (months === 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function simulateRealEstate(input: SimulateRealEstateInput): SimulateRealEstateResult {
  const { property_price, monthly_rent, loan_duration_years, down_payment } = input;
  const notaryFees = property_price * NOTARY_RATE;
  const totalCost = property_price + notaryFees;
  const loanAmount = Math.max(0, totalCost - down_payment);
  const months = loan_duration_years * 12;

  const capitalPayment = monthlyPayment(loanAmount, NOMINAL_RATE, months);
  const insurance = (loanAmount * INSURANCE_RATE) / 12;
  const monthly = capitalPayment + insurance;

  const monthlyCharges = monthly_rent * CHARGES_PCT_RENT;
  const cashflow = monthly_rent - monthly - monthlyCharges;

  const totalPaid = monthly * months;
  const totalInterest = Math.max(0, totalPaid - loanAmount);

  const grossYield = property_price > 0 ? (monthly_rent * 12) / property_price * 100 : 0;
  const netYield = property_price > 0 ? ((monthly_rent - monthlyCharges) * 12) / property_price * 100 : 0;

  return {
    property_price,
    loan_amount: Math.round(loanAmount),
    monthly_payment: Math.round(monthly),
    monthly_rent,
    monthly_cashflow: Math.round(cashflow),
    gross_yield_pct: Math.round(grossYield * 100) / 100,
    net_yield_pct: Math.round(netYield * 100) / 100,
    total_interest: Math.round(totalInterest),
    total_charges_estimated: Math.round(monthlyCharges),
    notary_fees: Math.round(notaryFees),
  };
}
