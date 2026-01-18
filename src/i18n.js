import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { DEFAULT_LANG_CODE, SUPPORTED_LNGS } from "./languages";

i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: DEFAULT_LANG_CODE,
        supportedLngs: SUPPORTED_LNGS,
        debug: import.meta.env.DEV,
        interpolation: { escapeValue: false },
        backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
            lookupLocalStorage: "xpg_lang"
        },
        defaultNS: "common",
        ns: ["common"],
        react: { useSuspense: false }
    });

export default i18n;
