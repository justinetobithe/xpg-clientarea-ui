import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './components/json/en.json';
import ko from './components/json/ko.json';
import th from './components/json/th.json';
import zh from './components/json/zh.json';
import tr from './components/json/tr.json';
import pt from './components/json/pt.json';
import ru from './components/json/ru.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ko: { translation: ko },
            th: { translation: th },
            zh: { translation: zh },
            tr: { translation: tr },
            pt: { translation: pt },
            ru: { translation: ru },
        },
        fallbackLng: "en",
        detection: {
            order: ['localStorage', 'navigator'],
        },
        interpolation: { escapeValue: false },
    });

export default i18n;