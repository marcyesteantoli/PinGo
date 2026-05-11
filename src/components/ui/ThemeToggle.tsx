import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity } from 'react-native'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.7}
      className={`w-9 h-9 rounded-xl items-center justify-center ${className}`}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={18}
        color={isDark ? colors.warning[400] : colors.neutral[500]}
      />
    </TouchableOpacity>
  )
}
