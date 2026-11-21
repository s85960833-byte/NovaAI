import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
export const MAX_PDF_PAGES = 5;
export const MAX_EXTRACTED_CHARS = 40_000;
export async function extractPdfText(bytes: Uint8Array) {
  const task = getDocument({ data: bytes, useSystemFonts: true, verbosity: 0 });
  const pdf = await task.promise;
  try {
    if (pdf.numPages > MAX_PDF_PAGES) throw new Error("PDF_PAGE_LIMIT");
    const chunks: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" ");
      chunks.push(text);
      if (chunks.join("\n").length > MAX_EXTRACTED_CHARS) break;
    }
    const text = chunks.join("\n").trim().slice(0, MAX_EXTRACTED_CHARS);
    if (!text) return { text: "", pages: pdf.numPages, scannedOrEmpty: true };
    return { text, pages: pdf.numPages, scannedOrEmpty: false };
  } finally {
    await pdf.destroy();
  }
}
