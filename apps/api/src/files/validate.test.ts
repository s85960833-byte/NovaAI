import { it, expect } from "vitest";
import { validateUpload, MAX_UPLOAD_BYTES } from "./validate.js";
it("checks PDF and image magic bytes", () => {
  expect(
    validateUpload({ mime: "application/pdf", bytes: new TextEncoder().encode("%PDF-1.7") }).ok,
  ).toBe(true);
  expect(
    validateUpload({ mime: "application/pdf", bytes: new TextEncoder().encode("<html>") }),
  ).toEqual({ ok: false, code: "CONTENT_MISMATCH" });
  expect(
    validateUpload({ mime: "image/png", bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) })
      .ok,
  ).toBe(true);
});
it("rejects oversized, empty and unsupported uploads", () => {
  expect(
    validateUpload({ mime: "text/plain", bytes: new Uint8Array(MAX_UPLOAD_BYTES + 1) }),
  ).toEqual({ ok: false, code: "FILE_TOO_LARGE" });
  expect(
    validateUpload({ mime: "image/svg+xml", bytes: new TextEncoder().encode("<svg/>") }),
  ).toEqual({ ok: false, code: "MIME_NOT_ALLOWED" });
  expect(validateUpload({ mime: "text/plain", bytes: new Uint8Array() })).toEqual({
    ok: false,
    code: "EMPTY_FILE",
  });
});

it("rejects spoofed MIME headers and binary payloads disguised as plain text", () => {
  expect(
    validateUpload({
      mime: "application/pdf",
      bytes: new TextEncoder().encode("GIF89a<script>"),
    }),
  ).toEqual({ ok: false, code: "CONTENT_MISMATCH" });
  expect(
    validateUpload({
      mime: "image/jpeg",
      bytes: new TextEncoder().encode("%PDF-1.7"),
    }),
  ).toEqual({ ok: false, code: "CONTENT_MISMATCH" });
  expect(validateUpload({ mime: "text/plain", bytes: new Uint8Array([0, 1, 2, 3]) })).toEqual({
    ok: false,
    code: "CONTENT_MISMATCH",
  });
});
