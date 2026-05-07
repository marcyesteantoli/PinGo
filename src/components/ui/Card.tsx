import { ReactNode } from 'react'
import { TouchableOpacity, View } from 'react-native'

interface CardProps {
  children: ReactNode
  onPress?: () => void
  className?: string
}

export function Card({ children, onPress, className = '' }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className={`bg-white rounded-2xl shadow-sm p-4 ${className}`}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return (
    <View className={`bg-white rounded-2xl shadow-sm p-4 ${className}`}>
      {children}
    </View>
  )
}
