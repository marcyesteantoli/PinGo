import { useEffect } from 'react'
import { Appearance, Image, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.25)

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 350 }), withTiming(0.25, { duration: 350 })),
        -1,
        false
      )
    )
  }, [])

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        style,
        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0046de', marginHorizontal: 5 },
      ]}
    />
  )
}

export function WelcomeScreen() {
  const isDark = Appearance.getColorScheme() === 'dark'

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#0a0f1e' : '#ffffff',
      }}
    >
      <Image
        source={require('../../../../assets/images/icon.png')}
        style={{ width: 96, height: 96, borderRadius: 22 }}
      />
      <Text
        style={{
          marginTop: 16,
          fontSize: 24,
          fontWeight: '700',
          letterSpacing: -0.5,
          color: isDark ? '#ffffff' : '#0a0f1e',
        }}
      >
        PinGo
      </Text>
      <View style={{ flexDirection: 'row', marginTop: 28 }}>
        <Dot delay={0} />
        <Dot delay={180} />
        <Dot delay={360} />
      </View>
    </View>
  )
}
