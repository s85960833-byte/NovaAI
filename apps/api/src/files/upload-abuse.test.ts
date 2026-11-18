import { expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateUpload } from "./validate.js";

const textBytes = (value: string) => new TextEncoder().encode(value);

it("rejects PDFs containing obvious active actions", () => {
  const activePdf = textBytes("%PDF-1.7\n1 0 obj << /Type /Catalog /OpenAction 2 0 R >>");
  expect(validateUpload({ mime: "application/pdf", bytes: activePdf })).toEqual({
    ok: false,
    code: "PDF_ACTIVE_CONTENT",
  });
});

it("rejects spoofed, truncated and disallowed file formats", () => {
  expect(
    validateUpload({
      mime: "application/pdf",
      bytes: textBytes("GIF89a<html>"),
    }),
  ).toEqual({ ok: false, code: "CONTENT_MISMATCH" });
  expect(
    validateUpload({
      mime: "image/webp",
      bytes: textBytes("RIFF1234WAVExxxx"),
    }),
  ).toEqual({ ok: false, code: "CONTENT_MISMATCH" });
  expect(
    validateUpload({
      mime: "image/svg+xml",
      bytes: textBytes("<svg xmlns='http://www.w3.org/2000/svg'/>"),
    }),
  ).toEqual({ ok: false, code: "MIME_NOT_ALLOWED" });
});

it("rejects oversized payloads before parsing content", () => {
  const oversized = new Uint8Array(MAX_UPLOAD_BYTES + 1);
  expect(validateUpload({ mime: "application/pdf", bytes: oversized })).toEqual({
    ok: false,
    code: "FILE_TOO_LARGE",
  });
});
