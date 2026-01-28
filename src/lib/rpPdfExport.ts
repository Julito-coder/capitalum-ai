// PDF Export Premium for Résidence Principale (RP) - "Dossier de Financement RP"
// CAPITALUM - Dossier de financement professionnel pour banques privées et courtiers haut de gamme
// Version 2.0 - Transformation en dossier d'analyse financière bancaire

import jsPDF from 'jspdf';
import { FullProjectData, OperatingCosts } from './realEstateTypes';
import { supabase } from '@/integrations/supabase/client';
import { 
  HouseholdData as RPHouseholdData, 
  HouseholdMember as RPHouseholdMember,
  calculateRPMetrics 
} from './rpCalculations';

// =============================================
// PDF-SAFE CURRENCY FORMATTER
// =============================================
// jsPDF doesn't handle non-breaking spaces (U+00A0) from Intl.NumberFormat
// This function uses regular spaces that render correctly in PDF
function formatCurrencyPDF(amount: number): string {
  const rounded = Math.round(amount);
  const parts = rounded.toString().split('.');
  const intPart = parts[0];
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // Regular space
  return `${formatted} €`;
}

// =============================================
// TYPES & INTERFACES
// =============================================

interface ClientInfo {
  fullName: string;
  email?: string;
  city?: string;
  birthYear?: number;
  professionalStatus?: string;
  contractType?: string;
  netMonthlySalary?: number;
}

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
  primaryIncome?: number;
  primaryExistingCredits?: number;
  totalIncome: number;
  totalExistingCredits: number;
}

interface RPPDFConfig {
  household: HouseholdData;
  stressTests: {
    rateIncrease: number;
    chargesIncrease: number;
    incomeDecrease: number;
  };
}

// =============================================
// DESIGN SYSTEM - PREMIUM COLORS
// =============================================

const COLORS = {
  // Brand
  navy: [30, 58, 138] as [number, number, number],     // #1E3A8A - Primary Navy
  navyLight: [59, 130, 246] as [number, number, number], // #3B82F6 - Accent Blue
  
  // Status
  success: [16, 185, 129] as [number, number, number], // #10B981 - Green
  warning: [245, 158, 11] as [number, number, number], // #F59E0B - Orange
  danger: [239, 68, 68] as [number, number, number],   // #EF4444 - Red
  
  // Neutrals
  dark: [15, 23, 42] as [number, number, number],      // #0F172A - Slate 900
  text: [51, 65, 85] as [number, number, number],      // #334155 - Slate 700
  muted: [100, 116, 139] as [number, number, number],  // #64748B - Slate 500
  border: [203, 213, 225] as [number, number, number], // #CBD5E1 - Slate 300
  light: [241, 245, 249] as [number, number, number],  // #F1F5F9 - Slate 100
  white: [255, 255, 255] as [number, number, number],
  
  // Chart colors
  chart1: [59, 130, 246] as [number, number, number],  // Blue
  chart2: [16, 185, 129] as [number, number, number],  // Green
  chart3: [245, 158, 11] as [number, number, number],  // Orange
  chart4: [139, 92, 246] as [number, number, number],  // Purple
};

// =============================================
// HELPER FUNCTIONS
// =============================================

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

function formatProfessionalStatus(status: string | undefined): string {
  const statusMap: Record<string, string> = {
    'employee': 'Salarié(e)',
    'self_employed': 'Indépendant(e)',
    'civil_servant': 'Fonctionnaire',
    'retired': 'Retraité(e)',
    'executive': 'Cadre',
    'manager': 'Cadre dirigeant',
  };
  return statusMap[status || ''] || status || 'Non renseigné';
}

function formatRelation(relation: string): string {
  const relationMap: Record<string, string> = {
    'conjoint': 'Conjoint(e)',
    'pacs': 'Partenaire PACS',
    'concubin': 'Concubin(e)',
  };
  return relationMap[relation] || relation;
}

// =============================================
// PREMIUM CHART HELPERS
// =============================================

function drawPieChart(
  doc: jsPDF,
  x: number,
  y: number,
  radius: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  options: { showLegend?: boolean; legendX?: number; legendY?: number } = {}
) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return;
  
  let startAngle = -Math.PI / 2; // Start from top
  
  data.forEach((d) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    
    // Draw pie slice using triangles
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);
    
    const steps = Math.max(10, Math.ceil(sliceAngle * 20));
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + (sliceAngle * i) / steps;
      const a2 = startAngle + (sliceAngle * (i + 1)) / steps;
      
      const x1 = x + radius * Math.cos(a1);
      const y1 = y + radius * Math.sin(a1);
      const x2 = x + radius * Math.cos(a2);
      const y2 = y + radius * Math.sin(a2);
      
      doc.triangle(x, y, x1, y1, x2, y2, 'F');
    }
    
    startAngle = endAngle;
  });
  
  // Draw white center for donut effect
  doc.setFillColor(255, 255, 255);
  const innerRadius = radius * 0.55;
  for (let i = 0; i < 36; i++) {
    const a1 = (i / 36) * 2 * Math.PI;
    const a2 = ((i + 1) / 36) * 2 * Math.PI;
    const x1 = x + innerRadius * Math.cos(a1);
    const y1 = y + innerRadius * Math.sin(a1);
    const x2 = x + innerRadius * Math.cos(a2);
    const y2 = y + innerRadius * Math.sin(a2);
    doc.triangle(x, y, x1, y1, x2, y2, 'F');
  }
  
  // Legend
  if (options.showLegend !== false) {
    const legendX = options.legendX ?? (x + radius + 15);
    let legendY = options.legendY ?? (y - (data.length * 8) / 2);
    
    data.forEach((d) => {
      const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : '0';
      doc.setFillColor(d.color[0], d.color[1], d.color[2]);
      doc.roundedRect(legendX, legendY - 3, 8, 5, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text(`${d.label} (${pct}%)`, legendX + 11, legendY);
      legendY += 9;
    });
  }
}

function drawHorizontalBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  options: { title?: string; yFormatter?: (v: number) => string; maxValue?: number } = {}
) {
  const padding = { left: 60, right: 45, top: 12, bottom: 8 };
  const chartX = x + padding.left;
  const chartY = y + padding.top;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxValue = options.maxValue || Math.max(...data.map(d => d.value)) * 1.15;
  const yFormatter = options.yFormatter || formatCurrencyPDF;
  
  if (options.title) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(options.title, x + width / 2, y + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }
  
  const barHeight = Math.min(14, (chartHeight - (data.length - 1) * 4) / data.length);
  const gap = (chartHeight - barHeight * data.length) / (data.length - 1 || 1);
  
  data.forEach((d, i) => {
    const barY = chartY + i * (barHeight + gap);
    const barW = maxValue > 0 ? (d.value / maxValue) * chartWidth : 0;
    
    // Bar background
    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(chartX, barY, chartWidth, barHeight, 2, 2, 'F');
    
    // Bar value
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);
    if (barW > 4) {
      doc.roundedRect(chartX, barY, barW, barHeight, 2, 2, 'F');
    }
    
    // Label on left
    doc.setFontSize(7);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(d.label, chartX - 4, barY + barHeight / 2 + 2, { align: 'right' });
    
    // Value on right
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(yFormatter(d.value), chartX + chartWidth + 4, barY + barHeight / 2 + 2);
    doc.setFont('helvetica', 'normal');
  });
}

function drawLineChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: { x: number; y: number }[],
  options: {
    title?: string;
    xLabel?: string;
    lineColor: [number, number, number];
    fillArea?: boolean;
    fillColor?: [number, number, number];
    yFormatter?: (v: number) => string;
    yTickCount?: number;
    showDots?: boolean;
  }
) {
  const padding = { left: 30, right: 12, top: 16, bottom: 18 };
  const chartX = x + padding.left;
  const chartY = y + padding.top;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  if (data.length === 0) return;
  
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(0, Math.min(...yValues));
  const yMax = Math.max(...yValues) * 1.1;
  
  // Title
  if (options.title) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(options.title, x + width / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }
  
  // Grid lines
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.setLineWidth(0.15);
  const yTicks = options.yTickCount || 4;
  for (let i = 0; i <= yTicks; i++) {
    const tickY = chartY + chartHeight - (i / yTicks) * chartHeight;
    doc.line(chartX, tickY, chartX + chartWidth, tickY);
  }
  
  // Axes
  doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.setLineWidth(0.4);
  doc.line(chartX, chartY, chartX, chartY + chartHeight);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);
  
  // Y labels
  const yFormatter = options.yFormatter || ((v: number) => `${(v / 1000).toFixed(0)}k€`);
  doc.setFontSize(6);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  for (let i = 0; i <= yTicks; i++) {
    const tickY = chartY + chartHeight - (i / yTicks) * chartHeight;
    const value = yMin + (i / yTicks) * (yMax - yMin);
    doc.text(yFormatter(value), chartX - 3, tickY + 1.5, { align: 'right' });
  }
  
  // X labels
  const xStep = Math.ceil(data.length / 6);
  data.forEach((d, i) => {
    if (i % xStep === 0 || i === data.length - 1) {
      const px = chartX + ((d.x - xMin) / (xMax - xMin || 1)) * chartWidth;
      doc.text(`${d.x}`, px, chartY + chartHeight + 7, { align: 'center' });
    }
  });
  
  if (options.xLabel) {
    doc.setFontSize(6);
    doc.text(options.xLabel, chartX + chartWidth / 2, chartY + chartHeight + 14, { align: 'center' });
  }
  
  // Fill area
  if (options.fillArea && options.fillColor && data.length > 1) {
    doc.setFillColor(options.fillColor[0], options.fillColor[1], options.fillColor[2]);
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = chartX + ((data[i].x - xMin) / (xMax - xMin || 1)) * chartWidth;
      const y1 = chartY + chartHeight - ((data[i].y - yMin) / (yMax - yMin || 1)) * chartHeight;
      const x2 = chartX + ((data[i + 1].x - xMin) / (xMax - xMin || 1)) * chartWidth;
      const y2 = chartY + chartHeight - ((data[i + 1].y - yMin) / (yMax - yMin || 1)) * chartHeight;
      const baseY = chartY + chartHeight;
      doc.triangle(x1, y1, x2, y2, x1, baseY, 'F');
      doc.triangle(x2, y2, x2, baseY, x1, baseY, 'F');
    }
  }
  
  // Line
  doc.setDrawColor(options.lineColor[0], options.lineColor[1], options.lineColor[2]);
  doc.setLineWidth(1.2);
  let prevPx: number | null = null;
  let prevPy: number | null = null;
  data.forEach((d) => {
    const px = chartX + ((d.x - xMin) / (xMax - xMin || 1)) * chartWidth;
    const py = chartY + chartHeight - ((d.y - yMin) / (yMax - yMin || 1)) * chartHeight;
    if (prevPx !== null && prevPy !== null) {
      doc.line(prevPx, prevPy, px, py);
    }
    prevPx = px;
    prevPy = py;
  });
  
  // Dots
  if (options.showDots !== false) {
    doc.setFillColor(options.lineColor[0], options.lineColor[1], options.lineColor[2]);
    data.forEach((d) => {
      const px = chartX + ((d.x - xMin) / (xMax - xMin || 1)) * chartWidth;
      const py = chartY + chartHeight - ((d.y - yMin) / (yMax - yMin || 1)) * chartHeight;
      doc.circle(px, py, 1.5, 'F');
    });
  }
}

function drawMultiLineChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  series: { data: { x: number; y: number }[]; color: [number, number, number]; label: string; dashed?: boolean }[],
  options: { title?: string; yFormatter?: (v: number) => string }
) {
  const padding = { left: 30, right: 15, top: 16, bottom: 22 };
  const chartX = x + padding.left;
  const chartY = y + padding.top;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const allData = series.flatMap(s => s.data);
  if (allData.length === 0) return;
  
  const xMin = Math.min(...allData.map(d => d.x));
  const xMax = Math.max(...allData.map(d => d.x));
  const yMin = Math.min(0, ...allData.map(d => d.y));
  const yMax = Math.max(...allData.map(d => d.y)) * 1.1;
  
  // Title
  if (options.title) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(options.title, x + width / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }
  
  // Grid
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.setLineWidth(0.15);
  for (let i = 0; i <= 4; i++) {
    const tickY = chartY + chartHeight - (i / 4) * chartHeight;
    doc.line(chartX, tickY, chartX + chartWidth, tickY);
  }
  
  // Axes
  doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.setLineWidth(0.4);
  doc.line(chartX, chartY, chartX, chartY + chartHeight);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);
  
  // Y labels
  const yFormatter = options.yFormatter || ((v: number) => `${(v / 1000).toFixed(0)}k€`);
  doc.setFontSize(6);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  for (let i = 0; i <= 4; i++) {
    const tickY = chartY + chartHeight - (i / 4) * chartHeight;
    const value = yMin + (i / 4) * (yMax - yMin);
    doc.text(yFormatter(value), chartX - 3, tickY + 1.5, { align: 'right' });
  }
  
  // X labels
  const firstSeries = series[0]?.data || [];
  const xStep = Math.ceil(firstSeries.length / 5);
  firstSeries.forEach((d, i) => {
    if (i % xStep === 0 || i === firstSeries.length - 1) {
      const px = chartX + ((d.x - xMin) / (xMax - xMin || 1)) * chartWidth;
      doc.text(`${d.x}`, px, chartY + chartHeight + 7, { align: 'center' });
    }
  });
  
  // Draw each series
  series.forEach((s) => {
    doc.setDrawColor(s.color[0], s.color[1], s.color[2]);
    doc.setLineWidth(s.dashed ? 0.8 : 1.2);
    if (s.dashed) {
      doc.setLineDashPattern([2, 2], 0);
    } else {
      doc.setLineDashPattern([], 0);
    }
    
    let prevPx: number | null = null;
    let prevPy: number | null = null;
    s.data.forEach((d) => {
      const px = chartX + ((d.x - xMin) / (xMax - xMin || 1)) * chartWidth;
      const py = chartY + chartHeight - ((d.y - yMin) / (yMax - yMin || 1)) * chartHeight;
      if (prevPx !== null && prevPy !== null) {
        doc.line(prevPx, prevPy, px, py);
      }
      prevPx = px;
      prevPy = py;
    });
  });
  
  doc.setLineDashPattern([], 0);
  
  // Legend
  const legendY = chartY + chartHeight + 14;
  let legendX = chartX;
  doc.setFontSize(6);
  series.forEach((s, i) => {
    doc.setDrawColor(s.color[0], s.color[1], s.color[2]);
    doc.setLineWidth(1.2);
    if (s.dashed) {
      doc.setLineDashPattern([2, 2], 0);
    }
    doc.line(legendX, legendY, legendX + 10, legendY);
    doc.setLineDashPattern([], 0);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(s.label, legendX + 13, legendY + 1);
    legendX += 45;
  });
}

// =============================================
// DEFAULT CONFIG
// =============================================

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

// =============================================
// MAIN EXPORT FUNCTION
// =============================================

export async function generateRPBankPDF(
  data: FullProjectData, 
  config: RPPDFConfig = defaultRPConfig
): Promise<void> {
  const { project, acquisition, financing, owner_occupier, operating_costs, sale_data, results } = data;
  
  const clientInfo = await fetchClientInfo();
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;
  const totalPages = 10;
  let currentPage = 1;
  
  // Convert config to RPHouseholdData format for centralized calculations
  const rpHouseholdData: RPHouseholdData = {
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
  const ltv = metrics.ltv;
  
  // Calculate total project cost
  const totalCost = (acquisition.price_net_seller || 0) + 
                    (acquisition.agency_fee_amount || 0) + 
                    (acquisition.notary_fee_amount || 0) + 
                    (acquisition.works_amount || 0) +
                    (acquisition.bank_fees || 0) +
                    (acquisition.guarantee_fees || 0);
  
  const totalFees = (acquisition.agency_fee_amount || 0) + 
                    (acquisition.notary_fee_amount || 0) +
                    (acquisition.bank_fees || 0) +
                    (acquisition.guarantee_fees || 0);
  
  // =============================================
  // HELPER FUNCTIONS
  // =============================================
  
  const addHeader = () => {
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(`Dossier de financement — ${clientInfo.fullName}`, margin, 10);
    doc.setFont('helvetica', 'bold');
    doc.text('CAPITALUM', pageWidth - margin, 10, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  };
  
  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(`${currentPage} / ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  };
  
  const newPage = () => {
    doc.addPage();
    currentPage++;
    y = margin + 8;
    addHeader();
    addFooter();
  };
  
  const addSectionTitle = (text: string) => {
    y += 6;
    doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.roundedRect(margin, y, contentWidth, 11, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(text.toUpperCase(), margin + 6, y + 7.5);
    doc.setFont('helvetica', 'normal');
    y += 18;
  };
  
  const addSubsectionTitle = (text: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text(text, margin, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
  };
  
  const addKeyValueLine = (label: string, value: string, options: { indent?: number; bold?: boolean; highlight?: boolean } = {}) => {
    const indent = options.indent || 0;
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(label, margin + indent, y);
    
    if (options.bold) doc.setFont('helvetica', 'bold');
    if (options.highlight) doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    y += 5.5;
  };
  
  const addSeparator = (light: boolean = false) => {
    y += 2;
    doc.setDrawColor(light ? COLORS.border[0] : COLORS.muted[0], light ? COLORS.border[1] : COLORS.muted[1], light ? COLORS.border[2] : COLORS.muted[2]);
    doc.setLineWidth(light ? 0.2 : 0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };
  
  const addInfoCard = (title: string, content: string[], x: number, cardWidth: number, cardHeight: number, color: [number, number, number] = COLORS.navy) => {
    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
    
    // Title bar
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, cardWidth, 8, 3, 3, 'F');
    doc.rect(x, y + 4, cardWidth, 4, 'F'); // Square bottom corners
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), x + 5, y + 5.5);
    doc.setFont('helvetica', 'normal');
    
    // Content
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    let contentY = y + 14;
    content.forEach(line => {
      const parts = line.split(':');
      if (parts.length === 2) {
        doc.setFontSize(7);
        doc.text(parts[0].trim(), x + 5, contentY);
        doc.setFont('helvetica', 'bold');
        doc.text(parts[1].trim(), x + cardWidth - 5, contentY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
      } else {
        doc.setFontSize(7);
        doc.text(line, x + 5, contentY);
      }
      contentY += 5.5;
    });
  };
  
  // ============================================
  // PAGE 1: PREMIUM COVER PAGE
  // ============================================
  
  // Navy header banner
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Logo / Brand
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CAPITALUM', pageWidth / 2, 26, { align: 'center' });
  
  // Document title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('DOSSIER DE FINANCEMENT', pageWidth / 2, 40, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Résidence Principale', pageWidth / 2, 52, { align: 'center' });
  
  // Client card
  y = 75;
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 45, 4, 4, 'F');
  
  // Left side: Client info
  doc.setFontSize(9);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text('Dossier présenté par', margin + 8, y + 12);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text(clientInfo.fullName, margin + 8, y + 26);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  const householdLabel = memberCount === 1 ? 'Ménage de 1 personne' : `Ménage de ${memberCount} personnes`;
  doc.text(householdLabel, margin + 8, y + 36);
  
  // Right side: Email
  if (clientInfo.email) {
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(clientInfo.email, pageWidth - margin - 8, y + 26, { align: 'right' });
  }
  
  // Project card
  y = 130;
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 55, 4, 4, 'F');
  
  // Navy accent stripe
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(margin, y, 4, 55, 'F');
  
  // Project details
  doc.setFontSize(9);
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJET IMMOBILIER', margin + 12, y + 12);
  
  doc.setFontSize(14);
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text(project.title || 'Résidence Principale', margin + 12, y + 26);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`${project.city || 'Ville'} (${project.postal_code || ''})`, margin + 12, y + 38);
  
  const propertyTypeLabel = project.property_type === 'apartment' ? 'Appartement' : 'Maison';
  doc.text(`${propertyTypeLabel} — ${project.surface_m2} m² — ${project.rooms} pièces`, margin + 12, y + 48);
  
  // Right column
  if (project.dpe) {
    doc.setFontSize(8);
    doc.text(`DPE : ${project.dpe}`, pageWidth - margin - 12, y + 38, { align: 'right' });
  }
  
  // Generation info
  y = 200;
  doc.setFontSize(9);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  const generationDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Document généré le ${generationDate}`, pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(8);
  doc.text('Analyse financière et patrimoniale issue de la simulation CAPITALUM', pageWidth / 2, y, { align: 'center' });
  
  addFooter();
  
  // ============================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ============================================
  newPage();
  
  addSectionTitle('Résumé Exécutif');
  
  // Two-column layout for summary cards
  const cardWidth = (contentWidth - 8) / 2;
  const cardHeight = 60;
  
  // Left card: Project
  const projectContent = [
    `Type de bien: ${project.property_type === 'apartment' ? 'Appartement' : 'Maison'}`,
    `Localisation: ${project.city || 'Non définie'}`,
    `Prix total projet: ${formatCurrencyPDF(totalCost)}`,
    `Apport personnel: ${formatCurrencyPDF(financing.down_payment)}`,
    `Montant financé: ${formatCurrencyPDF(financing.loan_amount)}`,
    `Durée & taux: ${financing.duration_months / 12} ans à ${financing.nominal_rate}%`,
    `Mensualité: ${formatCurrencyPDF(monthlyPayment)}`,
  ];
  addInfoCard('Projet Immobilier', projectContent, margin, cardWidth, cardHeight, COLORS.navy);
  
  // Right card: Household
  const householdContent = [
    `Revenus nets/mois: ${formatCurrencyPDF(householdIncome)}`,
    `Crédits existants: ${formatCurrencyPDF(existingCredits)}`,
    `Mensualité projet: ${formatCurrencyPDF(monthlyPayment)}`,
    `Taux d'endettement: ${debtRatio.toFixed(1)}%`,
    `Reste à vivre: ${formatCurrencyPDF(resteAVivre)}`,
    `LTV: ${ltv.toFixed(0)}%`,
  ];
  addInfoCard('Lecture Ménage', householdContent, margin + cardWidth + 8, cardWidth, cardHeight, COLORS.success);
  
  y += cardHeight + 12;
  
  // Status badge
  const isViable = debtRatio <= 35 && resteAVivre >= 400 * memberCount;
  const isDanger = debtRatio > 40 || resteAVivre < 300 * memberCount;
  const isWarning = !isViable && !isDanger;
  
  const statusText = isDanger ? 'DOSSIER SOUS TENSION' : isWarning ? 'DOSSIER SOUS VIGILANCE' : 'DOSSIER ÉQUILIBRÉ';
  const statusColor = isDanger ? COLORS.danger : isWarning ? COLORS.warning : COLORS.success;
  const statusBgLight: [number, number, number] = isDanger ? [254, 226, 226] : isWarning ? [254, 249, 195] : [220, 252, 231];
  
  doc.setFillColor(statusBgLight[0], statusBgLight[1], statusBgLight[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F');
  doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'S');
  
  // Status icon (checkmark or warning)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  const icon = isDanger ? '✗' : isWarning ? '!' : '✓';
  doc.text(icon, margin + 12, y + 14);
  
  doc.setFontSize(11);
  doc.text(statusText, margin + 24, y + 14);
  doc.setFont('helvetica', 'normal');
  
  y += 32;
  
  // Synthesis text
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  
  let synthesisText: string;
  if (isDanger) {
    synthesisText = `Avec un taux d'endettement de ${debtRatio.toFixed(1)}% et un reste a vivre de ${formatCurrencyPDF(resteAVivre)}, le dossier presente des tensions budgetaires significatives. Une revision du projet ou un apport complementaire serait recommande.`;
  } else if (isWarning) {
    synthesisText = `Le taux d'endettement de ${debtRatio.toFixed(1)}% approche la limite HCSF de 35%. Le reste a vivre de ${formatCurrencyPDF(resteAVivre)} est acceptable mais sans marge confortable. Dossier a etudier avec attention.`;
  } else {
    synthesisText = `Le dossier presente une structure financiere equilibree avec un taux d'endettement de ${debtRatio.toFixed(1)}% (sous le seuil HCSF de 35%) et un reste a vivre confortable de ${formatCurrencyPDF(resteAVivre)}. Le menage dispose d'une capacite financiere adaptee au projet.`;
  }
  
  const synthesisLines = doc.splitTextToSize(synthesisText, contentWidth - 10);
  doc.text(synthesisLines, margin + 5, y);
  y += synthesisLines.length * 4.5 + 8;
  
  // Disclaimer
  doc.setFontSize(6);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text('Cette appréciation repose sur des indicateurs de solvabilité et ne constitue pas un engagement de financement.', margin, y);
  
  // ============================================
  // PAGE 3: HOUSEHOLD COMPOSITION & SOLVENCY
  // ============================================
  newPage();
  
  addSectionTitle('Composition du Ménage et Solvabilité');
  
  // Household table
  const tableStartY = y;
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  doc.rect(margin, y + 6, contentWidth, 4, 'F');
  
  // Table headers
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const colWidths = [50, 45, 40, 35];
  const colX = [margin + 5, margin + 55, margin + 100, margin + 140];
  doc.text('Nom', colX[0], y + 6.5);
  doc.text('Situation professionnelle', colX[1], y + 6.5);
  doc.text('Revenus nets/mois', colX[2], y + 6.5);
  doc.text('Crédits en cours', colX[3], y + 6.5);
  
  y += 12;
  
  // Table rows
  const rowHeight = 9;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  
  // Primary applicant
  const primaryIncome = config.household.primaryIncome ?? clientInfo.netMonthlySalary ?? 0;
  const primaryCredits = config.household.primaryExistingCredits ?? 0;
  
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.rect(margin, y, contentWidth, rowHeight, 'F');
  doc.setFontSize(7);
  doc.text(clientInfo.fullName, colX[0], y + 6);
  doc.text(formatProfessionalStatus(clientInfo.professionalStatus), colX[1], y + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrencyPDF(primaryIncome), colX[2], y + 6);
  doc.text(formatCurrencyPDF(primaryCredits), colX[3], y + 6);
  doc.setFont('helvetica', 'normal');
  
  y += rowHeight;
  
  // Additional members
  config.household.members.forEach((member, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    }
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    
    doc.setFontSize(7);
    doc.text(`${member.firstName} (${formatRelation(member.relation)})`, colX[0], y + 6);
    doc.text(formatProfessionalStatus(member.professionalStatus), colX[1], y + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrencyPDF(member.netMonthlySalary), colX[2], y + 6);
    doc.text(formatCurrencyPDF(member.existingCredits), colX[3], y + 6);
    doc.setFont('helvetica', 'normal');
    
    y += rowHeight;
  });
  
  // Total row
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(margin, y, contentWidth, rowHeight, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL MENAGE', colX[0], y + 6);
  doc.text(formatCurrencyPDF(householdIncome), colX[2], y + 6);
  doc.text(formatCurrencyPDF(existingCredits), colX[3], y + 6);
  
  y += rowHeight + 15;
  
  // Financial reading box
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'F');
  
  // Accent stripe
  doc.setFillColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  doc.rect(margin, y, 4, 40, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text('Lecture Financière', margin + 12, y + 10);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  
  const financialAvailable = householdIncome - existingCredits;
  const financialReadingText = `Le menage dispose d'une capacite financiere mensuelle de ${formatCurrencyPDF(financialAvailable)} apres deduction des credits existants. ` +
    `Avec une mensualite projet de ${formatCurrencyPDF(monthlyPayment)}, le taux d'endettement global s'etablit a ${debtRatio.toFixed(1)}%. ` +
    (debtRatio <= 35 ? `Ce ratio est conforme aux recommandations du HCSF (max 35%).` : `Ce ratio depasse le seuil HCSF recommande de 35%.`);
  
  const readingLines = doc.splitTextToSize(financialReadingText, contentWidth - 20);
  doc.text(readingLines, margin + 12, y + 20);
  
  // ============================================
  // PAGE 4: TOTAL PROJECT COST
  // ============================================
  newPage();
  
  addSectionTitle('Coût Total du Projet');
  
  // Cost breakdown
  addSubsectionTitle('Détail des coûts d\'acquisition');
  
  y += 2;
  addKeyValueLine('Prix net vendeur', formatCurrencyPDF(acquisition.price_net_seller), { bold: true, highlight: true });
  addKeyValueLine('Frais d\'agence', formatCurrencyPDF(acquisition.agency_fee_amount || 0), { indent: 5 });
  addKeyValueLine('Frais de notaire', formatCurrencyPDF(acquisition.notary_fee_amount || 0) + (acquisition.notary_fee_estimated ? ' (estimes)' : ''), { indent: 5 });
  if (acquisition.works_amount && acquisition.works_amount > 0) {
    addKeyValueLine('Travaux', formatCurrencyPDF(acquisition.works_amount), { indent: 5 });
  }
  addKeyValueLine('Frais bancaires', formatCurrencyPDF(acquisition.bank_fees || 0), { indent: 5 });
  addKeyValueLine('Frais de garantie', formatCurrencyPDF(acquisition.guarantee_fees || 0), { indent: 5 });
  
  addSeparator();
  
  addKeyValueLine('COUT TOTAL DU PROJET', formatCurrencyPDF(totalCost), { bold: true, highlight: true });
  
  y += 15;
  
  // Pie chart for cost breakdown
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 70, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text('Répartition du coût total', margin + contentWidth / 2, y + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  
  const pieData = [
    { label: 'Prix net', value: acquisition.price_net_seller, color: COLORS.navy },
    { label: 'Frais agence', value: acquisition.agency_fee_amount || 0, color: COLORS.chart3 },
    { label: 'Frais notaire', value: acquisition.notary_fee_amount || 0, color: COLORS.chart4 },
    { label: 'Travaux', value: acquisition.works_amount || 0, color: COLORS.success },
    { label: 'Frais bancaires', value: (acquisition.bank_fees || 0) + (acquisition.guarantee_fees || 0), color: COLORS.muted },
  ].filter(d => d.value > 0);
  
  drawPieChart(doc, margin + 55, y + 42, 22, pieData, { 
    showLegend: true, 
    legendX: margin + 90, 
    legendY: y + 22 
  });
  
  y += 80;
  
  // Summary boxes
  const boxWidth = (contentWidth - 10) / 3;
  
  // Price box
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.roundedRect(margin, y, boxWidth, 28, 2, 2, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(formatCurrencyPDF(acquisition.price_net_seller), margin + boxWidth / 2, y + 12, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Prix net vendeur', margin + boxWidth / 2, y + 22, { align: 'center' });
  
  // Fees box
  doc.setFillColor(COLORS.chart3[0], COLORS.chart3[1], COLORS.chart3[2]);
  doc.roundedRect(margin + boxWidth + 5, y, boxWidth, 28, 2, 2, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrencyPDF(totalFees), margin + boxWidth + 5 + boxWidth / 2, y + 12, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Total frais annexes', margin + boxWidth + 5 + boxWidth / 2, y + 22, { align: 'center' });
  
  // Total box
  doc.setFillColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.roundedRect(margin + 2 * (boxWidth + 5), y, boxWidth, 28, 2, 2, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrencyPDF(totalCost), margin + 2 * (boxWidth + 5) + boxWidth / 2, y + 12, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Cout total projet', margin + 2 * (boxWidth + 5) + boxWidth / 2, y + 22, { align: 'center' });
  
  // ============================================
  // PAGE 5: FINANCING & DEBT
  // ============================================
  newPage();
  
  addSectionTitle('Financement et Dette');
  
  addSubsectionTitle('Structure de financement');
  
  addKeyValueLine('Apport personnel', formatCurrencyPDF(financing.down_payment), { bold: true, highlight: true });
  addKeyValueLine('Affectation de l\'apport', financing.down_payment_allocation === 'fees' ? 'Frais annexes' : financing.down_payment_allocation === 'capital' ? 'Capital' : 'Mixte', { indent: 5 });
  
  addSeparator(true);
  
  addKeyValueLine('Montant emprunte', formatCurrencyPDF(financing.loan_amount), { bold: true, highlight: true });
  addKeyValueLine('Duree du pret', `${financing.duration_months} mois (${financing.duration_months / 12} ans)`, { indent: 5 });
  addKeyValueLine('Taux nominal (fixe)', `${financing.nominal_rate}%`, { indent: 5 });
  addKeyValueLine('Assurance emprunteur', `${financing.insurance_value}% du capital/an`, { indent: 5 });
  if (financing.deferment_months && financing.deferment_months > 0) {
    addKeyValueLine('Differe de remboursement', `${financing.deferment_months} mois (${financing.deferment_type === 'total' ? 'total' : 'partiel'})`, { indent: 5 });
  }
  
  addSeparator();
  
  addKeyValueLine('MENSUALITE TOTALE', formatCurrencyPDF(monthlyPayment), { bold: true, highlight: true });
  
  y += 10;
  
  // Credit cost box
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  doc.setFillColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
  doc.rect(margin, y, 4, 35, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text('Coût Total du Crédit', margin + 12, y + 10);
  doc.setFont('helvetica', 'normal');
  
  const creditInfoY = y + 18;
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text('Total des intérêts', margin + 12, creditInfoY);
  doc.text('Total assurance', margin + 12 + 55, creditInfoY);
  doc.text('Coût global', margin + 12 + 110, creditInfoY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text(formatCurrencyPDF(financing.total_interest || 0), margin + 12, creditInfoY + 8);
  doc.text(formatCurrencyPDF(financing.total_insurance || 0), margin + 12 + 55, creditInfoY + 8);
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text(formatCurrencyPDF((financing.total_interest || 0) + (financing.total_insurance || 0)), margin + 12 + 110, creditInfoY + 8);
  
  y += 50;
  
  // CRD Evolution chart
  const amortTable = financing.amortization_table || [];
  const amortData: { x: number; y: number }[] = [];
  
  const durationYears = financing.duration_months / 12;
  for (let yr = 0; yr <= durationYears; yr++) {
    const monthData = amortTable.find(r => r.year === yr && r.month === yr * 12);
    const endOfYearMonth = amortTable.filter(r => r.year === yr);
    const lastMonthData = endOfYearMonth[endOfYearMonth.length - 1];
    const crd = lastMonthData?.remaining_balance ?? financing.loan_amount * (1 - yr / durationYears);
    amortData.push({ x: yr, y: crd });
  }
  
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 60, 3, 3, 'F');
  
  drawLineChart(doc, margin, y, contentWidth, 60, amortData, {
    title: 'Évolution du Capital Restant Dû (CRD)',
    xLabel: 'Années',
    lineColor: COLORS.navy,
    fillArea: true,
    fillColor: [200, 215, 245],
    showDots: true,
    yTickCount: 4,
  });
  
  // ============================================
  // PAGE 6: HOUSING BUDGET & MONTHLY EFFORT
  // ============================================
  newPage();
  
  addSectionTitle('Budget Logement et Effort Mensuel');
  
  addSubsectionTitle('Detail du cout mensuel du logement');
  
  addKeyValueLine('Mensualite credit', formatCurrencyPDF(monthlyPayment), { bold: true });
  addKeyValueLine('Taxe fonciere', formatCurrencyPDF(monthlyPropertyTax) + '/mois', { indent: 5 });
  addKeyValueLine('Charges copropriete', formatCurrencyPDF(monthlyCondoCharges) + '/mois', { indent: 5 });
  addKeyValueLine('Assurance habitation (PNO)', formatCurrencyPDF(monthlyInsurance) + '/mois', { indent: 5 });
  
  addSeparator();
  
  addKeyValueLine('COUT MENSUEL GLOBAL LOGEMENT', formatCurrencyPDF(totalHousingCost), { bold: true, highlight: true });
  
  y += 12;
  
  // Horizontal bar chart for budget breakdown
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 55, 3, 3, 'F');
  
  const budgetData = [
    { label: 'Mensualité crédit', value: monthlyPayment, color: COLORS.navy },
    { label: 'Taxe foncière', value: monthlyPropertyTax, color: COLORS.chart3 },
    { label: 'Charges copro', value: monthlyCondoCharges, color: COLORS.chart4 },
    { label: 'Assurance', value: monthlyInsurance, color: COLORS.success },
  ];
  
  drawHorizontalBarChart(doc, margin, y, contentWidth, 55, budgetData, {
    title: 'Répartition du budget logement mensuel',
  });
  
  y += 65;
  
  // Monthly effort analysis box
  const effortAnalysisText = resteAVivre >= 600 * memberCount 
    ? 'Effort confortable'
    : resteAVivre >= 400 * memberCount
    ? 'Effort modere'
    : 'Effort eleve';
  
  const effortDetailText = resteAVivre >= 600 * memberCount 
    ? 'Le menage conserve une marge financiere importante apres logement.'
    : resteAVivre >= 400 * memberCount
    ? 'Le reste a vivre est correct mais sans grande marge de manoeuvre.'
    : 'Le reste a vivre apres logement est limite. Vigilance recommandee.';
  
  const effortColor = resteAVivre >= 600 * memberCount ? COLORS.success : resteAVivre >= 400 * memberCount ? COLORS.warning : COLORS.danger;
  
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  doc.setFillColor(effortColor[0], effortColor[1], effortColor[2]);
  doc.rect(margin, y, 4, 35, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text('Analyse de l\'Effort Mensuel', margin + 12, y + 10);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(effortColor[0], effortColor[1], effortColor[2]);
  doc.text(`${effortAnalysisText} : ${formatCurrencyPDF(totalHousingCost)}`, margin + 12, y + 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(effortDetailText, margin + 12, y + 27);
  
  doc.text(`Reste a vivre apres logement : ${formatCurrencyPDF(resteAVivre)}`, margin + 12, y + 34);
  
  // ============================================
  // PAGE 7: BANK ANALYSIS & STRESS TESTS
  // ============================================
  newPage();
  
  addSectionTitle('Analyse Bancaire et Stress Tests');
  
  doc.setFontSize(8);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text('Évaluation de la résilience du dossier face à des scénarios économiques dégradés.', margin, y);
  y += 10;
  
  // Stress test parameters box
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Hypothèses de stress appliquées', margin + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Taux d'intérêt : +${config.stressTests.rateIncrease} point(s)   |   Charges : +${config.stressTests.chargesIncrease}%   |   Revenus : -${config.stressTests.incomeDecrease}%`, margin + 6, y + 15);
  y += 28;
  
  // Calculate stressed values
  const stressedRate = financing.nominal_rate + config.stressTests.rateIncrease;
  const monthlyRateStressed = stressedRate / 100 / 12;
  const stressedMonthlyPayment = financing.loan_amount * monthlyRateStressed * 
    Math.pow(1 + monthlyRateStressed, financing.duration_months) / 
    (Math.pow(1 + monthlyRateStressed, financing.duration_months) - 1);
  const stressedCharges = totalHousingCost * (1 + config.stressTests.chargesIncrease / 100);
  const stressedIncome = householdIncome * (1 - config.stressTests.incomeDecrease / 100);
  const stressedTotalCredits = existingCredits + stressedMonthlyPayment;
  const stressedDebtRatio = (stressedTotalCredits / stressedIncome) * 100;
  const stressedResteAVivre = stressedIncome - stressedTotalCredits - (operating_costs.property_tax_annual || 0) / 12 - (operating_costs.condo_nonrecoverable_annual || 0) / 12;
  
  // Comparison table
  addSubsectionTitle('Comparaison Base vs Stress');
  
  // Table header
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.roundedRect(margin, y, contentWidth, 9, 2, 2, 'F');
  doc.rect(margin, y + 5, contentWidth, 4, 'F');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Indicateur', margin + 5, y + 6);
  doc.text('Scénario Base', margin + 70, y + 6);
  doc.text('Scénario Stress', margin + 110, y + 6);
  doc.text('Variation', margin + 155, y + 6);
  y += 11;
  
  const comparisonData = [
    { label: 'Mensualite credit', base: monthlyPayment, stress: stressedMonthlyPayment, format: formatCurrencyPDF, pct: false },
    { label: 'Revenus nets', base: householdIncome, stress: stressedIncome, format: formatCurrencyPDF, pct: false },
    { label: 'Taux d\'endettement', base: debtRatio, stress: stressedDebtRatio, format: (v: number) => `${v.toFixed(1)}%`, pct: true },
    { label: 'Reste a vivre', base: resteAVivre, stress: stressedResteAVivre, format: formatCurrencyPDF, pct: false },
  ];
  
  comparisonData.forEach((row, i) => {
    doc.setFillColor(i % 2 === 0 ? COLORS.light[0] : 255, i % 2 === 0 ? COLORS.light[1] : 255, i % 2 === 0 ? COLORS.light[2] : 255);
    doc.rect(margin, y, contentWidth, 8, 'F');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(row.label, margin + 5, y + 5.5);
    doc.text(row.format(row.base), margin + 70, y + 5.5);
    doc.text(row.format(row.stress), margin + 110, y + 5.5);
    
    const variation = row.pct ? (row.stress - row.base) : ((row.stress - row.base) / (row.base || 1)) * 100;
    const variationText = row.pct ? `${variation >= 0 ? '+' : ''}${variation.toFixed(1)} pts` : `${variation >= 0 ? '+' : ''}${variation.toFixed(0)}%`;
    const variationColor = (row.label === 'Reste a vivre' ? variation < 0 : variation > 0) ? COLORS.danger : COLORS.success;
    doc.setTextColor(variationColor[0], variationColor[1], variationColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(variationText, margin + 155, y + 5.5);
    
    y += 8;
  });
  
  y += 12;
  
  // Stress comparison chart
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F');
  
  const stressChartData = [
    { label: 'Reste à vivre (Base)', value: resteAVivre, color: COLORS.success },
    { label: 'Reste à vivre (Stress)', value: stressedResteAVivre, color: COLORS.warning },
    { label: 'Seuil minimum', value: 400 * memberCount, color: COLORS.danger },
  ];
  
  drawHorizontalBarChart(doc, margin, y, contentWidth, 50, stressChartData, {
    title: 'Comparaison du Reste à Vivre',
    maxValue: Math.max(resteAVivre, stressedResteAVivre, 400 * memberCount) * 1.2,
  });
  
  y += 60;
  
  // Conclusion
  const stressConclusion = stressedDebtRatio <= 40 && stressedResteAVivre >= 300 * memberCount
    ? 'Le dossier conserve une marge de sécurité significative même en scénario dégradé. La structure financière est résiliente.'
    : 'En scénario de stress, le dossier présente des tensions. Un suivi attentif de l\'évolution des conditions de marché est recommandé.';
  
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setFillColor(stressedDebtRatio <= 40 ? COLORS.success[0] : COLORS.warning[0], stressedDebtRatio <= 40 ? COLORS.success[1] : COLORS.warning[1], stressedDebtRatio <= 40 ? COLORS.success[2] : COLORS.warning[2]);
  doc.rect(margin, y, 4, 18, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  const conclusionLines = doc.splitTextToSize(stressConclusion, contentWidth - 20);
  doc.text(conclusionLines, margin + 12, y + 11);
  
  // ============================================
  // PAGE 8: RESALE & FUTURE WEALTH
  // ============================================
  newPage();
  
  addSectionTitle('Revente et Patrimoine à Terme');
  
  const resaleYear = sale_data?.resale_year || project.horizon_years || 20;
  const propertyGrowth = sale_data?.property_growth_rate || owner_occupier?.value_growth_rate || 2;
  const futurePropertyValue = acquisition.price_net_seller * Math.pow(1 + propertyGrowth / 100, resaleYear);
  const remainingDebtAtTerm = results?.patrimony_series?.[results.patrimony_series.length - 1]?.remaining_debt || 0;
  const netEquity = futurePropertyValue - remainingDebtAtTerm;
  
  addSubsectionTitle(`Projection a ${resaleYear} ans`);
  
  addKeyValueLine('Valeur estimee du bien', formatCurrencyPDF(futurePropertyValue), { bold: true });
  addKeyValueLine('Hypothese de croissance annuelle', `${propertyGrowth}%/an`, { indent: 5 });
  addKeyValueLine('Dette restante a terme', formatCurrencyPDF(remainingDebtAtTerm), { indent: 5 });
  
  addSeparator();
  
  addKeyValueLine('EQUITE NETTE ESTIMEE', formatCurrencyPDF(netEquity), { bold: true, highlight: true });
  
  y += 10;
  
  // Summary cards
  const patCardWidth = (contentWidth - 10) / 3;
  
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.roundedRect(margin, y, patCardWidth, 30, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(formatCurrencyPDF(futurePropertyValue), margin + patCardWidth / 2, y + 13, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Valeur du bien', margin + patCardWidth / 2, y + 23, { align: 'center' });
  
  doc.setFillColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
  doc.roundedRect(margin + patCardWidth + 5, y, patCardWidth, 30, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrencyPDF(remainingDebtAtTerm), margin + patCardWidth + 5 + patCardWidth / 2, y + 13, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Dette restante', margin + patCardWidth + 5 + patCardWidth / 2, y + 23, { align: 'center' });
  
  doc.setFillColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  doc.roundedRect(margin + 2 * (patCardWidth + 5), y, patCardWidth, 30, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrencyPDF(netEquity), margin + 2 * (patCardWidth + 5) + patCardWidth / 2, y + 13, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Equite nette', margin + 2 * (patCardWidth + 5) + patCardWidth / 2, y + 23, { align: 'center' });
  
  y += 42;
  
  // Multi-line chart: Property Value, Debt, Equity
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 70, 3, 3, 'F');
  
  // Build chart data
  const patrimonyChartData: { x: number; y: number }[][] = [[], [], []];
  for (let yr = 0; yr <= resaleYear; yr += Math.ceil(resaleYear / 10)) {
    const propVal = acquisition.price_net_seller * Math.pow(1 + propertyGrowth / 100, yr);
    const debt = financing.loan_amount * Math.max(0, 1 - yr / (financing.duration_months / 12));
    const equity = propVal - debt;
    patrimonyChartData[0].push({ x: yr, y: propVal });
    patrimonyChartData[1].push({ x: yr, y: debt });
    patrimonyChartData[2].push({ x: yr, y: equity });
  }
  
  // Add final year if not included
  if (patrimonyChartData[0][patrimonyChartData[0].length - 1]?.x !== resaleYear) {
    patrimonyChartData[0].push({ x: resaleYear, y: futurePropertyValue });
    patrimonyChartData[1].push({ x: resaleYear, y: remainingDebtAtTerm });
    patrimonyChartData[2].push({ x: resaleYear, y: netEquity });
  }
  
  drawMultiLineChart(doc, margin, y, contentWidth, 70, [
    { data: patrimonyChartData[0], color: COLORS.muted, label: 'Valeur bien', dashed: true },
    { data: patrimonyChartData[1], color: COLORS.danger, label: 'Dette' },
    { data: patrimonyChartData[2], color: COLORS.success, label: 'Équité nette' },
  ], { title: 'Évolution : Valeur, Dette et Équité' });
  
  // ============================================
  // PAGE 9: SIMULATION ASSUMPTIONS
  // ============================================
  newPage();
  
  addSectionTitle('Hypothèses de la Simulation');
  
  doc.setFontSize(8);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text('Les projections financières reposent sur les hypothèses suivantes, susceptibles d\'évoluer.', margin, y);
  y += 10;
  
  const hypothesisCategories = [
    {
      title: 'Revenus du menage',
      items: [
        `Revenu net mensuel total : ${formatCurrencyPDF(householdIncome)}`,
        `Composition du menage : ${memberCount} personne(s)`,
        config.household.members.length > 0 ? `Revenus co-emprunteurs inclus` : null,
      ].filter(Boolean),
    },
    {
      title: 'Charges existantes',
      items: [
        `Credits en cours : ${formatCurrencyPDF(existingCredits)}/mois`,
      ],
    },
    {
      title: 'Acquisition',
      items: [
        `Prix d'achat net vendeur : ${formatCurrencyPDF(acquisition.price_net_seller)}`,
        `Frais de notaire : ${((acquisition.notary_fee_amount || 0) / acquisition.price_net_seller * 100).toFixed(1)}%`,
        acquisition.works_amount && acquisition.works_amount > 0 ? `Travaux prevus : ${formatCurrencyPDF(acquisition.works_amount)}` : null,
      ].filter(Boolean),
    },
    {
      title: 'Financement',
      items: [
        `Emprunt : ${formatCurrencyPDF(financing.loan_amount)} sur ${financing.duration_months / 12} ans`,
        `Taux nominal : ${financing.nominal_rate}% (fixe)`,
        `Assurance emprunteur : ${financing.insurance_value}%/an du capital`,
        `Apport personnel : ${formatCurrencyPDF(financing.down_payment)}`,
      ],
    },
    {
      title: 'Charges logement',
      items: [
        `Taxe fonciere : ${formatCurrencyPDF(operating_costs.property_tax_annual || 0)}/an`,
        `Charges copropriete : ${formatCurrencyPDF(operating_costs.condo_nonrecoverable_annual || 0)}/an`,
        `Inflation des charges : ${operating_costs.costs_growth_rate || 2}%/an`,
      ],
    },
    {
      title: 'Hypotheses patrimoniales',
      items: [
        `Horizon d'analyse : ${resaleYear} ans`,
        `Croissance valeur immobiliere : ${propertyGrowth}%/an`,
      ],
    },
  ];
  
  hypothesisCategories.forEach(category => {
    addSubsectionTitle(category.title);
    category.items.forEach(item => {
      if (item) {
        doc.setFontSize(8);
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.text(`•  ${item}`, margin + 5, y);
        y += 5.5;
      }
    });
    y += 4;
  });
  
  // ============================================
  // PAGE 10: PROFESSIONAL DISCLAIMER
  // ============================================
  newPage();
  
  addSectionTitle('Avertissement Professionnel');
  
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 90, 4, 4, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  
  const disclaimerParagraphs = [
    'Ce document est une simulation financière fondée sur les informations déclarées par le client.',
    '',
    'Il ne constitue ni une offre de prêt, ni un engagement de financement de la part d\'un établissement bancaire ou de CAPITALUM.',
    '',
    'Les projections financières sont fondées sur des hypothèses susceptibles d\'évoluer en fonction des conditions de marché, des taux d\'intérêt et d\'autres facteurs économiques.',
    '',
    'Les indicateurs de solvabilité présentés (taux d\'endettement, reste à vivre, LTV) sont fournis à titre indicatif et ne préjugent pas de la décision d\'un établissement de crédit.',
    '',
    'Avant toute décision d\'achat, il est recommandé de consulter un professionnel du financement immobilier.',
    '',
    'CAPITALUM décline toute responsabilité quant aux décisions prises sur la base de ce document.',
  ];
  
  let disclaimerY = y + 10;
  disclaimerParagraphs.forEach(para => {
    if (para) {
      const lines = doc.splitTextToSize(para, contentWidth - 20);
      doc.text(lines, margin + 10, disclaimerY);
      disclaimerY += lines.length * 5;
    } else {
      disclaimerY += 3;
    }
  });
  
  y += 105;
  
  // Signature block
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CAPITALUM', margin + 10, y + 14);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Simulation financière et analyse patrimoniale', margin + 10, y + 22);
  
  const signatureDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Document généré le ${signatureDate}`, margin + 10, y + 32);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Client : ${clientInfo.fullName}`, pageWidth - margin - 10, y + 25, { align: 'right' });
  
  // Save
  const sanitizedName = clientInfo.fullName.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const sanitizedProject = (project.title || 'residence').replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const filename = `dossier-financement-rp-${sanitizedName}-${sanitizedProject}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
