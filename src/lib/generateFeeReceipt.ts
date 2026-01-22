import jsPDF from 'jspdf';
import { Fee } from '@/hooks/useLMS';
import { format } from 'date-fns';

interface ReceiptData {
  fee: Fee;
  studentName: string;
  studentEmail?: string;
  institutionName?: string;
}

export function generateFeeReceipt({ 
  fee, 
  studentName, 
  studentEmail,
  institutionName = 'Miracle Educational Society Group of Institutions' 
}: ReceiptData) {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Header background
  doc.setFillColor(30, 64, 175); // Primary blue
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Institution name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(institutionName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Fee Payment Receipt', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 25;
  
  // Receipt number and date
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text(`Receipt No: ${fee.transaction_id || fee.id.slice(0, 8).toUpperCase()}`, margin, yPos);
  doc.text(`Date: ${format(new Date(fee.paid_date || new Date()), 'dd MMM yyyy')}`, pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 15;
  
  // Student details section
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT DETAILS', margin, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${studentName}`, margin, yPos);
  
  if (studentEmail) {
    yPos += 7;
    doc.text(`Email: ${studentEmail}`, margin, yPos);
  }
  
  yPos += 15;
  
  // Payment details section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', margin, yPos);
  
  yPos += 12;
  
  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 12, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Description', margin + 5, yPos + 3);
  doc.text('Amount', pageWidth - margin - 5, yPos + 3, { align: 'right' });
  
  yPos += 15;
  
  // Table content
  doc.setFont('helvetica', 'normal');
  doc.text(fee.description, margin + 5, yPos);
  doc.text(`Rs. ${fee.amount.toLocaleString('en-IN')}`, pageWidth - margin - 5, yPos, { align: 'right' });
  
  yPos += 10;
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Paid:', margin + 5, yPos);
  doc.setTextColor(30, 64, 175);
  doc.text(`Rs. ${fee.amount.toLocaleString('en-IN')}`, pageWidth - margin - 5, yPos, { align: 'right' });
  
  yPos += 20;
  
  // Transaction details
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (fee.transaction_id) {
    doc.text(`Transaction ID: ${fee.transaction_id}`, margin, yPos);
    yPos += 7;
  }
  
  doc.text(`Payment Date: ${format(new Date(fee.paid_date || new Date()), 'dd MMMM yyyy, hh:mm a')}`, margin, yPos);
  yPos += 7;
  doc.text('Payment Status: PAID', margin, yPos);
  
  yPos += 25;
  
  // Success stamp
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(2);
  doc.roundedRect(pageWidth / 2 - 30, yPos - 5, 60, 20, 3, 3, 'S');
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', pageWidth / 2, yPos + 8, { align: 'center' });
  
  // Footer
  yPos = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Save the PDF
  const fileName = `Fee_Receipt_${fee.transaction_id || fee.id.slice(0, 8)}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
}
