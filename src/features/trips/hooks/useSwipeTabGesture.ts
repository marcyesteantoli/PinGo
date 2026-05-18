import { useCallback, useEffect, useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router'
import { Gesture } from 'react-native-gesture-handler'
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

const TAB_ROUTES = ['timeline', 'memories', 'expenses', 'documents']

export function useSwipeTabGesture() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const { width: screenWidth } = useWindowDimensions()

  const currentTab = pathname.split('/').pop() ?? 'timeline'
  const currentIndex = TAB_ROUTES.indexOf(currentTab)
  const tabIndex = useSharedValue(currentIndex)
  const translateX = useSharedValue(0)

  useEffect(() => {
    tabIndex.value = currentIndex
    translateX.value = 0
  }, [currentIndex])

  const goToTab = useCallback(
    (tab: string) => router.navigate(`/trips/${id}/${tab}` as never),
    [router, id]
  )

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: translateX.value }],
  }))

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-10, 10])
        .onUpdate((e) => {
          'worklet'
          if (e.translationX < 0 && tabIndex.value >= TAB_ROUTES.length - 1) return
          if (e.translationX > 0 && tabIndex.value <= 0) return
          translateX.value = e.translationX
        })
        .onEnd((e) => {
          'worklet'
          const shouldSwitch =
            Math.abs(e.velocityX) > 300 || Math.abs(e.translationX) > screenWidth * 0.3

          const goingLeft = e.translationX < 0
          const canSwitch = goingLeft
            ? tabIndex.value < TAB_ROUTES.length - 1
            : tabIndex.value > 0

          if (!shouldSwitch || !canSwitch) {
            translateX.value = withSpring(0, { damping: 20, stiffness: 200 })
            return
          }

          const target = goingLeft ? -screenWidth : screenWidth
          translateX.value = withTiming(target, { duration: 180 }, () => {
            const nextTab = goingLeft
              ? TAB_ROUTES[tabIndex.value + 1]
              : TAB_ROUTES[tabIndex.value - 1]
            runOnJS(goToTab)(nextTab)
          })
        }),
    [goToTab, screenWidth]
  )

  return { gesture, animatedStyle }
}
