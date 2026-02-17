import jsPDF from 'jspdf';

// ── Helpers ──

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
    .replace(/[≤]/g, 'max')
    .replace(/[≥]/g, 'min')
    .replace(/[€]/g, 'EUR');
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

// ── Types for the export functions ──

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
  fractionCedee: number;
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
}

// ── Main export: Synthese PDF ──

export function exportCrypto2086Pdf(
  accounts: CryptoAccount[],
  lines: CryptoTxLine[],
  totals: CryptoTotals,
  taxYear: number = 2025
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  const addPage = () => {
    doc.addPage();
    y = 20;
  };

  const checkPage = (needed: number) => {
    if (y + needed > 275) addPage();
  };

  // Header
  doc.setFontSize(18);
  doc.setFont('Helvetica', 'bold');
  doc.text(norm('Dossier 2086 - Synthese'), pageW / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(norm(`Annee fiscale : ${taxYear}`), pageW / 2, y, { align: 'center' });
  y += 5;
  doc.text(norm(`Genere le : ${new Date().toLocaleDateString('fr-FR')}`), pageW / 2, y, { align: 'center' });
  y += 5;
  doc.text('Capitalum', pageW / 2, y, { align: 'center' });
  y += 12;

  // Section Comptes
  doc.setFontSize(13);
  doc.setFont('Helvetica', 'bold');
  doc.text(norm('1. Comptes declares'), 14, y);
  y += 7;

  if (accounts.length === 0) {
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(norm('Aucun compte declare.'), 14, y);
    y += 6;
  } else {
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.text('Nom', 14, y);
    doc.text('Type', 80, y);
    doc.text('Pays', 110, y);
    doc.text(norm('Etranger'), 140, y);
    y += 5;
    doc.setFont('Helvetica', 'normal');
    for (const acc of accounts) {
      checkPage(6);
      doc.text(norm(acc.name), 14, y);
      doc.text(norm(acc.accountType), 80, y);
      doc.text(norm(acc.country), 110, y);
      doc.text(acc.isForeignAccount ? 'Oui' : 'Non', 140, y);
      y += 5;
    }
  }
  y += 8;

  // Section Cessions taxables
  checkPage(20);
  doc.setFontSize(13);
  doc.setFont('Helvetica', 'bold');
  doc.text(norm('2. Cessions taxables'), 14, y);
  y += 7;

  if (lines.length === 0) {
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(norm('Aucune cession taxable.'), 14, y);
    y += 6;
  } else {
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'bold');
    doc.text('Date', 14, y);
    doc.text('Actif', 40, y);
    doc.text('Cession', 65, y);
    doc.text('Fraction', 100, y);
    doc.text('PV/MV', 130, y);
    doc.text('Frais', 165, y);
    y += 5;
    doc.setFont('Helvetica', 'normal');
    for (const line of lines) {
      checkPage(6);
      doc.text(fmtDate(line.date), 14, y);
      doc.text(norm(line.assetFrom || '-'), 40, y);
      doc.text(fmtEur(line.prixCession), 65, y);
      doc.text(`${(line.fractionCedee * 100).toFixed(2)}%`, 100, y);
      const pvText = fmtEur(line.plusValue);
      doc.text(pvText, 130, y);
      doc.text(fmtEur(line.frais), 165, y);
      y += 5;
    }
  }
  y += 8;

  // Section Totaux
  checkPage(40);
  doc.setFontSize(13);
  doc.setFont('Helvetica', 'bold');
  doc.text(norm('3. Totaux et cases fiscales'), 14, y);
  y += 8;

  doc.setFontSize(10);
  const totLines: [string, string][] = [
    ['Total des cessions', fmtEur(totals.totalCessionsEur)],
    ['Total acquisitions (PMPA)', fmtEur(totals.totalAcquisitionsEur)],
    ['Valeur globale portefeuille', fmtEur(totals.portfolioValueEur)],
    ['Plus-values', fmtEur(totals.gainsEur)],
    ['Moins-values', fmtEur(totals.lossesEur)],
    ['Gain net', fmtEur(totals.netGainEur)],
  ];

  doc.setFont('Helvetica', 'normal');
  for (const [label, val] of totLines) {
    doc.text(norm(label), 14, y);
    doc.text(val, 120, y);
    y += 6;
  }
  y += 4;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(norm(`Case 3AN (plus-values) : ${fmtEur(totals.case3AN)}`), 14, y);
  y += 7;
  doc.text(norm(`Case 3BN (moins-values) : ${fmtEur(totals.case3BN)}`), 14, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.text(norm(`Regime fiscal : ${totals.regime || 'PFU (30%)'}`), 14, y);
  y += 10;

  // Section Hypotheses
  checkPage(20);
  doc.setFontSize(13);
  doc.setFont('Helvetica', 'bold');
  doc.text(norm('4. Hypotheses'), 14, y);
  y += 7;
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text(norm(`Methode de calcul : Art. 150 VH bis CGI (PMPA)`), 14, y);
  y += 5;
  doc.text(norm(`Prix total acquisition utilise : ${fmtEur(totals.totalAcquisitionsEur)}`), 14, y);
  y += 5;
  doc.text(norm(`Valeur globale portefeuille : ${fmtEur(totals.portfolioValueEur)}`), 14, y);
  y += 5;
  doc.text(norm(`Date de generation : ${new Date().toISOString()}`), 14, y);

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.text(
      norm(`Capitalum - Dossier 2086 ${taxYear} - Page ${i}/${totalPages}`),
      pageW / 2,
      290,
      { align: 'center' }
    );
  }

  doc.save(`Capitalum_2086_Synthese_${taxYear}.pdf`);
}

// ── Audit PDF ──

export function exportCryptoAuditPdf(
  auditTrail: CryptoAuditEntry[],
  lines: CryptoTxLine[],
  totals: CryptoTotals,
  taxYear: number = 2025
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  };

  doc.setFontSize(16);
  doc.setFont('Helvetica', 'bold');
  doc.text(norm("Journal d'audit - Calcul 2086"), pageW / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.text(norm(`Annee fiscale : ${taxYear} | Genere le : ${new Date().toLocaleDateString('fr-FR')}`), pageW / 2, y, { align: 'center' });
  y += 12;

  // Résumé
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text(norm('Resume'), 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.text(norm(`Cessions taxables : ${lines.length}`), 14, y); y += 5;
  doc.text(norm(`Gain net : ${fmtEur(totals.netGainEur)}`), 14, y); y += 5;
  doc.text(norm(`Case 3AN : ${fmtEur(totals.case3AN)} | Case 3BN : ${fmtEur(totals.case3BN)}`), 14, y);
  y += 10;

  // Detail par cession
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text(norm('Detail par cession'), 14, y);
  y += 7;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    checkPage(25);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.text(norm(`Cession ${i + 1} : ${line.assetFrom} le ${fmtDate(line.date)}`), 14, y);
    y += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(norm(`Prix de cession : ${fmtEur(line.prixCession)}`), 18, y); y += 4;
    doc.text(norm(`Fraction cedee : ${(line.fractionCedee * 100).toFixed(4)}%`), 18, y); y += 4;
    doc.text(norm(`Frais de cession : ${fmtEur(line.frais)}`), 18, y); y += 4;
    doc.text(norm(`Plus/Moins-value : ${fmtEur(line.plusValue)}`), 18, y); y += 6;
  }

  // Audit trail
  if (auditTrail.length > 0) {
    checkPage(15);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text(norm('Journal de calcul detaille'), 14, y);
    y += 7;

    for (const entry of auditTrail) {
      checkPage(15);
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'bold');
      doc.text(norm(entry.step), 14, y); y += 4;
      doc.setFont('Helvetica', 'normal');
      doc.text(norm(entry.formula), 18, y); y += 4;
      doc.text(norm(`Resultat : ${fmtEur(entry.result)}`), 18, y); y += 6;
    }
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.text(
      norm(`Capitalum - Journal d'audit 2086 ${taxYear} - Page ${i}/${totalPages}`),
      pageW / 2,
      290,
      { align: 'center' }
    );
  }

  doc.save(`Capitalum_2086_Audit_${taxYear}.pdf`);
}
