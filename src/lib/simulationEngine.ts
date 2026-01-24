// Simulation Engine - Core calculation logic for real estate investments

import {
  FullProjectData,
  SimulationResults,
  AmortizationRow,
  CashflowYear,
  PatrimonyYear,
  SensitivityData,
  AcquisitionData,
  FinancingData,
  RentalIncomeData,
  OperatingCosts,
  TaxConfig,
  SaleData,
  RealEstateProject,
} from './realEstateTypes';

// Calculate monthly loan payment (annuity formula)
export function calculateMonthlyPayment(
  loanAmount: number,
  annualRate: number,
  durationMonths: number
): number {
  if (loanAmount <= 0 || durationMonths <= 0) return 0;
  if (annualRate <= 0) return loanAmount / durationMonths;
  
  const monthlyRate = annualRate / 100 / 12;
  const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) / 
                  (Math.pow(1 + monthlyRate, durationMonths) - 1);
  return Math.round(payment * 100) / 100;
}

// Calculate insurance monthly amount
export function calculateInsurance(
  loanAmount: number,
  insuranceMode: 'percentage' | 'fixed',
  insuranceValue: number
): number {
  if (insuranceMode === 'fixed') return insuranceValue;
  return Math.round((loanAmount * (insuranceValue / 100) / 12) * 100) / 100;
}

// Generate amortization table
export function generateAmortizationTable(
  loanAmount: number,
  annualRate: number,
  durationMonths: number,
  insuranceMode: 'percentage' | 'fixed',
  insuranceValue: number,
  defermentType: 'none' | 'partial' | 'total' = 'none',
  defermentMonths: number = 0
): AmortizationRow[] {
  const table: AmortizationRow[] = [];
  const monthlyRate = annualRate / 100 / 12;
  const monthlyInsurance = calculateInsurance(loanAmount, insuranceMode, insuranceValue);
  
  let remainingBalance = loanAmount;
  let standardPayment = calculateMonthlyPayment(loanAmount, annualRate, durationMonths - defermentMonths);
  
  for (let month = 1; month <= durationMonths; month++) {
    const year = Math.ceil(month / 12);
    const interest = remainingBalance * monthlyRate;
    
    let payment: number;
    let principal: number;
    
    if (month <= defermentMonths) {
      if (defermentType === 'total') {
        // Total deferment: no payment, interest capitalizes
        payment = 0;
        principal = 0;
        remainingBalance += interest;
      } else if (defermentType === 'partial') {
        // Partial deferment: pay interest only
        payment = interest + monthlyInsurance;
        principal = 0;
      } else {
        // No deferment
        payment = standardPayment + monthlyInsurance;
        principal = payment - monthlyInsurance - interest;
      }
    } else {
      payment = standardPayment + monthlyInsurance;
      principal = payment - monthlyInsurance - interest;
    }
    
    remainingBalance = Math.max(0, remainingBalance - principal);
    
    table.push({
      month,
      year,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      insurance: monthlyInsurance,
      remaining_balance: Math.round(remainingBalance * 100) / 100,
    });
  }
  
  return table;
}

// Calculate notary fees estimate
export function estimateNotaryFees(price: number, isNew: boolean): number {
  const rate = isNew ? 0.025 : 0.075; // 2.5% for new, 7.5% for old
  return Math.round(price * rate);
}

// Calculate annual rental income with adjustments
export function calculateAdjustedRentalIncome(rental: RentalIncomeData, year: number = 1): number {
  if (rental.is_seasonal) {
    // Seasonal calculation
    const daysPerYear = 365;
    const occupiedDays = daysPerYear * (rental.seasonal_occupancy_rate / 100);
    const grossRevenue = occupiedDays * rental.seasonal_avg_night;
    const platformFees = grossRevenue * (rental.seasonal_platform_fees / 100);
    const cleaningCosts = rental.seasonal_cleaning_fees * (occupiedDays / 7); // weekly cleaning
    return grossRevenue - platformFees - cleaningCosts;
  }
  
  // Standard rental
  const baseRent = rental.rent_monthly * 12;
  const growthFactor = Math.pow(1 + rental.rent_growth_rate / 100, year - 1);
  const adjustedRent = baseRent * growthFactor;
  const vacancyAdjustment = adjustedRent * (1 - rental.vacancy_rate / 100);
  const defaultAdjustment = vacancyAdjustment * (1 - rental.default_rate / 100);
  
  return Math.round(defaultAdjustment * 100) / 100;
}

// Calculate annual operating costs
export function calculateAnnualOperatingCosts(
  costs: OperatingCosts,
  rentalIncome: number,
  year: number = 1
): number {
  const growthFactor = Math.pow(1 + costs.costs_growth_rate / 100, year - 1);
  const taxGrowthFactor = Math.pow(1 + costs.property_tax_growth_rate / 100, year - 1);
  
  let maintenance: number;
  if (costs.maintenance_mode === 'percentage') {
    maintenance = rentalIncome * (costs.maintenance_value / 100);
  } else {
    maintenance = costs.maintenance_value * growthFactor;
  }
  
  const management = rentalIncome * (costs.management_pct / 100);
  
  const otherCostsTotal = costs.other_costs.reduce((sum, c) => sum + c.amount, 0);
  
  const total = 
    costs.property_tax_annual * taxGrowthFactor +
    costs.condo_nonrecoverable_annual * growthFactor +
    costs.insurance_annual * growthFactor +
    maintenance +
    management +
    costs.letting_fees_annual +
    costs.accounting_annual * growthFactor +
    costs.cfe_annual * growthFactor +
    costs.utilities_annual * growthFactor +
    otherCostsTotal * growthFactor;
  
  return Math.round(total * 100) / 100;
}

// Calculate tax based on configuration
export function calculateAnnualTax(
  taxableIncome: number,
  interestPaid: number,
  operatingCosts: number,
  taxConfig: TaxConfig,
  amortizationAmount: number = 0
): number {
  if (taxConfig.tax_mode === 'override' && taxConfig.annual_tax_override !== undefined) {
    return taxConfig.annual_tax_override;
  }
  
  let taxableBase = taxableIncome;
  
  // Apply deductions based on regime
  if (taxConfig.regime_key === 'micro_foncier') {
    taxableBase = taxableIncome * 0.70; // 30% abatement
  } else if (taxConfig.regime_key === 'micro_bic') {
    taxableBase = taxableIncome * 0.50; // 50% abatement
  } else {
    // Real regime: deduct costs
    if (taxConfig.interest_deductible) {
      taxableBase -= interestPaid;
    }
    if (taxConfig.costs_deductible) {
      taxableBase -= operatingCosts;
    }
    if (taxConfig.amortization_enabled) {
      taxableBase -= amortizationAmount;
    }
  }
  
  // Apply deficit rules if enabled (taxable base can't go negative for certain regimes)
  if (!taxConfig.deficit_enabled && taxableBase < 0) {
    taxableBase = 0;
  }
  
  // Calculate tax
  const totalRate = (taxConfig.tmi_rate + taxConfig.social_rate) / 100;
  const tax = Math.max(0, taxableBase * totalRate);
  
  return Math.round(tax * 100) / 100;
}

// Calculate amortization for the year
export function calculateYearlyAmortization(
  taxConfig: TaxConfig,
  propertyValue: number,
  furnitureValue: number,
  worksValue: number,
  year: number
): number {
  if (!taxConfig.amortization_enabled) return 0;
  
  let totalAmortization = 0;
  
  for (const component of taxConfig.amortization_components) {
    if (year <= component.duration_years) {
      let baseValue = 0;
      if (component.name === 'bati') {
        baseValue = propertyValue * (component.value_pct / 100);
      } else if (component.name === 'mobilier') {
        baseValue = furnitureValue * (component.value_pct / 100);
      } else if (component.name === 'travaux') {
        baseValue = worksValue * (component.value_pct / 100);
      }
      totalAmortization += baseValue / component.duration_years;
    }
  }
  
  return Math.round(totalAmortization * 100) / 100;
}

// Calculate property value at year N
export function calculatePropertyValue(
  initialValue: number,
  growthRate: number,
  year: number
): number {
  return Math.round(initialValue * Math.pow(1 + growthRate / 100, year) * 100) / 100;
}

// Calculate remaining debt at year N from amortization table
export function getRemainingDebtAtYear(
  amortizationTable: AmortizationRow[],
  year: number
): number {
  const monthIndex = Math.min(year * 12, amortizationTable.length) - 1;
  if (monthIndex < 0 || monthIndex >= amortizationTable.length) return 0;
  return amortizationTable[monthIndex].remaining_balance;
}

// Calculate IRR (Internal Rate of Return)
export function calculateIRR(cashflows: number[], maxIterations: number = 1000): number {
  // Newton-Raphson method for IRR
  let rate = 0.1; // Initial guess 10%
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let t = 0; t < cashflows.length; t++) {
      npv += cashflows[t] / Math.pow(1 + rate, t);
      dnpv -= t * cashflows[t] / Math.pow(1 + rate, t + 1);
    }
    
    const newRate = rate - npv / dnpv;
    
    if (Math.abs(newRate - rate) < 0.0001) {
      return Math.round(newRate * 10000) / 100; // Return as percentage with 2 decimals
    }
    
    rate = newRate;
  }
  
  return Math.round(rate * 10000) / 100;
}

// Main simulation calculation
export function calculateSimulation(data: FullProjectData): SimulationResults {
  const { project, acquisition, financing, rental, owner_occupier, operating_costs, tax_config, sale_data } = data;
  
  const totalCost = acquisition.total_project_cost || (
    acquisition.price_net_seller + 
    acquisition.agency_fee_amount + 
    acquisition.notary_fee_amount + 
    acquisition.works_amount + 
    acquisition.furniture_amount + 
    acquisition.bank_fees + 
    acquisition.guarantee_fees + 
    acquisition.brokerage_fees
  );
  
  // Generate amortization table
  const amortizationTable = generateAmortizationTable(
    financing.loan_amount,
    financing.nominal_rate,
    financing.duration_months,
    financing.insurance_mode,
    financing.insurance_value,
    financing.deferment_type,
    financing.deferment_months
  );
  
  // Calculate totals from amortization
  const totalInterest = amortizationTable.reduce((sum, row) => sum + row.interest, 0);
  const totalInsurance = amortizationTable.reduce((sum, row) => sum + row.insurance, 0);
  const monthlyPayment = amortizationTable[0]?.payment || 0;
  
  // Calculate annual series
  const cashflowSeries: CashflowYear[] = [];
  const patrimonySeries: PatrimonyYear[] = [];
  const irrCashflows: number[] = [-financing.down_payment]; // Initial investment
  
  let cumulativeCashflow = 0;
  
  for (let year = 1; year <= project.horizon_years; year++) {
    let rentalIncome = 0;
    if (project.type === 'LOCATIF' && rental) {
      rentalIncome = calculateAdjustedRentalIncome(rental, year);
    }
    
    const annualOperatingCosts = calculateAnnualOperatingCosts(operating_costs, rentalIncome, year);
    
    // Get loan payments for this year
    const startMonth = (year - 1) * 12;
    const endMonth = Math.min(year * 12, amortizationTable.length);
    let yearlyLoanPayment = 0;
    let yearlyInterest = 0;
    
    for (let m = startMonth; m < endMonth; m++) {
      if (amortizationTable[m]) {
        yearlyLoanPayment += amortizationTable[m].payment;
        yearlyInterest += amortizationTable[m].interest;
      }
    }
    
    const cashflowBeforeTax = rentalIncome - annualOperatingCosts - yearlyLoanPayment;
    
    // Calculate amortization for tax purposes
    const yearlyAmortization = calculateYearlyAmortization(
      tax_config,
      acquisition.price_net_seller,
      acquisition.furniture_amount,
      acquisition.works_amount,
      year
    );
    
    // Calculate tax
    const tax = calculateAnnualTax(
      rentalIncome,
      yearlyInterest,
      annualOperatingCosts,
      tax_config,
      yearlyAmortization
    );
    
    const cashflowAfterTax = cashflowBeforeTax - tax;
    cumulativeCashflow += cashflowAfterTax;
    
    cashflowSeries.push({
      year,
      rental_income: rentalIncome,
      operating_costs: annualOperatingCosts,
      loan_payment: yearlyLoanPayment,
      cashflow_before_tax: cashflowBeforeTax,
      tax,
      cashflow_after_tax: cashflowAfterTax,
    });
    
    // Property value and patrimony
    const propertyValue = calculatePropertyValue(
      acquisition.price_net_seller,
      sale_data.property_growth_rate,
      year
    );
    const remainingDebt = getRemainingDebtAtYear(amortizationTable, year);
    const netPatrimony = propertyValue - remainingDebt + cumulativeCashflow;
    
    patrimonySeries.push({
      year,
      property_value: propertyValue,
      remaining_debt: remainingDebt,
      cumulative_cashflow: cumulativeCashflow,
      net_patrimony: netPatrimony,
    });
    
    irrCashflows.push(cashflowAfterTax);
  }
  
  // Add resale proceeds to IRR calculation
  const resaleYear = sale_data.resale_year;
  if (resaleYear <= project.horizon_years) {
    const finalPropertyValue = calculatePropertyValue(
      acquisition.price_net_seller,
      sale_data.property_growth_rate,
      resaleYear
    );
    const resaleFees = finalPropertyValue * (sale_data.resale_agency_pct / 100) + sale_data.resale_other_fees;
    const remainingDebt = getRemainingDebtAtYear(amortizationTable, resaleYear);
    
    // Capital gain tax (simplified)
    const capitalGain = finalPropertyValue - acquisition.price_net_seller - acquisition.works_amount;
    const capitalGainTax = Math.max(0, capitalGain * (sale_data.capital_gain_tax_rate / 100));
    
    const netSaleProceeds = finalPropertyValue - resaleFees - remainingDebt - capitalGainTax;
    
    // Add to last IRR cashflow
    if (irrCashflows.length > resaleYear) {
      irrCashflows[resaleYear] += netSaleProceeds;
    }
  }
  
  // Calculate KPIs
  const annualRent = rental ? rental.rent_monthly * 12 : 0;
  const grossYield = totalCost > 0 ? (annualRent / totalCost) * 100 : 0;
  
  const firstYearCosts = calculateAnnualOperatingCosts(operating_costs, annualRent, 1);
  const noi = annualRent * (1 - (rental?.vacancy_rate || 0) / 100) - firstYearCosts;
  const netYield = totalCost > 0 ? (noi / totalCost) * 100 : 0;
  
  const avgCashflowAfterTax = cashflowSeries.length > 0 
    ? cashflowSeries.reduce((sum, cf) => sum + cf.cashflow_after_tax, 0) / cashflowSeries.length 
    : 0;
  const netNetYield = totalCost > 0 ? (avgCashflowAfterTax / totalCost) * 100 : 0;
  
  const monthlyCashflowBeforeTax = cashflowSeries[0] ? cashflowSeries[0].cashflow_before_tax / 12 : 0;
  const monthlyCashflowAfterTax = cashflowSeries[0] ? cashflowSeries[0].cashflow_after_tax / 12 : 0;
  
  // Effort d'épargne (for RP)
  const monthlyEffort = project.type === 'RP' ? monthlyPayment : Math.abs(Math.min(0, monthlyCashflowAfterTax));
  
  // DSCR (Debt Service Coverage Ratio)
  const annualDebtService = monthlyPayment * 12;
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;
  
  // IRR
  const irr = calculateIRR(irrCashflows);
  
  // Net patrimony at horizon
  const netPatrimony = patrimonySeries[patrimonySeries.length - 1]?.net_patrimony || 0;
  
  // Break-even calculations
  const breakEvenRent = calculateBreakEvenRent(totalCost, financing, operating_costs, tax_config);
  const breakEvenPrice = calculateBreakEvenPrice(annualRent, financing, operating_costs, tax_config);
  const breakEvenRate = calculateBreakEvenRate(financing.loan_amount, financing.duration_months, annualRent, firstYearCosts);
  
  // Sensitivity analysis
  const sensitivityData = calculateSensitivity(data);
  
  return {
    project_id: project.id,
    gross_yield: Math.round(grossYield * 100) / 100,
    net_yield: Math.round(netYield * 100) / 100,
    net_net_yield: Math.round(netNetYield * 100) / 100,
    monthly_cashflow_before_tax: Math.round(monthlyCashflowBeforeTax * 100) / 100,
    monthly_cashflow_after_tax: Math.round(monthlyCashflowAfterTax * 100) / 100,
    monthly_effort: Math.round(monthlyEffort * 100) / 100,
    irr: isNaN(irr) ? 0 : irr,
    net_patrimony: Math.round(netPatrimony * 100) / 100,
    dscr: Math.round(dscr * 100) / 100,
    break_even_rent: Math.round(breakEvenRent * 100) / 100,
    break_even_price: Math.round(breakEvenPrice * 100) / 100,
    break_even_rate: Math.round(breakEvenRate * 100) / 100,
    cashflow_series: cashflowSeries,
    patrimony_series: patrimonySeries,
    sensitivity_data: sensitivityData,
    calculated_at: new Date().toISOString(),
  };
}

// Calculate break-even rent (cashflow = 0)
function calculateBreakEvenRent(
  totalCost: number,
  financing: FinancingData,
  costs: OperatingCosts,
  taxConfig: TaxConfig
): number {
  const monthlyPayment = calculateMonthlyPayment(
    financing.loan_amount,
    financing.nominal_rate,
    financing.duration_months
  );
  const insurance = calculateInsurance(financing.loan_amount, financing.insurance_mode, financing.insurance_value);
  const annualDebt = (monthlyPayment + insurance) * 12;
  
  // Fixed costs (not dependent on rent)
  const fixedCosts = 
    costs.property_tax_annual +
    costs.condo_nonrecoverable_annual +
    costs.insurance_annual +
    costs.accounting_annual +
    costs.cfe_annual +
    costs.utilities_annual;
  
  // For break-even: rent - vacancy - management - maintenance - fixed - debt - tax = 0
  // Simplified calculation
  const vacancyFactor = 1 - 0.05; // 5% vacancy
  const managementFactor = 1 - (costs.management_pct / 100);
  const taxFactor = 1 - ((taxConfig.tmi_rate + taxConfig.social_rate) / 100) * 0.7; // Approximate
  
  const effectiveFactor = vacancyFactor * managementFactor * taxFactor;
  const breakEvenRent = (annualDebt + fixedCosts) / effectiveFactor / 12;
  
  return breakEvenRent;
}

// Calculate break-even price (cashflow = 0 at current rent)
function calculateBreakEvenPrice(
  annualRent: number,
  financing: FinancingData,
  costs: OperatingCosts,
  taxConfig: TaxConfig
): number {
  // At what price would this rent generate 0 cashflow?
  const effectiveRent = annualRent * 0.95 * (1 - costs.management_pct / 100);
  const fixedCosts = 
    costs.property_tax_annual +
    costs.condo_nonrecoverable_annual +
    costs.insurance_annual +
    costs.accounting_annual;
  
  const availableForDebt = effectiveRent - fixedCosts;
  if (availableForDebt <= 0) return 0;
  
  // Reverse calculate loan amount from available cashflow
  const monthlyRate = financing.nominal_rate / 100 / 12;
  const months = financing.duration_months;
  
  const maxMonthlyPayment = availableForDebt / 12;
  const maxLoan = maxMonthlyPayment * (Math.pow(1 + monthlyRate, months) - 1) / 
                  (monthlyRate * Math.pow(1 + monthlyRate, months));
  
  // Add down payment to get max price
  return maxLoan + financing.down_payment;
}

// Calculate break-even interest rate (cashflow = 0)
function calculateBreakEvenRate(
  loanAmount: number,
  durationMonths: number,
  annualRent: number,
  annualCosts: number
): number {
  const availableAnnual = annualRent * 0.93 - annualCosts; // 7% vacancy/default
  if (availableAnnual <= 0) return 0;
  
  const monthlyAvailable = availableAnnual / 12;
  
  // Binary search for rate
  let low = 0;
  let high = 20;
  
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const payment = calculateMonthlyPayment(loanAmount, mid, durationMonths);
    
    if (payment > monthlyAvailable) {
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return (low + high) / 2;
}

// Calculate sensitivity analysis data
function calculateSensitivity(data: FullProjectData): SensitivityData {
  const { acquisition, financing, rental, operating_costs, tax_config } = data;
  
  const baseRent = rental?.rent_monthly || 0;
  const basePrice = acquisition.price_net_seller;
  const baseRate = financing.nominal_rate;
  
  const totalCost = acquisition.total_project_cost || basePrice * 1.1;
  
  // Rent sensitivity
  const rentSensitivity = [];
  for (let pct = -20; pct <= 20; pct += 5) {
    const rent = baseRent * (1 + pct / 100);
    const annualRent = rent * 12;
    const grossYield = (annualRent / totalCost) * 100;
    const costs = calculateAnnualOperatingCosts(operating_costs, annualRent, 1);
    const noi = annualRent * 0.95 - costs;
    const monthlyPayment = calculateMonthlyPayment(financing.loan_amount, financing.nominal_rate, financing.duration_months);
    const cashflow = (noi - monthlyPayment * 12) / 12;
    
    rentSensitivity.push({ rent: Math.round(rent), cashflow: Math.round(cashflow), yield: Math.round(grossYield * 10) / 10 });
  }
  
  // Price sensitivity
  const priceSensitivity = [];
  for (let pct = -20; pct <= 20; pct += 5) {
    const price = basePrice * (1 + pct / 100);
    const annualRent = baseRent * 12;
    const grossYield = (annualRent / (price * 1.1)) * 100;
    const monthlyPayment = calculateMonthlyPayment(price * 0.9, financing.nominal_rate, financing.duration_months);
    const costs = calculateAnnualOperatingCosts(operating_costs, annualRent, 1);
    const noi = annualRent * 0.95 - costs;
    const cashflow = (noi - monthlyPayment * 12) / 12;
    
    priceSensitivity.push({ price: Math.round(price), cashflow: Math.round(cashflow), yield: Math.round(grossYield * 10) / 10 });
  }
  
  // Rate sensitivity
  const rateSensitivity = [];
  for (let rate = 1; rate <= 7; rate += 0.5) {
    const monthlyPayment = calculateMonthlyPayment(financing.loan_amount, rate, financing.duration_months);
    const annualRent = baseRent * 12;
    const costs = calculateAnnualOperatingCosts(operating_costs, annualRent, 1);
    const noi = annualRent * 0.95 - costs;
    const cashflow = (noi - monthlyPayment * 12) / 12;
    
    rateSensitivity.push({ rate, cashflow: Math.round(cashflow), monthly_payment: Math.round(monthlyPayment) });
  }
  
  // Heatmap (price vs rent)
  const heatmap = [];
  for (let pricePct = -20; pricePct <= 20; pricePct += 10) {
    for (let rentPct = -20; rentPct <= 20; rentPct += 10) {
      const price = basePrice * (1 + pricePct / 100);
      const rent = baseRent * (1 + rentPct / 100);
      const annualRent = rent * 12;
      const netYield = (annualRent * 0.9 / (price * 1.1)) * 100;
      
      heatmap.push({ price: Math.round(price), rent: Math.round(rent), net_yield: Math.round(netYield * 10) / 10 });
    }
  }
  
  return {
    rent_sensitivity: rentSensitivity,
    price_sensitivity: priceSensitivity,
    rate_sensitivity: rateSensitivity,
    heatmap,
  };
}
