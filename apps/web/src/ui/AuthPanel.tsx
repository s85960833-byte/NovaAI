import { useEffect, useState, type FormEvent } from "react";
import { translate, type Locale } from "../i18n";
type Props = { locale: Locale };
export function AuthPanel({ locale }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [user, setUser] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [resetMode, setResetMode] = useState(window.location.pathname === "/auth/reset");
  const t = (key: string) => translate(locale, key);
  async function loadSession() {
    try {
      let response = await fetch("/api/auth/session", { credentials: "include" });
      if (response.status === 401) {
        const refreshed = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (refreshed.ok) response = await fetch("/api/auth/session", { credentials: "include" });
      }
      if (response.ok) {
        const body = (await response.json()) as {
          authenticated: boolean;
          user?: { email?: string };
        };
        setUser(body.user?.email ?? null);
      } else setUser(null);
      setConfigured(response.status !== 503);
    } catch {
      setConfigured(false);
    }
  }
  useEffect(() => {
    let active = true;
    const confirm = async () => {
      const params = new URLSearchParams(window.location.search);
      const token_hash = params.get("token_hash");
      const type = params.get("type");
      if (
        (window.location.pathname === "/auth/confirm" ||
          window.location.pathname === "/auth/reset") &&
        token_hash &&
        type
      ) {
        setBusy(true);
        try {
          const response = await fetch("/api/auth/confirm", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token_hash, type }),
          });
          if (response.ok) {
            window.history.replaceState({}, "", type === "recovery" ? "/auth/reset" : "/");
            setNotice(t("auth.confirmed"));
          } else setNotice(t("auth.confirmFailed"));
        } finally {
          setBusy(false);
        }
      }
      if (active) await loadSession();
    };
    void confirm();
    return () => {
      active = false;
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const endpoint = resetMode
        ? "/api/auth/update-password"
        : mode === "signup"
          ? "/api/auth/signup"
          : "/api/auth/signin";
      const body = resetMode ? { password } : { email, password };
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        user?: { email?: string };
        message?: { hi?: string; en?: string };
        error?: { message?: { hi?: string; en?: string } };
      };
      if (!response.ok) {
        setNotice(data.error?.message?.[locale] ?? t("auth.failed"));
      } else {
        setNotice(
          data.message?.[locale] ??
            (resetMode
              ? t("auth.passwordUpdated")
              : mode === "signup"
                ? t("auth.checkEmail")
                : t("auth.signedIn")),
        );
        if (data.user) setUser(data.user.email ?? email);
        if (resetMode) {
          setResetMode(false);
          window.history.replaceState({}, "", "/");
          setPassword("");
        } else if (mode === "signup" && !data.user) setPassword("");
        else await loadSession();
      }
    } catch {
      setNotice(t("auth.failed"));
    } finally {
      setBusy(false);
    }
  }
  async function forgot() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setNotice(response.ok ? t("auth.resetSent") : t("auth.failed"));
    } catch {
      setNotice(t("auth.failed"));
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
      setNotice(t("auth.signedOut"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-panel">
      <h2>{t("auth.title")}</h2>
      {configured === false && <p className="auth-note">{t("auth.notConfigured")}</p>}
      {user ? (
        <>
          <p className="auth-user">
            {t("auth.signedInAs")}: <strong>{user}</strong>
          </p>
          <button className="auth-primary" onClick={() => void signOut()} disabled={busy}>
            {t("auth.signOut")}
          </button>
        </>
      ) : (
        <>
          <div className="auth-tabs">
            <button
              className={mode === "signin" ? "selected" : ""}
              onClick={() => {
                setMode("signin");
                setResetMode(false);
              }}
            >
              {t("auth.signIn")}
            </button>
            <button
              className={mode === "signup" ? "selected" : ""}
              onClick={() => {
                setMode("signup");
                setResetMode(false);
              }}
            >
              {t("auth.signUp")}
            </button>
          </div>
          <form onSubmit={submit}>
            {!resetMode && (
              <label>
                {t("auth.email")}
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            <label>
              {t("auth.password")}
              <input
                type="password"
                autoComplete={
                  resetMode
                    ? "new-password"
                    : mode === "signup"
                      ? "new-password"
                      : "current-password"
                }
                minLength={resetMode || mode === "signup" ? 12 : 1}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="auth-primary" disabled={busy || configured === false}>
              {busy
                ? t("common.loading")
                : resetMode
                  ? t("auth.updatePassword")
                  : mode === "signup"
                    ? t("auth.signUp")
                    : t("auth.signIn")}
            </button>
          </form>
          {!resetMode && mode === "signin" && (
            <button className="auth-link" onClick={() => void forgot()} disabled={busy || !email}>
              {t("auth.forgot")}
            </button>
          )}
        </>
      )}
      {notice && (
        <p className="auth-notice" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}
