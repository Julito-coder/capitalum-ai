import jsPDF from 'jspdf';
import { Invoice } from './invoiceService';
import { ProProfile } from './proService';

export const generateInvoicePDF = (invoice: Invoice, profile: ProProfile | null): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor = [45, 55, 72] as [number, number, number]; // Dark blue-gray
  const secondaryColor = [100, 116, 139] as [number, number, number]; // Gray
  const accentColor = [99, 102, 241] as [number, number, number]; // Indigo
  
  let y = 20;

  // Header - Company info
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.companyName || 'Mon Entreprise', 20, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  
  if (profile?.siret) {
    doc.text(`SIRET: ${profile.siret}`, 20, y);
    y += 5;
  }

  // Invoice title and number
  doc.setFontSize(28);
  doc.setTextColor(...accentColor);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', pageWidth - 20, 25, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text(invoice.invoiceNumber, pageWidth - 20, 35, { align: 'right' });

  // Dates
  y = 50;
  doc.setFontSize(10);
  doc.setTextColor(...secondaryColor);
  doc.text(`Date d'émission: ${new Date(invoice.issueDate).toLocaleDateString('fr-FR')}`, pageWidth - 20, y, { align: 'right' });
  y += 5;
  doc.text(`Date d'échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, pageWidth - 20, y, { align: 'right' });

  // Client section
  y = 70;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(20, y - 5, pageWidth - 40, 35, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Facturer à:', 25, y + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.clientName, 25, y + 12);
  
  if (invoice.clientAddress) {
    doc.setFontSize(9);
    doc.setTextColor(...secondaryColor);
    const addressLines = doc.splitTextToSize(invoice.clientAddress, pageWidth - 50);
    doc.text(addressLines, 25, y + 19);
  }
  
  if (invoice.clientSiret) {
    doc.setFontSize(9);
    doc.text(`SIRET: ${invoice.clientSiret}`, 25, y + 26);
  }

  // Table header
  y = 120;
  doc.setFillColor(...accentColor);
  doc.rect(20, y, pageWidth - 40, 10, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 25, y + 7);
  doc.text('Montant HT', pageWidth - 25, y + 7, { align: 'right' });

  // Table content
  y += 15;
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'normal');
  
  const description = invoice.description || 'Prestation de services';
  const descLines = doc.splitTextToSize(description, pageWidth - 80);
  doc.text(descLines, 25, y);
  doc.text(`${invoice.amountHt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, pageWidth - 25, y, { align: 'right' });

  // Totals section
  y = Math.max(y + 30, 170);
  
  // Line separator
  doc.setDrawColor(229, 231, 235);
  doc.line(pageWidth - 100, y, pageWidth - 20, y);
  
  y += 10;
  const totalsX = pageWidth - 100;
  
  // Subtotal
  doc.setFontSize(10);
  doc.setTextColor(...secondaryColor);
  doc.text('Sous-total HT:', totalsX, y);
  doc.setTextColor(...primaryColor);
  doc.text(`${invoice.amountHt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, pageWidth - 25, y, { align: 'right' });

  // TVA
  y += 8;
  doc.setTextColor(...secondaryColor);
  doc.text(`TVA (${invoice.tvaRate}%):`, totalsX, y);
  const tvaAmount = invoice.amountHt * (invoice.tvaRate / 100);
  doc.setTextColor(...primaryColor);
  doc.text(`${tvaAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, pageWidth - 25, y, { align: 'right' });

  // Total TTC
  y += 12;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(totalsX - 5, y - 5, pageWidth - totalsX + 5 - 15, 15, 2, 2, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Total TTC:', totalsX, y + 5);
  doc.setTextColor(...accentColor);
  doc.text(`${invoice.amountTtc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, pageWidth - 25, y + 5, { align: 'right' });

  // TVA mention for micro
  y += 30;
  if (invoice.tvaRate === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...secondaryColor);
    doc.text('TVA non applicable, art. 293 B du CGI', 20, y);
  }

  // Payment info
  y += 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  doc.text('Conditions de paiement: Paiement à réception de facture', 20, y);
  
  if (invoice.notes) {
    y += 10;
    doc.text(`Notes: ${invoice.notes}`, 20, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(...secondaryColor);
  doc.text('Merci pour votre confiance.', pageWidth / 2, footerY, { align: 'center' });

  return doc;
};

export const downloadInvoicePDF = (invoice: Invoice, profile: ProProfile | null): void => {
  const doc = generateInvoicePDF(invoice, profile);
  doc.save(`${invoice.invoiceNumber}.pdf`);
};
