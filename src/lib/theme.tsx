import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'

const THEME_KEY = '@tripsync/theme'

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const [isDark, setIsDark] = useState(systemScheme === 'dark')

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'dark') setIsDark(true)
      else if (stored === 'light') setIsDark(false)
    })
  }, [])

  const toggleTheme = async () => {
    const next = !isDark
    setIsDark(next)
    await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
