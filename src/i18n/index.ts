import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Localization from 'expo-localization'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { de } from './locales/de'
import { en } from './locales/en'
import { es } from './locales/es'
import { fr } from './locales/fr'
import { it } from './locales/it'
import { pt } from './locales/pt'

export const LANGUAGE_KEY = '@pingo/language'
export const SUPPORTED_LANGUAGES = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

function getDeviceLanguage(): SupportedLanguage {
  const tag = Localization.getLocales()[0]?.languageTag ?? 'es'
  const lang = tag.split('-')[0]
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang)
    ? (lang as SupportedLanguage)
    : 'es'
}

export async function initI18n(): Promise<void> {
  const stored = await AsyncStorage.getItem(LANGUAGE_KEY)
  const lng: SupportedLanguage =
    stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)
      ? (stored as SupportedLanguage)
      : getDeviceLanguage()

  await i18next.use(initReactI18next).init({
    lng,
    fallbackLng: 'en',
    resources: {
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
      it: { translation: it },
    },
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  })
}

export { i18next as i18n }
