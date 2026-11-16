import { Link } from "react-router-dom";
import AuthLangSwitch from "../i18n/AuthLangSwitch";
import { useLanguage } from "../i18n/LanguageContext";

export default function LegalPage({ type = "privacy" }) {
  const { t, isRtl } = useLanguage();
  const title = type === "terms" ? t("auth.terms") : t("auth.privacy");

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        padding: "56px 24px",
        background: "#05080a",
        color: "#ffffff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <AuthLangSwitch />

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ color: "#2dd4bf", marginBottom: 16 }}>{title}</h1>
        <p style={{ color: "#a3adb5", lineHeight: 1.8 }}>
          {t("auth.legal.text", { title: title.toLowerCase() })}
        </p>
        <Link to="/signup" style={{ color: "#2dd4bf" }}>
          {isRtl ? "→" : "←"} {t("auth.legal.back")}
        </Link>
      </div>
    </main>
  );
}
