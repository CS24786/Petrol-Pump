/**
 * Utility for exporting HTML printable elements to PDF with specific filenames.
 * Supports native Electron PDF generation (if running in desktop app)
 * and intelligent browser print fallback (setting document.title so Save-as-PDF defaults to filename).
 */

export async function exportReportToPDF(elementId, defaultFileName = 'Diyal_Station_Document.pdf') {
  const element = document.getElementById(elementId);
  const cleanFileName = defaultFileName.endsWith('.pdf') ? defaultFileName : `${defaultFileName}.pdf`;

  // 1. Electron Desktop Native PDF Export
  if (typeof window !== 'undefined' && window.electronAPI?.exportPDF && element) {
    try {
      const res = await window.electronAPI.exportPDF(element.innerHTML, cleanFileName, {
        landscape: false,
        format: 'A4'
      });
      if (res?.success) {
        return { success: true, filePath: res.filePath };
      }
      if (res?.cancelled) {
        return { success: false, cancelled: true };
      }
    } catch (err) {
      console.warn('Native electron PDF export failed, using print fallback:', err);
    }
  }

  // 2. Web Browser Fallback:
  // Dynamically set document.title to cleanFileName so browser's "Save as PDF" dialog defaults to that exact name
  if (typeof document !== 'undefined') {
    const originalTitle = document.title;
    document.title = cleanFileName.replace(/\.pdf$/i, '');
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
    return { success: true };
  }

  return { success: false };
}
