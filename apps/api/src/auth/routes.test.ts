import { it, expect } from "vitest";
import { authConfigured } from "./client.js";
it("does not enable account creation until the isolated staging project is configured", () => {
  expect(authConfigured()).toBe(false);
});
