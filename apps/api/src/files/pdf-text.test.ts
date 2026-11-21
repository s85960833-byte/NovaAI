import { it, expect } from "vitest";
import { extractPdfText } from "./pdf-text.js";
function makePdf(text: string) {
  const stream = "BT /F1 12 Tf 72 72 Td (" + text + ") Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length " +
      new TextEncoder().encode(stream).length +
      " >>\nstream\n" +
      stream +
      "\nendstream",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += i + 1 + " 0 obj\n" + objects[i] + "\nendobj\n";
  }
  const xref = new TextEncoder().encode(pdf).length;
  pdf +=
    "xref\n0 " +
    (objects.length + 1) +
    "\n0000000000 65535 f \n" +
    offsets
      .slice(1)
      .map((offset) => String(offset).padStart(10, "0") + " 00000 n \n")
      .join("") +
    "trailer\n<< /Size " +
    (objects.length + 1) +
    " /Root 1 0 R >>\nstartxref\n" +
    xref +
    "\n%%EOF";
  return new TextEncoder().encode(pdf);
}
it("extracts text from a small synthetic PDF", async () => {
  const result = await extractPdfText(makePdf("Hello NOVA"));
  expect(result.text).toContain("Hello NOVA");
  expect(result.scannedOrEmpty).toBe(false);
});
it("reports image-only or empty PDFs without pretending OCR succeeded", async () => {
  const result = await extractPdfText(makePdf(""));
  expect(result.text).toBe("");
  expect(result.scannedOrEmpty).toBe(true);
});
