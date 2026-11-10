import { findAuthUserByEmail, hasConfirmedEmail } from "./invitations.ts";

Deno.test("finds existing users case-insensitively", async () => {
  const admin = { auth: { admin: { listUsers: async () => ({
    data: { users: [{ id: "user-1", email: "Person@Example.com", email_confirmed_at: "2026-01-01T00:00:00Z" }] }, error: null
  }) } } };
  const found = await findAuthUserByEmail(admin, " person@example.com ");
  if (found?.id !== "user-1") throw new Error("existing user was not found");
});

Deno.test("paginates until a matching existing user is found", async () => {
  let calls = 0;
  const admin = { auth: { admin: { listUsers: async ({ page }: { page: number }) => {
    calls += 1;
    return { data: { users: page === 1
      ? Array.from({ length: 1000 }, (_, i) => ({ id: "user-" + i, email: "other-" + i + "@example.com" }))
      : [{ id: "target-user", email: "target@example.com" }] }, error: null };
  } } } };
  const found = await findAuthUserByEmail(admin, "target@example.com");
  if (found?.id !== "target-user" || calls !== 2) throw new Error("pagination did not locate the user");
});

Deno.test("returns null when a short final page has no match", async () => {
  const admin = { auth: { admin: { listUsers: async () => ({
    data: { users: [{ id: "other", email: "other@example.com" }] }, error: null
  }) } } };
  const found = await findAuthUserByEmail(admin, "missing@example.com");
  if (found !== null) throw new Error("missing user should return null");
});

Deno.test("fails closed when the Admin API lookup fails", async () => {
  const admin = { auth: { admin: { listUsers: async () => ({
    data: null, error: new Error("private provider detail")
  }) } } };
  let rejected = false;
  try { await findAuthUserByEmail(admin, "person@example.com"); } catch { rejected = true; }
  if (!rejected) throw new Error("lookup errors must not be treated as a new account");
});

Deno.test("requires an existing invitee to have a confirmed email", () => {
  if (hasConfirmedEmail({ id: "user-unconfirmed", email: "person@example.com" })) {
    throw new Error("missing email confirmation must be rejected");
  }
  if (hasConfirmedEmail({ id: "user-unconfirmed", email: "person@example.com", email_confirmed_at: null })) {
    throw new Error("null email confirmation must be rejected");
  }
  if (!hasConfirmedEmail({ id: "user-confirmed", email: "person@example.com", email_confirmed_at: "2026-01-01T00:00:00Z" })) {
    throw new Error("confirmed email must be accepted");
  }
});
