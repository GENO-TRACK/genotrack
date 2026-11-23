import { createContext } from "react";

// Shared by LanguageContext.jsx (the provider) and useLanguage.js (the hook).
export const STORAGE_KEY = "genotrack_lang";
export const LanguageContext = createContext(null);
