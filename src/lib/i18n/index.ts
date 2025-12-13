import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

import fr from "./fr";
import en from "./en";
import he from "./he";

export const LANGUAGES = {
  fr: { name: "Français", nativeName: "Français", flag: "🇫🇷", rtl: false },
  en: { name: "English", nativeName: "English", flag: "🇬🇧", rtl: false },
  he: { name: "Hebrew", nativeName: "עברית", flag: "🇮🇱", rtl: true },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

const LANGUAGE_STORAGE_KEY = "@minyannow_language";

// Détecte si l'appareil est en RTL
const isRTL = I18nManager.isRTL;

// Langue par défaut
const DEFAULT_LANGUAGE: LanguageCode = "fr";

// Récupère la langue sauvegardée
export const getSavedLanguage = async (): Promise<LanguageCode> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && savedLanguage in LANGUAGES) {
      return savedLanguage as LanguageCode;
    }
  } catch (error) {
    console.error("Error loading saved language:", error);
  }
  return DEFAULT_LANGUAGE;
};

// Sauvegarde la langue
export const saveLanguage = async (language: LanguageCode): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error("Error saving language:", error);
  }
};

// Change la langue
export const changeLanguage = async (language: LanguageCode): Promise<void> => {
  const languageInfo = LANGUAGES[language];
  
  // Sauvegarde la préférence
  await saveLanguage(language);
  
  // Change la langue de i18n
  await i18n.changeLanguage(language);
  
  // Gère le RTL pour l'hébreu
  if (languageInfo.rtl !== I18nManager.isRTL) {
    I18nManager.allowRTL(languageInfo.rtl);
    I18nManager.forceRTL(languageInfo.rtl);
    // Note: Un redémarrage de l'app est nécessaire pour appliquer le RTL
  }
};

// Configuration i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      he: { translation: he },
    },
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false, // React gère déjà l'échappement
    },
    react: {
      useSuspense: false, // Désactive le suspense pour React Native
    },
  });

// Initialise la langue sauvegardée au démarrage
export const initializeLanguage = async (): Promise<LanguageCode> => {
  const savedLanguage = await getSavedLanguage();
  await i18n.changeLanguage(savedLanguage);
  return savedLanguage;
};

export default i18n;
