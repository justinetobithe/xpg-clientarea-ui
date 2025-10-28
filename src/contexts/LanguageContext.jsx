import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [selectedLanguage, setSelectedLanguage] = useState({
        code: "en",
        name: "English",
        flag: "🇬🇧",
        initial: "EN",
    });

    const setLanguage = (language) => {
        setSelectedLanguage(language);
    };

    const value = {
        selectedLanguage,
        setLanguage,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    return useContext(LanguageContext);
};