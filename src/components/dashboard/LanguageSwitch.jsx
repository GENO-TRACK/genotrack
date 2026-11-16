import { useLanguage } from "../../i18n/LanguageContext";

export default function LanguageSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <button
        type="button"
        className={lang === "en" ? "on" : ""}
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
      >
        English
      </button>
      <button
        type="button"
        className={lang === "ar" ? "on" : ""}
        aria-pressed={lang === "ar"}
        onClick={() => setLang("ar")}
      >
        العربية
      </button>
    </div>
  );
}
