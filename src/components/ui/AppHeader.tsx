import { Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { Avatar } from '@components/ui/Avatar'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useProfile } from '@features/auth/hooks/useProfile'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'

export interface HeaderAction {
  icon: React.ComponentProps<typeof Ionicons>['name']
  onPress: () => void
  variant?: 'primary' | 'outline'
}

export function useAppHeader() {
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y
  })
  return { scrollY, scrollHandler }
}

interface AppHeaderProps {
  title: string
  subtitle?: string
  scrollY: SharedValue<number>
  rightActions?: HeaderAction[]
}

/**
 * Header persistente: título + subtítulo contextual a la izquierda, avatar fijo a la derecha.
 * Un hairline aparece bajo el header al hacer scroll (profundidad nativa, sin recolapsar título).
 */
export function AppHeader({ title, subtitle, scrollY, rightActions }: AppHeaderProps) {
  const router = useRouter()
  const { data: user } = useCurrentUser()
  const { data: profile } = useProfile(user?.id)
  const { isDark } = useTheme()

  const dividerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 26], [0, 1], 'clamp'),
  }))

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 14,
        }}
      >
        <View style={{ flex: 1, gap: 2, paddingRight: 12 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 28,
              fontWeight: '700',
              letterSpacing: -0.4,
              color: isDark ? colors.neutral[50] : colors.neutral[900],
            }}
          >
            {title}
          </Text>
          {!!subtitle && (
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: isDark ? colors.neutral[400] : colors.neutral[500],
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {rightActions?.map((action, i) => (
            <TouchableOpacity
              key={i}
              onPress={action.onPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                marginRight: 6,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  action.variant === 'primary'
                    ? colors.primary[500]
                    : action.variant === 'outline'
                      ? 'transparent'
                      : isDark ? colors.surface[700] : colors.neutral[200],
                borderWidth: action.variant === 'outline' ? 1.5 : 0,
                borderColor: action.variant === 'outline' ? colors.primary[500] : undefined,
              }}
            >
              <Ionicons
                name={action.icon}
                size={17}
                color={
                  action.variant === 'primary'
                    ? colors.white
                    : action.variant === 'outline'
                      ? colors.primary[500]
                      : isDark ? colors.neutral[100] : colors.neutral[700]
                }
              />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => router.push('/(app)/profile')}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Avatar
              uri={profile?.avatar_url}
              name={profile?.name ?? user?.user_metadata?.name ?? 'U'}
              size="md"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View
        style={[
          { height: 1, backgroundColor: isDark ? colors.neutral[800] : colors.neutral[200] },
          dividerStyle,
        ]}
      />
    </View>
  )
}
