import { ReactNode } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { cardShadow } from '@lib/shadows'

interface CardProps {
  children: ReactNode
  onPress?: () => void
  className?: string
}

export function Card({ children, onPress, className = '' }: CardProps) {
  if (onPress) {
    return (
      <View className="rounded-[12px]" style={cardShadow}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          className={`bg-white dark:bg-surface-800 rounded-[12px] p-4 ${className}`}
        >
          {children}
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="rounded-[12px]" style={cardShadow}>
      <View className={`bg-white dark:bg-surface-800 rounded-[12px] p-4 ${className}`}>
        {children}
      </View>
    </View>
  )
}
