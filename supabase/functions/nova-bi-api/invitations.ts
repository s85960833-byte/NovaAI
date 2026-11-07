export type AuthUserLookup = {
  id: string;
  email?: string | null;
};

type AdminAuthClient = {
  auth: {
    admin: {
      listUsers(options: { page: number; perPage: number }): Promise<{
        data: { users: AuthUserLookup[] } | null;
        error: unknown | null;
      }>;
    };
  };
};

// Supabase's inviteUserByEmail rejects an address that already has an account.
// Resolve existing accounts through the server-only Admin API so those users
// can receive an in-app organization invitation without creating a duplicate.
export async function findAuthUserByEmail(
  admin: AdminAuthClient,
  email: string,
): Promise<AuthUserLookup | null> {
  const target = email.trim().toLowerCase();
  if (!target) throw new TypeError("email is required");

  const perPage = 1000;
  const maxPages = 100;
  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error("Could not safely check existing account status");
    const users = data?.users || [];
    const found = users.find((user) => user.email?.trim().toLowerCase() === target);
    if (found) return found;
    if (users.length < perPage) return null;
  }

  throw new Error("Account lookup exceeded the safe pagination limit");
}
