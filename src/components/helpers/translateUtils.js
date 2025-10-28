import axios from 'axios';

const translationCache = new Map();

export const supportedLanguages = ['en', 'ko', 'pt', 'ru', 'th', 'tr', 'zh'];

export const translateText = async (text, targetLang) => {
    if (!text || !targetLang) return text;

    const cacheKey = `${text}_${targetLang}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    const apiUrl = `https://lingva.ml/api/v1/en/${targetLang}/${encodeURIComponent(text)}`;

    try {
        const response = await axios.get(apiUrl);

        if (response.status === 200 && response.data?.translation) {
            const translatedText = response.data.translation;
            translationCache.set(cacheKey, translatedText);
            return translatedText;
        } else {
            console.error('Translation failed: No translation found');
            return text;
        }
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
};

export const translateToAllLanguages = async (text) => {
    if (!text) return {};

    const translations = {};
    const translationPromises = supportedLanguages.map(async (lang) => {
        translations[lang] = await translateText(text, lang);
    });

    await Promise.all(translationPromises);
    return translations;
};
