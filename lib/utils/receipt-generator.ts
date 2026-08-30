/**
 * Receipt PDF Generator Utility
 * Generates PDF receipts from POS transactions using jsPDF and html2canvas
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptGeneratorOptions {
  filename?: string;
  quality?: 'low' | 'medium' | 'high';
}

/**
 * Generate and download a PDF receipt from HTML element
 * @param elementId - ID of the HTML element containing the receipt
 * @param filename - PDF filename (without .pdf extension)
 * @param options - Optional configuration
 */
export async function generateReceiptPDF(
  elementId: string,
  filename: string = 'receipt',
  options: ReceiptGeneratorOptions = {}
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Set quality based on option
    const quality = options.quality === 'low' ? 1 : options.quality === 'high' ? 2 : 1.5;

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: quality,
      allowTaint: true,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Calculate PDF dimensions
    // Standard receipt paper is typically 80mm wide (about 226px at 96dpi)
    const pdfWidth = 80; // mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // mm

    // Create PDF
    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Download the PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    throw error;
  }
}

/**
 * Generate and download receipt as PDF with automatic filename
 * @param elementId - ID of the HTML element containing the receipt
 * @param transactionNumber - Transaction number for filename
 */
export async function downloadReceiptPDF(
  elementId: string,
  transactionNumber: string
): Promise<void> {
  const filename = `${transactionNumber}-receipt`;
  return generateReceiptPDF(elementId, filename, { quality: 'high' });
}

/**
 * Prepare element for printing by hiding non-printable elements
 * Call before window.print()
 */
export function preparePrint(): void {
  // Add print-specific styles if not already present
  let style = document.getElementById('receipt-print-styles');
  if (!style) {
    style = document.createElement('style');
    style.id = 'receipt-print-styles';
    style.textContent = `
      @media print {
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        
        /* Hide everything except receipt modal content */
        #receipt-modal {
          position: static;
          width: 100%;
          height: 100%;
          background: white;
          border: none;
          box-shadow: none;
          padding: 0;
          margin: 0;
        }
        
        #receipt-modal::backdrop {
          display: none;
        }
        
        /* Hide print/close buttons in print view */
        #receipt-print-actions {
          display: none !important;
        }
        
        /* Hide floating button */
        #receipt-floating-button {
          display: none !important;
        }
        
        /* Ensure receipt content is visible and properly formatted */
        #receipt-content {
          width: 100%;
          max-width: 80mm;
          margin: 0 auto;
          padding: 10mm;
          page-break-after: avoid;
        }
        
        /* Print-friendly text sizing */
        #receipt-content {
          font-family: 'Courier New', monospace;
          font-size: 10pt;
          line-height: 1.4;
        }
        
        #receipt-content h2 {
          font-size: 12pt;
          margin: 5mm 0;
        }
        
        #receipt-content .text-xs {
          font-size: 8pt;
        }
        
        #receipt-content .text-sm {
          font-size: 9pt;
        }
        
        #receipt-content .text-lg {
          font-size: 11pt;
        }
        
        #receipt-content .text-xl {
          font-size: 12pt;
        }
        
        /* Ensure proper spacing */
        #receipt-content > div {
          page-break-inside: avoid;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Clean up after printing
 */
export function cleanupPrint(): void {
  // Print styles will remain for future use, no cleanup needed
  // but could add additional cleanup logic here if needed
}
