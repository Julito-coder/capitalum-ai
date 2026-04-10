import jsPDF from 'jspdf';

// ── Helpers ──────────────────────────────────────

/** Normalise les accents français pour jsPDF (Helvetica ne les supporte pas) */
function norm(s: string): string {
  if (!s) return '';
  return s
    .replace(/[àâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ÀÂÄ]/g, 'A')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÎÏ]/g, 'I')
    .replace(/[ÔÖ]/g, 'O')
    .replace(/[ÙÛÜ]/g, 'U')
    .replace(/[Ç]/g, 'C')
    .replace(/[≤]/g, '<=')
    .replace(/[≥]/g, '>=')
    .replace(/[€]/g, 'EUR')
    .replace(/[–—]/g, '-');
}

function fmtEur(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${intPart},${parts[1]} EUR`;
}

function fmtDate(d: string): string {
  if (!d) return '-';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR');
  } catch {
    return d;
  }
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

// ── Élio brand colors (RGB) ────────────────
const BRAND = {
  navy: [27, 58, 92] as [number, number, number],
  navyLight: [37, 99, 160] as [number, number, number],
  gold: [200, 148, 62] as [number, number, number],
  green: [75, 130, 100] as [number, number, number],
  red: [204, 85, 61] as [number, number, number],
  orange: [217, 119, 6] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  grayLight: [245, 243, 240] as [number, number, number],
  grayMedium: [148, 163, 184] as [number, number, number],
  grayDark: [30, 41, 59] as [number, number, number],
  textDark: [27, 46, 61] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
};

// ── Types for the export functions ──────────────

export interface CryptoAccount {
  name: string;
  accountType: string;
  country: string;
  isForeignAccount: boolean;
}

export interface CryptoTxLine {
  date: string;
  assetFrom: string;
  prixCession: number;
  prixTotalAcquisitionPortefeuille?: number;
  valeurGlobalePortefeuille?: number;
  fractionCedee: number;
  prixAcquisitionFraction?: number;
  plusValue: number;
  frais: number;
  accountName?: string;
}

export interface CryptoTotals {
  totalCessionsEur: number;
  totalAcquisitionsEur: number;
  portfolioValueEur: number;
  gainsEur: number;
  lossesEur: number;
  netGainEur: number;
  case3AN: number;
  case3BN: number;
  regime: string;
}

export interface CryptoAuditEntry {
  step: string;
  formula: string;
  result: number;
  inputs?: Record<string, number | string>;
}

// ── PDF Layout Engine ───────────────────────────

class PdfBuilder {
  private doc: jsPDF;
  private y: number = 0;
  private pageW: number;
  private pageH: number;
  private marginL = 16;
  private marginR = 16;
  private contentW: number;
  private taxYear: number;
  private docTitle: string;

  constructor(taxYear: number, docTitle: string) {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageW = this.doc.internal.pageSize.getWidth();
    this.pageH = this.doc.internal.pageSize.getHeight();
    this.contentW = this.pageW - this.marginL - this.marginR;
    this.taxYear = taxYear;
    this.docTitle = docTitle;
    this.y = 0;
  }

  // ── Header / Footer ─────────────────────────

  drawHeader(): void {
    // Navy banner
    this.doc.setFillColor(...BRAND.navy);
    this.doc.rect(0, 0, this.pageW, 42, 'F');

    // Accent line
    this.doc.setFillColor(...BRAND.gold);
    this.doc.rect(0, 42, this.pageW, 1.5, 'F');

    // Logo text
    this.doc.setFontSize(22);
    this.doc.setFont('Helvetica', 'bold');
    this.doc.setTextColor(...BRAND.white);
    this.doc.text('ELIO', this.marginL, 18);

    // Subtitle
    this.doc.setFontSize(9);
    this.doc.setFont('Helvetica', 'normal');
    this.doc.setTextColor(200, 190, 170);
    this.doc.text(norm('Copilote administratif & financier'), this.marginL, 25);

    // Document title
    this.doc.setFontSize(14);
    this.doc.setFont('Helvetica', 'bold');
    this.doc.setTextColor(...BRAND.white);
    this.doc.text(norm(this.docTitle), this.marginL, 36);

    // Year badge
    this.doc.setFontSize(11);
    this.doc.setFont('Helvetica', 'bold');
    const yearText = `${this.taxYear}`;
    const yearW = this.doc.getTextWidth(yearText) + 10;
    this.doc.setFillColor(...BRAND.gold);
    this.doc.roundedRect(this.pageW - this.marginR - yearW, 28, yearW, 10, 2, 2, 'F');
    this.doc.setTextColor(...BRAND.navy);
    this.doc.text(yearText, this.pageW - this.marginR - yearW / 2, 35, { align: 'center' });

    this.y = 50;
  }

  drawFooterAll(): void {
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);

      // Separator line
      this.doc.setDrawColor(...BRAND.grayMedium);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.marginL, this.pageH - 16, this.pageW - this.marginR, this.pageH - 16);

      // Footer text
      this.doc.setFontSize(7);
      this.doc.setFont('Helvetica', 'normal');
      this.doc.setTextColor(...BRAND.textMuted);
      this.doc.text(
        norm(`Capitalum - ${this.docTitle} ${this.taxYear}`),
        this.marginL,
        this.pageH - 10
      );
      this.doc.text(
        norm(`Genere le ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${totalPages}`),
        this.pageW - this.marginR,
        this.pageH - 10,
        { align: 'right' }
      );

      // Disclaimer
      this.doc.setFontSize(5.5);
      this.doc.text(
        norm('Document informatif - Ne constitue pas un avis fiscal. Consultez un professionnel.'),
        this.pageW / 2,
        this.pageH - 6,
        { align: 'center' }
      );
    }
  }

  // ── Layout helpers ──────────────────────────

  checkPage(needed: number): void {
    if (this.y + needed > this.pageH - 22) {
      this.doc.addPage();
      this.y = 16;
    }
  }

  sectionTitle(title: string, number?: string): void {
    this.checkPage(14);
    this.y += 3;

    // Accent bar
    this.doc.setFillColor(...BRAND.navy);
    this.doc.rect(this.marginL, this.y - 1, 3, 8, 'F');

    this.doc.setFontSize(12);
    this.doc.setFont('Helvetica', 'bold');
    this.doc.setTextColor(...BRAND.textDark);
    const prefix = number ? `${number}. ` : '';
    this.doc.text(norm(`${prefix}${title}`), this.marginL + 6, this.y + 5);
    this.y += 12;
  }

  subTitle(title: string): void {
    this.checkPage(10);
    this.doc.setFontSize(9);
    this.doc.setFont('Helvetica', 'bold');
    this.doc.setTextColor(...BRAND.navyLight);
    this.doc.text(norm(title), this.marginL + 2, this.y);
    this.y += 5;
  }

  textLine(text: string, indent: number = 0): void {
    this.checkPage(6);
    this.doc.setFontSize(8.5);
    this.doc.setFont('Helvetica', 'normal');
    this.doc.setTextColor(...BRAND.textDark);
    this.doc.text(norm(text), this.marginL + indent, this.y);
    this.y += 4.5;
  }

  mutedLine(text: string, indent: number = 0): void {
    this.checkPage(5);
    this.doc.setFontSize(7.5);
    this.doc.setFont('Helvetica', 'normal');
    this.doc.setTextColor(...BRAND.textMuted);
    this.doc.text(norm(text), this.marginL + indent, this.y);
    this.y += 4;
  }

  gap(h: number = 4): void { this.y += h; }

  // ── Highlighted KPI box ─────────────────────

  kpiRow(items: { label: string; value: string; color?: [number, number, number] }[]): void {
    this.checkPage(20);
    const boxW = (this.contentW - (items.length - 1) * 3) / items.length;

    items.forEach((item, i) => {
      const x = this.marginL + i * (boxW + 3);
      this.doc.setFillColor(...BRAND.grayLight);
      this.doc.roundedRect(x, this.y, boxW, 16, 1.5, 1.5, 'F');

      this.doc.setFontSize(7);
      this.doc.setFont('Helvetica', 'normal');
      this.doc.setTextColor(...BRAND.textMuted);
      this.doc.text(norm(item.label), x + 3, this.y + 5);

      this.doc.setFontSize(10);
      this.doc.setFont('Helvetica', 'bold');
      this.doc.setTextColor(...(item.color || BRAND.textDark));
      this.doc.text(norm(item.value), x + 3, this.y + 12);
    });

    this.y += 20;
  }

  // ── Highlighted fiscal box ──────────────────

  fiscalCaseBox(label: string, value: number, description: string, color: [number, number, number]): void {
    this.checkPage(22);

    // Background (blend color with white at ~8% opacity)
    const bgR = Math.round(255 - (255 - color[0]) * 0.08);
    const bgG = Math.round(255 - (255 - color[1]) * 0.08);
    const bgB = Math.round(255 - (255 - color[2]) * 0.08);
    this.doc.setFillColor(bgR, bgG, bgB);
    this.doc.roundedRect(this.marginL, this.y, this.contentW, 18, 2, 2, 'F');

    // Left border
    this.doc.setFillColor(...color);
    this.doc.rect(this.marginL, this.y, 3, 18, 'F');

    // Label
    this.doc.setFontSize(9);
    this.doc.setFont('Helvetica', 'bold');
    this.doc.setTextColor(...color);
    this.doc.text(norm(label), this.marginL + 7, this.y + 7);

    // Description
    this.doc.setFontSize(7);
    this.doc.setFont('Helvetica', 'normal');
    this.doc.setTextColor(...BRAND.textMuted);
    this.doc.text(norm(description), this.marginL + 7, this.y + 13);

    // Value (right-aligned)
    this.doc.setFontSize(13);
    this.doc.setFont('Helvetica', 'bold');
    this.doc.setTextColor(...color);
    this.doc.text(fmtEur(value), this.pageW - this.marginR - 5, this.y + 10, { align: 'right' });

    this.y += 22;
  }

  // ── Table ───────────────────────────────────

  tableHeader(columns: { label: string; x: number; align?: 'left' | 'right' }[]): void {
    this.checkPage(8);

    this.doc.setFillColor(...BRAND.navy);
    this.doc.rect(this.marginL, this.y, this.contentW, 7, 'F');

    this.doc.setFontSize(7);
    this.doc.setFont('Helvetica', 'bold');
    this.doc.setTextColor(...BRAND.white);

    columns.forEach((col) => {
      const opts = col.align === 'right' ? { align: 'right' as const } : {};
      this.doc.text(norm(col.label), this.marginL + col.x, this.y + 5, opts);
    });

    this.y += 8;
  }

  tableRow(
    columns: { value: string; x: number; align?: 'left' | 'right'; bold?: boolean; color?: [number, number, number] }[],
    striped: boolean = false
  ): void {
    this.checkPage(6);

    if (striped) {
      this.doc.setFillColor(...BRAND.grayLight);
      this.doc.rect(this.marginL, this.y - 1, this.contentW, 5.5, 'F');
    }

    this.doc.setFontSize(7);

    columns.forEach((col) => {
      this.doc.setFont('Helvetica', col.bold ? 'bold' : 'normal');
      this.doc.setTextColor(...(col.color || BRAND.textDark));
      const opts = col.align === 'right' ? { align: 'right' as const } : {};
      this.doc.text(norm(col.value), this.marginL + col.x, this.y + 3, opts);
    });

    this.y += 5.5;
  }

  // ── Summary row (totals) ────────────────────

  tableTotalRow(columns: { value: string; x: number; align?: 'left' | 'right' }[]): void {
    this.checkPage(8);

    this.doc.setDrawColor(...BRAND.navy);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.marginL, this.y, this.marginL + this.contentW, this.y);
    this.y += 2;

    this.doc.setFontSize(8);
    this.doc.setFont('Helvetica', 'bold');
    this.doc.setTextColor(...BRAND.navy);

    columns.forEach((col) => {
      const opts = col.align === 'right' ? { align: 'right' as const } : {};
      this.doc.text(norm(col.value), this.marginL + col.x, this.y + 3, opts);
    });

    this.y += 7;
  }

  // ── Info box ────────────────────────────────

  infoBox(text: string): void {
    this.checkPage(14);
    // Light blue background (simulated 6% opacity)
    this.doc.setFillColor(242, 245, 252);
    this.doc.roundedRect(this.marginL, this.y, this.contentW, 10, 1.5, 1.5, 'F');

    this.doc.setFontSize(7);
    this.doc.setFont('Helvetica', 'normal');
    this.doc.setTextColor(...BRAND.navyLight);
    this.doc.text(norm(text), this.marginL + 4, this.y + 6);
    this.y += 14;
  }

  save(filename: string): void {
    this.doc.save(filename);
  }

  getDoc(): jsPDF { return this.doc; }
  getY(): number { return this.y; }
  setY(v: number): void { this.y = v; }
}

// ── Main export: Synthese PDF ───────────────────

export function exportCrypto2086Pdf(
  accounts: CryptoAccount[],
  lines: CryptoTxLine[],
  totals: CryptoTotals,
  taxYear: number = 2025
): void {
  const pdf = new PdfBuilder(taxYear, 'Dossier fiscal crypto - Formulaire 2086');
  pdf.drawHeader();

  // ── Section 1: Résumé fiscal ──────────────
  pdf.sectionTitle('Resume fiscal', '1');

  pdf.kpiRow([
    { label: 'Cessions taxables', value: `${lines.length}` },
    { label: 'Total des cessions', value: fmtEur(totals.totalCessionsEur) },
    { label: 'Prix total acquisition', value: fmtEur(totals.totalAcquisitionsEur) },
    { label: 'Valeur portefeuille', value: fmtEur(totals.portfolioValueEur) },
  ]);

  pdf.kpiRow([
    { label: 'Plus-values brutes', value: fmtEur(totals.gainsEur), color: BRAND.green },
    { label: 'Moins-values brutes', value: fmtEur(totals.lossesEur), color: BRAND.red },
    {
      label: 'Resultat net',
      value: fmtEur(totals.netGainEur),
      color: totals.netGainEur >= 0 ? BRAND.green : BRAND.red,
    },
  ]);

  // ── Section 2: Cases fiscales à reporter ──
  pdf.sectionTitle('Montants a reporter sur impots.gouv.fr', '2');

  pdf.mutedLine('Declaration > Annexes > Formulaire 2086');
  pdf.gap(2);

  if (totals.case3AN > 0) {
    pdf.fiscalCaseBox(
      'Case 3AN - Plus-values nettes',
      totals.case3AN,
      'A reporter dans votre declaration de revenus (formulaire 2086)',
      BRAND.green,
    );
  }

  if (totals.case3BN > 0) {
    pdf.fiscalCaseBox(
      'Case 3BN - Moins-values nettes',
      totals.case3BN,
      'Reportable sur les plus-values des 10 annees suivantes',
      BRAND.red,
    );
  }

  if (totals.case3AN === 0 && totals.case3BN === 0) {
    pdf.infoBox('Aucune plus-value ni moins-value nette a reporter pour cette annee fiscale.');
  }

  pdf.gap(2);

  // Estimation PFU
  const irAmount = Math.round(totals.case3AN * 0.128 * 100) / 100;
  const socialCharges = Math.round(totals.case3AN * 0.172 * 100) / 100;
  const totalTax = Math.round((irAmount + socialCharges) * 100) / 100;

  if (totals.case3AN > 0) {
    pdf.subTitle('Estimation de l\'impot (PFU - Prelevement Forfaitaire Unique)');
    pdf.kpiRow([
      { label: 'IR (12,8%)', value: fmtEur(irAmount) },
      { label: 'Prelevements sociaux (17,2%)', value: fmtEur(socialCharges) },
      { label: 'Total impot estime (30%)', value: fmtEur(totalTax), color: BRAND.orange },
    ]);
    pdf.mutedLine('Estimation indicative - le regime au bareme progressif peut etre plus avantageux.', 2);
    pdf.gap(2);
  }

  // ── Section 3: Comptes déclares ───────────
  pdf.sectionTitle('Comptes crypto declares', '3');

  if (accounts.length === 0) {
    pdf.infoBox('Aucun compte declare. Si vous detenez des comptes a l\'etranger, pensez au formulaire 3916-bis.');
  } else {
    const foreignAccounts = accounts.filter((a) => a.isForeignAccount);

    if (foreignAccounts.length > 0) {
      pdf.infoBox(
        `${foreignAccounts.length} compte(s) etranger(s) detecte(s) - Obligation de declaration 3916-bis.`
      );
      pdf.gap(2);
    }

    pdf.tableHeader([
      { label: 'Nom du compte', x: 0 },
      { label: 'Type', x: 70 },
      { label: 'Pays', x: 100 },
      { label: 'Etranger', x: 130 },
    ]);

    accounts.forEach((acc, i) => {
      pdf.tableRow(
        [
          { value: acc.name, x: 0 },
          { value: acc.accountType === 'exchange' ? 'Plateforme' : 'Wallet', x: 70 },
          { value: acc.country || 'FR', x: 100 },
          { value: acc.isForeignAccount ? 'Oui' : 'Non', x: 130, color: acc.isForeignAccount ? BRAND.orange : BRAND.textDark },
        ],
        i % 2 === 0
      );
    });
  }

  pdf.gap(4);

  // ── Section 4: Détail des cessions ────────
  pdf.sectionTitle('Detail des cessions taxables', '4');

  if (lines.length === 0) {
    pdf.infoBox('Aucune cession taxable identifiee pour cette annee fiscale.');
  } else {
    pdf.mutedLine(`${lines.length} cession(s) taxable(s) identifiee(s) - Methode PMPA (Art. 150 VH bis CGI)`);
    pdf.gap(3);

    const cols = [
      { label: '#', x: 0 },
      { label: 'Date', x: 6 },
      { label: 'Actif cede', x: 28 },
      { label: 'Prix cession', x: 58, align: 'right' as const },
      { label: 'Fraction cedee', x: 90, align: 'right' as const },
      { label: 'Cout acq. frac.', x: 118, align: 'right' as const },
      { label: 'Frais', x: 140, align: 'right' as const },
      { label: 'PV / MV', x: 168, align: 'right' as const },
    ];

    pdf.tableHeader(cols);

    lines.forEach((line, i) => {
      const pvColor = line.plusValue >= 0 ? BRAND.green : BRAND.red;
      pdf.tableRow(
        [
          { value: `${i + 1}`, x: 0 },
          { value: fmtDate(line.date), x: 6 },
          { value: line.assetFrom || '-', x: 28 },
          { value: fmtEur(line.prixCession), x: 58, align: 'right' },
          { value: fmtPct(line.fractionCedee), x: 90, align: 'right' },
          { value: fmtEur(line.prixAcquisitionFraction || 0), x: 118, align: 'right' },
          { value: fmtEur(line.frais), x: 140, align: 'right' },
          { value: fmtEur(line.plusValue), x: 168, align: 'right', bold: true, color: pvColor },
        ],
        i % 2 === 0
      );
    });

    // Total row
    const totalPV = lines.reduce((s, l) => s + Math.max(0, l.plusValue), 0);
    const totalMV = lines.reduce((s, l) => s + Math.min(0, l.plusValue), 0);
    const totalFrais = lines.reduce((s, l) => s + l.frais, 0);

    pdf.tableTotalRow([
      { value: 'TOTAL', x: 0 },
      { value: fmtEur(totals.totalCessionsEur), x: 58, align: 'right' },
      { value: fmtEur(totalFrais), x: 140, align: 'right' },
      { value: fmtEur(totals.netGainEur), x: 168, align: 'right' },
    ]);
  }

  pdf.gap(4);

  // ── Section 5: Hypotheses & methode ───────
  pdf.sectionTitle('Hypotheses et methode de calcul', '5');

  pdf.textLine('Methode de calcul : Article 150 VH bis du Code General des Impots (PMPA)');
  pdf.textLine(`Regime fiscal applique : ${totals.regime || 'PFU (30%)'}`);
  pdf.textLine(`Prix total d'acquisition utilise : ${fmtEur(totals.totalAcquisitionsEur)}`);
  pdf.textLine(`Valeur globale du portefeuille : ${fmtEur(totals.portfolioValueEur)}`);
  pdf.gap(2);
  pdf.mutedLine('Formule : PV = Prix_cession - (Prix_total_acq x Prix_cession / Valeur_globale) - Frais');
  pdf.mutedLine('Les arrondis sont appliques uniquement sur les resultats finaux (centimes d\'euro).');
  pdf.gap(2);
  pdf.mutedLine(`Document genere le ${new Date().toLocaleString('fr-FR')} par Capitalum.`);

  // ── Footers ───────────────────────────────
  pdf.drawFooterAll();
  pdf.save(`Capitalum_2086_Synthese_${taxYear}.pdf`);
}

// ── Audit PDF ───────────────────────────────────

export function exportCryptoAuditPdf(
  auditTrail: CryptoAuditEntry[],
  lines: CryptoTxLine[],
  totals: CryptoTotals,
  taxYear: number = 2025
): void {
  const pdf = new PdfBuilder(taxYear, 'Journal d\'audit - Calcul fiscal crypto 2086');
  pdf.drawHeader();

  // ── Section 1: Résumé ─────────────────────
  pdf.sectionTitle('Resume du calcul', '1');

  pdf.kpiRow([
    { label: 'Cessions traitees', value: `${lines.length}` },
    { label: 'Gain net', value: fmtEur(totals.netGainEur), color: totals.netGainEur >= 0 ? BRAND.green : BRAND.red },
    { label: 'Case 3AN', value: fmtEur(totals.case3AN), color: BRAND.green },
    { label: 'Case 3BN', value: fmtEur(totals.case3BN), color: BRAND.red },
  ]);

  // ── Section 2: Détail par cession ─────────
  pdf.sectionTitle('Detail par cession', '2');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    pdf.checkPage(30);

    pdf.subTitle(`Cession ${i + 1} : ${line.assetFrom || '?'} - ${fmtDate(line.date)}`);

    pdf.textLine(`Prix de cession : ${fmtEur(line.prixCession)}`, 4);
    if (line.prixTotalAcquisitionPortefeuille !== undefined) {
      pdf.textLine(`Prix total acquisition portefeuille : ${fmtEur(line.prixTotalAcquisitionPortefeuille)}`, 4);
    }
    if (line.valeurGlobalePortefeuille !== undefined) {
      pdf.textLine(`Valeur globale portefeuille : ${fmtEur(line.valeurGlobalePortefeuille)}`, 4);
    }
    pdf.textLine(`Fraction cedee : ${fmtPct(line.fractionCedee)}`, 4);
    if (line.prixAcquisitionFraction !== undefined) {
      pdf.textLine(`Prix d'acquisition de la fraction : ${fmtEur(line.prixAcquisitionFraction)}`, 4);
    }
    pdf.textLine(`Frais de cession : ${fmtEur(line.frais)}`, 4);

    const pvColor = line.plusValue >= 0 ? 'Plus-value' : 'Moins-value';
    pdf.textLine(`${pvColor} : ${fmtEur(line.plusValue)}`, 4);

    pdf.mutedLine('PV = Prix_cession - (Total_acq x Prix_cession / Valeur_globale) - Frais', 4);
    pdf.gap(3);
  }

  // ── Section 3: Journal chronologique ──────
  if (auditTrail.length > 0) {
    pdf.sectionTitle('Journal chronologique detaille', '3');

    pdf.mutedLine(`${auditTrail.length} etape(s) de calcul enregistrees`);
    pdf.gap(3);

    for (let i = 0; i < auditTrail.length; i++) {
      const entry = auditTrail[i];
      pdf.checkPage(16);

      // Step header
      pdf.tableRow(
        [
          { value: `${i + 1}.`, x: 0, bold: true, color: BRAND.navy },
          { value: entry.step, x: 6, bold: true, color: BRAND.navy },
          { value: `Resultat : ${fmtEur(entry.result)}`, x: 148, align: 'right', bold: true },
        ],
        i % 2 === 0
      );

      pdf.mutedLine(`Formule : ${entry.formula}`, 6);

      // Inputs if available
      if (entry.inputs) {
        const inputPairs = Object.entries(entry.inputs)
          .filter(([, v]) => typeof v === 'number')
          .map(([k, v]) => `${k} = ${typeof v === 'number' ? fmtEur(v as number) : v}`)
          .join(' | ');
        if (inputPairs) {
          pdf.mutedLine(inputPairs, 6);
        }
      }

      pdf.gap(1);
    }
  }

  // ── Section 4: Contrôle de cohérence ──────
  pdf.sectionTitle('Controle de coherence', auditTrail.length > 0 ? '4' : '3');

  const sumPV = lines.reduce((s, l) => s + l.plusValue, 0);
  const roundedSum = Math.round(sumPV * 100) / 100;
  const coherent = Math.abs(roundedSum - totals.netGainEur) < 0.02;

  pdf.textLine(`Somme des PV/MV individuelles : ${fmtEur(roundedSum)}`);
  pdf.textLine(`Gain net declare : ${fmtEur(totals.netGainEur)}`);
  pdf.textLine(`Ecart : ${fmtEur(Math.abs(roundedSum - totals.netGainEur))}`);
  pdf.gap(2);

  if (coherent) {
    pdf.infoBox('Coherence verifiee - Les totaux correspondent aux calculs individuels.');
  } else {
    pdf.textLine('ATTENTION : Ecart detecte entre les calculs individuels et le total.');
  }

  pdf.gap(4);
  pdf.mutedLine(`Document genere le ${new Date().toLocaleString('fr-FR')} par Capitalum.`);

  // ── Footers ───────────────────────────────
  pdf.drawFooterAll();
  pdf.save(`Capitalum_2086_Audit_${taxYear}.pdf`);
}
