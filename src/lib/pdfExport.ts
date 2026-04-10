import jsPDF from 'jspdf';
import { ScanResult, TaxError, TaxOptimization } from '@/data/taxScannerTypes';

export function exportTaxReportPDF(result: ScanResult): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Helper functions
  const addTitle = (text: string, size: number = 20) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += size * 0.5;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += 8;
  };

  const addText = (text: string, indent: number = 0) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - indent);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5;
  };

  const addLine = () => {
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  const checkNewPage = (neededSpace: number = 30) => {
    if (y > doc.internal.pageSize.getHeight() - neededSpace) {
      doc.addPage();
      y = 20;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Header
  addTitle('ELIO - Rapport d\'Audit Fiscal 2026');
  y += 5;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Généré le ${result.timestamp.toLocaleDateString('fr-FR')} à ${result.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, margin, y);
  doc.setTextColor(0);
  y += 15;

  addLine();
  y += 5;

  // Score Section
  addSubtitle('Score Global');
  y += 3;
  
  const scoreLabel = result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Bon' : 'À améliorer';
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${result.score}/100 - ${scoreLabel}`, margin, y);
  y += 12;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Économies potentielles : ${formatCurrency(result.totalPotentialSavings)}`, margin, y);
  y += 6;
  doc.text(`Risque estimé : ${formatCurrency(result.totalRiskAmount)}`, margin, y);
  y += 15;

  addLine();
  y += 10;

  // Summary
  const criticalErrors = result.errors.filter(e => e.severity === 'critical').length;
  const warningErrors = result.errors.filter(e => e.severity === 'warning').length;
  const infoErrors = result.errors.filter(e => e.severity === 'info').length;

  addSubtitle('Résumé');
  y += 3;
  addText(`• ${criticalErrors} erreur(s) critique(s)`);
  addText(`• ${warningErrors} point(s) d'attention`);
  addText(`• ${infoErrors} information(s)`);
  addText(`• ${result.optimizations.length} optimisation(s) disponible(s)`);
  y += 10;

  addLine();
  y += 10;

  // Errors Section
  if (result.errors.length > 0) {
    addSubtitle(`Erreurs et Alertes Détectées (${result.errors.length})`);
    y += 5;

    result.errors.forEach((error: TaxError, index: number) => {
      checkNewPage(40);
      
      const severityLabel = error.severity === 'critical' ? '🔴 CRITIQUE' : 
                           error.severity === 'warning' ? '🟡 ATTENTION' : '🔵 INFO';
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${error.title} [${severityLabel}]`, margin, y);
      y += 6;
      
      if (error.taxBox) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`Case déclaration : ${error.taxBox}`, margin + 5, y);
        y += 5;
      }
      
      addText(error.description, 5);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`→ Action : ${error.action}`, margin + 5, y);
      y += 6;
      
      if (error.estimatedRisk > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text(`Risque estimé : ${formatCurrency(error.estimatedRisk)}`, margin + 5, y);
        y += 6;
      }
      
      if (error.legalReference) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Réf. : ${error.legalReference}`, margin + 5, y);
        doc.setTextColor(0);
        y += 6;
      }
      
      y += 5;
    });

    y += 5;
    addLine();
    y += 10;
  }

  // Optimizations Section
  if (result.optimizations.length > 0) {
    checkNewPage(50);
    addSubtitle(`Optimisations Recommandées (${result.optimizations.length})`);
    y += 5;

    result.optimizations.forEach((opt: TaxOptimization, index: number) => {
      checkNewPage(45);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${opt.title}`, margin, y);
      y += 6;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 128, 0);
      doc.text(`+${formatCurrency(opt.estimatedSavings)} d'économie`, margin + 5, y);
      doc.setTextColor(0);
      y += 7;
      
      addText(opt.description, 5);
      
      if (opt.taxBox) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`Case déclaration : ${opt.taxBox}`, margin + 5, y);
        y += 5;
      }
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Effort : ${opt.effort}`, margin + 5, y);
      y += 5;
      
      if (opt.deadline) {
        doc.text(`Échéance : ${opt.deadline}`, margin + 5, y);
        y += 5;
      }
      
      if (opt.legalReference) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Réf. : ${opt.legalReference}`, margin + 5, y);
        doc.setTextColor(0);
        y += 5;
      }
      
      if (opt.conditions && opt.conditions.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(80);
        opt.conditions.forEach(cond => {
          doc.text(`• ${cond}`, margin + 10, y);
          y += 4;
        });
        doc.setTextColor(0);
      }
      
      y += 8;
    });
  }

  // Footer / Disclaimer
  checkNewPage(40);
  y += 10;
  addLine();
  y += 10;
  
  doc.setFontSize(8);
  doc.setTextColor(100);
  const disclaimer = "AVERTISSEMENT : Ce rapport est fourni à titre indicatif uniquement et ne constitue pas un conseil fiscal professionnel. Les montants estimés sont approximatifs et peuvent varier selon votre situation réelle. Consultez un expert-comptable ou un conseiller fiscal pour valider ces recommandations avant de les appliquer à votre déclaration.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2);
  doc.text(disclaimerLines, margin, y);
  y += disclaimerLines.length * 4 + 5;
  
  doc.text("Source : impots.gouv.fr | Généré par ELIO", margin, y);
  doc.setTextColor(0);

  // Save
  const filename = `audit-fiscal-elio-${result.timestamp.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
