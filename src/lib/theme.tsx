import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, ReactNode, useContext, useEffect } from 'react'
import { useColorScheme as useNativeWindColorScheme } from 'nativewind'

const THEME_KEY = '@pingo/theme'

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useNativeWindColorScheme()
  const isDark = colorScheme === 'dark'

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'dark') setColorScheme('dark')
      else if (stored === 'light') setColorScheme('light')
    })
  }, [])

  const toggleTheme = async () => {
    const next = !isDark
    setColorScheme(next ? 'dark' : 'light')
    await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
