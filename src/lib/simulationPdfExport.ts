// PDF Export for Real Estate Simulations - "Dossier Banque" Professional
import jsPDF from 'jspdf';
import { FullProjectData, CashflowYear, PatrimonyYear } from './realEstateTypes';
import { formatCurrency } from '@/data/mockData';

interface PDFConfig {
  showPrudentScenario: boolean;
  haircuts: {
    rentHaircut: number;
    vacancyHaircut: number;
    rateHaircut: number;
    costsHaircut: number;
  };
}

const defaultConfig: PDFConfig = {
  showPrudentScenario: true,
  haircuts: {
    rentHaircut: 10,
    vacancyHaircut: 50,
    rateHaircut: 1,
    costsHaircut: 10,
  }
};

export async function generateBankPDF(data: FullProjectData, config: PDFConfig = defaultConfig): Promise<void> {
  const { project, acquisition, financing, rental, operating_costs, tax_config, sale_data, results } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;
  let pageNumber = 1;

  // Colors (RGB)
  const colors = {
    primary: [59, 130, 246] as [number, number, number],    // Blue
    success: [34, 197, 94] as [number, number, number],     // Green
    warning: [234, 179, 8] as [number, number, number],     // Yellow
    danger: [239, 68, 68] as [number, number, number],      // Red
    muted: [148, 163, 184] as [number, number, number],     // Gray
    dark: [30, 41, 59] as [number, number, number],         // Slate
  };

  const addPageIfNeeded = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - 30) {
      doc.addPage();
      pageNumber++;
      y = margin;
      addFooter();
    }
  };

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.text(`CAPITALUM — Dossier de financement — Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Ce document est une simulation. Les résultats ne constituent pas un conseil en investissement.', pageWidth / 2, pageHeight - 5, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  const addSectionTitle = (text: string, icon?: string) => {
    addPageIfNeeded(25);
    y += 5;
    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${icon || ''}  ${text}`.trim(), margin + 5, y + 8);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    y += 18;
  };

  const addSubtitle = (text: string) => {
    addPageIfNeeded(15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(text, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    y += 6;
  };

  const addLine = (label: string, value: string, indent: number = 0, highlight: boolean = false) => {
    addPageIfNeeded(7);
    doc.setFontSize(9);
    if (highlight) {
      doc.setFont('helvetica', 'bold');
    }
    doc.text(label, margin + indent, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 5;
  };

  const addSeparator = () => {
    y += 2;
    doc.setDrawColor(...colors.muted);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  const addKPIBox = (x: number, width: number, label: string, value: string, status: 'good' | 'warning' | 'bad' | 'neutral' = 'neutral') => {
    const boxHeight = 20;
    const statusColor = status === 'good' ? colors.success : status === 'warning' ? colors.warning : status === 'bad' ? colors.danger : colors.muted;
    
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, y, width, boxHeight, 2, 2, 'F');
    doc.setDrawColor(...statusColor);
    doc.setLineWidth(1);
    doc.roundedRect(x, y, width, boxHeight, 2, 2, 'S');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(value, x + width / 2, y + 8, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.muted);
    doc.text(label, x + width / 2, y + 15, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
  };

  // Calculate additional metrics
  const totalCost = (acquisition.price_net_seller || 0) + 
                    (acquisition.agency_fee_amount || 0) + 
                    (acquisition.notary_fee_amount || 0) + 
                    (acquisition.works_amount || 0) +
                    (acquisition.furniture_amount || 0) +
                    (acquisition.bank_fees || 0) +
                    (acquisition.guarantee_fees || 0);

  const annualRent = (rental?.rent_monthly || 0) * 12;
  const effectiveVacancy = rental?.vacancy_rate || 5;
  const effectiveRent = annualRent * (1 - effectiveVacancy / 100);
  
  // Prudent scenario calculations
  const prudentRent = (rental?.rent_monthly || 0) * (1 - config.haircuts.rentHaircut / 100);
  const prudentVacancy = Math.min(100, effectiveVacancy * (1 + config.haircuts.vacancyHaircut / 100));
  const prudentRate = financing.nominal_rate + config.haircuts.rateHaircut;
  const prudentMonthlyPayment = financing.loan_amount * (prudentRate / 100 / 12) * Math.pow(1 + prudentRate / 100 / 12, financing.duration_months) / (Math.pow(1 + prudentRate / 100 / 12, financing.duration_months) - 1);
  const prudentOperatingCosts = (operating_costs.property_tax_annual + operating_costs.condo_nonrecoverable_annual + operating_costs.insurance_annual) * (1 + config.haircuts.costsHaircut / 100);
  const prudentNOI = prudentRent * 12 * (1 - prudentVacancy / 100) - prudentOperatingCosts;
  const prudentDSCR = prudentNOI / (prudentMonthlyPayment * 12);
  const prudentCashflow = (prudentNOI - prudentMonthlyPayment * 12) / 12;

  // ============================================
  // PAGE 1: COVER PAGE
  // ============================================
  
  // Logo area
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CAPITALUM', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('DOSSIER DE FINANCEMENT IMMOBILIER', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 52, { align: 'center' });
  
  // Project title
  y = 80;
  doc.setTextColor(...colors.dark);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(project.title || 'Projet Immobilier', pageWidth / 2, y, { align: 'center' });
  
  y += 12;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.muted);
  doc.text(`${project.city || ''} (${project.postal_code || ''}) — ${project.surface_m2} m²`, pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.text(`${project.property_type === 'apartment' ? 'Appartement' : 'Maison'} — ${project.rooms} pièces — ${project.strategy === 'meuble' ? 'Location meublée' : 'Location nue'}`, pageWidth / 2, y, { align: 'center' });
  
  // Key metrics boxes
  y = 120;
  const boxWidth = (contentWidth - 15) / 4;
  
  addKPIBox(margin, boxWidth, 'PRIX TOTAL', formatCurrency(totalCost), 'neutral');
  addKPIBox(margin + boxWidth + 5, boxWidth, 'APPORT', formatCurrency(financing.down_payment), 'neutral');
  addKPIBox(margin + (boxWidth + 5) * 2, boxWidth, 'EMPRUNT', formatCurrency(financing.loan_amount), 'neutral');
  addKPIBox(margin + (boxWidth + 5) * 3, boxWidth, 'MENSUALITÉ', formatCurrency(financing.monthly_payment), 'neutral');
  
  y += 30;
  
  const yieldStatus = (results?.net_yield || 0) >= 5 ? 'good' : (results?.net_yield || 0) >= 3 ? 'warning' : 'bad';
  const dscrStatus = (results?.dscr || 0) >= 1.2 ? 'good' : (results?.dscr || 0) >= 1 ? 'warning' : 'bad';
  const cashflowStatus = (results?.monthly_cashflow_after_tax || 0) >= 0 ? 'good' : (results?.monthly_cashflow_after_tax || 0) >= -200 ? 'warning' : 'bad';
  const irrStatus = (results?.irr || 0) >= 8 ? 'good' : (results?.irr || 0) >= 4 ? 'warning' : 'bad';
  
  addKPIBox(margin, boxWidth, 'RENTA. NETTE', `${(results?.net_yield || 0).toFixed(2)}%`, yieldStatus);
  addKPIBox(margin + boxWidth + 5, boxWidth, 'DSCR', `${(results?.dscr || 0).toFixed(2)}`, dscrStatus);
  addKPIBox(margin + (boxWidth + 5) * 2, boxWidth, 'CASHFLOW/MOIS', formatCurrency(results?.monthly_cashflow_after_tax || 0), cashflowStatus);
  addKPIBox(margin + (boxWidth + 5) * 3, boxWidth, 'TRI', `${(results?.irr || 0).toFixed(1)}%`, irrStatus);
  
  // Summary box
  y += 35;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(...colors.success);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'FD');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('SYNTHÈSE DU PROJET', margin + 10, y + 12);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const summaryLines = [
    `• Investissement de ${formatCurrency(totalCost)} avec un apport de ${formatCurrency(financing.down_payment)} (${((financing.down_payment / totalCost) * 100).toFixed(0)}%)`,
    `• Financement sur ${financing.duration_months / 12} ans à ${financing.nominal_rate}% — Mensualité : ${formatCurrency(financing.monthly_payment)}`,
    `• Loyer attendu : ${formatCurrency(rental?.rent_monthly || 0)}/mois — Rentabilité nette : ${(results?.net_yield || 0).toFixed(2)}%`,
    `• Patrimoine net estimé à ${project.horizon_years} ans : ${formatCurrency(results?.net_patrimony || 0)}`,
  ];
  summaryLines.forEach((line, i) => {
    doc.text(line, margin + 10, y + 22 + i * 5);
  });
  
  // Project viability indicator
  y += 55;
  const isViable = (results?.dscr || 0) >= 1.2 && (results?.monthly_cashflow_after_tax || 0) >= -200;
  const viableColor = isViable ? colors.success : colors.danger;
  doc.setFillColor(isViable ? 220 : 254, isViable ? 252 : 226, isViable ? 231 : 226);
  doc.setDrawColor(viableColor[0], viableColor[1], viableColor[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'FD');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(viableColor[0], viableColor[1], viableColor[2]);
  doc.text(isViable ? '✓ PROJET FINANÇABLE — Ratios conformes aux critères bancaires' : '⚠ ATTENTION — Certains ratios sont sous les seuils bancaires recommandés', pageWidth / 2, y + 12, { align: 'center' });
  
  addFooter();
  
  // ============================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ============================================
  doc.addPage();
  pageNumber++;
  y = margin;
  addFooter();
  
  addSectionTitle('RÉSUMÉ EXÉCUTIF', '📊');
  
  // 3-column layout for key data
  const col1 = margin;
  const col2 = margin + contentWidth / 3 + 3;
  const col3 = margin + (contentWidth / 3) * 2 + 6;
  const colWidth = contentWidth / 3 - 4;
  
  // Column 1: Acquisition
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col1, y, colWidth, 70, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('ACQUISITION', col1 + 5, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.dark);
  doc.setFontSize(8);
  let lineY = y + 20;
  doc.text(`Prix net vendeur`, col1 + 5, lineY);
  doc.text(formatCurrency(acquisition.price_net_seller), col1 + colWidth - 5, lineY, { align: 'right' });
  lineY += 7;
  doc.text(`Frais agence`, col1 + 5, lineY);
  doc.text(formatCurrency(acquisition.agency_fee_amount), col1 + colWidth - 5, lineY, { align: 'right' });
  lineY += 7;
  doc.text(`Frais notaire`, col1 + 5, lineY);
  doc.text(formatCurrency(acquisition.notary_fee_amount), col1 + colWidth - 5, lineY, { align: 'right' });
  lineY += 7;
  if (acquisition.works_amount > 0) {
    doc.text(`Travaux`, col1 + 5, lineY);
    doc.text(formatCurrency(acquisition.works_amount), col1 + colWidth - 5, lineY, { align: 'right' });
    lineY += 7;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL`, col1 + 5, y + 62);
  doc.text(formatCurrency(totalCost), col1 + colWidth - 5, y + 62, { align: 'right' });
  
  // Column 2: Financement
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2, y, colWidth, 70, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('FINANCEMENT', col2 + 5, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.dark);
  doc.setFontSize(8);
  lineY = y + 20;
  doc.text(`Apport personnel`, col2 + 5, lineY);
  doc.text(formatCurrency(financing.down_payment), col2 + colWidth - 5, lineY, { align: 'right' });
  lineY += 7;
  doc.text(`Montant emprunté`, col2 + 5, lineY);
  doc.text(formatCurrency(financing.loan_amount), col2 + colWidth - 5, lineY, { align: 'right' });
  lineY += 7;
  doc.text(`Durée`, col2 + 5, lineY);
  doc.text(`${financing.duration_months / 12} ans`, col2 + colWidth - 5, lineY, { align: 'right' });
  lineY += 7;
  doc.text(`Taux nominal`, col2 + 5, lineY);
  doc.text(`${financing.nominal_rate}%`, col2 + colWidth - 5, lineY, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`MENSUALITÉ`, col2 + 5, y + 62);
  doc.text(formatCurrency(financing.monthly_payment), col2 + colWidth - 5, y + 62, { align: 'right' });
  
  // Column 3: Exploitation
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col3, y, colWidth, 70, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('EXPLOITATION', col3 + 5, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.dark);
  doc.setFontSize(8);
  lineY = y + 20;
  doc.text(`Loyer mensuel`, col3 + 5, lineY);
  doc.text(formatCurrency(rental?.rent_monthly || 0), col3 + colWidth - 5, lineY, { align: 'right' });
  lineY += 7;
  doc.text(`Loyer annuel`, col3 + 5, lineY);
  doc.text(formatCurrency(annualRent), col3 + colWidth - 5, lineY, { align: 'right' });
  lineY += 7;
  doc.text(`Vacance/impayés`, col3 + 5, lineY);
  doc.text(`${effectiveVacancy + (rental?.default_rate || 0)}%`, col3 + colWidth - 5, lineY, { align: 'right' });
  lineY += 7;
  doc.text(`Charges annuelles`, col3 + 5, lineY);
  doc.text(formatCurrency(operating_costs.property_tax_annual + operating_costs.condo_nonrecoverable_annual + operating_costs.insurance_annual), col3 + colWidth - 5, lineY, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`CASHFLOW/MOIS`, col3 + 5, y + 62);
  const cfColor = (results?.monthly_cashflow_after_tax || 0) >= 0 ? colors.success : colors.danger;
  doc.setTextColor(cfColor[0], cfColor[1], cfColor[2]);
  doc.text(formatCurrency(results?.monthly_cashflow_after_tax || 0), col3 + colWidth - 5, y + 62, { align: 'right' });
  
  y += 80;
  
  // Performance indicators table
  addSubtitle('Indicateurs de performance');
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 55, 2, 2, 'F');
  
  const indicators = [
    { label: 'Rentabilité brute', value: `${(results?.gross_yield || 0).toFixed(2)}%`, desc: 'Loyer annuel / Coût total' },
    { label: 'Rentabilité nette', value: `${(results?.net_yield || 0).toFixed(2)}%`, desc: 'Après charges, avant impôts' },
    { label: 'Rentabilité nette-nette', value: `${(results?.net_net_yield || 0).toFixed(2)}%`, desc: 'Après charges et impôts' },
    { label: 'DSCR', value: `${(results?.dscr || 0).toFixed(2)}`, desc: 'NOI / Service dette (min 1.20)' },
    { label: 'TRI (IRR)', value: `${(results?.irr || 0).toFixed(1)}%`, desc: 'Performance globale horizon' },
    { label: 'Patrimoine net', value: formatCurrency(results?.net_patrimony || 0), desc: `À ${project.horizon_years} ans` },
  ];
  
  const indWidth = contentWidth / 3 - 4;
  indicators.forEach((ind, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = margin + col * (indWidth + 6) + 5;
    const yPos = y + row * 25 + 12;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(ind.value, x, yPos);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(ind.label, x, yPos + 6);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.text(ind.desc, x, yPos + 11);
  });
  
  y += 65;
  
  // ============================================
  // PRUDENT SCENARIO (Bank Scenario)
  // ============================================
  if (config.showPrudentScenario) {
    addSectionTitle('SCÉNARIO PRUDENT (BANQUE)', '🏦');
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.text('Ce scénario applique des haircuts conservateurs pour évaluer la résilience du projet face aux risques.', margin, y);
    y += 8;
    
    // Haircuts applied
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...colors.dark);
    doc.text('Haircuts appliqués :', margin + 5, y + 8);
    doc.text(`Loyer -${config.haircuts.rentHaircut}%  |  Vacance +${config.haircuts.vacancyHaircut}%  |  Taux +${config.haircuts.rateHaircut} pts  |  Charges +${config.haircuts.costsHaircut}%`, margin + 5, y + 16);
    y += 28;
    
    // Comparison table
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 45, 2, 2, 'F');
    
    // Headers
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicateur', margin + 5, y + 10);
    doc.text('Base', margin + 80, y + 10);
    doc.text('Prudent', margin + 120, y + 10);
    doc.text('Variation', margin + 160, y + 10);
    
    doc.setFont('helvetica', 'normal');
    
    const comparisons = [
      { label: 'Loyer mensuel', base: formatCurrency(rental?.rent_monthly || 0), prudent: formatCurrency(prudentRent), variation: `-${config.haircuts.rentHaircut}%` },
      { label: 'Mensualité crédit', base: formatCurrency(financing.monthly_payment), prudent: formatCurrency(prudentMonthlyPayment), variation: `+${((prudentMonthlyPayment / financing.monthly_payment - 1) * 100).toFixed(0)}%` },
      { label: 'DSCR', base: (results?.dscr || 0).toFixed(2), prudent: prudentDSCR.toFixed(2), variation: `${prudentDSCR >= (results?.dscr || 0) ? '+' : ''}${((prudentDSCR / (results?.dscr || 1) - 1) * 100).toFixed(0)}%` },
      { label: 'Cashflow/mois', base: formatCurrency(results?.monthly_cashflow_after_tax || 0), prudent: formatCurrency(prudentCashflow), variation: formatCurrency(prudentCashflow - (results?.monthly_cashflow_after_tax || 0)) },
    ];
    
    comparisons.forEach((comp, i) => {
      const lineY = y + 20 + i * 7;
      doc.text(comp.label, margin + 5, lineY);
      doc.text(comp.base, margin + 80, lineY);
      doc.setTextColor(...colors.warning);
      doc.text(comp.prudent, margin + 120, lineY);
      doc.setTextColor(...colors.danger);
      doc.text(comp.variation, margin + 160, lineY);
      doc.setTextColor(...colors.dark);
    });
    
    y += 52;
    
    // Prudent verdict
    const prudentViable = prudentDSCR >= 1.0 && prudentCashflow >= -500;
    doc.setFillColor(prudentViable ? 220 : 254, prudentViable ? 252 : 226, prudentViable ? 231 : 226);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const prudentColor = prudentViable ? colors.success : colors.danger;
    doc.setTextColor(prudentColor[0], prudentColor[1], prudentColor[2]);
    doc.text(
      prudentViable 
        ? '✓ Le projet reste viable dans le scénario prudent — Marge de sécurité suffisante'
        : '⚠ Attention : Le scénario prudent montre une fragilité — Négocier le prix ou augmenter l\'apport',
      pageWidth / 2, y + 11, { align: 'center' }
    );
    y += 25;
  }
  
  // ============================================
  // PAGE 3: DETAILED FINANCIALS
  // ============================================
  doc.addPage();
  pageNumber++;
  y = margin;
  addFooter();
  
  addSectionTitle('DÉTAIL DE L\'ACQUISITION', '🏠');
  
  addLine('Prix net vendeur', formatCurrency(acquisition.price_net_seller), 0, true);
  addLine('Frais d\'agence', formatCurrency(acquisition.agency_fee_amount), 5);
  if (acquisition.agency_fee_pct) {
    addLine('  (pourcentage)', `${acquisition.agency_fee_pct}%`, 10);
  }
  addLine('Frais de notaire', formatCurrency(acquisition.notary_fee_amount), 5);
  addLine('  Estimation', acquisition.notary_fee_estimated ? 'Oui' : 'Non (réel)', 10);
  if (acquisition.works_amount > 0) {
    addLine('Travaux', formatCurrency(acquisition.works_amount), 5);
    if (acquisition.works_schedule_months) {
      addLine('  Durée travaux', `${acquisition.works_schedule_months} mois`, 10);
    }
  }
  if (acquisition.furniture_amount > 0) {
    addLine('Mobilier', formatCurrency(acquisition.furniture_amount), 5);
  }
  addLine('Frais bancaires', formatCurrency(acquisition.bank_fees || 0), 5);
  addLine('Frais de garantie', formatCurrency(acquisition.guarantee_fees || 0), 5);
  addSeparator();
  addLine('COÛT TOTAL PROJET', formatCurrency(totalCost), 0, true);
  y += 10;
  
  addSectionTitle('STRUCTURE DE FINANCEMENT', '💰');
  
  addLine('Apport personnel', formatCurrency(financing.down_payment), 0, true);
  addLine('  Affectation', financing.down_payment_allocation === 'fees' ? 'Frais annexes' : 'Prix', 5);
  addLine('Montant emprunté', formatCurrency(financing.loan_amount), 0, true);
  addLine('Durée du prêt', `${financing.duration_months} mois (${financing.duration_months / 12} ans)`, 5);
  addLine('Taux nominal', `${financing.nominal_rate}%`, 5);
  addLine('Assurance emprunteur', `${financing.insurance_value}% / an`, 5);
  if (financing.deferment_months > 0) {
    addLine('Différé de remboursement', `${financing.deferment_months} mois (${financing.deferment_type})`, 5);
  }
  addSeparator();
  addLine('Mensualité totale', formatCurrency(financing.monthly_payment), 0, true);
  addLine('Total intérêts', formatCurrency(financing.total_interest), 5);
  addLine('Total assurance', formatCurrency(financing.total_insurance), 5);
  addLine('Coût total du crédit', formatCurrency(financing.total_interest + financing.total_insurance), 5);
  y += 10;
  
  addSectionTitle('REVENUS LOCATIFS', '📈');
  
  if (rental?.is_seasonal) {
    addLine('Type de location', 'Saisonnière', 0);
    addLine('Prix moyen/nuit', formatCurrency(rental.seasonal_avg_night || 0), 5);
    addLine('Taux d\'occupation', `${rental.seasonal_occupancy_rate}%`, 5);
    addLine('Frais plateforme', `${rental.seasonal_platform_fees}%`, 5);
    addLine('Frais ménage', formatCurrency(rental.seasonal_cleaning_fees || 0), 5);
  } else {
    addLine('Loyer mensuel HC', formatCurrency(rental?.rent_monthly || 0), 0, true);
    addLine('Loyer annuel', formatCurrency(annualRent), 5);
    addLine('Charges récupérables', formatCurrency(rental?.recoverable_charges || 0), 5);
  }
  addLine('Vacance locative', `${rental?.vacancy_rate || 5}%`, 5);
  addLine('Taux d\'impayés', `${rental?.default_rate || 2}%`, 5);
  addLine('Revalorisation annuelle', `${rental?.rent_growth_rate || 1}%`, 5);
  addSeparator();
  addLine('Revenu net effectif / an', formatCurrency(effectiveRent), 0, true);
  
  // ============================================
  // PAGE 4: OPERATING COSTS & TAX
  // ============================================
  doc.addPage();
  pageNumber++;
  y = margin;
  addFooter();
  
  addSectionTitle('CHARGES D\'EXPLOITATION', '📋');
  
  addLine('Taxe foncière', formatCurrency(operating_costs.property_tax_annual) + ' / an', 0, true);
  addLine('  Revalorisation', `${operating_costs.property_tax_growth_rate}% / an`, 5);
  addLine('Charges copro non récup.', formatCurrency(operating_costs.condo_nonrecoverable_annual) + ' / an', 0);
  addLine('Assurance PNO', formatCurrency(operating_costs.insurance_annual) + ' / an', 0);
  addLine('Gestion locative', `${operating_costs.management_pct}%`, 0);
  addLine('Comptabilité', formatCurrency(operating_costs.accounting_annual) + ' / an', 0);
  if (operating_costs.cfe_annual) addLine('CFE', formatCurrency(operating_costs.cfe_annual) + ' / an', 0);
  if (operating_costs.maintenance_value) {
    addLine('Provision entretien', operating_costs.maintenance_mode === 'percentage' 
      ? `${operating_costs.maintenance_value}% du loyer`
      : formatCurrency(operating_costs.maintenance_value) + ' / an', 0);
  }
  addSeparator();
  const totalCharges = operating_costs.property_tax_annual + operating_costs.condo_nonrecoverable_annual + operating_costs.insurance_annual + operating_costs.accounting_annual;
  addLine('TOTAL CHARGES / AN', formatCurrency(totalCharges), 0, true);
  y += 10;
  
  addSectionTitle('CONFIGURATION FISCALE', '🧾');
  
  addLine('Mode de calcul', tax_config.tax_mode === 'simple' ? 'Simplifié (TMI + PS)' : (tax_config.tax_mode as string) === 'regime' ? 'Par régime' : 'Override manuel', 0);
  addLine('Régime fiscal', tax_config.regime_key?.replace(/_/g, ' ').toUpperCase() || 'Non défini', 0, true);
  addLine('Tranche Marginale (TMI)', `${tax_config.tmi_rate}%`, 5);
  addLine('Prélèvements sociaux', `${tax_config.social_rate}%`, 5);
  addLine('Taux d\'imposition global', `${tax_config.tmi_rate + tax_config.social_rate}%`, 5);
  if (tax_config.interest_deductible) addLine('Intérêts déductibles', 'Oui', 5);
  if (tax_config.costs_deductible) addLine('Charges déductibles', 'Oui', 5);
  if (tax_config.amortization_enabled) addLine('Amortissements activés', 'Oui', 5);
  if (tax_config.deficit_enabled) addLine('Report de déficit', 'Activé', 5);
  y += 10;
  
  addSectionTitle('REVENTE & PLUS-VALUE', '🏷️');
  
  addLine('Horizon de revente', `Année ${sale_data.resale_year}`, 0);
  addLine('Croissance valeur', `${sale_data.property_growth_rate}% / an`, 0);
  const futureValue = acquisition.price_net_seller * Math.pow(1 + sale_data.property_growth_rate / 100, sale_data.resale_year);
  addLine('Valeur estimée à la revente', formatCurrency(futureValue), 0, true);
  addLine('Frais d\'agence revente', `${sale_data.resale_agency_pct}%`, 5);
  addLine('Autres frais', formatCurrency(sale_data.resale_other_fees || 0), 5);
  addLine('Taxation plus-value', `${sale_data.capital_gain_tax_rate}%`, 0);
  
  // ============================================
  // PAGE 5: CASHFLOW TABLE
  // ============================================
  doc.addPage();
  pageNumber++;
  y = margin;
  addFooter();
  
  addSectionTitle('TABLEAU DES CASHFLOWS ANNUELS', '📊');
  
  const cashflows = results?.cashflow_series || [];
  const headers = ['An', 'Revenus', 'Charges', 'Crédit', 'Impôts', 'Cashflow net'];
  const colWidths = [15, 30, 30, 30, 25, 35];
  
  // Header
  doc.setFillColor(...colors.primary);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  let x = margin + 3;
  headers.forEach((h, i) => {
    doc.text(h, x, y + 5.5);
    x += colWidths[i];
  });
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  cashflows.slice(0, 25).forEach((cf, idx) => {
    addPageIfNeeded(6);
    
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3, contentWidth, 6, 'F');
    }
    
    x = margin + 3;
    doc.setFontSize(8);
    const row = [
      `${cf.year}`,
      formatCurrency(cf.rental_income),
      formatCurrency(cf.operating_costs),
      formatCurrency(cf.loan_payment),
      formatCurrency(cf.tax),
      formatCurrency(cf.cashflow_after_tax),
    ];
    row.forEach((cell, i) => {
      if (i === 5) {
        const cellColor = cf.cashflow_after_tax >= 0 ? colors.success : colors.danger;
        doc.setTextColor(cellColor[0], cellColor[1], cellColor[2]);
        doc.setFont('helvetica', 'bold');
      }
      doc.text(cell, x, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      x += colWidths[i];
    });
    y += 6;
  });
  
  // Totals
  y += 3;
  doc.setFillColor(...colors.dark);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  x = margin + 3;
  const totals = [
    'TOTAL',
    formatCurrency(cashflows.reduce((s, c) => s + c.rental_income, 0)),
    formatCurrency(cashflows.reduce((s, c) => s + c.operating_costs, 0)),
    formatCurrency(cashflows.reduce((s, c) => s + c.loan_payment, 0)),
    formatCurrency(cashflows.reduce((s, c) => s + c.tax, 0)),
    formatCurrency(cashflows.reduce((s, c) => s + c.cashflow_after_tax, 0)),
  ];
  totals.forEach((t, i) => {
    doc.text(t, x, y + 5.5);
    x += colWidths[i];
  });
  
  // ============================================
  // PAGE 6: PATRIMONY & AMORTIZATION
  // ============================================
  doc.addPage();
  pageNumber++;
  y = margin;
  addFooter();
  
  addSectionTitle('ÉVOLUTION DU PATRIMOINE', '📈');
  
  const patrimony = results?.patrimony_series || [];
  const patHeaders = ['An', 'Valeur bien', 'Dette', 'Cashflow cumulé', 'Patrimoine net'];
  const patColWidths = [15, 35, 35, 40, 40];
  
  doc.setFillColor(...colors.primary);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  x = margin + 3;
  patHeaders.forEach((h, i) => {
    doc.text(h, x, y + 5.5);
    x += patColWidths[i];
  });
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  patrimony.forEach((p, idx) => {
    addPageIfNeeded(6);
    
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3, contentWidth, 6, 'F');
    }
    
    x = margin + 3;
    doc.setFontSize(8);
    const row = [
      `${p.year}`,
      formatCurrency(p.property_value),
      formatCurrency(p.remaining_debt),
      formatCurrency(p.cumulative_cashflow),
      formatCurrency(p.net_patrimony),
    ];
    row.forEach((cell, i) => {
      if (i === 4) {
        const patColor = p.net_patrimony >= 0 ? colors.success : colors.danger;
        doc.setTextColor(patColor[0], patColor[1], patColor[2]);
        doc.setFont('helvetica', 'bold');
      }
      doc.text(cell, x, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      x += patColWidths[i];
    });
    y += 6;
  });
  
  // ============================================
  // LAST PAGE: HYPOTHESES & DISCLAIMERS
  // ============================================
  doc.addPage();
  pageNumber++;
  y = margin;
  addFooter();
  
  addSectionTitle('HYPOTHÈSES DE LA SIMULATION', 'ℹ️');
  
  doc.setFontSize(8);
  doc.setTextColor(...colors.muted);
  const hypotheses = [
    `Prix d'achat net vendeur : ${formatCurrency(acquisition.price_net_seller)}`,
    `Frais de notaire estimés à ${((acquisition.notary_fee_amount / acquisition.price_net_seller) * 100).toFixed(1)}% du prix`,
    `Financement : ${formatCurrency(financing.loan_amount)} sur ${financing.duration_months / 12} ans à ${financing.nominal_rate}%`,
    `Assurance emprunteur : ${financing.insurance_value}% du capital / an`,
    `Loyer mensuel : ${formatCurrency(rental?.rent_monthly || 0)} (revalorisation ${rental?.rent_growth_rate || 1}%/an)`,
    `Vacance locative : ${rental?.vacancy_rate || 5}% — Impayés : ${rental?.default_rate || 2}%`,
    `Charges d'exploitation : ${formatCurrency(totalCharges)}/an (revalorisation ${operating_costs.costs_growth_rate}%/an)`,
    `Fiscalité : ${tax_config.regime_key?.replace(/_/g, ' ')} — TMI ${tax_config.tmi_rate}% + PS ${tax_config.social_rate}%`,
    `Horizon de détention : ${project.horizon_years} ans`,
    `Revente année ${sale_data.resale_year} avec croissance ${sale_data.property_growth_rate}%/an`,
    `Plus-value taxée à ${sale_data.capital_gain_tax_rate}%`,
  ];
  
  hypotheses.forEach(h => {
    addPageIfNeeded(6);
    doc.text(`• ${h}`, margin, y);
    y += 5;
  });
  
  y += 10;
  
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('AVERTISSEMENT', margin + 5, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const disclaimer = [
    'Ce document est une simulation basée sur des hypothèses qui peuvent évoluer.',
    'Les résultats présentés ne constituent en aucun cas un conseil en investissement.',
    'Les performances passées ne préjugent pas des performances futures.',
    'Consultez un conseiller en gestion de patrimoine avant toute décision d\'investissement.',
  ];
  disclaimer.forEach((line, i) => {
    doc.text(line, margin + 5, y + 17 + i * 4);
  });
  
  // Save
  const filename = `dossier-banque-${project.title?.replace(/\s+/g, '-').toLowerCase() || 'simulation'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Legacy wrapper for backward compatibility
export async function generatePrudentBankPDF(data: FullProjectData, haircuts: { rentHaircut: number; chargesMarkup: number }): Promise<void> {
  await generateBankPDF(data, {
    showPrudentScenario: true,
    haircuts: {
      rentHaircut: haircuts.rentHaircut,
      vacancyHaircut: 50,
      rateHaircut: 1,
      costsHaircut: haircuts.chargesMarkup,
    }
  });
}
