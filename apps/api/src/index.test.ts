import { describe, it, expect } from "vitest";
import { app } from "./index.js";
import { createServer } from "node:http";
describe("health route", () => {
  it("returns only public readiness metadata", async () => {
    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("server did not bind");
    try {
      const response = await fetch("http://127.0.0.1:" + address.port + "/api/health");
      const body = (await response.json()) as {
        ok: boolean;
        service: string;
        dependencies: { database: { configured: boolean; ok: boolean } };
      };
      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.service).toBe("nova-api");
      expect(body.dependencies.database).toEqual({ configured: false, ok: false });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
