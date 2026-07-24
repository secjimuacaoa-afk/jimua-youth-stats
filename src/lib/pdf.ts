import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import logoJimua from "@/assets/logo-jimua.png";

export interface PdfOptions {
  title: string;
  subtitle?: string;
  orientation?: "portrait" | "landscape";
}

// Convert bundled image to data URL so jsPDF can embed it
let logoDataUrl: string | null = null;
async function loadLogo(): Promise<string | null> {
  if (logoDataUrl) return logoDataUrl;
  try {
    const res = await fetch(logoJimua);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onloadend = () => { logoDataUrl = r.result as string; resolve(logoDataUrl!); };
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function createOfficialPdf({ title, subtitle, orientation = "portrait" }: PdfOptions) {
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const logo = await loadLogo();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Igreja Metodista Unida", 14, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Conferência Anual do Oeste de Angola", 14, 22);

  if (logo) {
    try { doc.addImage(logo, "PNG", pageW - 30, 8, 20, 20); } catch { /* ignore */ }
  }

  // Divider
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.line(14, 30, pageW - 14, 30);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 14, 38);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(subtitle, 14, 44);
    doc.setTextColor(0);
  }

  const exportDate = new Date().toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exportado a ${exportDate}`, pageW - 14, 38, { align: "right" });
  doc.setTextColor(0);

  return { doc, startY: subtitle ? 50 : 46 };
}

export function addSignatures(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const y = pageH - 30;
  const col1x = 25;
  const col2x = pageW - 85;
  const lineW = 60;

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(col1x, y, col1x + lineW, y);
  doc.line(col2x, y, col2x + lineW, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("O Secretário", col1x + lineW / 2, y + 6, { align: "center" });
  doc.text("O Director", col2x + lineW / 2, y + 6, { align: "center" });
}

export function addPageNumbers(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Página ${i} de ${pages}`, pageW / 2, pageH - 6, { align: "center" });
    doc.setTextColor(0);
  }
}

export function addTable(doc: jsPDF, options: UserOptions) {
  autoTable(doc, {
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 2 },
    margin: { left: 14, right: 14 },
    ...options,
  });
}

export function savePdf(doc: jsPDF, filename: string) {
  addSignatures(doc);
  addPageNumbers(doc);
  doc.save(filename);
}
