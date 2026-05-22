import { Image, Text, TouchableOpacity, View } from 'react-native'
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
  scrollY: SharedValue<number>
  expandProgress?: SharedValue<number>
  rightActions?: HeaderAction[]
}

export function AppHeader({ title, scrollY, expandProgress, rightActions }: AppHeaderProps) {
  const router = useRouter()
  const { data: user } = useCurrentUser()
  const { data: profile } = useProfile(user?.id)
  const { isDark } = useTheme()

  const smallTitleStyle = useAnimatedStyle(() => ({
    opacity: expandProgress
      ? expandProgress.value
      : interpolate(scrollY.value, [22, 52], [0, 1], 'clamp'),
  }))

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: expandProgress
      ? expandProgress.value
      : interpolate(scrollY.value, [70, 110], [0, 1], 'clamp'),
  }))

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: '700',
            color: isDark ? colors.neutral[50] : colors.neutral[900],
            letterSpacing: -0.5,
          }}
        >
          PinG
        </Text>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={{ width: 26, height: 26, marginBottom: 1 }}
          resizeMode="contain"
        />
      </View>

      <Animated.Text
        numberOfLines={1}
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 17,
            fontWeight: '600',
            color: isDark ? colors.neutral[50] : colors.neutral[900],
          },
          smallTitleStyle,
        ]}
        pointerEvents="none"
      >
        {title}
      </Animated.Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {rightActions && (
          <Animated.View
            style={[{ flexDirection: 'row', alignItems: 'center', gap: 2 }, actionsStyle]}
          >
            {rightActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                onPress={action.onPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  marginRight: 5,
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
          </Animated.View>
        )}
        <TouchableOpacity
          onPress={() => router.push('/(app)/profile')}
          style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden' }}
        >
          <Avatar
            uri={profile?.avatar_url}
            name={profile?.name ?? user?.user_metadata?.name ?? 'U'}
            size="md"
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export function AppLargeTitle({ title, scrollY }: AppHeaderProps) {
  const { isDark } = useTheme()

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 44], [1, 0], 'clamp'),
  }))

  return (
    <Animated.Text
      style={[
        {
          fontSize: 34,
          fontWeight: '700',
          color: isDark ? colors.neutral[50] : colors.neutral[900],
          paddingHorizontal: 20,
          paddingBottom: 16,
        },
        animStyle,
      ]}
    >
      {title}
    </Animated.Text>
  )
}
