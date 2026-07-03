import { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { colors } from '@lib/colors'
import { EASE_OUT, DURATION } from '@lib/animations'

type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  onPress?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  disabled?: boolean
  children: ReactNode
  className?: string
}

const variantClasses: Record<ButtonVariant, {
  container: string
  text: string
  spinner: string
  disabledContainer: string
  disabledText: string
}> = {
  primary: {
    container: 'bg-primary-500',
    text: 'text-white',
    spinner: colors.white,
    disabledContainer: 'bg-primary-300 dark:bg-primary-800',
    disabledText: 'text-primary-100 dark:text-primary-400',
  },
  ghost: {
    container: 'border border-neutral-300 bg-transparent dark:border-neutral-600',
    text: 'text-neutral-700 dark:text-neutral-200',
    spinner: colors.neutral[600],
    disabledContainer: 'border border-neutral-200 bg-transparent dark:border-neutral-700',
    disabledText: 'text-neutral-400 dark:text-neutral-500',
  },
  outline: {
    container: 'border-2 border-primary-500 bg-white dark:bg-surface-900',
    text: 'text-primary-500',
    spinner: colors.primary[500],
    disabledContainer: 'border-2 border-primary-200 bg-white dark:border-primary-800 dark:bg-surface-900',
    disabledText: 'text-primary-300 dark:text-primary-700',
  },
  destructive: {
    container: 'bg-error',
    text: 'text-white',
    spinner: colors.white,
    disabledContainer: 'bg-error-300 dark:bg-error-800',
    disabledText: 'text-error-100 dark:text-error-400',
  },
}

const sizeClasses: Record<ButtonSize, { container: string; text: string; lineHeight: number }> = {
  sm: { container: 'px-4 py-2 rounded-full', text: 'text-[15px] font-medium', lineHeight: 20 },
  md: { container: 'px-5 py-2.5 rounded-xl', text: 'text-[17px] font-semibold', lineHeight: 22 },
  lg: { container: 'px-6 py-3.5 rounded-2xl', text: 'text-[17px] font-semibold', lineHeight: 22 },
}

export function Button({
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  className = '',
}: ButtonProps) {
  const v = variantClasses[variant]
  const s = sizeClasses[size]
  const isDisabled = disabled || isLoading

  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: DURATION.press, easing: EASE_OUT })
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT })
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
    >
      <Animated.View
        style={animStyle}
        className={`flex-row items-center justify-center ${isDisabled ? v.disabledContainer : v.container} ${s.container} ${className}`}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={v.spinner} />
        ) : typeof children === 'string' ? (
          <Text
            className={`${isDisabled ? v.disabledText : v.text} ${s.text}`}
            style={{ includeFontPadding: false, lineHeight: s.lineHeight }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  )
}
