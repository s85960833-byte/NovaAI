import { useEffect, useState } from "react";
import type { Locale } from "../i18n";

type Props = { locale: Locale };

export function AuthPanel({ locale }: Props) {
  const [open, setOpen] = useState(false);
  const title = locale === "hi" ? "NOVA खाता" : "NOVA Account";
  const note =
    locale === "hi"
      ? "यहाँ पुराने NOVA का मौजूदा खाता सिस्टम खुलता है। साइन इन, नया खाता, पासवर्ड रिकवरी और वैकल्पिक चैट सिंक उसी खाते से चलते हैं।"
      : "This opens the existing NOVA account system. Sign-in, account creation, password recovery and optional chat sync continue to use the same account.";

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <section className="auth-panel auth-legacy-panel">
      <h2>{title}</h2>
      <p className="auth-note">{note}</p>
      <button className="auth-open-button" type="button" onClick={() => setOpen(true)}>
        {locale === "hi" ? "खाता खोलें" : "Open account"}
      </button>
      {open && (
        <div
          className="auth-frame-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nova-auth-frame-title"
        >
          <div className="auth-frame-topbar">
            <strong id="nova-auth-frame-title">{title}</strong>
            <button type="button" onClick={() => setOpen(false)}>
              {locale === "hi" ? "बंद करें" : "Close"}
            </button>
          </div>
          <iframe
            className="auth-legacy-frame"
            src="/classic?account=1"
            title={title}
            loading="eager"
            referrerPolicy="same-origin"
          />
        </div>
      )}
    </section>
  );
}
