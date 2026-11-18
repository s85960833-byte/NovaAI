import type { Locale } from "../i18n";

type Props = { locale: Locale };

export function AuthPanel({ locale }: Props) {
  const title = locale === "hi" ? "NOVA खाता" : "NOVA Account";
  const note =
    locale === "hi"
      ? "यहाँ पुराने NOVA का मौजूदा खाता सिस्टम खुलता है। साइन इन, नया खाता, पासवर्ड रिकवरी और वैकल्पिक चैट सिंक उसी खाते से चलते हैं।"
      : "This opens the existing NOVA account system. Sign-in, account creation, password recovery and optional chat sync continue to use the same account.";
  return (
    <section className="auth-panel auth-legacy-panel">
      <h2>{title}</h2>
      <p className="auth-note">{note}</p>
      <iframe
        className="auth-legacy-frame"
        src="/classic?account=1"
        title={title}
        loading="lazy"
        referrerPolicy="same-origin"
      />
    </section>
  );
}
