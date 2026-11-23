import { useCallback, useEffect, useMemo, useState } from "react";
import translations from "./translations";
import { LanguageContext, STORAGE_KEY } from "./languageStore";

// Only the provider component lives in this file (React Fast Refresh needs
// that). The hook is in useLanguage.js and the context in languageStore.js.
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "ar" || saved === "en" ? saved : "en";
  });

  // Keep <html> in sync so CSS and the browser know the direction.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  // t(key) or t(key, { n: 2, sample: "GTX-1" }) replaces {n}, {sample}, ...
  const t = useCallback(
    (key, vars) => {
      let text = translations[lang]?.[key] ?? translations.en?.[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.split(`{${k}}`).join(String(v ?? ""));
        });
      }
      return text;
    },
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang((l) => (l === "en" ? "ar" : "en")),
      isRtl: lang === "ar",
      t,
    }),
    [lang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
