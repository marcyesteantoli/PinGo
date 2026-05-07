import { ReactNode } from 'react'
import { TouchableOpacity, View } from 'react-native'

const cardShadow = {
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
}

interface CardProps {
  children: ReactNode
  onPress?: () => void
  className?: string
}

export function Card({ children, onPress, className = '' }: CardProps) {
  if (onPress) {
    return (
      <View className="rounded-2xl" style={cardShadow}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          className={`bg-white rounded-2xl p-4 ${className}`}
        >
          {children}
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="rounded-2xl" style={cardShadow}>
      <View className={`bg-white rounded-2xl p-4 ${className}`}>
        {children}
      </View>
    </View>
  )
}
