import { parseJsonObject, RequestInputError } from "./request-input.ts";

Deno.test("parses an object request body", () => {
  const parsed = parseJsonObject('{"name":"NOVA","count":2}');
  if (parsed.name !== "NOVA" || parsed.count !== 2) {
    throw new Error("JSON object values were not preserved");
  }
});

Deno.test("treats an empty request body as an empty object", () => {
  const parsed = parseJsonObject("");
  if (Object.keys(parsed).length !== 0) throw new Error("Empty body should become an empty object");
});

Deno.test("rejects malformed JSON with HTTP 400 input error", () => {
  try {
    parseJsonObject("{");
    throw new Error("Malformed JSON was accepted");
  } catch (error) {
    if (!(error instanceof RequestInputError) || error.status !== 400) {
      throw new Error("Malformed JSON must produce a 400 RequestInputError");
    }
  }
});

Deno.test("rejects JSON null, arrays, strings and numbers as non-object bodies", () => {
  for (const raw of ["null", "[]", '"text"', "42", "true"]) {
    try {
      parseJsonObject(raw);
      throw new Error("Non-object JSON was accepted: " + raw);
    } catch (error) {
      if (!(error instanceof RequestInputError) || error.status !== 400 ||
          error.message !== "Request body must be a JSON object") {
        throw new Error("Non-object JSON must produce a 400 object-shape error: " + raw);
      }
    }
  }
});
