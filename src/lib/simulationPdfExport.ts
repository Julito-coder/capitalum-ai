// PDF Export for Real Estate Simulations - "Dossier Banque" Professional
// ELIO - Document de financement immobilier nominatif
import jsPDF from 'jspdf';
import { FullProjectData, CashflowYear, PatrimonyYear } from './realEstateTypes';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';

interface ClientInfo {
  fullName: string;
  email?: string;
  city?: string;
}

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

// Fetch client info from profile
async function fetchClientInfo(): Promise<ClientInfo> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { fullName: 'Client' };
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, address_city')
      .eq('user_id', user.id)
      .single();
    
    return {
      fullName: profile?.full_name || user.user_metadata?.full_name || 'Client',
      email: user.email,
      city: (profile as any)?.address_city || undefined,
    };
  } catch {
    return { fullName: 'Client' };
  }
}

// Helper: Draw chart with proper axes and labels
function drawChartWithAxes(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: { x: number; y: number; label?: string }[],
  options: {
    xLabel?: string;
    yLabel?: string;
    title?: string;
    lineColor: [number, number, number];
    showDots?: boolean;
    yFormatter?: (v: number) => string;
    xFormatter?: (v: number) => string;
    yTickCount?: number;
    xTickCount?: number;
    showGrid?: boolean;
    fillArea?: boolean;
    fillColor?: [number, number, number];
  }
) {
  const colors = {
    axis: [100, 116, 139] as [number, number, number],
    grid: [226, 232, 240] as [number, number, number],
    text: [71, 85, 105] as [number, number, number],
  };

  const padding = { left: 25, right: 10, top: 15, bottom: 18 };
  const chartX = x + padding.left;
  const chartY = y + padding.top;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate data bounds
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(0, Math.min(...yValues));
  const yMax = Math.max(...yValues) * 1.1;

  // Draw title
  if (options.title) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(options.title, x + width / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }

  // Draw grid
  if (options.showGrid !== false) {
    doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2]);
    doc.setLineWidth(0.2);
    
    const yTicks = options.yTickCount || 5;
    for (let i = 0; i <= yTicks; i++) {
      const tickY = chartY + chartHeight - (i / yTicks) * chartHeight;
      doc.line(chartX, tickY, chartX + chartWidth, tickY);
    }
  }

  // Draw axes
  doc.setDrawColor(colors.axis[0], colors.axis[1], colors.axis[2]);
  doc.setLineWidth(0.5);
  doc.line(chartX, chartY, chartX, chartY + chartHeight); // Y axis
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); // X axis

  // Y-axis labels
  const yTicks = options.yTickCount || 5;
  const yFormatter = options.yFormatter || ((v: number) => v.toLocaleString('fr-FR'));
  doc.setFontSize(6);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  for (let i = 0; i <= yTicks; i++) {
    const tickY = chartY + chartHeight - (i / yTicks) * chartHeight;
    const value = yMin + (i / yTicks) * (yMax - yMin);
    doc.text(yFormatter(value), chartX - 3, tickY + 1.5, { align: 'right' });
    
    // Small tick mark
    doc.line(chartX - 2, tickY, chartX, tickY);
  }

  // X-axis labels
  const xTicks = options.xTickCount || Math.min(data.length, 8);
  const xFormatter = options.xFormatter || ((v: number) => `${v}`);
  const step = Math.ceil(data.length / xTicks);
  
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      const px = chartX + ((d.x - xMin) / (xMax - xMin)) * chartWidth;
      doc.text(xFormatter(d.x), px, chartY + chartHeight + 8, { align: 'center' });
      
      // Small tick mark
      doc.line(px, chartY + chartHeight, px, chartY + chartHeight + 2);
    }
  });

  // Draw axis labels
  if (options.xLabel) {
    doc.setFontSize(7);
    doc.text(options.xLabel, chartX + chartWidth / 2, chartY + chartHeight + 15, { align: 'center' });
  }
  
  if (options.yLabel) {
    doc.setFontSize(7);
    doc.text(options.yLabel, x + 5, chartY + chartHeight / 2, { angle: 90 });
  }

  // Draw area fill if requested
  if (options.fillArea && options.fillColor && data.length > 1) {
    const points: { x: number; y: number }[] = [];
    data.forEach(d => {
      const px = chartX + ((d.x - xMin) / (xMax - xMin)) * chartWidth;
      const py = chartY + chartHeight - ((d.y - yMin) / (yMax - yMin)) * chartHeight;
      points.push({ x: px, y: py });
    });
    
    // Simple area fill using multiple small rectangles
    doc.setFillColor(options.fillColor[0], options.fillColor[1], options.fillColor[2]);
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = points[i].x;
      const y1 = points[i].y;
      const x2 = points[i + 1].x;
      const y2 = points[i + 1].y;
      const baseY = chartY + chartHeight;
      
      // Draw trapezoid as triangle approximations
      doc.triangle(x1, y1, x2, y2, x1, baseY, 'F');
      doc.triangle(x2, y2, x2, baseY, x1, baseY, 'F');
    }
  }

  // Draw line
  doc.setDrawColor(options.lineColor[0], options.lineColor[1], options.lineColor[2]);
  doc.setLineWidth(1.2);

  let prevPx: number | null = null;
  let prevPy: number | null = null;

  data.forEach((d) => {
    const px = chartX + ((d.x - xMin) / (xMax - xMin)) * chartWidth;
    const py = chartY + chartHeight - ((d.y - yMin) / (yMax - yMin)) * chartHeight;
    
    if (prevPx !== null && prevPy !== null) {
      doc.line(prevPx, prevPy, px, py);
    }
    
    prevPx = px;
    prevPy = py;
  });

  // Draw dots
  if (options.showDots !== false) {
    doc.setFillColor(options.lineColor[0], options.lineColor[1], options.lineColor[2]);
    data.forEach((d) => {
      const px = chartX + ((d.x - xMin) / (xMax - xMin)) * chartWidth;
      const py = chartY + chartHeight - ((d.y - yMin) / (yMax - yMin)) * chartHeight;
      doc.circle(px, py, 1.5, 'F');
    });
  }
}

// Helper: Draw bar chart with axes
function drawBarChartWithAxes(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  options: {
    title?: string;
    yLabel?: string;
    yFormatter?: (v: number) => string;
    horizontal?: boolean;
    showValues?: boolean;
  }
) {
  const colors = {
    axis: [100, 116, 139] as [number, number, number],
    grid: [226, 232, 240] as [number, number, number],
    text: [71, 85, 105] as [number, number, number],
  };

  const padding = { left: options.horizontal ? 50 : 25, right: 15, top: 15, bottom: 20 };
  const chartX = x + padding.left;
  const chartY = y + padding.top;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value)) * 1.15;
  const yFormatter = options.yFormatter || ((v: number) => v.toLocaleString('fr-FR'));

  // Draw title
  if (options.title) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(options.title, x + width / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }

  if (options.horizontal) {
    // Horizontal bar chart
    const barHeight = (chartHeight - (data.length - 1) * 3) / data.length;
    
    // Draw grid
    doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2]);
    doc.setLineWidth(0.2);
    for (let i = 0; i <= 5; i++) {
      const tickX = chartX + (i / 5) * chartWidth;
      doc.line(tickX, chartY, tickX, chartY + chartHeight);
    }

    // X-axis labels (values)
    doc.setFontSize(6);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    for (let i = 0; i <= 5; i++) {
      const tickX = chartX + (i / 5) * chartWidth;
      const value = (i / 5) * maxValue;
      doc.text(yFormatter(value), tickX, chartY + chartHeight + 8, { align: 'center' });
    }

    // Draw bars
    data.forEach((d, i) => {
      const barY = chartY + i * (barHeight + 3);
      const barWidth = (d.value / maxValue) * chartWidth;
      
      doc.setFillColor(d.color[0], d.color[1], d.color[2]);
      doc.roundedRect(chartX, barY, barWidth, barHeight, 2, 2, 'F');
      
      // Label on left
      doc.setFontSize(7);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.text(d.label, chartX - 3, barY + barHeight / 2 + 1.5, { align: 'right' });
      
      // Value on right of bar
      if (options.showValues !== false) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(yFormatter(d.value), chartX + barWidth + 3, barY + barHeight / 2 + 1.5);
        doc.setFont('helvetica', 'normal');
      }
    });
  } else {
    // Vertical bar chart
    const barWidth = (chartWidth - (data.length - 1) * 3) / data.length;
    
    // Draw axes
    doc.setDrawColor(colors.axis[0], colors.axis[1], colors.axis[2]);
    doc.setLineWidth(0.5);
    doc.line(chartX, chartY, chartX, chartY + chartHeight);
    doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);

    // Y-axis labels
    doc.setFontSize(6);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    for (let i = 0; i <= 5; i++) {
      const tickY = chartY + chartHeight - (i / 5) * chartHeight;
      const value = (i / 5) * maxValue;
      doc.text(yFormatter(value), chartX - 3, tickY + 1.5, { align: 'right' });
      
      // Grid line
      doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2]);
      doc.setLineWidth(0.2);
      doc.line(chartX, tickY, chartX + chartWidth, tickY);
    }

    // Draw bars
    data.forEach((d, i) => {
      const barX = chartX + i * (barWidth + 3);
      const barH = (d.value / maxValue) * chartHeight;
      
      doc.setFillColor(d.color[0], d.color[1], d.color[2]);
      doc.roundedRect(barX, chartY + chartHeight - barH, barWidth, barH, 2, 2, 'F');
      
      // Label below
      doc.setFontSize(6);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.text(d.label, barX + barWidth / 2, chartY + chartHeight + 8, { align: 'center' });
    });
  }
}

export async function generateBankPDF(data: FullProjectData, config: PDFConfig = defaultConfig): Promise<void> {
  const { project, acquisition, financing, rental, operating_costs, tax_config, sale_data, results } = data;
  
  // Fetch client info
  const clientInfo = await fetchClientInfo();
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;
  let totalPages = 10;
  let currentPage = 1;

  // Colors (RGB tuples)
  const colors = {
    primary: [59, 130, 246] as [number, number, number],
    success: [34, 197, 94] as [number, number, number],
    warning: [234, 179, 8] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    muted: [148, 163, 184] as [number, number, number],
    dark: [30, 41, 59] as [number, number, number],
    light: [248, 250, 252] as [number, number, number],
  };

  // Helper functions
  const addHeader = () => {
    doc.setFontSize(7);
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(`Dossier de financement — ${clientInfo.fullName}`, margin, 10);
    doc.text(`ELIO`, pageWidth - margin, 10, { align: 'right' });
  };

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(`Page ${currentPage} / ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  const newPage = () => {
    doc.addPage();
    currentPage++;
    y = margin + 5;
    addHeader();
    addFooter();
  };

  const addSectionTitle = (text: string) => {
    y += 8;
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(text, margin + 5, y + 7);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    y += 16;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(text, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    y += 6;
  };

  const addLine = (label: string, value: string, indent: number = 0, bold: boolean = false) => {
    doc.setFontSize(8);
    if (bold) doc.setFont('helvetica', 'bold');
    doc.text(label, margin + indent, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    if (bold) doc.setFont('helvetica', 'normal');
    y += 5;
  };

  const addSeparator = () => {
    y += 2;
    doc.setDrawColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  // Calculate metrics
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
  const totalCharges = (operating_costs.property_tax_annual || 0) + 
                       (operating_costs.condo_nonrecoverable_annual || 0) + 
                       (operating_costs.insurance_annual || 0) + 
                       (operating_costs.accounting_annual || 0);

  // Prudent scenario
  const prudentRent = (rental?.rent_monthly || 0) * (1 - config.haircuts.rentHaircut / 100);
  const prudentVacancy = Math.min(100, effectiveVacancy * (1 + config.haircuts.vacancyHaircut / 100));
  const prudentRate = financing.nominal_rate + config.haircuts.rateHaircut;
  const prudentMonthlyPayment = financing.loan_amount * (prudentRate / 100 / 12) * Math.pow(1 + prudentRate / 100 / 12, financing.duration_months) / (Math.pow(1 + prudentRate / 100 / 12, financing.duration_months) - 1);
  const prudentCosts = totalCharges * (1 + config.haircuts.costsHaircut / 100);
  const prudentNOI = prudentRent * 12 * (1 - prudentVacancy / 100) - prudentCosts;
  const prudentDSCR = prudentNOI / (prudentMonthlyPayment * 12);
  const prudentCashflow = (prudentNOI - prudentMonthlyPayment * 12) / 12;

  // ============================================
  // PAGE 1: COVER PAGE
  // ============================================
  
  // Blue header band
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 55, 'F');
  
  // Logo/Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ELIO', pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('DOSSIER DE FINANCEMENT IMMOBILIER', pageWidth / 2, 35, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text('Simulation patrimoniale et financiere', pageWidth / 2, 47, { align: 'center' });
  
  // Client info box
  y = 70;
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Dossier presente par', margin + 5, y + 10);
  doc.setFontSize(14);
  doc.text(clientInfo.fullName, margin + 5, y + 22);
  if (clientInfo.email) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(clientInfo.email, pageWidth - margin - 5, y + 22, { align: 'right' });
  }
  
  // Project info
  y = 115;
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 55, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('PROJET', margin + 5, y + 10);
  
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFontSize(12);
  doc.text(project.title || 'Projet Immobilier', margin + 5, y + 22);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const projectType = project.type === 'LOCATIF' 
    ? (project.strategy === 'meuble' ? 'Investissement locatif meuble' : 'Investissement locatif nu')
    : 'Residence principale';
  doc.text(projectType, margin + 5, y + 32);
  
  doc.text(`${project.city || 'Ville'} (${project.postal_code || ''})`, margin + 5, y + 42);
  
  // Right side details
  const rightX = margin + contentWidth / 2;
  doc.text(`${project.surface_m2} m2 — ${project.rooms} pieces`, rightX, y + 22);
  doc.text(project.property_type === 'apartment' ? 'Appartement' : 'Maison', rightX, y + 32);
  if (project.dpe) doc.text(`DPE : ${project.dpe}`, rightX, y + 42);
  
  // Generation date
  y = 185;
  doc.setFontSize(9);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text(`Document genere le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, y, { align: 'center' });
  doc.text('via ELIO — Simulateur patrimonial', pageWidth / 2, y + 6, { align: 'center' });
  
  addFooter();

  // ============================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ============================================
  newPage();
  
  addSectionTitle('RESUME EXECUTIF');
  
  // Key metrics grid
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 50, 2, 2, 'F');
  
  const metrics = [
    { label: 'Prix total projet', value: formatCurrency(totalCost) },
    { label: 'Apport personnel', value: `${formatCurrency(financing.down_payment)} (${((financing.down_payment / totalCost) * 100).toFixed(0)}%)` },
    { label: 'Montant finance', value: formatCurrency(financing.loan_amount) },
    { label: 'Duree et taux', value: `${financing.duration_months / 12} ans a ${financing.nominal_rate}%` },
    { label: 'Mensualite (assurance incluse)', value: formatCurrency(financing.monthly_payment) },
    { label: 'Loyer attendu', value: formatCurrency(rental?.rent_monthly || 0) + '/mois' },
    { label: 'Cashflow mensuel net', value: formatCurrency(results?.monthly_cashflow_after_tax || 0) },
    { label: 'DSCR', value: (results?.dscr || 0).toFixed(2) },
    { label: 'TRI', value: `${(results?.irr || 0).toFixed(1)}%` },
    { label: 'Patrimoine net a terme', value: formatCurrency(results?.net_patrimony || 0) },
  ];
  
  const col1X = margin + 5;
  const col2X = margin + contentWidth / 2 + 5;
  let lineY = y + 8;
  
  metrics.forEach((m, i) => {
    const x = i % 2 === 0 ? col1X : col2X;
    if (i > 0 && i % 2 === 0) lineY += 9;
    
    doc.setFontSize(7);
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(m.label, x, lineY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(m.value, x, lineY + 5);
    doc.setFont('helvetica', 'normal');
  });
  
  y += 60;
  
  // Lecture bancaire badge
  const isViable = (results?.dscr || 0) >= 1.2 && (results?.monthly_cashflow_after_tax || 0) >= -200;
  const statusText = isViable ? 'PROJET EQUILIBRE' : (results?.dscr || 0) >= 1 ? 'PROJET A SURVEILLER' : 'PROJET SOUS CONTRAINTE';
  const statusColor = isViable ? colors.success : (results?.dscr || 0) >= 1 ? colors.warning : colors.danger;
  
  doc.setFillColor(isViable ? 220 : 254, isViable ? 252 : (results?.dscr || 0) >= 1 ? 249 : 226, isViable ? 231 : 195);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'S');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(statusText, pageWidth / 2, y + 11, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  
  y += 28;
  
  // Note explicative
  doc.setFontSize(7);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text('Cette appreciation repose sur des indicateurs de confort (DSCR, cashflow) et ne constitue pas un engagement de financement.', margin, y);

  // ============================================
  // PAGE 3: ACQUISITION & BUDGET
  // ============================================
  newPage();
  
  addSectionTitle('ACQUISITION ET BUDGET GLOBAL');
  
  addLine('Prix net vendeur', formatCurrency(acquisition.price_net_seller), 0, true);
  addLine('Frais d\'agence', formatCurrency(acquisition.agency_fee_amount), 5);
  addLine('Frais de notaire', formatCurrency(acquisition.notary_fee_amount) + (acquisition.notary_fee_estimated ? ' (estimes)' : ''), 5);
  if (acquisition.works_amount > 0) addLine('Travaux', formatCurrency(acquisition.works_amount), 5);
  if (acquisition.furniture_amount > 0) addLine('Mobilier', formatCurrency(acquisition.furniture_amount), 5);
  addLine('Frais bancaires', formatCurrency(acquisition.bank_fees || 0), 5);
  addLine('Frais de garantie', formatCurrency(acquisition.guarantee_fees || 0), 5);
  addSeparator();
  addLine('TOTAL PROJET', formatCurrency(totalCost), 0, true);
  
  y += 15;
  
  // Répartition visuelle
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'F');
  
  const priceRatio = acquisition.price_net_seller / totalCost;
  const feesRatio = (acquisition.agency_fee_amount + acquisition.notary_fee_amount) / totalCost;
  
  // Bar
  const barY = y + 10;
  const barHeight = 8;
  let barX = margin + 5;
  const barWidth = contentWidth - 10;
  
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(barX, barY, barWidth * priceRatio, barHeight, 0, 0, 'F');
  
  doc.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.rect(barX + barWidth * priceRatio, barY, barWidth * feesRatio, barHeight, 'F');
  
  doc.setFillColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.roundedRect(barX + barWidth * (priceRatio + feesRatio), barY, barWidth * (1 - priceRatio - feesRatio), barHeight, 0, 0, 'F');
  
  y += 30;
  
  // Legend
  doc.setFontSize(7);
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin + 5, y, 8, 4, 'F');
  doc.text(`Prix (${(priceRatio * 100).toFixed(0)}%)`, margin + 16, y + 3);
  
  doc.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.rect(margin + 55, y, 8, 4, 'F');
  doc.text(`Frais (${(feesRatio * 100).toFixed(0)}%)`, margin + 66, y + 3);
  
  doc.setFillColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.rect(margin + 105, y, 8, 4, 'F');
  doc.text('Autres', margin + 116, y + 3);

  // ============================================
  // PAGE 4: FINANCING & DEBT WITH IMPROVED CHART
  // ============================================
  newPage();
  
  addSectionTitle('FINANCEMENT ET DETTE');
  
  addSubtitle('Structure de financement');
  addLine('Apport personnel', formatCurrency(financing.down_payment), 0, true);
  addLine('Affectation de l\'apport', financing.down_payment_allocation === 'fees' ? 'Frais annexes' : 'Capital', 5);
  addLine('Montant emprunte', formatCurrency(financing.loan_amount), 0, true);
  addLine('Duree', `${financing.duration_months} mois (${financing.duration_months / 12} ans)`, 5);
  addLine('Taux nominal', `${financing.nominal_rate}%`, 5);
  addLine('Assurance emprunteur', `${financing.insurance_value}% du capital/an`, 5);
  if (financing.deferment_months > 0) {
    addLine('Differe', `${financing.deferment_months} mois (${financing.deferment_type})`, 5);
  }
  addSeparator();
  addLine('Mensualite totale', formatCurrency(financing.monthly_payment), 0, true);
  
  y += 10;
  addSubtitle('Cout total du credit');
  addLine('Total des interets', formatCurrency(financing.total_interest), 5);
  addLine('Total assurance', formatCurrency(financing.total_insurance), 5);
  addLine('Cout global credit', formatCurrency(financing.total_interest + financing.total_insurance), 0, true);
  
  y += 12;
  
  // Amortization chart with proper axes
  const amortTable = financing.amortization_table || [];
  const amortData: { x: number; y: number }[] = [];
  
  for (let yr = 1; yr <= financing.duration_months / 12; yr++) {
    const monthData = amortTable.find(r => r.year === yr && r.month === yr * 12);
    const crd = monthData?.remaining_balance || financing.loan_amount * (1 - yr / (financing.duration_months / 12));
    amortData.push({ x: yr, y: crd });
  }
  
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 60, 2, 2, 'F');
  
  drawChartWithAxes(doc, margin, y, contentWidth, 60, amortData, {
    title: 'Evolution du capital restant du (CRD)',
    xLabel: 'Annees',
    lineColor: colors.primary,
    showDots: true,
    yFormatter: (v) => `${(v / 1000).toFixed(0)}k€`,
    xFormatter: (v) => `${v}`,
    yTickCount: 4,
    xTickCount: 6,
    fillArea: true,
    fillColor: [59, 130, 246, 0.2] as unknown as [number, number, number],
  });

  // ============================================
  // PAGE 5: EXPLOITATION WITH CASHFLOW CHART
  // ============================================
  newPage();
  
  addSectionTitle('EXPLOITATION LOCATIVE');
  
  addSubtitle('Revenus locatifs');
  addLine('Loyer mensuel HC', formatCurrency(rental?.rent_monthly || 0), 0, true);
  addLine('Loyer annuel brut', formatCurrency(annualRent), 5);
  addLine('Vacance locative', `${rental?.vacancy_rate || 5}%`, 5);
  addLine('Taux d\'impayes', `${rental?.default_rate || 2}%`, 5);
  addLine('Revalorisation annuelle', `${rental?.rent_growth_rate || 1}%`, 5);
  addSeparator();
  addLine('Revenu effectif annuel', formatCurrency(effectiveRent), 0, true);
  
  y += 8;
  addSubtitle('Charges d\'exploitation');
  addLine('Taxe fonciere', formatCurrency(operating_costs.property_tax_annual) + '/an', 5);
  addLine('Charges copro (non recup.)', formatCurrency(operating_costs.condo_nonrecoverable_annual) + '/an', 5);
  addLine('Assurance PNO', formatCurrency(operating_costs.insurance_annual) + '/an', 5);
  addLine('Comptabilite', formatCurrency(operating_costs.accounting_annual) + '/an', 5);
  if (operating_costs.management_pct > 0) addLine('Gestion locative', `${operating_costs.management_pct}%`, 5);
  addSeparator();
  addLine('Total charges annuelles', formatCurrency(totalCharges), 0, true);
  
  y += 8;
  
  // Cashflow chart
  const cashflowData = (results?.cashflow_series || []).map(cf => ({
    x: cf.year,
    y: cf.cashflow_after_tax
  }));
  
  if (cashflowData.length > 0) {
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(margin, y, contentWidth, 55, 2, 2, 'F');
    
    drawChartWithAxes(doc, margin, y, contentWidth, 55, cashflowData, {
      title: 'Cashflow annuel apres impots',
      xLabel: 'Annees',
      lineColor: cashflowData[0].y >= 0 ? colors.success : colors.danger,
      showDots: true,
      yFormatter: (v) => `${(v / 1000).toFixed(1)}k€`,
      xFormatter: (v) => `${v}`,
      yTickCount: 4,
      xTickCount: 6,
    });
    y += 60;
  }

  // ============================================
  // PAGE 6: PERFORMANCE KPIs WITH YIELD CHART
  // ============================================
  newPage();
  
  addSectionTitle('INDICATEURS DE PERFORMANCE');
  
  // KPI Cards
  const kpis = [
    { label: 'Rentabilite brute', value: `${(results?.gross_yield || 0).toFixed(2)}%`, desc: 'Loyer annuel / Cout total', color: colors.primary },
    { label: 'Rentabilite nette', value: `${(results?.net_yield || 0).toFixed(2)}%`, desc: 'Apres charges, avant impots', color: colors.success },
    { label: 'Rentabilite nette-nette', value: `${(results?.net_net_yield || 0).toFixed(2)}%`, desc: 'Apres charges et impots', color: colors.warning },
    { label: 'DSCR', value: `${(results?.dscr || 0).toFixed(2)}`, desc: 'NOI / Service dette (seuil 1.20)', color: colors.primary },
    { label: 'TRI (IRR)', value: `${(results?.irr || 0).toFixed(1)}%`, desc: 'Performance globale', color: colors.success },
    { label: 'Loyer seuil', value: formatCurrency(results?.break_even_rent || 0), desc: 'Break-even mensuel', color: colors.warning },
  ];
  
  const cardWidth = (contentWidth - 10) / 3;
  const cardHeight = 28;
  
  kpis.forEach((kpi, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const kx = margin + col * (cardWidth + 5);
    const cardY = y + row * (cardHeight + 8);
    
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(kx, cardY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(kx, cardY, cardWidth, cardHeight, 2, 2, 'S');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(kpi.value, kx + cardWidth / 2, cardY + 10, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, kx + cardWidth / 2, cardY + 17, { align: 'center' });
    
    doc.setFontSize(6);
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(kpi.desc, kx + cardWidth / 2, cardY + 23, { align: 'center' });
  });
  
  y += 80;
  
  // Yield comparison bar chart with axes
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 60, 2, 2, 'F');
  
  const yieldData = [
    { label: 'Brute', value: results?.gross_yield || 0, color: colors.primary },
    { label: 'Nette', value: results?.net_yield || 0, color: colors.success },
    { label: 'Nette-nette', value: results?.net_net_yield || 0, color: colors.warning },
  ];
  
  drawBarChartWithAxes(doc, margin, y, contentWidth, 60, yieldData, {
    title: 'Comparaison des rentabilites',
    horizontal: true,
    yFormatter: (v) => `${v.toFixed(2)}%`,
    showValues: true,
  });

  // ============================================
  // PAGE 7: SCENARIO PRUDENT WITH COMPARISON CHART
  // ============================================
  newPage();
  
  addSectionTitle('SCENARIO PRUDENT (BANQUE)');
  
  doc.setFontSize(8);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text('Ce scenario applique des hypotheses conservatrices pour evaluer la resilience du projet.', margin, y);
  y += 8;
  
  // Haircuts applied
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Hypotheses de stress appliquees :', margin + 5, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Loyer -${config.haircuts.rentHaircut}%  |  Vacance +${config.haircuts.vacancyHaircut}%  |  Taux +${config.haircuts.rateHaircut} pts  |  Charges +${config.haircuts.costsHaircut}%`, margin + 5, y + 14);
  y += 25;
  
  // Comparison table
  addSubtitle('Comparaison Base vs Prudent');
  
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 45, 2, 2, 'F');
  
  // Headers
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicateur', margin + 5, y + 8);
  doc.text('Base', margin + 70, y + 8);
  doc.text('Prudent', margin + 110, y + 8);
  doc.text('Variation', margin + 150, y + 8);
  doc.setFont('helvetica', 'normal');
  
  const comparisons = [
    { 
      label: 'Loyer mensuel', 
      base: formatCurrency(rental?.rent_monthly || 0), 
      prudent: formatCurrency(prudentRent), 
      variation: `-${config.haircuts.rentHaircut}%` 
    },
    { 
      label: 'Mensualite credit', 
      base: formatCurrency(financing.monthly_payment), 
      prudent: formatCurrency(prudentMonthlyPayment), 
      variation: `+${((prudentMonthlyPayment / financing.monthly_payment - 1) * 100).toFixed(0)}%` 
    },
    { 
      label: 'DSCR', 
      base: (results?.dscr || 0).toFixed(2), 
      prudent: prudentDSCR.toFixed(2), 
      variation: `${((prudentDSCR / (results?.dscr || 1) - 1) * 100).toFixed(0)}%` 
    },
    { 
      label: 'Cashflow/mois', 
      base: formatCurrency(results?.monthly_cashflow_after_tax || 0), 
      prudent: formatCurrency(prudentCashflow), 
      variation: formatCurrency(prudentCashflow - (results?.monthly_cashflow_after_tax || 0)) 
    },
  ];
  
  comparisons.forEach((comp, i) => {
    const rowY = y + 16 + i * 7;
    doc.text(comp.label, margin + 5, rowY);
    doc.text(comp.base, margin + 70, rowY);
    doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
    doc.text(comp.prudent, margin + 110, rowY);
    doc.setTextColor(colors.danger[0], colors.danger[1], colors.danger[2]);
    doc.text(comp.variation, margin + 150, rowY);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  });
  
  y += 55;
  
  // Base vs Prudent DSCR chart
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 50, 2, 2, 'F');
  
  const dscrCompareData = [
    { label: 'DSCR Base', value: results?.dscr || 0, color: colors.primary },
    { label: 'DSCR Prudent', value: prudentDSCR, color: colors.warning },
    { label: 'Seuil Bancaire', value: 1.2, color: colors.muted },
  ];
  
  drawBarChartWithAxes(doc, margin, y, contentWidth, 50, dscrCompareData, {
    title: 'Comparaison DSCR Base vs Prudent',
    horizontal: true,
    yFormatter: (v) => v.toFixed(2),
    showValues: true,
  });
  
  y += 55;
  
  // Verdict
  const prudentViable = prudentDSCR >= 1.0 && prudentCashflow >= -500;
  doc.setFillColor(prudentViable ? 220 : 254, prudentViable ? 252 : 226, prudentViable ? 231 : 226);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const prudentColor = prudentViable ? colors.success : colors.danger;
  doc.setTextColor(prudentColor[0], prudentColor[1], prudentColor[2]);
  doc.text(
    prudentViable 
      ? 'Le projet reste viable dans le scenario prudent — Marge de securite suffisante'
      : 'Attention : Le scenario prudent montre une fragilite — Negocier le prix ou augmenter l\'apport',
    pageWidth / 2, y + 10, { align: 'center' }
  );

  // ============================================
  // PAGE 8: PATRIMOINE & EXIT WITH IMPROVED CHART
  // ============================================
  newPage();
  
  addSectionTitle('PATRIMOINE ET SORTIE');
  
  const patrimony = results?.patrimony_series || [];
  const lastPatrimony = patrimony[patrimony.length - 1];
  
  addSubtitle('Evolution du patrimoine');
  
  // Summary cards
  const patCards = [
    { label: 'Valeur bien a terme', value: formatCurrency(lastPatrimony?.property_value || 0) },
    { label: 'Dette restante', value: formatCurrency(lastPatrimony?.remaining_debt || 0) },
    { label: 'Cashflows cumules', value: formatCurrency(lastPatrimony?.cumulative_cashflow || 0) },
    { label: 'Patrimoine net', value: formatCurrency(lastPatrimony?.net_patrimony || 0) },
  ];
  
  const patCardWidth = (contentWidth - 15) / 4;
  patCards.forEach((card, i) => {
    const px = margin + i * (patCardWidth + 5);
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(px, y, patCardWidth, 22, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(card.value, px + patCardWidth / 2, y + 9, { align: 'center' });
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(card.label, px + patCardWidth / 2, y + 17, { align: 'center' });
  });
  
  y += 28;
  
  // Patrimony chart with proper axes
  if (patrimony.length > 0) {
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(margin, y, contentWidth, 65, 2, 2, 'F');
    
    const patData = patrimony.map(p => ({ x: p.year, y: p.net_patrimony }));
    const propData = patrimony.map(p => ({ x: p.year, y: p.property_value }));
    const debtData = patrimony.map(p => ({ x: p.year, y: p.remaining_debt }));
    
    // Draw multiple series
    const padding = { left: 30, right: 15, top: 15, bottom: 20 };
    const chartX = margin + padding.left;
    const chartY = y + padding.top;
    const chartWidth = contentWidth - padding.left - padding.right;
    const chartHeight = 65 - padding.top - padding.bottom;
    
    const allValues = [...patData.map(d => d.y), ...propData.map(d => d.y), ...debtData.map(d => d.y)];
    const yMax = Math.max(...allValues) * 1.1;
    const yMin = Math.min(0, Math.min(...allValues));
    const xMin = Math.min(...patData.map(d => d.x));
    const xMax = Math.max(...patData.map(d => d.x));
    
    // Title
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Evolution : Valeur, Dette et Patrimoine net', margin + contentWidth / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    
    // Grid
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    for (let i = 0; i <= 4; i++) {
      const tickY = chartY + chartHeight - (i / 4) * chartHeight;
      doc.line(chartX, tickY, chartX + chartWidth, tickY);
    }
    
    // Axes
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.5);
    doc.line(chartX, chartY, chartX, chartY + chartHeight);
    doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);
    
    // Y labels
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    for (let i = 0; i <= 4; i++) {
      const tickY = chartY + chartHeight - (i / 4) * chartHeight;
      const value = yMin + (i / 4) * (yMax - yMin);
      doc.text(`${(value / 1000).toFixed(0)}k€`, chartX - 3, tickY + 1.5, { align: 'right' });
    }
    
    // X labels
    const step = Math.ceil(patData.length / 6);
    patData.forEach((d, i) => {
      if (i % step === 0 || i === patData.length - 1) {
        const px = chartX + ((d.x - xMin) / (xMax - xMin)) * chartWidth;
        doc.text(`${d.x}`, px, chartY + chartHeight + 7, { align: 'center' });
      }
    });
    
    // Draw property value line (dashed)
    doc.setDrawColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setLineWidth(0.8);
    doc.setLineDashPattern([2, 2], 0);
    let prevX: number | null = null;
    let prevY: number | null = null;
    propData.forEach((d) => {
      const px = chartX + ((d.x - xMin) / (xMax - xMin)) * chartWidth;
      const py = chartY + chartHeight - ((d.y - yMin) / (yMax - yMin)) * chartHeight;
      if (prevX !== null && prevY !== null) doc.line(prevX, prevY, px, py);
      prevX = px;
      prevY = py;
    });
    
    // Draw debt line
    doc.setDrawColor(colors.danger[0], colors.danger[1], colors.danger[2]);
    doc.setLineDashPattern([], 0);
    prevX = null;
    prevY = null;
    debtData.forEach((d) => {
      const px = chartX + ((d.x - xMin) / (xMax - xMin)) * chartWidth;
      const py = chartY + chartHeight - ((d.y - yMin) / (yMax - yMin)) * chartHeight;
      if (prevX !== null && prevY !== null) doc.line(prevX, prevY, px, py);
      prevX = px;
      prevY = py;
    });
    
    // Draw patrimony line (bold)
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(1.5);
    prevX = null;
    prevY = null;
    patData.forEach((d) => {
      const px = chartX + ((d.x - xMin) / (xMax - xMin)) * chartWidth;
      const py = chartY + chartHeight - ((d.y - yMin) / (yMax - yMin)) * chartHeight;
      if (prevX !== null && prevY !== null) doc.line(prevX, prevY, px, py);
      prevX = px;
      prevY = py;
    });
    
    // Legend
    const legendY = y + 65 - 8;
    doc.setFontSize(6);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(1.5);
    doc.line(margin + 35, legendY, margin + 45, legendY);
    doc.text('Patrimoine net', margin + 48, legendY + 1);
    
    doc.setDrawColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setLineWidth(0.8);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin + 95, legendY, margin + 105, legendY);
    doc.text('Valeur bien', margin + 108, legendY + 1);
    doc.setLineDashPattern([], 0);
    
    doc.setDrawColor(colors.danger[0], colors.danger[1], colors.danger[2]);
    doc.setLineWidth(0.8);
    doc.line(margin + 145, legendY, margin + 155, legendY);
    doc.text('Dette', margin + 158, legendY + 1);
    
    y += 70;
  }

  // ============================================
  // PAGE 9: HYPOTHESES
  // ============================================
  newPage();
  
  addSectionTitle('HYPOTHESES ET METHODOLOGIE');
  
  const hypotheses = [
    { cat: 'Acquisition', items: [
      `Prix d'achat net vendeur : ${formatCurrency(acquisition.price_net_seller)}`,
      `Frais de notaire : ${((acquisition.notary_fee_amount / acquisition.price_net_seller) * 100).toFixed(1)}% ${acquisition.notary_fee_estimated ? '(estimation)' : '(reel)'}`,
      acquisition.works_amount > 0 ? `Travaux prevus : ${formatCurrency(acquisition.works_amount)}` : null,
    ].filter(Boolean) },
    { cat: 'Financement', items: [
      `Emprunt : ${formatCurrency(financing.loan_amount)} sur ${financing.duration_months / 12} ans`,
      `Taux nominal : ${financing.nominal_rate}% (fixe)`,
      `Assurance : ${financing.insurance_value}% du capital/an`,
    ] },
    { cat: 'Revenus', items: [
      `Loyer mensuel : ${formatCurrency(rental?.rent_monthly || 0)}`,
      `Revalorisation annuelle : ${rental?.rent_growth_rate || 1}%`,
      `Vacance locative : ${rental?.vacancy_rate || 5}%`,
      `Taux d'impayes : ${rental?.default_rate || 2}%`,
    ] },
    { cat: 'Charges', items: [
      `Taxe fonciere : ${formatCurrency(operating_costs.property_tax_annual)}/an`,
      `Charges copro : ${formatCurrency(operating_costs.condo_nonrecoverable_annual)}/an`,
      `Revalorisation charges : ${operating_costs.costs_growth_rate || 2}%/an`,
    ] },
    { cat: 'Fiscalite', items: [
      `Regime : ${tax_config.regime_key?.replace(/_/g, ' ') || 'Non defini'}`,
      `TMI : ${tax_config.tmi_rate}%`,
      `Prelevements sociaux : ${tax_config.social_rate}%`,
      tax_config.amortization_enabled ? 'Amortissements actives' : null,
    ].filter(Boolean) },
    { cat: 'Revente', items: [
      `Horizon : ${sale_data.resale_year} ans`,
      `Croissance valeur : ${sale_data.property_growth_rate}%/an`,
      `Taxation plus-value : ${sale_data.capital_gain_tax_rate}%`,
    ] },
  ];
  
  hypotheses.forEach(section => {
    addSubtitle(section.cat);
    section.items.forEach(item => {
      if (item) {
        doc.setFontSize(8);
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        doc.text(`• ${item}`, margin + 5, y);
        y += 5;
      }
    });
    y += 3;
  });

  // ============================================
  // PAGE 10: DISCLAIMER
  // ============================================
  newPage();
  
  addSectionTitle('AVERTISSEMENT PROFESSIONNEL');
  
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 80, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  
  const disclaimers = [
    'Ce document est une simulation financiere reposant sur des hypotheses fournies par l\'utilisateur.',
    '',
    'Il ne constitue ni une offre de credit, ni un engagement de financement de la part d\'un',
    'etablissement bancaire ou de ELIO.',
    '',
    'Les projections financieres sont fondees sur des hypotheses susceptibles d\'evoluer en fonction',
    'des conditions de marche, des taux d\'interet, de la fiscalite et d\'autres facteurs economiques.',
    '',
    'Les performances passees ou simulees ne prejugent pas des performances futures.',
    '',
    'Avant toute decision d\'investissement, il est recommande de consulter un conseiller en gestion',
    'de patrimoine ou un professionnel du financement immobilier.',
    '',
    'ELIO decline toute responsabilite quant aux decisions prises sur la base de ce document.',
  ];
  
  let disclaimerY = y + 10;
  disclaimers.forEach(line => {
    doc.text(line, margin + 10, disclaimerY);
    disclaimerY += 5;
  });
  
  y += 95;
  
  // Signature block
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 35, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text('Document genere automatiquement via la plateforme ELIO', margin + 10, y + 10);
  doc.text(`Date : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin + 10, y + 18);
  doc.text(`Client : ${clientInfo.fullName}`, margin + 10, y + 26);
  
  // Final save
  const filename = `dossier-banque-${clientInfo.fullName.replace(/\s+/g, '-').toLowerCase()}-${project.title?.replace(/\s+/g, '-').toLowerCase() || 'projet'}-${new Date().toISOString().split('T')[0]}.pdf`;
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
