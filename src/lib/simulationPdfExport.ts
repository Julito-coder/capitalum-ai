// PDF Export for Real Estate Simulations - "Dossier Banque"

import jsPDF from 'jspdf';
import { FullProjectData } from './realEstateTypes';
import { formatCurrency } from '@/data/mockData';

export async function generateBankPDF(data: FullProjectData): Promise<void> {
  const { project, acquisition, financing, rental, operating_costs, tax_config, sale_data, results } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const addPageIfNeeded = (neededSpace: number) => {
    if (y + neededSpace > 280) {
      doc.addPage();
      y = margin;
      addWatermark();
    }
  };

  const addWatermark = () => {
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text('Simulation CAPITALUM — hypothèses modifiables', pageWidth / 2, 290, { align: 'center' });
    doc.setTextColor(0);
  };

  const addTitle = (text: string, size: number = 14) => {
    addPageIfNeeded(20);
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += size * 0.5 + 4;
    doc.setFont('helvetica', 'normal');
  };

  const addLine = (label: string, value: string, indent: number = 0) => {
    addPageIfNeeded(8);
    doc.setFontSize(10);
    doc.text(label, margin + indent, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    y += 6;
  };

  const addSeparator = () => {
    y += 2;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  // Page 1: Cover
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DOSSIER DE FINANCEMENT', pageWidth / 2, 60, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setTextColor(100, 100, 100);
  doc.text(project.title || 'Projet Immobilier', pageWidth / 2, 80, { align: 'center' });
  doc.setTextColor(0);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${project.city || ''} • ${project.surface_m2} m²`, pageWidth / 2, 95, { align: 'center' });
  doc.text(`Type: ${project.type === 'LOCATIF' ? 'Investissement Locatif' : 'Résidence Principale'}`, pageWidth / 2, 105, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 130, { align: 'center' });

  // KPIs Box
  doc.setDrawColor(0, 100, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, 150, contentWidth, 50, 3, 3);
  
  doc.setFontSize(10);
  doc.text('INDICATEURS CLÉS', margin + 5, 160);
  
  const kpis = [
    { label: 'Renta. brute', value: `${results?.gross_yield?.toFixed(2) || 0}%` },
    { label: 'Renta. nette', value: `${results?.net_yield?.toFixed(2) || 0}%` },
    { label: 'Cashflow/mois', value: formatCurrency(results?.monthly_cashflow_after_tax || 0) },
    { label: 'TRI', value: `${results?.irr?.toFixed(1) || 0}%` },
  ];

  const kpiWidth = contentWidth / 4;
  kpis.forEach((kpi, i) => {
    const x = margin + i * kpiWidth + kpiWidth / 2;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, x, 180, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, x, 190, { align: 'center' });
  });

  addWatermark();

  // Page 2: Executive Summary
  doc.addPage();
  y = margin;
  addWatermark();

  addTitle('RÉSUMÉ EXÉCUTIF', 16);
  y += 5;

  addTitle('1. Projet', 12);
  addLine('Type de bien', project.property_type === 'apartment' ? 'Appartement' : 'Maison');
  addLine('Localisation', project.city || 'Non défini');
  addLine('Surface', `${project.surface_m2} m²`);
  addLine('Nombre de pièces', `${project.rooms}`);
  addLine('Stratégie', project.strategy === 'meuble' ? 'Meublé (LMNP)' : 'Nu');
  addLine('Horizon', `${project.horizon_years} ans`);
  y += 5;

  addTitle('2. Budget d\'acquisition', 12);
  const totalCost = (acquisition.price_net_seller || 0) + 
                    (acquisition.agency_fee_amount || 0) + 
                    (acquisition.notary_fee_amount || 0) + 
                    (acquisition.works_amount || 0) +
                    (acquisition.furniture_amount || 0);
  addLine('Prix net vendeur', formatCurrency(acquisition.price_net_seller));
  addLine('Frais d\'agence', formatCurrency(acquisition.agency_fee_amount));
  addLine('Frais de notaire', formatCurrency(acquisition.notary_fee_amount));
  if (acquisition.works_amount > 0) addLine('Travaux', formatCurrency(acquisition.works_amount));
  if (acquisition.furniture_amount > 0) addLine('Mobilier', formatCurrency(acquisition.furniture_amount));
  addSeparator();
  doc.setFont('helvetica', 'bold');
  addLine('TOTAL PROJET', formatCurrency(totalCost));
  doc.setFont('helvetica', 'normal');
  y += 5;

  addTitle('3. Financement', 12);
  addLine('Apport personnel', formatCurrency(financing.down_payment));
  addLine('Montant emprunté', formatCurrency(financing.loan_amount));
  addLine('Durée', `${financing.duration_months / 12} ans (${financing.duration_months} mois)`);
  addLine('Taux nominal', `${financing.nominal_rate}%`);
  addLine('Assurance', `${financing.insurance_value}% / an`);
  addSeparator();
  doc.setFont('helvetica', 'bold');
  addLine('Mensualité totale', formatCurrency(financing.monthly_payment));
  doc.setFont('helvetica', 'normal');
  addLine('Intérêts totaux', formatCurrency(financing.total_interest));
  addLine('Assurance totale', formatCurrency(financing.total_insurance));

  // Page 3: Rental & Operating
  doc.addPage();
  y = margin;
  addWatermark();

  if (project.type === 'LOCATIF' && rental) {
    addTitle('4. Revenus locatifs', 12);
    addLine('Loyer mensuel HC', formatCurrency(rental.rent_monthly));
    addLine('Loyer annuel brut', formatCurrency(rental.rent_monthly * 12));
    addLine('Vacance locative', `${rental.vacancy_rate}%`);
    addLine('Taux d\'impayés', `${rental.default_rate}%`);
    addLine('Revalorisation', `${rental.rent_growth_rate}% / an`);
    y += 5;
  }

  addTitle('5. Charges d\'exploitation', 12);
  addLine('Taxe foncière', formatCurrency(operating_costs.property_tax_annual) + ' / an');
  addLine('Charges copro (non récup.)', formatCurrency(operating_costs.condo_nonrecoverable_annual) + ' / an');
  addLine('Assurance PNO', formatCurrency(operating_costs.insurance_annual) + ' / an');
  addLine('Gestion locative', `${operating_costs.management_pct}%`);
  addLine('Comptabilité', formatCurrency(operating_costs.accounting_annual) + ' / an');
  y += 5;

  addTitle('6. Fiscalité', 12);
  addLine('Mode', tax_config.tax_mode === 'simple' ? 'Simplifié' : 'Avancé');
  addLine('Régime', tax_config.regime_key?.replace(/_/g, ' ') || 'Micro-foncier');
  addLine('TMI', `${tax_config.tmi_rate}%`);
  addLine('Prélèvements sociaux', `${tax_config.social_rate}%`);
  addLine('Taux global', `${tax_config.tmi_rate + tax_config.social_rate}%`);
  if (tax_config.amortization_enabled) {
    addLine('Amortissements', 'Activés');
  }

  // Page 4: Results
  doc.addPage();
  y = margin;
  addWatermark();

  addTitle('7. Résultats de la simulation', 12);
  
  addTitle('Rentabilités', 11);
  addLine('Rentabilité brute', `${results?.gross_yield?.toFixed(2) || 0}%`);
  addLine('Rentabilité nette (après charges)', `${results?.net_yield?.toFixed(2) || 0}%`);
  addLine('Rentabilité nette-nette (après impôts)', `${results?.net_net_yield?.toFixed(2) || 0}%`);
  y += 5;

  addTitle('Cashflows', 11);
  addLine('Cashflow mensuel avant impôt', formatCurrency(results?.monthly_cashflow_before_tax || 0));
  addLine('Cashflow mensuel après impôt', formatCurrency(results?.monthly_cashflow_after_tax || 0));
  addLine('Effort d\'épargne mensuel', formatCurrency(results?.monthly_effort || 0));
  y += 5;

  addTitle('Indicateurs avancés', 11);
  addLine('TRI (Taux de Rentabilité Interne)', `${results?.irr?.toFixed(2) || 0}%`);
  addLine('DSCR (Ratio couverture dette)', `${results?.dscr?.toFixed(2) || 0}`);
  addLine('Patrimoine net à horizon', formatCurrency(results?.net_patrimony || 0));
  y += 5;

  addTitle('Seuils de rentabilité', 11);
  addLine('Loyer minimum (break-even)', formatCurrency(results?.break_even_rent || 0));
  addLine('Prix maximum', formatCurrency(results?.break_even_price || 0));
  addLine('Taux maximum', `${results?.break_even_rate?.toFixed(2) || 0}%`);

  // Page 5: Cashflow table
  doc.addPage();
  y = margin;
  addWatermark();

  addTitle('8. Tableau des cashflows annuels', 12);
  
  const cashflows = results?.cashflow_series || [];
  const headers = ['Année', 'Revenus', 'Charges', 'Crédit', 'Impôts', 'Net'];
  const colWidths = [20, 30, 28, 28, 25, 30];
  
  // Header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let x = margin;
  headers.forEach((h, i) => {
    doc.text(h, x, y);
    x += colWidths[i];
  });
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  cashflows.slice(0, 20).forEach((cf) => {
    addPageIfNeeded(8);
    x = margin;
    const row = [
      `An ${cf.year}`,
      formatCurrency(cf.rental_income),
      formatCurrency(cf.operating_costs),
      formatCurrency(cf.loan_payment),
      formatCurrency(cf.tax),
      formatCurrency(cf.cashflow_after_tax),
    ];
    row.forEach((cell, i) => {
      doc.text(cell, x, y);
      x += colWidths[i];
    });
    y += 5;
  });

  // Page 6: Amortization summary
  doc.addPage();
  y = margin;
  addWatermark();

  addTitle('9. Tableau d\'amortissement (résumé annuel)', 12);

  const amortTable = financing.amortization_table || [];
  const amortHeaders = ['Année', 'Capital', 'Intérêts', 'CRD fin'];
  const amortColWidths = [30, 40, 40, 45];

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  x = margin;
  amortHeaders.forEach((h, i) => {
    doc.text(h, x, y);
    x += amortColWidths[i];
  });
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  
  // Aggregate by year
  for (let year = 1; year <= Math.min(25, Math.ceil(amortTable.length / 12)); year++) {
    addPageIfNeeded(8);
    const yearRows = amortTable.filter((r: any) => r.year === year);
    if (yearRows.length === 0) continue;
    
    const principal = yearRows.reduce((s: number, r: any) => s + r.principal, 0);
    const interest = yearRows.reduce((s: number, r: any) => s + r.interest, 0);
    const crd = yearRows[yearRows.length - 1].remaining_balance;
    
    x = margin;
    const row = [
      `An ${year}`,
      formatCurrency(principal),
      formatCurrency(interest),
      formatCurrency(crd),
    ];
    row.forEach((cell, i) => {
      doc.text(cell, x, y);
      x += amortColWidths[i];
    });
    y += 5;
  }

  // Page 7: Hypotheses
  doc.addPage();
  y = margin;
  addWatermark();

  addTitle('10. Hypothèses de la simulation', 12);
  y += 5;
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  const hypotheses = [
    `• Prix d'achat: ${formatCurrency(acquisition.price_net_seller)}`,
    `• Frais de notaire estimés à ${((acquisition.notary_fee_amount / acquisition.price_net_seller) * 100).toFixed(1)}%`,
    `• Taux d'emprunt: ${financing.nominal_rate}% sur ${financing.duration_months / 12} ans`,
    `• Assurance emprunteur: ${financing.insurance_value}% du capital / an`,
    `• Vacance locative: ${rental?.vacancy_rate || 5}%`,
    `• Impayés: ${rental?.default_rate || 2}%`,
    `• Revalorisation loyers: ${rental?.rent_growth_rate || 1}% / an`,
    `• Revalorisation charges: ${operating_costs.costs_growth_rate}% / an`,
    `• Revalorisation valeur bien: ${sale_data.property_growth_rate}% / an`,
    `• Fiscalité: TMI ${tax_config.tmi_rate}% + PS ${tax_config.social_rate}%`,
    `• Horizon de détention: ${project.horizon_years} ans`,
    `• Revente à l'année ${sale_data.resale_year}`,
    `• Frais de revente: ${sale_data.resale_agency_pct}%`,
    `• Taxation plus-value: ${sale_data.capital_gain_tax_rate}%`,
  ];
  
  hypotheses.forEach(h => {
    addPageIfNeeded(6);
    doc.text(h, margin, y);
    y += 5;
  });

  y += 10;
  doc.setTextColor(150);
  doc.setFontSize(8);
  doc.text('Ces hypothèses sont indicatives et peuvent être modifiées. Les résultats ne constituent', margin, y);
  y += 4;
  doc.text('pas un conseil en investissement. Consultez un professionnel avant toute décision.', margin, y);
  doc.setTextColor(0);

  // Save
  const filename = `dossier-banque-${project.title?.replace(/\s+/g, '-').toLowerCase() || 'simulation'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Export prudent version with haircuts
export async function generatePrudentBankPDF(data: FullProjectData, haircuts: { rentHaircut: number; chargesMarkup: number }): Promise<void> {
  // Clone data and apply haircuts
  const prudentData = JSON.parse(JSON.stringify(data)) as FullProjectData;
  
  if (prudentData.rental) {
    prudentData.rental.rent_monthly = prudentData.rental.rent_monthly * (1 - haircuts.rentHaircut / 100);
  }
  
  prudentData.operating_costs.property_tax_annual *= (1 + haircuts.chargesMarkup / 100);
  prudentData.operating_costs.condo_nonrecoverable_annual *= (1 + haircuts.chargesMarkup / 100);
  
  await generateBankPDF(prudentData);
}