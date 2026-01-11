
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';

/**
 * Generates a DOCX blob from text.
 */
export const generateDOCX = async (text: string): Promise<Blob> => {
  const lines = text.split('\n');
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: lines.map(line => {
          // Detect simple headers (all caps or short lines with specific patterns could be enhanced here)
          const isHeader = line.length > 0 && line.length < 50 && line === line.toUpperCase();
          
          return new Paragraph({
            children: [
              new TextRun({
                text: line,
                bold: isHeader,
                size: isHeader ? 28 : 24, // 14pt or 12pt
                font: "Arial"
              }),
            ],
            spacing: {
              after: 200,
            },
            alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
          });
        }),
      },
    ],
  });

  return await Packer.toBlob(doc);
};

/**
 * Generates a PDF blob from text using jsPDF.
 */
export const generatePDF = async (text: string): Promise<Blob> => {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (margin * 2);
  const startY = margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  // Split text to fit page width
  const splitText = doc.splitTextToSize(text, contentWidth);
  
  // Basic paging logic
  let cursorY = startY;
  const pageHeight = doc.internal.pageSize.getHeight();

  splitText.forEach((line: string) => {
    if (cursorY > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(line, margin, cursorY);
    cursorY += 16; // Line height
  });

  return doc.output('blob');
};
