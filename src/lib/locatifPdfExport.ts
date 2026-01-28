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
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  // Replace non-breaking spaces with regular spaces for PDF compatibility
  return formatted.replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ');
}

function formatPercentPDF(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

function normalizeText(text: string): string {
  // Replace problematic characters for PDF rendering
  return text
    .replace(/é/g, 'e')
    .replace(/è/g, 'e')
    .replace(/ê/g, 'e')
    .replace(/ë/g, 'e')
    .replace(/à/g, 'a')
    .replace(/â/g, 'a')
    .replace(/ô/g, 'o')
    .replace(/û/g, 'u')
    .replace(/ù/g, 'u')
    .replace(/î/g, 'i')
    .replace(/ï/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/œ/g, 'oe')
    .replace(/≤/g, 'max')
    .replace(/≥/g, 'min')
    .replace(/€/g, 'EUR')
    .replace(/'/g, "'");
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

  // Key metrics in 2 columns
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth / 2 - 4, 65, 3, 3, 'F');
  doc.roundedRect(margin + contentWidth / 2 + 4, y, contentWidth / 2 - 4, 65, 3, 3, 'F');

  // Left column - Project
  let leftY = y + 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('PROJET IMMOBILIER', margin + 5, leftY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  leftY += 10;
  const leftMetrics = [
    ['Cout total projet', formatCurrencyPDF(totalCost)],
    ['Apport personnel', formatCurrencyPDF(financing.down_payment)],
    ['Montant finance', formatCurrencyPDF(financing.loan_amount)],
    ['Duree / Taux', `${(financing.duration_months || 0) / 12} ans a ${financing.nominal_rate || 0}%`],
    ['Mensualite', formatCurrencyPDF(financing.monthly_payment)],
  ];
  leftMetrics.forEach(([label, value]) => {
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(normalizeText(label), margin + 5, leftY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(normalizeText(value), margin + 5, leftY + 5);
    doc.setFont('helvetica', 'normal');
    leftY += 11;
  });

  // Right column - Performance
  let rightY = y + 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  doc.text('PERFORMANCE', margin + contentWidth / 2 + 8, rightY);

  doc.setFont('helvetica', 'normal');
  rightY += 10;
  const rightMetrics = [
    ['Loyer mensuel', formatCurrencyPDF(rental?.rent_monthly || 0)],
    ['Cashflow net/mois', formatCurrencyPDF(results?.monthly_cashflow_after_tax || 0)],
    ['Rentabilite nette', formatPercentPDF(results?.net_yield || 0)],
    ['DSCR', (results?.dscr || 0).toFixed(2)],
    ['TRI (IRR)', formatPercentPDF(results?.irr || 0, 1)],
  ];
  rightMetrics.forEach(([label, value]) => {
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(normalizeText(label), margin + contentWidth / 2 + 8, rightY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(normalizeText(value), margin + contentWidth / 2 + 8, rightY + 5);
    doc.setFont('helvetica', 'normal');
    rightY += 11;
  });

  y += 75;

  // Status badge
  const isViable = (results?.dscr || 0) >= 1.2 && (results?.monthly_cashflow_after_tax || 0) >= -100;
  const isWarning = (results?.dscr || 0) >= 1 && (results?.dscr || 0) < 1.2;
  let statusText = 'PROJET EQUILIBRE';
  let statusColor = COLORS.success;
  let statusBg = COLORS.successLight;
  if (!isViable && isWarning) {
    statusText = 'PROJET A SURVEILLER';
    statusColor = COLORS.warning;
    statusBg = COLORS.warningLight;
  } else if (!isViable && !isWarning) {
    statusText = 'PROJET SOUS TENSION';
    statusColor = COLORS.danger;
    statusBg = COLORS.dangerLight;
  }

  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
  doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'S');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(normalizeText(statusText), pageWidth / 2, y + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  y += 28;

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
  addLine('Loyer mensuel HC', formatCurrencyPDF(rental?.rent_monthly || 0), 0, true);
  addLine('Loyer annuel brut', formatCurrencyPDF(annualRent), 5);
  addLine('Charges recoverables', formatCurrencyPDF(rental?.recoverable_charges || 0) + '/mois', 5);
  addLine('Vacance locative', formatPercentPDF(rental?.vacancy_rate || 5), 5);
  addLine("Taux d'impayes", formatPercentPDF(rental?.default_rate || 2), 5);
  addLine('Revalorisation annuelle', formatPercentPDF(rental?.rent_growth_rate || 1), 5);
  addSeparator();
  addLine('REVENU EFFECTIF ANNUEL', formatCurrencyPDF(effectiveRent), 0, true);

  y += 6;
  addSubtitle("Charges d'exploitation");
  addLine('Taxe fonciere', formatCurrencyPDF(operating_costs.property_tax_annual || 0) + '/an', 5);
  addLine('Charges copropriete (non recup.)', formatCurrencyPDF(operating_costs.condo_nonrecoverable_annual || 0) + '/an', 5);
  addLine('Assurance PNO', formatCurrencyPDF(operating_costs.insurance_annual || 0) + '/an', 5);
  if ((operating_costs.management_pct || 0) > 0) addLine('Gestion locative', formatPercentPDF(operating_costs.management_pct || 0), 5);
  addLine('CFE', formatCurrencyPDF(operating_costs.cfe_annual || 0) + '/an', 5);
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

  // KPI Cards
  const kpis = [
    { label: 'Rentabilite brute', value: formatPercentPDF(results?.gross_yield || 0), desc: 'Loyer brut / Cout total', color: COLORS.primaryLight },
    { label: 'Rentabilite nette', value: formatPercentPDF(results?.net_yield || 0), desc: 'Apres charges, avant impots', color: COLORS.success },
    { label: 'Rentabilite nette-nette', value: formatPercentPDF(results?.net_net_yield || 0), desc: 'Apres charges et impots', color: COLORS.warning },
    { label: 'DSCR', value: (results?.dscr || 0).toFixed(2), desc: 'NOI / Service dette (seuil 1.20)', color: COLORS.primary },
    { label: 'TRI (IRR)', value: formatPercentPDF(results?.irr || 0, 1), desc: 'Performance globale', color: COLORS.success },
    { label: 'Loyer seuil', value: formatCurrencyPDF(results?.break_even_rent || 0), desc: 'Break-even mensuel', color: COLORS.warning },
  ];

  const cardWidth = (contentWidth - 10) / 3;
  const cardHeight = 30;

  kpis.forEach((kpi, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const kx = margin + col * (cardWidth + 5);
    const cardY = y + row * (cardHeight + 8);

    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(kx, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.setLineWidth(1);
    doc.roundedRect(kx, cardY, cardWidth, cardHeight, 3, 3, 'S');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(kpi.value, kx + cardWidth / 2, cardY + 12, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(normalizeText(kpi.label), kx + cardWidth / 2, cardY + 20, { align: 'center' });

    doc.setFontSize(6);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(normalizeText(kpi.desc), kx + cardWidth / 2, cardY + 26, { align: 'center' });
  });

  y += 85;

  // Yield comparison chart
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 55, 3, 3, 'F');

  drawHorizontalBarChart(doc, margin, y, contentWidth, 55, [
    { label: 'Brute', value: results?.gross_yield || 0, color: COLORS.primaryLight },
    { label: 'Nette', value: results?.net_yield || 0, color: COLORS.success },
    { label: 'Nette-nette', value: results?.net_net_yield || 0, color: COLORS.warning },
  ], {
    title: 'Comparaison des rentabilites',
    valueFormatter: (v) => formatPercentPDF(v),
  });

  // ==========================================================================
  // PAGE 7: CASHFLOW ANALYSIS
  // ==========================================================================
  newPage();
  addSectionTitle('Analyse des Cashflows');

  // Monthly cashflow breakdown
  addSubtitle('Decomposition mensuelle');
  const monthlyRent = rental?.rent_monthly || 0;
  const monthlyCharges = totalOperatingCosts / 12;
  const monthlyDebt = financing.monthly_payment || 0;
  const monthlyCashflowBefore = (results?.monthly_cashflow_before_tax || 0);
  const monthlyTax = (results?.monthly_cashflow_before_tax || 0) - (results?.monthly_cashflow_after_tax || 0);
  const monthlyCashflowAfter = results?.monthly_cashflow_after_tax || 0;

  addLine('Loyer mensuel', formatCurrencyPDF(monthlyRent), 0);
  addLine('- Charges mensuelles', '- ' + formatCurrencyPDF(monthlyCharges), 5);
  addLine('- Mensualite credit', '- ' + formatCurrencyPDF(monthlyDebt), 5);
  addSeparator();
  addLine('= Cashflow avant impots', formatCurrencyPDF(monthlyCashflowBefore), 0, true);
  addLine('- Imposition', '- ' + formatCurrencyPDF(Math.max(0, monthlyTax)), 5);
  addSeparator();
  addLine('= CASHFLOW NET MENSUEL', formatCurrencyPDF(monthlyCashflowAfter), 0, true);

  y += 10;

  // Cashflow evolution chart
  const cashflowData = (results?.cashflow_series || []).map(cf => ({
    x: cf.year,
    y: cf.cashflow_after_tax
  }));

  if (cashflowData.length > 0) {
    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(margin, y, contentWidth, 65, 3, 3, 'F');

    drawLineChart(doc, margin, y, contentWidth, 65, cashflowData, {
      title: 'Evolution du cashflow annuel apres impots',
      lineColor: monthlyCashflowAfter >= 0 ? COLORS.success : COLORS.danger,
      showDots: true,
      yFormatter: (v) => formatCurrencyPDF(v),
      yTickCount: 5,
    });

    y += 70;
  }

  // Cashflow table
  if (y < pageHeight - 60) {
    addSubtitle('Tableau des 5 premieres annees');
    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(margin, y, contentWidth, 40, 2, 2, 'F');

    // Headers
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    const cols = ['Annee', 'Revenus', 'Charges', 'Credit', 'Impots', 'Cashflow'];
    const colWidths = [20, 30, 30, 30, 30, 30];
    let colX = margin + 3;
    cols.forEach((col, i) => {
      doc.text(normalizeText(col), colX, y + 8);
      colX += colWidths[i];
    });
    doc.setFont('helvetica', 'normal');

    // Rows
    (results?.cashflow_series || []).slice(0, 5).forEach((cf, i) => {
      const rowY = y + 15 + i * 5;
      colX = margin + 3;
      doc.setFontSize(7);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text(`An ${cf.year}`, colX, rowY); colX += colWidths[0];
      doc.text(formatCurrencyPDF(cf.rental_income), colX, rowY); colX += colWidths[1];
      doc.text(formatCurrencyPDF(cf.operating_costs), colX, rowY); colX += colWidths[2];
      doc.text(formatCurrencyPDF(cf.loan_payment), colX, rowY); colX += colWidths[3];
      doc.text(formatCurrencyPDF(cf.tax), colX, rowY); colX += colWidths[4];
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(cf.cashflow_after_tax >= 0 ? COLORS.success[0] : COLORS.danger[0], cf.cashflow_after_tax >= 0 ? COLORS.success[1] : COLORS.danger[1], cf.cashflow_after_tax >= 0 ? COLORS.success[2] : COLORS.danger[2]);
      doc.text(formatCurrencyPDF(cf.cashflow_after_tax), colX, rowY);
      doc.setFont('helvetica', 'normal');
    });
  }

  // ==========================================================================
  // PAGE 8: TAX CONFIGURATION
  // ==========================================================================
  newPage();
  addSectionTitle('Fiscalite');

  addSubtitle('Configuration fiscale');
  addLine('Mode', tax_config.tax_mode === 'simple' ? 'Simple' : tax_config.tax_mode === 'advanced' ? 'Avance' : 'Override', 5);
  addLine('Regime', normalizeText((tax_config.regime_key || 'Non defini').replace(/_/g, ' ')), 5);
  addLine('Tranche marginale (TMI)', formatPercentPDF(tax_config.tmi_rate || 0), 5);
  addLine('Prelevements sociaux', formatPercentPDF(tax_config.social_rate || 0), 5);
  addLine('Taux global', formatPercentPDF((tax_config.tmi_rate || 0) + (tax_config.social_rate || 0)), 0, true);

  y += 6;
  addSubtitle('Options de deduction');
  addLine('Interets deductibles', tax_config.interest_deductible ? 'Oui' : 'Non', 5);
  addLine('Charges deductibles', tax_config.costs_deductible ? 'Oui' : 'Non', 5);
  addLine('Amortissements actives', tax_config.amortization_enabled ? 'Oui' : 'Non', 5);
  if (tax_config.deficit_enabled) addLine('Report de deficit', 'Active', 5);

  y += 10;

  // Tax evolution
  addSubtitle('Evolution de l\'imposition');
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 55, 3, 3, 'F');

  const taxData = (results?.cashflow_series || []).map(cf => ({
    x: cf.year,
    y: cf.tax
  }));

  if (taxData.length > 0) {
    drawLineChart(doc, margin, y, contentWidth, 55, taxData, {
      title: 'Impots annuels',
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
  addSectionTitle('Analyse de Resilience (Stress Tests)');

  // Stress hypotheses
  doc.setFillColor(COLORS.warningLight[0], COLORS.warningLight[1], COLORS.warningLight[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text('Hypotheses de stress appliquees :', margin + 5, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(normalizeText(`Loyer -${config.haircuts.rentHaircut}%  |  Vacance +${config.haircuts.vacancyHaircut}%  |  Taux +${config.haircuts.rateHaircut} pts  |  Charges +${config.haircuts.costsHaircut}%`), margin + 5, y + 16);

  y += 28;

  // Comparison table
  addSubtitle('Comparaison Base vs Prudent');
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F');

  // Headers
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text('Indicateur', margin + 5, y + 10);
  doc.text('Base', margin + 65, y + 10);
  doc.text('Prudent', margin + 105, y + 10);
  doc.text('Variation', margin + 150, y + 10);
  doc.setFont('helvetica', 'normal');

  const comparisons = [
    { label: 'Loyer mensuel', base: formatCurrencyPDF(rental?.rent_monthly || 0), prudent: formatCurrencyPDF(prudentRent), variation: `-${config.haircuts.rentHaircut}%` },
    { label: 'Mensualite credit', base: formatCurrencyPDF(financing.monthly_payment), prudent: formatCurrencyPDF(prudentMonthlyPayment), variation: `+${((prudentMonthlyPayment / (financing.monthly_payment || 1) - 1) * 100).toFixed(0)}%` },
    { label: 'DSCR', base: (results?.dscr || 0).toFixed(2), prudent: prudentDSCR.toFixed(2), variation: `${((prudentDSCR / (results?.dscr || 1) - 1) * 100).toFixed(0)}%` },
    { label: 'Cashflow/mois', base: formatCurrencyPDF(results?.monthly_cashflow_after_tax || 0), prudent: formatCurrencyPDF(prudentCashflowMonthly), variation: formatCurrencyPDF(prudentCashflowMonthly - (results?.monthly_cashflow_after_tax || 0)) },
  ];

  comparisons.forEach((comp, i) => {
    const rowY = y + 20 + i * 8;
    doc.setFontSize(7);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(normalizeText(comp.label), margin + 5, rowY);
    doc.text(comp.base, margin + 65, rowY);
    doc.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
    doc.text(comp.prudent, margin + 105, rowY);
    doc.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
    doc.text(comp.variation, margin + 150, rowY);
  });

  y += 60;

  // DSCR comparison chart
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F');

  drawHorizontalBarChart(doc, margin, y, contentWidth, 50, [
    { label: 'DSCR Base', value: results?.dscr || 0, color: COLORS.success },
    { label: 'DSCR Prudent', value: prudentDSCR, color: COLORS.warning },
    { label: 'Seuil bancaire', value: 1.20, color: COLORS.danger },
  ], {
    title: 'Comparaison DSCR',
    valueFormatter: (v) => v.toFixed(2),
  });

  y += 58;

  // Conclusion
  doc.setFillColor(prudentDSCR >= 1.2 ? COLORS.successLight[0] : COLORS.warningLight[0], prudentDSCR >= 1.2 ? COLORS.successLight[1] : COLORS.warningLight[1], prudentDSCR >= 1.2 ? COLORS.successLight[2] : COLORS.warningLight[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');

  doc.setFontSize(8);
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  if (prudentDSCR >= 1.2) {
    doc.text(normalizeText('Le dossier conserve une marge de securite significative meme en scenario degrade.'), margin + 5, y + 12);
  } else if (prudentDSCR >= 1) {
    doc.text(normalizeText('Le projet reste a l\'equilibre en scenario prudent mais sans marge.'), margin + 5, y + 12);
  } else {
    doc.text(normalizeText('Attention : le scenario prudent genere un deficit. Risque bancaire eleve.'), margin + 5, y + 12);
  }

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
  addSectionTitle('Hypotheses et Methodologie');

  const hypotheses = [
    {
      cat: 'Acquisition', items: [
        `Prix d'achat net vendeur : ${formatCurrencyPDF(acquisition.price_net_seller)}`,
        `Frais de notaire : ${formatPercentPDF((acquisition.notary_fee_amount / acquisition.price_net_seller) * 100, 1)} ${acquisition.notary_fee_estimated ? '(estimation)' : '(reel)'}`,
        acquisition.works_amount > 0 ? `Travaux prevus : ${formatCurrencyPDF(acquisition.works_amount)}` : null,
      ].filter(Boolean)
    },
    {
      cat: 'Financement', items: [
        `Emprunt : ${formatCurrencyPDF(financing.loan_amount)} sur ${(financing.duration_months || 0) / 12} ans`,
        `Taux nominal : ${formatPercentPDF(financing.nominal_rate || 0)} (fixe)`,
        `Assurance : ${formatPercentPDF(financing.insurance_value || 0)} du capital/an`,
        `Apport : ${formatCurrencyPDF(financing.down_payment)} (${formatPercentPDF((financing.down_payment / totalCost) * 100, 0)})`,
      ]
    },
    {
      cat: 'Revenus locatifs', items: [
        `Loyer mensuel : ${formatCurrencyPDF(rental?.rent_monthly || 0)}`,
        `Revalorisation annuelle : ${formatPercentPDF(rental?.rent_growth_rate || 1)}`,
        `Vacance locative : ${formatPercentPDF(rental?.vacancy_rate || 5)}`,
        `Taux d'impayes : ${formatPercentPDF(rental?.default_rate || 2)}`,
      ]
    },
    {
      cat: 'Charges', items: [
        `Taxe fonciere : ${formatCurrencyPDF(operating_costs.property_tax_annual || 0)}/an`,
        `Charges copropriete : ${formatCurrencyPDF(operating_costs.condo_nonrecoverable_annual || 0)}/an`,
        `Revalorisation charges : ${formatPercentPDF(operating_costs.costs_growth_rate || 2)}/an`,
      ]
    },
    {
      cat: 'Fiscalite', items: [
        `Regime : ${normalizeText((tax_config.regime_key || 'Non defini').replace(/_/g, ' '))}`,
        `TMI : ${formatPercentPDF(tax_config.tmi_rate || 0)}`,
        `Prelevements sociaux : ${formatPercentPDF(tax_config.social_rate || 0)}`,
        tax_config.amortization_enabled ? 'Amortissements actives' : null,
      ].filter(Boolean)
    },
    {
      cat: 'Revente', items: [
        `Horizon : ${sale_data.resale_year || 20} ans`,
        `Croissance valeur : ${formatPercentPDF(sale_data.property_growth_rate || 2)}/an`,
        `Taxation plus-value : ${formatPercentPDF(sale_data.capital_gain_tax_rate || 36.2)}`,
      ]
    },
  ];

  hypotheses.forEach(section => {
    addSubtitle(section.cat);
    section.items.forEach(item => {
      if (item) {
        doc.setFontSize(8);
        doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
        doc.text(normalizeText(`• ${item}`), margin + 5, y);
        y += 5;
      }
    });
    y += 4;
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
