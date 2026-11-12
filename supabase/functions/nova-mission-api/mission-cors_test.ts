import { configuredSiteOrigin, withSiteOrigin } from "../nova-bi-api/cors.ts";

const missionSite = configuredSiteOrigin("https://novaai-4auo.onrender.com");

Deno.test("Mission API CORS uses the exact NOVA production site origin", () => {
  if (missionSite !== "https://novaai-4auo.onrender.com") {
    throw new Error("Mission API site origin must normalize to the exact NOVA origin");
  }
});

Deno.test("Mission API handles trusted browser preflight before authentication", async () => {
  let handlerCalls = 0;
  const wrapped = withSiteOrigin(async () => {
    handlerCalls += 1;
    return new Response("authenticated");
  }, missionSite);

  const response = await wrapped(new Request("https://project.example/functions/v1/nova-mission-api/missions", {
    method: "OPTIONS",
    headers: {
      Origin: missionSite,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization, apikey, content-type",
    },
  }));

  if (response.status !== 200) throw new Error("Trusted Mission API preflight must succeed");
  if (response.headers.get("Access-Control-Allow-Origin") !== missionSite) {
    throw new Error("Mission API preflight must return the exact configured origin");
  }
  if (handlerCalls !== 0) throw new Error("Preflight must not invoke authenticated Mission API logic");
});

Deno.test("Mission API rejects hostile and lookalike origins without reflecting them", async () => {
  let handlerCalls = 0;
  const wrapped = withSiteOrigin(async () => {
    handlerCalls += 1;
    return new Response("authenticated");
  }, missionSite);

  for (const origin of ["https://attacker.example", "https://novaai-4auo.onrender.com.attacker.example", "null"]) {
    const response = await wrapped(new Request("https://project.example/functions/v1/nova-mission-api/missions", {
      method: "OPTIONS",
      headers: { Origin: origin, "Access-Control-Request-Method": "GET" },
    }));
    if (response.status !== 403) throw new Error("Untrusted Mission API origin was not rejected: " + origin);
    if (response.headers.has("Access-Control-Allow-Origin")) {
      throw new Error("Untrusted Mission API origin received CORS permission: " + origin);
    }
  }
  if (handlerCalls !== 0) throw new Error("Rejected preflights must not invoke authenticated Mission API logic");
});

Deno.test("Mission API preserves server-to-server requests without adding browser CORS permission", async () => {
  const wrapped = withSiteOrigin(async () => new Response("ok"), missionSite);
  const response = await wrapped(new Request("https://project.example/functions/v1/nova-mission-api/missions"));
  if (response.status !== 200) throw new Error("Origin-less server request should remain supported");
  if (response.headers.has("Access-Control-Allow-Origin")) {
    throw new Error("Origin-less request must not receive a browser CORS allow-origin header");
  }
});
