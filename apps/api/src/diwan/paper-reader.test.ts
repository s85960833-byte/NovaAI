import { it, expect } from "vitest";
import { conservativePaperFallback, paperReaderOutputSchema } from "./paper-reader.js";
it("returns a schema-valid conservative fallback without inventing facts", () => {
  const result = conservativePaperFallback("यह एक सरकारी पत्र है");
  expect(paperReaderOutputSchema.safeParse(result).success).toBe(true);
  expect(result.key_dates).toEqual([]);
  expect(result.amounts).toEqual([]);
  expect(result.who_to_contact).toEqual([]);
  expect(result.confidence).toBeLessThan(0.2);
});

it("marks empty text as unreadable instead of inventing a summary", () => {
  const result = conservativePaperFallback("   ");
  expect(result.unclear_or_unreadable).toContain("No readable text was provided.");
  expect(result.confidence).toBe(0.1);
});
