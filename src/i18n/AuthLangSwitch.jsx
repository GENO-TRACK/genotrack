import { useLanguage } from "../i18n/LanguageContext";

export default function AuthLangSwitch() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      className="auth-lang"
      onClick={toggleLang}
      aria-label={lang === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      {lang === "en" ? "عربي" : "EN"}
    </button>
  );
}
