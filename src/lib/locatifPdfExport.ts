// =============================================================================
// CAPITALUM — Dossier de Financement Immobilier Locatif — Export PDF Premium
// Document professionnel de 12 pages pour établissements bancaires haut de gamme
// =============================================================================

import jsPDF from 'jspdf';
import { FullProjectData, CashflowYear, PatrimonyYear } from './realEstateTypes';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface ClientInfo {
  fullName: string;
  email?: string;
  city?: string;
  phone?: string;
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
    costsHaircut: 15,
  }
};

// =============================================================================
// COLOR PALETTE — PREMIUM NAVY/SLATE FINANCIAL THEME
// =============================================================================

const COLORS = {
  primary: [30, 58, 138] as [number, number, number],      // Navy #1E3A8A
  primaryLight: [59, 130, 246] as [number, number, number], // Blue #3B82F6
  success: [16, 185, 129] as [number, number, number],      // Green #10B981
  successLight: [209, 250, 229] as [number, number, number], // Light green
  warning: [245, 158, 11] as [number, number, number],      // Orange #F59E0B
  warningLight: [254, 243, 199] as [number, number, number], // Light orange
  danger: [239, 68, 68] as [number, number, number],        // Red #EF4444
  dangerLight: [254, 226, 226] as [number, number, number], // Light red
  dark: [15, 23, 42] as [number, number, number],           // Slate 900
  text: [51, 65, 85] as [number, number, number],           // Slate 600
  muted: [100, 116, 139] as [number, number, number],       // Slate 500
  light: [241, 245, 249] as [number, number, number],       // Slate 100
  white: [255, 255, 255] as [number, number, number],
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatCurrencyPDF(value: number): string {
  // Format number with space thousands separator
  const absValue = Math.abs(Math.round(value));
  const formatted = absValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = value < 0 ? '-' : '';
  return `${sign}${formatted} EUR`;
}

function formatPercentPDF(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

function normalizeText(text: string): string {
  if (!text) return '';
  // Replace problematic characters for PDF rendering with proper French equivalents
  return text
    .toString()
    .replace(/é/g, 'e')
    .replace(/É/g, 'E')
    .replace(/è/g, 'e')
    .replace(/È/g, 'E')
    .replace(/ê/g, 'e')
    .replace(/Ê/g, 'E')
    .replace(/ë/g, 'e')
    .replace(/à/g, 'a')
    .replace(/À/g, 'A')
    .replace(/â/g, 'a')
    .replace(/Â/g, 'A')
    .replace(/ô/g, 'o')
    .replace(/Ô/g, 'O')
    .replace(/û/g, 'u')
    .replace(/Û/g, 'U')
    .replace(/ù/g, 'u')
    .replace(/Ù/g, 'U')
    .replace(/î/g, 'i')
    .replace(/Î/g, 'I')
    .replace(/ï/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/€/g, 'EUR')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/–/g, '-')
    .replace(/—/g, '-');
}

async function fetchClientInfo(): Promise<ClientInfo> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { fullName: 'Client' };
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, address_city, phone')
      .eq('user_id', user.id)
      .single();
    
    return {
      fullName: profile?.full_name || user.user_metadata?.full_name || 'Client',
      email: user.email,
      city: (profile as any)?.address_city || undefined,
      phone: (profile as any)?.phone || undefined,
    };
  } catch {
    return { fullName: 'Client' };
  }
}

// =============================================================================
// CHART DRAWING HELPERS
// =============================================================================

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
    yLabel?: string;
    lineColor: [number, number, number];
    fillColor?: [number, number, number];
    showDots?: boolean;
    yFormatter?: (v: number) => string;
    xFormatter?: (v: number) => string;
    yTickCount?: number;
  }
) {
  if (data.length === 0) return;

  const padding = { left: 28, right: 10, top: 18, bottom: 22 };
  const chartX = x + padding.left;
  const chartY = y + padding.top;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(0, Math.min(...yValues));
  const yMax = Math.max(...yValues) * 1.1 || 1;

  // Title
  if (options.title) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(normalizeText(options.title), x + width / 2, y + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }

  // Grid
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  const yTicks = options.yTickCount || 5;
  for (let i = 0; i <= yTicks; i++) {
    const tickY = chartY + chartHeight - (i / yTicks) * chartHeight;
    doc.line(chartX, tickY, chartX + chartWidth, tickY);
  }

  // Axes
  doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.setLineWidth(0.5);
  doc.line(chartX, chartY, chartX, chartY + chartHeight);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);

  // Y-axis labels
  const yFormatter = options.yFormatter || ((v: number) => formatCurrencyPDF(v));
  doc.setFontSize(6);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  for (let i = 0; i <= yTicks; i++) {
    const tickY = chartY + chartHeight - (i / yTicks) * chartHeight;
    const value = yMin + (i / yTicks) * (yMax - yMin);
    doc.text(yFormatter(value), chartX - 3, tickY + 1.5, { align: 'right' });
  }

  // X-axis labels
  const xFormatter = options.xFormatter || ((v: number) => `${v}`);
  const step = Math.ceil(data.length / 8);
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      const px = chartX + ((d.x - xMin) / (xMax - xMin || 1)) * chartWidth;
      doc.text(xFormatter(d.x), px, chartY + chartHeight + 8, { align: 'center' });
    }
  });

  // Fill area
  if (options.fillColor) {
    doc.setFillColor(options.fillColor[0], options.fillColor[1], options.fillColor[2]);
    for (let i = 0; i < data.length - 1; i++) {
      const px1 = chartX + ((data[i].x - xMin) / (xMax - xMin || 1)) * chartWidth;
      const py1 = chartY + chartHeight - ((data[i].y - yMin) / (yMax - yMin || 1)) * chartHeight;
      const px2 = chartX + ((data[i + 1].x - xMin) / (xMax - xMin || 1)) * chartWidth;
      const py2 = chartY + chartHeight - ((data[i + 1].y - yMin) / (yMax - yMin || 1)) * chartHeight;
      const baseY = chartY + chartHeight;
      doc.triangle(px1, py1, px2, py2, px1, baseY, 'F');
      doc.triangle(px2, py2, px2, baseY, px1, baseY, 'F');
    }
  }

  // Line
  doc.setDrawColor(options.lineColor[0], options.lineColor[1], options.lineColor[2]);
  doc.setLineWidth(1.5);
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

  // Axis labels
  if (options.xLabel) {
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(normalizeText(options.xLabel), x + width / 2, chartY + chartHeight + 18, { align: 'center' });
  }
}

function drawHorizontalBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  options: {
    title?: string;
    valueFormatter?: (v: number) => string;
  }
) {
  const padding = { left: 55, right: 15, top: 18, bottom: 8 };
  const chartX = x + padding.left;
  const chartY = y + padding.top;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => Math.abs(d.value))) * 1.15 || 1;
  const barHeight = Math.min(12, (chartHeight - (data.length - 1) * 4) / data.length);
  const valueFormatter = options.valueFormatter || ((v: number) => formatCurrencyPDF(v));

  // Title
  if (options.title) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(normalizeText(options.title), x + width / 2, y + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }

  // Bars
  data.forEach((d, i) => {
    const barY = chartY + i * (barHeight + 4);
    const barW = Math.abs((d.value / maxValue) * chartWidth);

    // Bar
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);
    doc.roundedRect(chartX, barY, barW, barHeight, 2, 2, 'F');

    // Label
    doc.setFontSize(7);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(normalizeText(d.label), chartX - 4, barY + barHeight / 2 + 2, { align: 'right' });

    // Value
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(valueFormatter(d.value), chartX + barW + 4, barY + barHeight / 2 + 2);
    doc.setFont('helvetica', 'normal');
  });
}

function drawDonutChart(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  radius: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  options: { title?: string }
) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return;

  // Title
  if (options.title) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(normalizeText(options.title), centerX, centerY - radius - 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }

  // Draw segments
  let startAngle = -Math.PI / 2;
  const innerRadius = radius * 0.55;

  data.forEach((d) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    // Draw arc as filled wedge approximation
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);
    const steps = Math.max(20, Math.floor(sliceAngle * 30));
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + (i / steps) * sliceAngle;
      const a2 = startAngle + ((i + 1) / steps) * sliceAngle;

      const x1 = centerX + Math.cos(a1) * radius;
      const y1 = centerY + Math.sin(a1) * radius;
      const x2 = centerX + Math.cos(a2) * radius;
      const y2 = centerY + Math.sin(a2) * radius;
      const x3 = centerX + Math.cos(a2) * innerRadius;
      const y3 = centerY + Math.sin(a2) * innerRadius;
      const x4 = centerX + Math.cos(a1) * innerRadius;
      const y4 = centerY + Math.sin(a1) * innerRadius;

      doc.triangle(x1, y1, x2, y2, x3, y3, 'F');
      doc.triangle(x1, y1, x3, y3, x4, y4, 'F');
    }

    startAngle = endAngle;
  });

  // Center circle (white)
  doc.setFillColor(255, 255, 255);
  doc.circle(centerX, centerY, innerRadius - 1, 'F');

  // Center text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text(formatCurrencyPDF(total), centerX, centerY + 2, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Legend
  let legendY = centerY + radius + 10;
  doc.setFontSize(7);
  data.forEach((d, i) => {
    const legendX = centerX - 30;
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);
    doc.rect(legendX, legendY - 3 + i * 8, 6, 4, 'F');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    const pct = ((d.value / total) * 100).toFixed(0);
    doc.text(`${normalizeText(d.label)} (${pct}%)`, legendX + 10, legendY + i * 8);
  });
}

function drawMultiLineChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  series: { data: { x: number; y: number }[]; color: [number, number, number]; label: string; dashed?: boolean }[],
  options: {
    title?: string;
    yFormatter?: (v: number) => string;
    xFormatter?: (v: number) => string;
  }
) {
  const padding = { left: 28, right: 10, top: 18, bottom: 22 };
  const chartX = x + padding.left;
  const chartY = y + padding.top;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const allValues = series.flatMap(s => s.data.map(d => d.y));
  const allX = series.flatMap(s => s.data.map(d => d.x));
  const yMin = Math.min(0, Math.min(...allValues));
  const yMax = Math.max(...allValues) * 1.1 || 1;
  const xMin = Math.min(...allX);
  const xMax = Math.max(...allX);

  // Title
  if (options.title) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(normalizeText(options.title), x + width / 2, y + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }

  // Grid
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 5; i++) {
    const tickY = chartY + chartHeight - (i / 5) * chartHeight;
    doc.line(chartX, tickY, chartX + chartWidth, tickY);
  }

  // Axes
  doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.setLineWidth(0.5);
  doc.line(chartX, chartY, chartX, chartY + chartHeight);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);

  // Y-axis labels
  const yFormatter = options.yFormatter || ((v: number) => `${(v / 1000).toFixed(0)}k`);
  doc.setFontSize(6);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  for (let i = 0; i <= 5; i++) {
    const tickY = chartY + chartHeight - (i / 5) * chartHeight;
    const value = yMin + (i / 5) * (yMax - yMin);
    doc.text(yFormatter(value), chartX - 3, tickY + 1.5, { align: 'right' });
  }

  // X-axis labels
  const xFormatter = options.xFormatter || ((v: number) => `${v}`);
  const firstSeries = series[0]?.data || [];
  const step = Math.ceil(firstSeries.length / 8);
  firstSeries.forEach((d, i) => {
    if (i % step === 0 || i === firstSeries.length - 1) {
      const px = chartX + ((d.x - xMin) / (xMax - xMin || 1)) * chartWidth;
      doc.text(xFormatter(d.x), px, chartY + chartHeight + 8, { align: 'center' });
    }
  });

  // Draw each series
  series.forEach((s) => {
    doc.setDrawColor(s.color[0], s.color[1], s.color[2]);
    doc.setLineWidth(1.2);
    if (s.dashed) {
      doc.setLineDashPattern([3, 2], 0);
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
  const legendY = y + height - 6;
  let legendX = x + 30;
  doc.setFontSize(6);
  series.forEach((s) => {
    doc.setDrawColor(s.color[0], s.color[1], s.color[2]);
    doc.setLineWidth(1.2);
    if (s.dashed) {
      doc.setLineDashPattern([3, 2], 0);
    }
    doc.line(legendX, legendY, legendX + 10, legendY);
    doc.setLineDashPattern([], 0);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(normalizeText(s.label), legendX + 13, legendY + 1);
    legendX += 45;
  });
}

// =============================================================================
// MAIN PDF GENERATION FUNCTION
// =============================================================================

export async function generateLocatifBankPDF(data: FullProjectData, config: PDFConfig = defaultConfig): Promise<void> {
  const { project, acquisition, financing, rental, operating_costs, tax_config, sale_data, results } = data;

  const clientInfo = await fetchClientInfo();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;
  const totalPages = 12;
  let currentPage = 1;

  // ==========================================================================
  // CALCULATED METRICS
  // ==========================================================================

  const totalCost = (acquisition.price_net_seller || 0) +
    (acquisition.agency_fee_amount || 0) +
    (acquisition.notary_fee_amount || 0) +
    (acquisition.works_amount || 0) +
    (acquisition.furniture_amount || 0) +
    (acquisition.bank_fees || 0) +
    (acquisition.guarantee_fees || 0) +
    (acquisition.brokerage_fees || 0);

  const annualRent = (rental?.rent_monthly || 0) * 12;
  const effectiveVacancy = rental?.vacancy_rate || 5;
  const effectiveRent = annualRent * (1 - effectiveVacancy / 100);

  const totalOperatingCosts = (operating_costs.property_tax_annual || 0) +
    (operating_costs.condo_nonrecoverable_annual || 0) +
    (operating_costs.insurance_annual || 0) +
    (operating_costs.accounting_annual || 0) +
    (operating_costs.cfe_annual || 0) +
    (operating_costs.letting_fees_annual || 0) +
    (annualRent * (operating_costs.management_pct || 0) / 100);

  const noi = effectiveRent - totalOperatingCosts;
  const annualDebtService = (financing.monthly_payment || 0) * 12;

  // Prudent scenario calculations
  const prudentRent = (rental?.rent_monthly || 0) * (1 - config.haircuts.rentHaircut / 100);
  const prudentVacancy = Math.min(100, effectiveVacancy * (1 + config.haircuts.vacancyHaircut / 100));
  const prudentRate = (financing.nominal_rate || 0) + config.haircuts.rateHaircut;
  const prudentDuration = financing.duration_months || 240;
  const prudentMonthlyPayment = financing.loan_amount > 0
    ? financing.loan_amount * (prudentRate / 100 / 12) * Math.pow(1 + prudentRate / 100 / 12, prudentDuration) / (Math.pow(1 + prudentRate / 100 / 12, prudentDuration) - 1)
    : 0;
  const prudentCosts = totalOperatingCosts * (1 + config.haircuts.costsHaircut / 100);
  const prudentEffectiveRent = prudentRent * 12 * (1 - prudentVacancy / 100);
  const prudentNOI = prudentEffectiveRent - prudentCosts;
  const prudentDSCR = prudentMonthlyPayment > 0 ? prudentNOI / (prudentMonthlyPayment * 12) : 0;
  const prudentCashflowMonthly = (prudentNOI - prudentMonthlyPayment * 12) / 12;

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================

  const addHeader = () => {
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(normalizeText(`Dossier de Financement Locatif — ${clientInfo.fullName}`), margin, 10);
    doc.text('CAPITALUM', pageWidth - margin, 10, { align: 'right' });
  };

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(`Page ${currentPage} / ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  };

  const newPage = () => {
    doc.addPage();
    currentPage++;
    y = margin + 5;
    addHeader();
    addFooter();
  };

  const addSectionTitle = (text: string) => {
    y += 6;
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(normalizeText(text.toUpperCase()), margin + 5, y + 7);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    y += 16;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text(normalizeText(text), margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    y += 6;
  };

  const addLine = (label: string, value: string, indent: number = 0, bold: boolean = false) => {
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    if (bold) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    }
    doc.text(normalizeText(label), margin + indent, y);
    doc.text(normalizeText(value), pageWidth - margin, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 5;
  };

  const addSeparator = () => {
    y += 2;
    doc.setDrawColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  // ==========================================================================
  // PAGE 1: COVER PAGE
  // ==========================================================================

  // Navy header band
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, pageWidth, 60, 'F');

  // Logo
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CAPITALUM', pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('DOSSIER DE FINANCEMENT', pageWidth / 2, 40, { align: 'center' });

  doc.setFontSize(11);
  doc.text('Investissement Locatif', pageWidth / 2, 52, { align: 'center' });

  // Client info box
  y = 75;
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text('Dossier presente par', margin + 6, y + 10);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text(normalizeText(clientInfo.fullName), margin + 6, y + 24);
  doc.setFont('helvetica', 'normal');

  if (clientInfo.email) {
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(clientInfo.email, pageWidth - margin - 6, y + 24, { align: 'right' });
  }

  // Project info box
  y = 120;
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 60, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJET', margin + 6, y + 12);

  doc.setFontSize(14);
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text(normalizeText(project.title || 'Projet Immobilier'), margin + 6, y + 26);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const strategyLabel = project.strategy === 'meuble' ? 'Location meublee' :
    project.strategy === 'coloc' ? 'Colocation' :
      project.strategy === 'saisonnier' ? 'Location saisonniere' : 'Location nue';
  doc.text(normalizeText(strategyLabel), margin + 6, y + 38);
  doc.text(normalizeText(`${project.city || 'Ville'} (${project.postal_code || ''})`), margin + 6, y + 50);

  // Right side
  const rightX = margin + contentWidth / 2;
  doc.text(`${project.surface_m2 || 0} m2 — ${project.rooms || 0} pieces`, rightX, y + 26);
  doc.text(project.property_type === 'apartment' ? 'Appartement' : 'Maison', rightX, y + 38);
  if (project.dpe) {
    doc.text(`DPE : ${project.dpe}`, rightX, y + 50);
  }

  // Date
  y = 195;
  doc.setFontSize(9);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(normalizeText(`Document genere le ${dateStr}`), pageWidth / 2, y, { align: 'center' });
  doc.text('via CAPITALUM — Simulateur patrimonial', pageWidth / 2, y + 8, { align: 'center' });

  addFooter();

  // ==========================================================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ==========================================================================
  newPage();
  addSectionTitle('Resume Executif');

  // Key metrics in 2 columns with proper styling
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth / 2 - 4, 70, 3, 3, 'F');
  doc.roundedRect(margin + contentWidth / 2 + 4, y, contentWidth / 2 - 4, 70, 3, 3, 'F');

  // Draw subtle borders
  doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth / 2 - 4, 70, 3, 3, 'S');
  doc.roundedRect(margin + contentWidth / 2 + 4, y, contentWidth / 2 - 4, 70, 3, 3, 'S');

  // Left column - Project details
  let leftY = y + 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('PROJET IMMOBILIER', margin + 6, leftY);
  
  // Underline
  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(margin + 6, leftY + 2, margin + 55, leftY + 2);

  doc.setFont('helvetica', 'normal');
  leftY += 12;
  
  const leftMetrics = [
    ['Cout total du projet', formatCurrencyPDF(totalCost)],
    ['Apport personnel', formatCurrencyPDF(financing.down_payment)],
    ['Montant emprunte', formatCurrencyPDF(financing.loan_amount)],
    ['Duree et taux', `${(financing.duration_months || 0) / 12} ans a ${(financing.nominal_rate || 0).toFixed(2)}%`],
    ['Mensualite totale', formatCurrencyPDF(financing.monthly_payment)],
  ];
  
  leftMetrics.forEach(([label, value]) => {
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(normalizeText(label as string), margin + 6, leftY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(normalizeText(value as string), margin + 6, leftY + 5);
    doc.setFont('helvetica', 'normal');
    leftY += 11;
  });

  // Right column - Performance indicators
  let rightY = y + 10;
  const rightColX = margin + contentWidth / 2 + 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  doc.text('INDICATEURS DE PERFORMANCE', rightColX, rightY);
  
  // Underline
  doc.setDrawColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  doc.setLineWidth(0.5);
  doc.line(rightColX, rightY + 2, rightColX + 70, rightY + 2);

  doc.setFont('helvetica', 'normal');
  rightY += 12;
  
  const cashflowValue = results?.monthly_cashflow_after_tax || 0;
  const dscrValue = results?.dscr || 0;
  
  const rightMetrics = [
    ['Loyer mensuel brut', formatCurrencyPDF(rental?.rent_monthly || 0)],
    ['Cashflow net mensuel', formatCurrencyPDF(cashflowValue)],
    ['Rentabilite nette', formatPercentPDF(results?.net_yield || 0, 2)],
    ['DSCR (ratio couverture)', dscrValue.toFixed(2)],
    ['TRI sur la duree', formatPercentPDF(results?.irr || 0, 1)],
  ];
  
  rightMetrics.forEach(([label, value]) => {
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(normalizeText(label as string), rightColX, rightY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    // Color code cashflow and DSCR
    if ((label as string).includes('Cashflow')) {
      doc.setTextColor(cashflowValue >= 0 ? COLORS.success[0] : COLORS.danger[0], cashflowValue >= 0 ? COLORS.success[1] : COLORS.danger[1], cashflowValue >= 0 ? COLORS.success[2] : COLORS.danger[2]);
    } else if ((label as string).includes('DSCR')) {
      doc.setTextColor(dscrValue >= 1.2 ? COLORS.success[0] : dscrValue >= 1 ? COLORS.warning[0] : COLORS.danger[0], dscrValue >= 1.2 ? COLORS.success[1] : dscrValue >= 1 ? COLORS.warning[1] : COLORS.danger[1], dscrValue >= 1.2 ? COLORS.success[2] : dscrValue >= 1 ? COLORS.warning[2] : COLORS.danger[2]);
    } else {
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    }
    doc.text(normalizeText(value as string), rightColX, rightY + 5);
    doc.setFont('helvetica', 'normal');
    rightY += 11;
  });

  y += 80;

  // Status badge with clear interpretation
  const isViable = dscrValue >= 1.2 && cashflowValue >= -100;
  const isWarning = dscrValue >= 1 && dscrValue < 1.2;
  let statusText = 'PROJET EQUILIBRE';
  let statusSubtext = 'DSCR conforme aux exigences bancaires';
  let statusColor = COLORS.success;
  let statusBg = COLORS.successLight;
  
  if (!isViable && isWarning) {
    statusText = 'PROJET A SURVEILLER';
    statusSubtext = 'DSCR proche du seuil minimal bancaire (1.20)';
    statusColor = COLORS.warning;
    statusBg = COLORS.warningLight;
  } else if (!isViable && !isWarning) {
    statusText = 'PROJET SOUS TENSION';
    statusSubtext = 'DSCR insuffisant - Effort d\'epargne mensuel requis';
    statusColor = COLORS.danger;
    statusBg = COLORS.dangerLight;
  }

  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');
  doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'S');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(normalizeText(statusText), pageWidth / 2, y + 11, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(normalizeText(statusSubtext), pageWidth / 2, y + 20, { align: 'center' });

  y += 33;

  // Synthesis text
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  let synthesisText = '';
  if (isViable) {
    synthesisText = `Ce projet presente un DSCR de ${(results?.dscr || 0).toFixed(2)} (seuil bancaire 1.20), un cashflow mensuel positif de ${formatCurrencyPDF(results?.monthly_cashflow_after_tax || 0)} et une rentabilite nette de ${formatPercentPDF(results?.net_yield || 0)}. Le dossier est equilibre.`;
  } else if (isWarning) {
    synthesisText = `Le DSCR de ${(results?.dscr || 0).toFixed(2)} est proche du seuil bancaire (1.20). Le cashflow mensuel est de ${formatCurrencyPDF(results?.monthly_cashflow_after_tax || 0)}. Une attention particuliere est recommandee.`;
  } else {
    synthesisText = `Attention : le DSCR de ${(results?.dscr || 0).toFixed(2)} est inferieur au seuil bancaire de 1.20. Le cashflow mensuel de ${formatCurrencyPDF(results?.monthly_cashflow_after_tax || 0)} indique un effort d'epargne requis.`;
  }
  const textLines = doc.splitTextToSize(normalizeText(synthesisText), contentWidth - 10);
  doc.text(textLines, margin + 5, y);

  // ==========================================================================
  // PAGE 3: ACQUISITION & BUDGET
  // ==========================================================================
  newPage();
  addSectionTitle('Cout Total du Projet');

  addLine('Prix net vendeur', formatCurrencyPDF(acquisition.price_net_seller), 0, true);
  addLine("Frais d'agence", formatCurrencyPDF(acquisition.agency_fee_amount), 5);
  addLine('Frais de notaire', formatCurrencyPDF(acquisition.notary_fee_amount) + (acquisition.notary_fee_estimated ? ' (estimes)' : ''), 5);
  if (acquisition.works_amount > 0) addLine('Travaux', formatCurrencyPDF(acquisition.works_amount), 5);
  if (acquisition.furniture_amount > 0) addLine('Mobilier', formatCurrencyPDF(acquisition.furniture_amount), 5);
  addLine('Frais bancaires', formatCurrencyPDF(acquisition.bank_fees || 0), 5);
  addLine('Frais de garantie', formatCurrencyPDF(acquisition.guarantee_fees || 0), 5);
  if (acquisition.brokerage_fees > 0) addLine('Courtage', formatCurrencyPDF(acquisition.brokerage_fees), 5);
  addSeparator();
  addLine('TOTAL PROJET', formatCurrencyPDF(totalCost), 0, true);

  y += 10;

  // Donut chart
  const budgetData = [
    { label: 'Prix', value: acquisition.price_net_seller, color: COLORS.primary },
    { label: 'Frais', value: (acquisition.agency_fee_amount || 0) + (acquisition.notary_fee_amount || 0) + (acquisition.bank_fees || 0) + (acquisition.guarantee_fees || 0) + (acquisition.brokerage_fees || 0), color: COLORS.warning },
    { label: 'Travaux/Mobilier', value: (acquisition.works_amount || 0) + (acquisition.furniture_amount || 0), color: COLORS.muted },
  ].filter(d => d.value > 0);

  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 80, 3, 3, 'F');
  drawDonutChart(doc, margin + contentWidth / 2, y + 35, 25, budgetData, { title: 'Repartition du budget' });

  // ==========================================================================
  // PAGE 4: FINANCING & DEBT
  // ==========================================================================
  newPage();
  addSectionTitle('Financement et Dette');

  addSubtitle('Structure de financement');
  addLine('Apport personnel', formatCurrencyPDF(financing.down_payment), 0, true);
  addLine("Affectation de l'apport", financing.down_payment_allocation === 'fees' ? 'Frais annexes' : financing.down_payment_allocation === 'capital' ? 'Capital' : 'Mixte', 5);
  addLine('Montant emprunte', formatCurrencyPDF(financing.loan_amount), 0, true);
  addLine('Duree', `${financing.duration_months || 0} mois (${(financing.duration_months || 0) / 12} ans)`, 5);
  addLine('Taux nominal', formatPercentPDF(financing.nominal_rate || 0), 5);
  addLine('Assurance emprunteur', `${financing.insurance_value || 0}% du capital/an`, 5);
  if ((financing.deferment_months || 0) > 0) {
    addLine('Differe', `${financing.deferment_months} mois (${financing.deferment_type})`, 5);
  }
  addSeparator();
  addLine('MENSUALITE TOTALE', formatCurrencyPDF(financing.monthly_payment), 0, true);

  y += 6;
  addSubtitle('Cout total du credit');
  addLine('Total des interets', formatCurrencyPDF(financing.total_interest || 0), 5);
  addLine('Total assurance', formatCurrencyPDF(financing.total_insurance || 0), 5);
  addLine('COUT GLOBAL CREDIT', formatCurrencyPDF((financing.total_interest || 0) + (financing.total_insurance || 0)), 0, true);

  y += 10;

  // CRD Chart
  const amortTable = financing.amortization_table || [];
  const crdData: { x: number; y: number }[] = [];
  const years = (financing.duration_months || 240) / 12;
  for (let yr = 0; yr <= years; yr++) {
    const monthData = amortTable.find(r => r.year === yr);
    const crd = yr === 0 ? financing.loan_amount : (monthData?.remaining_balance || financing.loan_amount * (1 - yr / years));
    crdData.push({ x: yr, y: crd });
  }

  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 60, 3, 3, 'F');
  drawLineChart(doc, margin, y, contentWidth, 60, crdData, {
    title: 'Evolution du Capital Restant Du (CRD)',
    lineColor: COLORS.primary,
    fillColor: [59, 130, 246],
    showDots: false,
    yFormatter: (v) => `${(v / 1000).toFixed(0)}k`,
    yTickCount: 4,
  });

  // ==========================================================================
  // PAGE 5: RENTAL EXPLOITATION
  // ==========================================================================
  newPage();
  addSectionTitle('Exploitation Locative');

  addSubtitle('Revenus locatifs');
  addLine('Loyer mensuel hors charges', formatCurrencyPDF(rental?.rent_monthly || 0), 0, true);
  addLine('Loyer annuel brut', formatCurrencyPDF(annualRent), 5);
  addLine('Charges recuperables', formatCurrencyPDF(rental?.recoverable_charges || 0) + '/mois', 5);
  addLine('Vacance locative', formatPercentPDF(rental?.vacancy_rate || 5, 2), 5);
  addLine('Taux d\'impayes', formatPercentPDF(rental?.default_rate || 2, 2), 5);
  addLine('Revalorisation annuelle', formatPercentPDF(rental?.rent_growth_rate || 1, 2), 5);
  addSeparator();
  addLine('REVENU EFFECTIF ANNUEL', formatCurrencyPDF(effectiveRent), 0, true);

  y += 6;
  addSubtitle('Charges d\'exploitation annuelles');
  addLine('Taxe fonciere', formatCurrencyPDF(operating_costs.property_tax_annual || 0) + '/an', 5);
  addLine('Charges copropriete non recup.', formatCurrencyPDF(operating_costs.condo_nonrecoverable_annual || 0) + '/an', 5);
  addLine('Assurance PNO', formatCurrencyPDF(operating_costs.insurance_annual || 0) + '/an', 5);
  if ((operating_costs.management_pct || 0) > 0) addLine('Gestion locative', formatPercentPDF(operating_costs.management_pct || 0, 1) + ' du loyer', 5);
  addLine('CFE (Cotisation Fonciere)', formatCurrencyPDF(operating_costs.cfe_annual || 0) + '/an', 5);
  addLine('Comptabilite', formatCurrencyPDF(operating_costs.accounting_annual || 0) + '/an', 5);
  addSeparator();
  addLine('TOTAL CHARGES ANNUELLES', formatCurrencyPDF(totalOperatingCosts), 0, true);

  y += 6;

  // NOI & Key metrics
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('Resultat net d\'exploitation (NOI)', margin + 5, y + 10);
  doc.setFontSize(12);
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text(formatCurrencyPDF(noi) + '/an', margin + 5, y + 20);

  doc.setFontSize(9);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('Service de la dette', margin + contentWidth / 2, y + 10);
  doc.setFontSize(12);
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text(formatCurrencyPDF(annualDebtService) + '/an', margin + contentWidth / 2, y + 20);

  doc.setFont('helvetica', 'normal');

  // ==========================================================================
  // PAGE 6: PERFORMANCE KPIs
  // ==========================================================================
  newPage();
  addSectionTitle('Indicateurs de Performance');

  // KPI Cards - Properly structured with correct values
  const grossYield = results?.gross_yield || 0;
  const netYield = results?.net_yield || 0;
  const netNetYield = results?.net_net_yield || 0;
  const dscr = results?.dscr || 0;
  const irr = results?.irr || 0;
  const breakEvenRent = results?.break_even_rent || 0;

  const kpis = [
    { label: 'Rentabilite brute', value: formatPercentPDF(grossYield, 2), desc: 'Loyer brut / Cout total du projet', color: COLORS.primaryLight },
    { label: 'Rentabilite nette', value: formatPercentPDF(netYield, 2), desc: 'Apres deduction des charges', color: COLORS.success },
    { label: 'Rentabilite nette-nette', value: formatPercentPDF(netNetYield, 2), desc: 'Apres charges et fiscalite', color: COLORS.warning },
    { label: 'DSCR', value: dscr.toFixed(2), desc: 'Ratio de couverture (seuil: 1.20)', color: dscr >= 1.2 ? COLORS.success : COLORS.danger },
    { label: 'TRI (IRR)', value: formatPercentPDF(irr, 1), desc: 'Taux de rendement interne', color: COLORS.success },
    { label: 'Loyer equilibre', value: formatCurrencyPDF(breakEvenRent), desc: 'Loyer mensuel minimum', color: COLORS.warning },
  ];

  const cardWidth = (contentWidth - 10) / 3;
  const cardHeight = 32;

  kpis.forEach((kpi, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const kx = margin + col * (cardWidth + 5);
    const cardY = y + row * (cardHeight + 8);

    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(kx, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.setLineWidth(1.5);
    doc.roundedRect(kx, cardY, cardWidth, cardHeight, 3, 3, 'S');

    // Value - larger and bold
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(kpi.value, kx + cardWidth / 2, cardY + 13, { align: 'center' });

    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(normalizeText(kpi.label), kx + cardWidth / 2, cardY + 21, { align: 'center' });

    // Description
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(normalizeText(kpi.desc), kx + cardWidth / 2, cardY + 28, { align: 'center' });
  });

  y += 90;

  // Yield comparison chart
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 55, 3, 3, 'F');

  drawHorizontalBarChart(doc, margin, y, contentWidth, 55, [
    { label: 'Rentabilite brute', value: grossYield, color: COLORS.primaryLight },
    { label: 'Rentabilite nette', value: netYield, color: COLORS.success },
    { label: 'Rentabilite nette-nette', value: netNetYield, color: COLORS.warning },
  ], {
    title: 'Comparaison des rentabilites',
    valueFormatter: (v) => formatPercentPDF(v, 2),
  });

  // ==========================================================================
  // PAGE 7: CASHFLOW ANALYSIS
  // ==========================================================================
  newPage();
  addSectionTitle('Analyse des Flux de Tresorerie');

  // Monthly cashflow breakdown - improved layout
  addSubtitle('Decomposition mensuelle du cashflow');
  
  const monthlyRent = rental?.rent_monthly || 0;
  const monthlyCharges = totalOperatingCosts / 12;
  const monthlyDebt = financing.monthly_payment || 0;
  const monthlyCashflowBefore = (results?.monthly_cashflow_before_tax || 0);
  const monthlyTax = Math.max(0, (results?.monthly_cashflow_before_tax || 0) - (results?.monthly_cashflow_after_tax || 0));
  const monthlyCashflowAfter = results?.monthly_cashflow_after_tax || 0;

  // Create a cleaner breakdown table
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 48, 3, 3, 'F');
  
  let tableY = y + 8;
  
  const cashflowLines = [
    { label: 'Loyer mensuel brut', value: monthlyRent, prefix: '', isTotal: false },
    { label: 'Charges d\'exploitation (1/12)', value: -monthlyCharges, prefix: '', isTotal: false },
    { label: 'Mensualite de credit', value: -monthlyDebt, prefix: '', isTotal: false },
    { label: 'Cashflow avant impots', value: monthlyCashflowBefore, prefix: '=', isTotal: true },
    { label: 'Imposition mensuelle estimee', value: -monthlyTax, prefix: '', isTotal: false },
    { label: 'CASHFLOW NET MENSUEL', value: monthlyCashflowAfter, prefix: '=', isTotal: true },
  ];

  cashflowLines.forEach((line) => {
    doc.setFontSize(8);
    if (line.isTotal) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    }
    
    const labelText = line.prefix ? `${line.prefix} ${line.label}` : line.label;
    doc.text(normalizeText(labelText), margin + 5, tableY);
    
    // Color code values
    if (line.value < 0) {
      doc.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
    } else if (line.value > 0) {
      doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
    }
    
    if (line.isTotal) {
      doc.setFont('helvetica', 'bold');
    }
    
    doc.text(formatCurrencyPDF(line.value), pageWidth - margin - 5, tableY, { align: 'right' });
    tableY += 7;
    
    // Add separator before totals
    if (line.label === 'Mensualite de credit' || line.label === 'Imposition mensuelle estimee') {
      doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.setLineWidth(0.3);
      doc.line(margin + 5, tableY - 2, pageWidth - margin - 5, tableY - 2);
      tableY += 2;
    }
  });

  y += 58;

  // Cashflow evolution chart
  const cashflowData = (results?.cashflow_series || []).map(cf => ({
    x: cf.year,
    y: cf.cashflow_after_tax
  }));

  if (cashflowData.length > 0) {
    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(margin, y, contentWidth, 60, 3, 3, 'F');

    drawLineChart(doc, margin, y, contentWidth, 60, cashflowData, {
      title: 'Projection du cashflow annuel net',
      lineColor: monthlyCashflowAfter >= 0 ? COLORS.success : COLORS.danger,
      showDots: true,
      yFormatter: (v) => formatCurrencyPDF(v),
      yTickCount: 5,
    });

    y += 68;
  }

  // Cashflow table - improved with proper headers
  addSubtitle('Projection sur les 5 premieres annees');
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'F');

  // Headers with background
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(margin, y, contentWidth, 8, 'F');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  
  const cols = ['Annee', 'Revenus', 'Charges', 'Credit', 'Impots', 'Cashflow Net'];
  const colWidths = [22, 30, 30, 30, 28, 34];
  let colX = margin + 3;
  cols.forEach((col, i) => {
    doc.text(normalizeText(col), colX, y + 5);
    colX += colWidths[i];
  });

  // Rows
  (results?.cashflow_series || []).slice(0, 5).forEach((cf, i) => {
    const rowY = y + 14 + i * 6;
    colX = margin + 3;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    
    doc.text(`Annee ${cf.year}`, colX, rowY); colX += colWidths[0];
    doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
    doc.text(formatCurrencyPDF(cf.rental_income), colX, rowY); colX += colWidths[1];
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(formatCurrencyPDF(cf.operating_costs), colX, rowY); colX += colWidths[2];
    doc.text(formatCurrencyPDF(cf.loan_payment), colX, rowY); colX += colWidths[3];
    doc.text(formatCurrencyPDF(cf.tax), colX, rowY); colX += colWidths[4];
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(cf.cashflow_after_tax >= 0 ? COLORS.success[0] : COLORS.danger[0], cf.cashflow_after_tax >= 0 ? COLORS.success[1] : COLORS.danger[1], cf.cashflow_after_tax >= 0 ? COLORS.success[2] : COLORS.danger[2]);
    doc.text(formatCurrencyPDF(cf.cashflow_after_tax), colX, rowY);
  });

  // ==========================================================================
  // PAGE 8: TAX CONFIGURATION
  // ==========================================================================
  newPage();
  addSectionTitle('Fiscalite');

  // Format regime name for display
  const regimeDisplay = (tax_config.regime_key || 'non_defini')
    .replace(/_/g, ' ')
    .replace(/lmnp/gi, 'LMNP')
    .replace(/sci/gi, 'SCI')
    .replace(/is/gi, 'IS')
    .replace(/reel/gi, 'Reel')
    .replace(/micro/gi, 'Micro');

  addSubtitle('Configuration fiscale');
  addLine('Mode de calcul', tax_config.tax_mode === 'simple' ? 'Simplifie' : tax_config.tax_mode === 'advanced' ? 'Avance' : 'Saisie manuelle', 5);
  addLine('Regime fiscal', normalizeText(regimeDisplay), 5);
  addLine('Tranche Marginale d\'Imposition', formatPercentPDF(tax_config.tmi_rate || 0, 2), 5);
  addLine('Prelevements sociaux', formatPercentPDF(tax_config.social_rate || 0, 2), 5);
  addSeparator();
  addLine('TAUX GLOBAL D\'IMPOSITION', formatPercentPDF((tax_config.tmi_rate || 0) + (tax_config.social_rate || 0), 2), 0, true);

  y += 6;
  addSubtitle('Options de deduction fiscale');
  addLine('Interets d\'emprunt deductibles', tax_config.interest_deductible ? 'Oui' : 'Non', 5);
  addLine('Charges d\'exploitation deductibles', tax_config.costs_deductible ? 'Oui' : 'Non', 5);
  addLine('Amortissements comptables', tax_config.amortization_enabled ? 'Actives' : 'Desactives', 5);
  if (tax_config.deficit_enabled) addLine('Report des deficits fonciers', 'Active', 5);

  y += 10;

  // Tax evolution
  addSubtitle('Evolution de l\'imposition annuelle');
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 55, 3, 3, 'F');

  const taxData = (results?.cashflow_series || []).map(cf => ({
    x: cf.year,
    y: cf.tax
  }));

  if (taxData.length > 0) {
    drawLineChart(doc, margin, y, contentWidth, 55, taxData, {
      title: 'Fiscalite annuelle projetee',
      lineColor: COLORS.warning,
      showDots: true,
      yFormatter: (v) => formatCurrencyPDF(v),
      yTickCount: 4,
    });
  }

  // ==========================================================================
  // PAGE 9: STRESS TESTS
  // ==========================================================================
  newPage();
  addSectionTitle('Analyse de Resilience - Stress Tests');

  // Stress hypotheses box
  doc.setFillColor(COLORS.warningLight[0], COLORS.warningLight[1], COLORS.warningLight[2]);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');
  doc.setDrawColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text('Hypotheses de stress appliquees (scenario prudent)', margin + 5, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  const stressParams = [
    `Loyer: -${config.haircuts.rentHaircut}%`,
    `Vacance: +${config.haircuts.vacancyHaircut}%`,
    `Taux credit: +${config.haircuts.rateHaircut} point(s)`,
    `Charges: +${config.haircuts.costsHaircut}%`
  ];
  doc.text(normalizeText(stressParams.join('   |   ')), margin + 5, y + 20);

  y += 32;

  // Comparison table with clear headers
  addSubtitle('Comparaison Scenario Base vs Scenario Prudent');
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 55, 3, 3, 'F');

  // Table headers with proper alignment
  const tableColWidths = [55, 45, 45, 35];
  let tableX = margin + 5;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text('Indicateur', tableX, y + 10);
  doc.text('Scenario Base', tableX + tableColWidths[0], y + 10);
  doc.text('Scenario Prudent', tableX + tableColWidths[0] + tableColWidths[1], y + 10);
  doc.text('Ecart', tableX + tableColWidths[0] + tableColWidths[1] + tableColWidths[2], y + 10);
  
  // Draw header separator
  doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.setLineWidth(0.3);
  doc.line(margin + 5, y + 14, pageWidth - margin - 5, y + 14);
  
  doc.setFont('helvetica', 'normal');

  const baseDSCR = results?.dscr || 0;
  const baseCashflow = results?.monthly_cashflow_after_tax || 0;
  const baseRent = rental?.rent_monthly || 0;
  const basePayment = financing.monthly_payment || 0;

  const comparisons = [
    { 
      label: 'Loyer mensuel', 
      base: formatCurrencyPDF(baseRent), 
      prudent: formatCurrencyPDF(prudentRent), 
      variation: `-${config.haircuts.rentHaircut}%` 
    },
    { 
      label: 'Mensualite credit', 
      base: formatCurrencyPDF(basePayment), 
      prudent: formatCurrencyPDF(prudentMonthlyPayment), 
      variation: basePayment > 0 ? `+${((prudentMonthlyPayment / basePayment - 1) * 100).toFixed(0)}%` : 'N/A'
    },
    { 
      label: 'DSCR (couverture dette)', 
      base: baseDSCR.toFixed(2), 
      prudent: prudentDSCR.toFixed(2), 
      variation: baseDSCR > 0 ? `${((prudentDSCR / baseDSCR - 1) * 100).toFixed(0)}%` : 'N/A'
    },
    { 
      label: 'Cashflow net mensuel', 
      base: formatCurrencyPDF(baseCashflow), 
      prudent: formatCurrencyPDF(prudentCashflowMonthly), 
      variation: formatCurrencyPDF(prudentCashflowMonthly - baseCashflow)
    },
  ];

  comparisons.forEach((comp, i) => {
    const rowY = y + 22 + i * 8;
    doc.setFontSize(7);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(normalizeText(comp.label), tableX, rowY);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(comp.base, tableX + tableColWidths[0], rowY);
    
    doc.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
    doc.text(comp.prudent, tableX + tableColWidths[0] + tableColWidths[1], rowY);
    
    doc.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
    doc.text(comp.variation, tableX + tableColWidths[0] + tableColWidths[1] + tableColWidths[2], rowY);
    doc.setFont('helvetica', 'normal');
  });

  y += 62;

  // DSCR comparison chart
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F');

  drawHorizontalBarChart(doc, margin, y, contentWidth, 50, [
    { label: 'DSCR Base', value: baseDSCR, color: baseDSCR >= 1.2 ? COLORS.success : COLORS.warning },
    { label: 'DSCR Prudent', value: prudentDSCR, color: prudentDSCR >= 1.2 ? COLORS.success : COLORS.danger },
    { label: 'Seuil bancaire (1.20)', value: 1.20, color: COLORS.muted },
  ], {
    title: 'Analyse du ratio de couverture de dette (DSCR)',
    valueFormatter: (v) => v.toFixed(2),
  });

  y += 58;

  // Conclusion with clear interpretation
  const conclusionBg = prudentDSCR >= 1.2 ? COLORS.successLight : prudentDSCR >= 1 ? COLORS.warningLight : COLORS.dangerLight;
  const conclusionBorder = prudentDSCR >= 1.2 ? COLORS.success : prudentDSCR >= 1 ? COLORS.warning : COLORS.danger;
  
  doc.setFillColor(conclusionBg[0], conclusionBg[1], conclusionBg[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F');
  doc.setDrawColor(conclusionBorder[0], conclusionBorder[1], conclusionBorder[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  
  let conclusionTitle = '';
  let conclusionText = '';
  if (prudentDSCR >= 1.2) {
    conclusionTitle = 'Resilience confirmee';
    conclusionText = 'Le projet conserve une marge de securite suffisante meme en scenario degrade.';
  } else if (prudentDSCR >= 1) {
    conclusionTitle = 'Resilience limite';
    conclusionText = 'Le projet reste a l\'equilibre en scenario prudent, mais sans marge de securite.';
  } else {
    conclusionTitle = 'Risque identifie';
    conclusionText = 'Le scenario prudent genere un deficit. Un examen approfondi est recommande.';
  }
  
  doc.text(normalizeText(conclusionTitle), margin + 5, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(normalizeText(conclusionText), margin + 5, y + 18);

  // ==========================================================================
  // PAGE 10: WEALTH PROJECTION
  // ==========================================================================
  newPage();
  addSectionTitle('Patrimoine a Terme');

  const patSeries = results?.patrimony_series || [];
  const lastYear = patSeries[patSeries.length - 1];

  addSubtitle('Projection patrimoniale');
  if (lastYear) {
    addLine('Horizon', `${sale_data.resale_year || 20} ans`, 5);
    addLine('Croissance valeur estimee', formatPercentPDF(sale_data.property_growth_rate || 2) + '/an', 5);
    addLine('Valeur du bien a terme', formatCurrencyPDF(lastYear.property_value), 0, true);
    addLine('Dette restante', formatCurrencyPDF(lastYear.remaining_debt), 5);
    addLine('Cashflows cumules', formatCurrencyPDF(lastYear.cumulative_cashflow), 5);
    addSeparator();
    addLine('PATRIMOINE NET ESTIME', formatCurrencyPDF(lastYear.net_patrimony), 0, true);
  }

  y += 10;

  // Multi-line chart
  const propData = patSeries.map(p => ({ x: p.year, y: p.property_value }));
  const debtData = patSeries.map(p => ({ x: p.year, y: p.remaining_debt }));
  const patData = patSeries.map(p => ({ x: p.year, y: p.net_patrimony }));

  if (patSeries.length > 0) {
    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(margin, y, contentWidth, 75, 3, 3, 'F');

    drawMultiLineChart(doc, margin, y, contentWidth, 75, [
      { data: propData, color: COLORS.muted, label: 'Valeur bien', dashed: true },
      { data: debtData, color: COLORS.danger, label: 'Dette' },
      { data: patData, color: COLORS.primary, label: 'Patrimoine net' },
    ], {
      title: 'Evolution : Valeur, Dette et Patrimoine Net',
      yFormatter: (v) => `${(v / 1000).toFixed(0)}k`,
    });

    y += 85;
  }

  // TRI
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Taux de Rendement Interne (TRI)', margin + 5, y + 10);
  doc.setFontSize(14);
  doc.text(formatPercentPDF(results?.irr || 0, 1), margin + 5, y + 20);
  doc.setFont('helvetica', 'normal');

  doc.setFontSize(8);
  doc.text('Performance globale de l\'investissement sur la duree', pageWidth - margin - 5, y + 15, { align: 'right' });

  // ==========================================================================
  // PAGE 11: HYPOTHESES
  // ==========================================================================
  newPage();
  addSectionTitle('Hypotheses de Simulation');

  // Introduction text
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(normalizeText('Les projections financieres de ce dossier reposent sur les hypotheses suivantes :'), margin, y);
  y += 8;

  const hypotheses = [
    {
      cat: 'Acquisition', items: [
        `Prix d'achat net vendeur : ${formatCurrencyPDF(acquisition.price_net_seller)}`,
        `Frais de notaire : ${formatPercentPDF((acquisition.notary_fee_amount / acquisition.price_net_seller) * 100, 1)} ${acquisition.notary_fee_estimated ? '(estimation standard)' : '(montant reel)'}`,
        acquisition.works_amount > 0 ? `Budget travaux prevu : ${formatCurrencyPDF(acquisition.works_amount)}` : null,
        acquisition.furniture_amount > 0 ? `Budget mobilier : ${formatCurrencyPDF(acquisition.furniture_amount)}` : null,
      ].filter(Boolean)
    },
    {
      cat: 'Structure de Financement', items: [
        `Capital emprunte : ${formatCurrencyPDF(financing.loan_amount)} sur ${(financing.duration_months || 0) / 12} ans`,
        `Taux d'interet nominal : ${formatPercentPDF(financing.nominal_rate || 0, 2)} (taux fixe)`,
        `Assurance emprunteur : ${formatPercentPDF(financing.insurance_value || 0, 2)} du capital initial par an`,
        `Apport personnel : ${formatCurrencyPDF(financing.down_payment)} (${formatPercentPDF((financing.down_payment / totalCost) * 100, 1)} du projet)`,
      ]
    },
    {
      cat: 'Revenus Locatifs', items: [
        `Loyer mensuel hors charges : ${formatCurrencyPDF(rental?.rent_monthly || 0)}`,
        `Indexation annuelle du loyer : ${formatPercentPDF(rental?.rent_growth_rate || 1, 2)}`,
        `Taux de vacance locative : ${formatPercentPDF(rental?.vacancy_rate || 5, 2)}`,
        `Provision pour impayes : ${formatPercentPDF(rental?.default_rate || 2, 2)}`,
      ]
    },
    {
      cat: 'Charges d\'Exploitation', items: [
        `Taxe fonciere annuelle : ${formatCurrencyPDF(operating_costs.property_tax_annual || 0)}`,
        `Charges de copropriete non recuperables : ${formatCurrencyPDF(operating_costs.condo_nonrecoverable_annual || 0)}/an`,
        `Assurance PNO : ${formatCurrencyPDF(operating_costs.insurance_annual || 0)}/an`,
        `Revalorisation annuelle des charges : ${formatPercentPDF(operating_costs.costs_growth_rate || 2, 2)}`,
      ]
    },
    {
      cat: 'Parametres Fiscaux', items: [
        `Regime d'imposition : ${normalizeText((tax_config.regime_key || 'Non defini').replace(/_/g, ' ').replace(/lmnp/gi, 'LMNP').replace(/sci/gi, 'SCI'))}`,
        `Tranche marginale d'imposition (TMI) : ${formatPercentPDF(tax_config.tmi_rate || 0, 0)}`,
        `Prelevements sociaux : ${formatPercentPDF(tax_config.social_rate || 0, 2)}`,
        tax_config.amortization_enabled ? 'Amortissements comptables actives' : 'Pas d\'amortissement',
      ].filter(Boolean)
    },
    {
      cat: 'Hypotheses de Revente', items: [
        `Horizon de detention : ${sale_data.resale_year || 20} ans`,
        `Croissance estimee de la valeur : ${formatPercentPDF(sale_data.property_growth_rate || 2, 2)}/an`,
        `Taxation des plus-values : ${formatPercentPDF(sale_data.capital_gain_tax_rate || 36.2, 2)} (avant abattements)`,
      ]
    },
  ];

  hypotheses.forEach(section => {
    // Section header with background
    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text(normalizeText(section.cat), margin + 3, y + 4.5);
    y += 9;
    
    doc.setFont('helvetica', 'normal');
    section.items.forEach(item => {
      if (item) {
        doc.setFontSize(7);
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.text(normalizeText(`  ${item}`), margin + 3, y);
        y += 5;
      }
    });
    y += 3;
  });

  // ==========================================================================
  // PAGE 12: DISCLAIMER
  // ==========================================================================
  newPage();
  addSectionTitle('Avertissement Professionnel');

  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 95, 3, 3, 'F');

  doc.setFontSize(8);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

  const disclaimers = [
    'Ce document est une simulation financiere reposant sur des hypotheses fournies par l\'utilisateur.',
    '',
    'Il ne constitue ni une offre de credit, ni un engagement de financement de la part d\'un',
    'etablissement bancaire ou de CAPITALUM.',
    '',
    'Les projections financieres sont fondees sur des hypotheses susceptibles d\'evoluer en fonction',
    'des conditions de marche, des taux d\'interet, de la fiscalite et d\'autres facteurs economiques.',
    '',
    'Les performances passees ou simulees ne prejugent pas des performances futures.',
    '',
    'Avant toute decision d\'investissement, il est recommande de consulter un conseiller en gestion',
    'de patrimoine ou un professionnel du financement immobilier.',
    '',
    'CAPITALUM decline toute responsabilite quant aux decisions prises sur la base de ce document.',
    '',
    'Les indicateurs DSCR, TRI et rentabilites sont calcules selon les normes bancaires francaises.',
  ];

  let disclaimerY = y + 10;
  disclaimers.forEach(line => {
    doc.text(normalizeText(line), margin + 8, disclaimerY);
    disclaimerY += 5;
  });

  y += 105;

  // Signature block
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'F');

  doc.setFontSize(8);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text('Document genere automatiquement via la plateforme CAPITALUM', margin + 8, y + 12);
  doc.text(normalizeText(`Date : ${dateStr}`), margin + 8, y + 22);
  doc.text(normalizeText(`Client : ${clientInfo.fullName}`), margin + 8, y + 32);

  doc.setFontSize(7);
  doc.text('www.capitalum.fr', pageWidth - margin - 8, y + 32, { align: 'right' });

  // ==========================================================================
  // SAVE PDF
  // ==========================================================================

  const filename = `dossier-financement-locatif-${clientInfo.fullName.replace(/\s+/g, '-').toLowerCase()}-${project.title?.replace(/\s+/g, '-').toLowerCase() || 'projet'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Legacy wrapper for backward compatibility
export async function generatePrudentLocatifPDF(data: FullProjectData, haircuts: { rentHaircut: number; chargesMarkup: number }): Promise<void> {
  await generateLocatifBankPDF(data, {
    showPrudentScenario: true,
    haircuts: {
      rentHaircut: haircuts.rentHaircut,
      vacancyHaircut: 50,
      rateHaircut: 1,
      costsHaircut: haircuts.chargesMarkup,
    }
  });
}
