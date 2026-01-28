// PDF Export for Résidence Principale (RP) - "Dossier de Financement RP"
// CAPITALUM - Document de financement nominatif centré sur la solvabilité du ménage
import jsPDF from 'jspdf';
import { FullProjectData, OperatingCosts } from './realEstateTypes';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { 
  HouseholdData as RPHouseholdData, 
  HouseholdMember as RPHouseholdMember,
  calculateRPMetrics 
} from './rpCalculations';

interface ClientInfo {
  fullName: string;
  email?: string;
  city?: string;
  birthYear?: number;
  professionalStatus?: string;
  contractType?: string;
  netMonthlySalary?: number;
}

// Legacy interfaces for backward compatibility with PDF config
interface HouseholdMember {
  firstName: string;
  relation: string;
  professionalStatus: string;
  netMonthlySalary: number;
  contractType: string;
  existingCredits: number;
}

interface HouseholdData {
  members: HouseholdMember[];
  // Primary person income/credits (NOT the sum, just the primary applicant)
  primaryIncome?: number;
  primaryExistingCredits?: number;
  // Legacy: pre-computed totals for backward compatibility
  totalIncome: number;
  totalExistingCredits: number;
}

interface RPPDFConfig {
  household: HouseholdData;
  stressTests: {
    rateIncrease: number;  // +X points
    chargesIncrease: number;  // +Y %
    incomeDecrease: number;  // -Z %
  };
}

const defaultRPConfig: RPPDFConfig = {
  household: {
    members: [],
    totalIncome: 0,
    totalExistingCredits: 0,
  },
  stressTests: {
    rateIncrease: 1,
    chargesIncrease: 15,
    incomeDecrease: 10,
  }
};

// Fetch client info from profile
async function fetchClientInfo(): Promise<ClientInfo> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { fullName: 'Client' };
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, address_city, birth_year, professional_status, contract_type, net_monthly_salary')
      .eq('user_id', user.id)
      .single();
    
    return {
      fullName: profile?.full_name || user.user_metadata?.full_name || 'Client',
      email: user.email,
      city: profile?.address_city || undefined,
      birthYear: profile?.birth_year || undefined,
      professionalStatus: profile?.professional_status || undefined,
      contractType: profile?.contract_type || undefined,
      netMonthlySalary: profile?.net_monthly_salary || undefined,
    };
  } catch {
    return { fullName: 'Client' };
  }
}

// Helper: Draw chart with proper axes and labels (duplicated for independence)
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

  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(0, Math.min(...yValues));
  const yMax = Math.max(...yValues) * 1.1;

  if (options.title) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(options.title, x + width / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }

  if (options.showGrid !== false) {
    doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2]);
    doc.setLineWidth(0.2);
    
    const yTicks = options.yTickCount || 5;
    for (let i = 0; i <= yTicks; i++) {
      const tickY = chartY + chartHeight - (i / yTicks) * chartHeight;
      doc.line(chartX, tickY, chartX + chartWidth, tickY);
    }
  }

  doc.setDrawColor(colors.axis[0], colors.axis[1], colors.axis[2]);
  doc.setLineWidth(0.5);
  doc.line(chartX, chartY, chartX, chartY + chartHeight);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);

  const yTicks = options.yTickCount || 5;
  const yFormatter = options.yFormatter || ((v: number) => v.toLocaleString('fr-FR'));
  doc.setFontSize(6);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  for (let i = 0; i <= yTicks; i++) {
    const tickY = chartY + chartHeight - (i / yTicks) * chartHeight;
    const value = yMin + (i / yTicks) * (yMax - yMin);
    doc.text(yFormatter(value), chartX - 3, tickY + 1.5, { align: 'right' });
    doc.line(chartX - 2, tickY, chartX, tickY);
  }

  const xTicks = options.xTickCount || Math.min(data.length, 8);
  const xFormatter = options.xFormatter || ((v: number) => `${v}`);
  const step = Math.ceil(data.length / xTicks);
  
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      const px = chartX + ((d.x - xMin) / (xMax - xMin)) * chartWidth;
      doc.text(xFormatter(d.x), px, chartY + chartHeight + 8, { align: 'center' });
      doc.line(px, chartY + chartHeight, px, chartY + chartHeight + 2);
    }
  });

  if (options.xLabel) {
    doc.setFontSize(7);
    doc.text(options.xLabel, chartX + chartWidth / 2, chartY + chartHeight + 15, { align: 'center' });
  }

  if (options.fillArea && options.fillColor && data.length > 1) {
    const points: { x: number; y: number }[] = [];
    data.forEach(d => {
      const px = chartX + ((d.x - xMin) / (xMax - xMin)) * chartWidth;
      const py = chartY + chartHeight - ((d.y - yMin) / (yMax - yMin)) * chartHeight;
      points.push({ x: px, y: py });
    });
    
    doc.setFillColor(options.fillColor[0], options.fillColor[1], options.fillColor[2]);
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = points[i].x;
      const y1 = points[i].y;
      const x2 = points[i + 1].x;
      const y2 = points[i + 1].y;
      const baseY = chartY + chartHeight;
      doc.triangle(x1, y1, x2, y2, x1, baseY, 'F');
      doc.triangle(x2, y2, x2, baseY, x1, baseY, 'F');
    }
  }

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

  if (options.showDots !== false) {
    doc.setFillColor(options.lineColor[0], options.lineColor[1], options.lineColor[2]);
    data.forEach((d) => {
      const px = chartX + ((d.x - xMin) / (xMax - xMin)) * chartWidth;
      const py = chartY + chartHeight - ((d.y - yMin) / (yMax - yMin)) * chartHeight;
      doc.circle(px, py, 1.5, 'F');
    });
  }
}

// Helper: Draw stacked bar chart for budget breakdown
function drawStackedBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  title: string
) {
  const colors = {
    text: [71, 85, 105] as [number, number, number],
    dark: [30, 41, 59] as [number, number, number],
  };

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const padding = { left: 10, right: 80, top: 15, bottom: 10 };
  const barX = x + padding.left;
  const barY = y + padding.top;
  const barWidth = width - padding.left - padding.right;
  const barHeight = 20;

  // Title
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text(title, x + width / 2, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Draw stacked bar
  let currentX = barX;
  data.forEach((d) => {
    const segmentWidth = (d.value / total) * barWidth;
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);
    doc.rect(currentX, barY, segmentWidth, barHeight, 'F');
    currentX += segmentWidth;
  });

  // Legend
  const legendY = barY + barHeight + 8;
  let legendX = barX;
  data.forEach((d, i) => {
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);
    doc.rect(legendX, legendY, 6, 4, 'F');
    doc.setFontSize(6);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text(`${d.label} (${formatCurrency(d.value)})`, legendX + 8, legendY + 3);
    legendX += 45;
    if (i === 2) {
      legendX = barX;
    }
  });
}

// Helper: Draw horizontal bar chart
function drawHorizontalBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  options: {
    title?: string;
    yFormatter?: (v: number) => string;
    showValues?: boolean;
  }
) {
  const colors = {
    axis: [100, 116, 139] as [number, number, number],
    grid: [226, 232, 240] as [number, number, number],
    text: [71, 85, 105] as [number, number, number],
    dark: [30, 41, 59] as [number, number, number],
  };

  const padding = { left: 55, right: 15, top: 15, bottom: 15 };
  const chartX = x + padding.left;
  const chartY = y + padding.top;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value)) * 1.15;
  const yFormatter = options.yFormatter || ((v: number) => v.toLocaleString('fr-FR'));

  if (options.title) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(options.title, x + width / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }

  const barHeight = (chartHeight - (data.length - 1) * 3) / data.length;

  // Draw grid
  doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2]);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 5; i++) {
    const tickX = chartX + (i / 5) * chartWidth;
    doc.line(tickX, chartY, tickX, chartY + chartHeight);
  }

  // X-axis labels
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
    const barW = (d.value / maxValue) * chartWidth;
    
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);
    doc.roundedRect(chartX, barY, barW, barHeight, 2, 2, 'F');
    
    // Label on left
    doc.setFontSize(7);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text(d.label, chartX - 3, barY + barHeight / 2 + 1.5, { align: 'right' });
    
    // Value on right of bar
    if (options.showValues !== false) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text(yFormatter(d.value), chartX + barW + 3, barY + barHeight / 2 + 1.5);
      doc.setFont('helvetica', 'normal');
    }
  });
}

export async function generateRPBankPDF(
  data: FullProjectData, 
  config: RPPDFConfig = defaultRPConfig
): Promise<void> {
  const { project, acquisition, financing, owner_occupier, operating_costs, sale_data, results } = data;
  
  const clientInfo = await fetchClientInfo();
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;
  const totalPages = 10;
  let currentPage = 1;

  const colors = {
    primary: [59, 130, 246] as [number, number, number],
    success: [34, 197, 94] as [number, number, number],
    warning: [234, 179, 8] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    muted: [148, 163, 184] as [number, number, number],
    dark: [30, 41, 59] as [number, number, number],
    light: [248, 250, 252] as [number, number, number],
  };

  // Convert config to RPHouseholdData format for centralized calculations
  // IMPORTANT: Use primaryIncome (just the main applicant) not totalIncome (pre-summed)
  // calculateRPMetrics will add the members' income itself
  const rpHouseholdData: RPHouseholdData = {
    // If primaryIncome is provided, use it. Otherwise fall back to clientInfo salary.
    // DO NOT use totalIncome here as it includes members already!
    primaryIncome: config.household.primaryIncome ?? clientInfo.netMonthlySalary ?? 0,
    primaryExistingCredits: config.household.primaryExistingCredits ?? 0,
    members: config.household.members.map(m => ({
      id: crypto.randomUUID(),
      firstName: m.firstName,
      relation: m.relation,
      professionalStatus: m.professionalStatus,
      netMonthlySalary: m.netMonthlySalary,
      contractType: m.contractType,
      existingCredits: m.existingCredits,
    })),
    otherChargesMonthly: 0,
  };
  
  // Use centralized calculations for consistency with dashboard
  const metrics = calculateRPMetrics(data, rpHouseholdData);
  
  // Extract metrics for use in PDF
  const householdIncome = metrics.totalHouseholdIncome;
  const existingCredits = metrics.totalExistingCredits;
  const monthlyPayment = metrics.monthlyPayment;
  const memberCount = metrics.memberCount;
  const monthlyPropertyTax = metrics.monthlyPropertyTax;
  const monthlyCondoCharges = metrics.monthlyCondoCharges;
  const monthlyInsurance = metrics.monthlyInsurance;
  const totalHousingCost = metrics.totalHousingCostMonthly;
  const totalCreditsAfterProject = metrics.totalCreditsAfterProject;
  const debtRatio = metrics.debtRatio;
  const resteAVivre = metrics.resteAVivre;
  const securityMargin = financing.down_payment - (acquisition.notary_fee_amount || 0) - (acquisition.works_amount || 0);

  // Helper functions
  const addHeader = () => {
    doc.setFontSize(7);
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(`Dossier de financement RP — ${clientInfo.fullName}`, margin, 10);
    doc.text(`CAPITALUM`, pageWidth - margin, 10, { align: 'right' });
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

  // Calculate total project cost
  const totalCost = (acquisition.price_net_seller || 0) + 
                    (acquisition.agency_fee_amount || 0) + 
                    (acquisition.notary_fee_amount || 0) + 
                    (acquisition.works_amount || 0);

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
  doc.text('CAPITALUM', pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('DOSSIER DE FINANCEMENT — RESIDENCE PRINCIPALE', pageWidth / 2, 35, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text('Analyse financiere et patrimoniale du menage', pageWidth / 2, 47, { align: 'center' });
  
  // Client info box
  y = 70;
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Dossier presente par', margin + 5, y + 10);
  doc.setFontSize(14);
  doc.text(clientInfo.fullName, margin + 5, y + 24);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const householdText = memberCount > 1 ? `Menage de ${memberCount} personnes` : 'Menage de 1 personne';
  doc.text(householdText, pageWidth - margin - 5, y + 15, { align: 'right' });
  if (clientInfo.email) {
    doc.text(clientInfo.email, pageWidth - margin - 5, y + 24, { align: 'right' });
  }
  
  // Project info
  y = 120;
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('PROJET', margin + 5, y + 10);
  
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFontSize(12);
  doc.text(project.title || 'Residence Principale', margin + 5, y + 22);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Residence principale', margin + 5, y + 32);
  doc.text(`${project.city || 'Ville'} (${project.postal_code || ''})`, margin + 5, y + 42);
  
  const rightX = margin + contentWidth / 2 + 5;
  doc.text(`${project.surface_m2} m2 — ${project.rooms} pieces`, rightX, y + 22);
  doc.text(project.property_type === 'apartment' ? 'Appartement' : 'Maison', rightX, y + 32);
  if (project.dpe) doc.text(`DPE : ${project.dpe}`, rightX, y + 42);
  
  // Generation date
  y = 185;
  doc.setFontSize(9);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text(`Document genere le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, y, { align: 'center' });
  doc.text('via CAPITALUM — Simulation financiere', pageWidth / 2, y + 6, { align: 'center' });
  
  addFooter();

  // ============================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ============================================
  newPage();
  
  addSectionTitle('RESUME EXECUTIF');
  
  // Projet immobilier block
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth / 2 - 3, 55, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('PROJET IMMOBILIER', margin + 5, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  
  const projectMetrics = [
    { label: 'Type de bien', value: project.property_type === 'apartment' ? 'Appartement' : 'Maison' },
    { label: 'Localisation', value: project.city || 'Non definie' },
    { label: 'Prix total', value: formatCurrency(totalCost) },
    { label: 'Apport', value: formatCurrency(financing.down_payment) },
    { label: 'Montant finance', value: formatCurrency(financing.loan_amount) },
    { label: 'Duree et taux', value: `${financing.duration_months / 12} ans a ${financing.nominal_rate}%` },
    { label: 'Mensualite', value: formatCurrency(monthlyPayment) },
  ];
  
  let metricY = y + 14;
  projectMetrics.forEach(m => {
    doc.setFontSize(7);
    doc.text(m.label, margin + 5, metricY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(m.value, margin + (contentWidth / 2 - 3) - 5, metricY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    metricY += 5.5;
  });
  
  // Lecture ménage block
  const rightBlockX = margin + contentWidth / 2 + 3;
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(rightBlockX, y, contentWidth / 2 - 3, 55, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.text('LECTURE MENAGE', rightBlockX + 5, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  
  const householdMetrics = [
    { label: 'Revenus nets/mois', value: formatCurrency(householdIncome) },
    { label: 'Credits existants', value: formatCurrency(existingCredits) },
    { label: 'Mensualite projet', value: formatCurrency(monthlyPayment) },
    { label: 'Taux endettement', value: `${debtRatio.toFixed(1)}%` },
    { label: 'Reste a vivre', value: formatCurrency(resteAVivre) },
    { label: 'Apport residuel', value: formatCurrency(Math.max(0, securityMargin)) },
  ];
  
  metricY = y + 14;
  householdMetrics.forEach(m => {
    doc.setFontSize(7);
    doc.text(m.label, rightBlockX + 5, metricY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(m.value, rightBlockX + (contentWidth / 2 - 3) - 5, metricY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    metricY += 5.5;
  });
  
  y += 65;
  
  // Status badge
  const isViable = debtRatio <= 35 && resteAVivre >= 400 * memberCount;
  const isWarning = debtRatio > 35 || resteAVivre < 400 * memberCount;
  const isDanger = debtRatio > 40 || resteAVivre < 300 * memberCount;
  
  const statusText = isDanger ? 'DOSSIER SOUS TENSION' : isWarning ? 'DOSSIER SOUS VIGILANCE' : 'DOSSIER EQUILIBRE';
  const statusColor = isDanger ? colors.danger : isWarning ? colors.warning : colors.success;
  
  doc.setFillColor(isDanger ? 254 : isWarning ? 254 : 220, isDanger ? 226 : isWarning ? 249 : 252, isDanger ? 226 : isWarning ? 195 : 231);
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
  
  doc.setFontSize(7);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text('Cette appreciation repose sur des indicateurs de solvabilite et ne constitue pas un engagement de financement.', margin, y);

  // ============================================
  // PAGE 3: HOUSEHOLD COMPOSITION & SOLVENCY
  // ============================================
  newPage();
  
  addSectionTitle('COMPOSITION DU MENAGE ET SOLVABILITE');
  
  // Household table
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 35, 2, 2, 'F');
  
  // Headers
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text('Personne', margin + 5, y + 8);
  doc.text('Situation pro', margin + 50, y + 8);
  doc.text('Revenus nets', margin + 95, y + 8);
  doc.text('Credits', margin + 135, y + 8);
  doc.setFont('helvetica', 'normal');
  
  // Main applicant row - show PRIMARY income only, not the total
  const row1Y = y + 18;
  const primaryIncomeForDisplay = config.household.primaryIncome ?? clientInfo.netMonthlySalary ?? rpHouseholdData.primaryIncome ?? 0;
  const primaryCreditsForDisplay = config.household.primaryExistingCredits ?? rpHouseholdData.primaryExistingCredits ?? 0;
  doc.setFontSize(7);
  doc.text(clientInfo.fullName, margin + 5, row1Y);
  doc.text(clientInfo.professionalStatus || 'Non renseigne', margin + 50, row1Y);
  doc.text(formatCurrency(primaryIncomeForDisplay), margin + 95, row1Y);
  doc.text(formatCurrency(primaryCreditsForDisplay), margin + 135, row1Y);
  
  // Additional members
  if (config.household.members.length > 0) {
    config.household.members.forEach((member, i) => {
      const rowY = row1Y + (i + 1) * 8;
      doc.text(member.firstName, margin + 5, rowY);
      doc.text(member.professionalStatus, margin + 50, rowY);
      doc.text(formatCurrency(member.netMonthlySalary), margin + 95, rowY);
      doc.text(formatCurrency(member.existingCredits), margin + 135, rowY);
    });
  }
  
  y += 45;
  
  // Summary
  addSubtitle('Synthese financiere du menage');
  addLine('Revenu net total menage', formatCurrency(householdIncome), 0, true);
  addLine('Charges de credits existantes', formatCurrency(existingCredits), 5);
  addLine('Capacite financiere disponible', formatCurrency(householdIncome - existingCredits), 0, true);
  
  addSeparator();
  
  doc.setFontSize(7);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text('Aucune norme universelle n\'est appliquee — les indicateurs sont fournis a titre d\'aide a la decision.', margin, y);

  // ============================================
  // PAGE 4: ACQUISITION & TOTAL COST
  // ============================================
  newPage();
  
  addSectionTitle('ACQUISITION ET COUT TOTAL DU PROJET');
  
  addLine('Prix net vendeur', formatCurrency(acquisition.price_net_seller), 0, true);
  addLine('Frais d\'agence', formatCurrency(acquisition.agency_fee_amount || 0), 5);
  addLine('Frais de notaire', formatCurrency(acquisition.notary_fee_amount || 0) + (acquisition.notary_fee_estimated ? ' (estimes)' : ''), 5);
  if (acquisition.works_amount && acquisition.works_amount > 0) {
    addLine('Travaux', formatCurrency(acquisition.works_amount), 5);
  }
  addLine('Frais bancaires', formatCurrency(acquisition.bank_fees || 0), 5);
  addLine('Frais de garantie', formatCurrency(acquisition.guarantee_fees || 0), 5);
  addSeparator();
  addLine('COUT TOTAL DU PROJET', formatCurrency(totalCost), 0, true);
  
  y += 15;
  
  // Visual breakdown
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'F');
  
  const priceRatio = acquisition.price_net_seller / totalCost;
  const feesRatio = ((acquisition.agency_fee_amount || 0) + (acquisition.notary_fee_amount || 0)) / totalCost;
  
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
  doc.text('Travaux/Autres', margin + 116, y + 3);

  // ============================================
  // PAGE 5: FINANCING & DEBT
  // ============================================
  newPage();
  
  addSectionTitle('FINANCEMENT ET DETTE');
  
  addSubtitle('Structure de financement');
  addLine('Apport personnel', formatCurrency(financing.down_payment), 0, true);
  addLine('Affectation', financing.down_payment_allocation === 'fees' ? 'Frais annexes' : 'Capital', 5);
  addLine('Montant emprunte', formatCurrency(financing.loan_amount), 0, true);
  addLine('Duree', `${financing.duration_months} mois (${financing.duration_months / 12} ans)`, 5);
  addLine('Taux nominal', `${financing.nominal_rate}%`, 5);
  addLine('Assurance', `${financing.insurance_value}% du capital/an`, 5);
  if (financing.deferment_months && financing.deferment_months > 0) {
    addLine('Differe', `${financing.deferment_months} mois`, 5);
  }
  addSeparator();
  addLine('Mensualite totale', formatCurrency(monthlyPayment), 0, true);
  
  y += 8;
  addSubtitle('Cout total du credit');
  addLine('Total des interets', formatCurrency(financing.total_interest || 0), 5);
  addLine('Total assurance', formatCurrency(financing.total_insurance || 0), 5);
  addLine('Cout global credit', formatCurrency((financing.total_interest || 0) + (financing.total_insurance || 0)), 0, true);
  
  y += 12;
  
  // CRD Evolution chart
  const amortTable = financing.amortization_table || [];
  const amortData: { x: number; y: number }[] = [];
  
  for (let yr = 1; yr <= financing.duration_months / 12; yr++) {
    const monthData = amortTable.find(r => r.year === yr);
    const crd = monthData?.remaining_balance || financing.loan_amount * (1 - yr / (financing.duration_months / 12));
    amortData.push({ x: yr, y: crd });
  }
  
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 55, 2, 2, 'F');
  
  drawChartWithAxes(doc, margin, y, contentWidth, 55, amortData, {
    title: 'Evolution du capital restant du (CRD)',
    xLabel: 'Annees',
    lineColor: colors.primary,
    showDots: true,
    yFormatter: (v) => `${(v / 1000).toFixed(0)}k€`,
    xFormatter: (v) => `${v}`,
    yTickCount: 4,
    xTickCount: 6,
    fillArea: true,
    fillColor: [200, 220, 255] as [number, number, number],
  });

  // ============================================
  // PAGE 6: HOUSING BUDGET & MONTHLY EFFORT
  // ============================================
  newPage();
  
  addSectionTitle('BUDGET LOGEMENT ET EFFORT MENSUEL');
  
  addSubtitle('Detail du cout mensuel du logement');
  addLine('Mensualite credit', formatCurrency(monthlyPayment), 5);
  addLine('Taxe fonciere', formatCurrency(monthlyPropertyTax) + '/mois', 5);
  addLine('Charges copropriete', formatCurrency(monthlyCondoCharges) + '/mois', 5);
  addLine('Assurance habitation', formatCurrency(monthlyInsurance) + '/mois', 5);
  addSeparator();
  addLine('COUT MENSUEL GLOBAL LOGEMENT', formatCurrency(totalHousingCost), 0, true);
  
  y += 8;
  addSubtitle('Analyse de l\'effort');
  addLine('Effort mensuel net', formatCurrency(totalHousingCost), 0, true);
  addLine('Reste a vivre apres logement', formatCurrency(resteAVivre), 0, true);
  
  y += 15;
  
  // Budget breakdown stacked chart
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 55, 2, 2, 'F');
  
  const budgetData = [
    { label: 'Credit', value: monthlyPayment, color: colors.primary },
    { label: 'Taxe fonciere', value: monthlyPropertyTax, color: colors.warning },
    { label: 'Charges', value: monthlyCondoCharges, color: colors.muted },
    { label: 'Assurance', value: monthlyInsurance, color: colors.success },
  ];
  
  drawStackedBarChart(doc, margin, y, contentWidth, 55, budgetData, 'Repartition du budget logement mensuel');

  // ============================================
  // PAGE 7: BANK ANALYSIS & STRESS TESTS
  // ============================================
  newPage();
  
  addSectionTitle('ANALYSE BANQUE ET STRESS TESTS');
  
  doc.setFontSize(8);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text('Scenarios de stress pour evaluer la resilience du dossier face aux aleas economiques.', margin, y);
  y += 8;
  
  // Stress test parameters
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Hypotheses de stress appliquees :', margin + 5, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Taux +${config.stressTests.rateIncrease} pts  |  Charges +${config.stressTests.chargesIncrease}%  |  Revenus -${config.stressTests.incomeDecrease}%`, margin + 5, y + 14);
  y += 25;
  
  // Calculate stressed values
  const stressedRate = financing.nominal_rate + config.stressTests.rateIncrease;
  const stressedMonthlyPayment = financing.loan_amount * (stressedRate / 100 / 12) * 
    Math.pow(1 + stressedRate / 100 / 12, financing.duration_months) / 
    (Math.pow(1 + stressedRate / 100 / 12, financing.duration_months) - 1);
  const stressedCharges = totalHousingCost * (1 + config.stressTests.chargesIncrease / 100);
  const stressedIncome = householdIncome * (1 - config.stressTests.incomeDecrease / 100);
  const stressedDebtRatio = ((existingCredits + stressedMonthlyPayment) / stressedIncome) * 100;
  const stressedResteAVivre = stressedIncome - existingCredits - stressedCharges;
  
  // Comparison table
  addSubtitle('Comparaison Base vs Stress');
  
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 40, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicateur', margin + 5, y + 8);
  doc.text('Base', margin + 70, y + 8);
  doc.text('Stress', margin + 110, y + 8);
  doc.text('Variation', margin + 150, y + 8);
  doc.setFont('helvetica', 'normal');
  
  const stressComparisons = [
    { label: 'Mensualite credit', base: formatCurrency(monthlyPayment), stress: formatCurrency(stressedMonthlyPayment), variation: `+${((stressedMonthlyPayment / monthlyPayment - 1) * 100).toFixed(0)}%` },
    { label: 'Taux endettement', base: `${debtRatio.toFixed(1)}%`, stress: `${stressedDebtRatio.toFixed(1)}%`, variation: `+${(stressedDebtRatio - debtRatio).toFixed(1)} pts` },
    { label: 'Reste a vivre', base: formatCurrency(resteAVivre), stress: formatCurrency(stressedResteAVivre), variation: formatCurrency(stressedResteAVivre - resteAVivre) },
  ];
  
  stressComparisons.forEach((comp, i) => {
    const rowY = y + 18 + i * 7;
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(comp.label, margin + 5, rowY);
    doc.text(comp.base, margin + 70, rowY);
    doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
    doc.text(comp.stress, margin + 110, rowY);
    doc.setTextColor(colors.danger[0], colors.danger[1], colors.danger[2]);
    doc.text(comp.variation, margin + 150, rowY);
  });
  
  y += 50;
  
  // Comparison bar chart
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 50, 2, 2, 'F');
  
  const stressChartData = [
    { label: 'Reste a vivre Base', value: Math.max(0, resteAVivre), color: colors.success },
    { label: 'Reste a vivre Stress', value: Math.max(0, stressedResteAVivre), color: colors.warning },
    { label: 'Seuil securite', value: 400 * memberCount, color: colors.muted },
  ];
  
  drawHorizontalBarChart(doc, margin, y, contentWidth, 50, stressChartData, {
    title: 'Comparaison Base vs Stress (Reste a vivre)',
    yFormatter: (v) => formatCurrency(v),
    showValues: true,
  });
  
  y += 55;
  
  // Verdict
  const stressViable = stressedDebtRatio <= 40 && stressedResteAVivre >= 300 * memberCount;
  doc.setFillColor(stressViable ? 220 : 254, stressViable ? 252 : 226, stressViable ? 231 : 226);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const verdictColor = stressViable ? colors.success : colors.danger;
  doc.setTextColor(verdictColor[0], verdictColor[1], verdictColor[2]);
  doc.text(
    stressViable 
      ? 'Le dossier reste viable dans le scenario de stress — Marge de securite suffisante'
      : 'Attention : Le scenario de stress revele une fragilite — Revoir le budget ou l\'apport',
    pageWidth / 2, y + 10, { align: 'center' }
  );

  // ============================================
  // PAGE 8: PATRIMONY & RESALE
  // ============================================
  newPage();
  
  addSectionTitle('REVENTE ET PATRIMOINE');
  
  doc.setFontSize(8);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text('Analyse patrimoniale indicative, hors aleas de marche.', margin, y);
  y += 8;
  
  // Generate patrimony evolution data
  const propertyGrowth = sale_data.property_growth_rate || 2;
  const resaleYear = sale_data.resale_year || 20;
  
  const patrimonyData: { year: number; propertyValue: number; debt: number; equity: number }[] = [];
  
  for (let yr = 0; yr <= resaleYear; yr++) {
    const propertyValue = totalCost * Math.pow(1 + propertyGrowth / 100, yr);
    const debt = financing.loan_amount * Math.max(0, 1 - yr / (financing.duration_months / 12));
    const equity = propertyValue - debt;
    patrimonyData.push({ year: yr, propertyValue, debt, equity });
  }
  
  const lastData = patrimonyData[patrimonyData.length - 1];
  
  // Summary cards
  const patCards = [
    { label: 'Valeur bien a terme', value: formatCurrency(lastData.propertyValue) },
    { label: 'Dette restante', value: formatCurrency(lastData.debt) },
    { label: 'Equite nette', value: formatCurrency(lastData.equity) },
  ];
  
  const patCardWidth = (contentWidth - 10) / 3;
  patCards.forEach((card, i) => {
    const px = margin + i * (patCardWidth + 5);
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(px, y, patCardWidth, 22, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(card.value, px + patCardWidth / 2, y + 9, { align: 'center' });
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(card.label, px + patCardWidth / 2, y + 17, { align: 'center' });
  });
  
  y += 28;
  
  // Multi-line chart: Property Value, Debt, Equity
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, y, contentWidth, 65, 2, 2, 'F');
  
  const padding = { left: 30, right: 15, top: 15, bottom: 20 };
  const chartX = margin + padding.left;
  const chartY = y + padding.top;
  const chartWidth = contentWidth - padding.left - padding.right;
  const chartHeight = 65 - padding.top - padding.bottom;
  
  const allValues = patrimonyData.flatMap(d => [d.propertyValue, d.debt, d.equity]);
  const yMax = Math.max(...allValues) * 1.1;
  const yMin = Math.min(0, Math.min(...allValues));
  const xMin = 0;
  const xMax = resaleYear;
  
  // Title
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Evolution : Valeur du bien, Dette et Equite', margin + contentWidth / 2, y + 8, { align: 'center' });
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
  const step = Math.ceil(patrimonyData.length / 6);
  patrimonyData.forEach((d, i) => {
    if (i % step === 0 || i === patrimonyData.length - 1) {
      const px = chartX + ((d.year - xMin) / (xMax - xMin)) * chartWidth;
      doc.text(`${d.year}`, px, chartY + chartHeight + 7, { align: 'center' });
    }
  });
  
  // Draw property value line (dashed)
  doc.setDrawColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.setLineWidth(0.8);
  doc.setLineDashPattern([2, 2], 0);
  let prevX: number | null = null;
  let prevY: number | null = null;
  patrimonyData.forEach((d) => {
    const px = chartX + ((d.year - xMin) / (xMax - xMin)) * chartWidth;
    const py = chartY + chartHeight - ((d.propertyValue - yMin) / (yMax - yMin)) * chartHeight;
    if (prevX !== null && prevY !== null) doc.line(prevX, prevY, px, py);
    prevX = px;
    prevY = py;
  });
  
  // Draw debt line
  doc.setDrawColor(colors.danger[0], colors.danger[1], colors.danger[2]);
  doc.setLineDashPattern([], 0);
  prevX = null;
  prevY = null;
  patrimonyData.forEach((d) => {
    const px = chartX + ((d.year - xMin) / (xMax - xMin)) * chartWidth;
    const py = chartY + chartHeight - ((d.debt - yMin) / (yMax - yMin)) * chartHeight;
    if (prevX !== null && prevY !== null) doc.line(prevX, prevY, px, py);
    prevX = px;
    prevY = py;
  });
  
  // Draw equity line (bold)
  doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.setLineWidth(1.5);
  prevX = null;
  prevY = null;
  patrimonyData.forEach((d) => {
    const px = chartX + ((d.year - xMin) / (xMax - xMin)) * chartWidth;
    const py = chartY + chartHeight - ((d.equity - yMin) / (yMax - yMin)) * chartHeight;
    if (prevX !== null && prevY !== null) doc.line(prevX, prevY, px, py);
    prevX = px;
    prevY = py;
  });
  
  // Legend
  const legendY = y + 65 - 8;
  doc.setFontSize(6);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  
  doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.setLineWidth(1.5);
  doc.line(margin + 35, legendY, margin + 45, legendY);
  doc.text('Equite nette', margin + 48, legendY + 1);
  
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

  // ============================================
  // PAGE 9: HYPOTHESES
  // ============================================
  newPage();
  
  addSectionTitle('HYPOTHESES DE LA SIMULATION');
  
  const hypotheses = [
    { cat: 'Revenus', items: [
      `Revenu net mensuel : ${formatCurrency(householdIncome)}`,
      `Composition menage : ${memberCount} personne(s)`,
      config.household.members.length > 0 ? `Revenus supplementaires inclus` : null,
    ].filter(Boolean) },
    { cat: 'Charges existantes', items: [
      `Credits en cours : ${formatCurrency(existingCredits)}/mois`,
    ] },
    { cat: 'Acquisition', items: [
      `Prix d'achat net vendeur : ${formatCurrency(acquisition.price_net_seller)}`,
      `Frais de notaire : ${((acquisition.notary_fee_amount || 0) / acquisition.price_net_seller * 100).toFixed(1)}%`,
      acquisition.works_amount && acquisition.works_amount > 0 ? `Travaux prevus : ${formatCurrency(acquisition.works_amount)}` : null,
    ].filter(Boolean) },
    { cat: 'Financement', items: [
      `Emprunt : ${formatCurrency(financing.loan_amount)} sur ${financing.duration_months / 12} ans`,
      `Taux nominal : ${financing.nominal_rate}% (fixe)`,
      `Assurance : ${financing.insurance_value}% du capital/an`,
      `Apport personnel : ${formatCurrency(financing.down_payment)}`,
    ] },
    { cat: 'Charges logement', items: [
      `Taxe fonciere : ${formatCurrency(operating_costs.property_tax_annual || 0)}/an`,
      `Charges copropriete : ${formatCurrency(operating_costs.condo_nonrecoverable_annual || 0)}/an`,
      `Inflation charges : ${operating_costs.costs_growth_rate || 2}%/an`,
    ] },
    { cat: 'Patrimoine', items: [
      `Horizon d'analyse : ${resaleYear} ans`,
      `Croissance valeur immobiliere : ${propertyGrowth}%/an`,
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
    'Ce document est une simulation financiere fondee sur les informations declarees par le client.',
    '',
    'Il ne constitue ni une offre de pret, ni un engagement de financement de la part d\'un',
    'etablissement bancaire ou de CAPITALUM.',
    '',
    'Les projections financieres sont fondees sur des hypotheses susceptibles d\'evoluer en fonction',
    'des conditions de marche, des taux d\'interet et d\'autres facteurs economiques.',
    '',
    'Les indicateurs de solvabilite presentes (taux d\'endettement, reste a vivre) sont fournis a',
    'titre indicatif et ne prejugent pas de la decision d\'un etablissement de credit.',
    '',
    'Avant toute decision d\'achat, il est recommande de consulter un professionnel du financement.',
    '',
    'CAPITALUM decline toute responsabilite quant aux decisions prises sur la base de ce document.',
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
  doc.text('Document genere automatiquement via la plateforme CAPITALUM', margin + 10, y + 10);
  doc.text(`Date : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin + 10, y + 18);
  doc.text(`Client : ${clientInfo.fullName}`, margin + 10, y + 26);
  
  // Save
  const filename = `dossier-financement-rp-${clientInfo.fullName.replace(/\s+/g, '-').toLowerCase()}-${project.title?.replace(/\s+/g, '-').toLowerCase() || 'residence'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
