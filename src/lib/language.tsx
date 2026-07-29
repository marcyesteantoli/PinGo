import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, ReactNode, useContext, useState } from 'react'
import { supabase } from '@lib/supabase'
import { i18n, LANGUAGE_KEY, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

export type { SupportedLanguage }

interface LanguageContextValue {
  language: SupportedLanguage
  changeLanguage: (lang: SupportedLanguage) => Promise<void>
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  changeLanguage: async () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>(
    i18n.language as SupportedLanguage,
  )

  const changeLanguage = async (lang: SupportedLanguage) => {
    await i18n.changeLanguage(lang)
    setLanguage(lang)
    await AsyncStorage.setItem(LANGUAGE_KEY, lang)

    const { data } = await supabase.auth.getUser()
    if (data.user) {
      await supabase.from('profiles').update({ locale: lang }).eq('id', data.user.id)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
