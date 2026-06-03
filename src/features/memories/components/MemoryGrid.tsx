import { useEffect, useState } from 'react'
import { Dimensions, FlatList, Image, Pressable, View } from 'react-native'
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Skeleton } from '@components/ui/Skeleton'
import { useStaggerEnter } from '@lib/useStaggerEnter'
import { EASE_OUT, DURATION } from '@lib/animations'
import type { Memory } from '@types/index'

const SCREEN_WIDTH = Dimensions.get('window').width
const CELL_GAP = 3
const CELL_SIZE = (SCREEN_WIDTH - 40 - CELL_GAP * 2) / 3 // px-5 each side + 2 gaps

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export interface MemoryGridProps {
  memories: Memory[]
  onPress: (memory: Memory, index: number) => void
  onLongPress?: (memory: Memory) => void
  scrollY?: SharedValue<number>
  selectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (memory: Memory) => void
}

type ImageStatus = 'loading' | 'loaded' | 'error'

interface MemoryCellProps {
  memory: Memory
  index: number
  onPress: (m: Memory, i: number) => void
  onLongPress?: (m: Memory) => void
  selectionMode: boolean
  selected: boolean
  onToggleSelect?: (m: Memory) => void
}

function MemoryCell({
  memory,
  index,
  onPress,
  onLongPress,
  selectionMode,
  selected,
  onToggleSelect,
}: MemoryCellProps) {
  const [status, setStatus] = useState<ImageStatus>('loading')
  const size = { width: CELL_SIZE, height: CELL_SIZE }

  // Press scale feedback
  const scale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  // Animated selection overlay
  const selectionOpacity = useSharedValue(selectionMode ? 1 : 0)
  const checkScale = useSharedValue(selected ? 1 : 0.6)

  useEffect(() => {
    selectionOpacity.value = withTiming(selectionMode ? 1 : 0, {
      duration: DURATION.micro,
      easing: EASE_OUT,
    })
  }, [selectionMode])

  useEffect(() => {
    checkScale.value = withTiming(selected ? 1 : 0.6, {
      duration: DURATION.micro,
      easing: EASE_OUT,
    })
  }, [selected])

  const overlayStyle = useAnimatedStyle(() => ({ opacity: selectionOpacity.value }))
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }))

  // Per-cell stagger entrance
  const staggerStyle = useStaggerEnter(index, { delay: 45, duration: 260 })

  const handlePress = () => {
    if (selectionMode) {
      onToggleSelect?.(memory)
    } else {
      onPress(memory, index)
    }
  }

  const handleLongPress = () => {
    if (!selectionMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      onLongPress?.(memory)
    }
  }

  return (
    <Animated.View style={staggerStyle}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={() => {
          scale.value = withTiming(0.96, { duration: DURATION.press, easing: EASE_OUT })
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 180, easing: EASE_OUT })
        }}
        delayLongPress={350}
        style={{ overflow: 'hidden', borderRadius: 10 }}
      >
        <Animated.View style={[size, pressStyle]}>
          {/* Image */}
          <Image
            source={{ uri: memory.image_url }}
            style={size}
            resizeMode="cover"
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
          />

          {/* Skeleton while loading */}
          {status === 'loading' && (
            <Skeleton width={CELL_SIZE} height={CELL_SIZE} className="absolute top-0 left-0" />
          )}

          {/* Error state */}
          {status === 'error' && (
            <View
              style={[size, { position: 'absolute', top: 0, left: 0 }]}
              className="bg-neutral-200 dark:bg-neutral-700 items-center justify-center"
            >
              <Ionicons name="image-outline" size={28} color="#9ca3af" />
            </View>
          )}

          {/* Caption indicator */}
          {memory.caption && !selectionMode && (
            <View className="absolute bottom-1.5 left-1.5 bg-black/50 rounded-full px-1.5 py-[3px] flex-row items-center gap-[3px]">
              <Ionicons name="chatbubble-ellipses" size={9} color="#fff" />
            </View>
          )}

          {/* Selection overlay — animated */}
          <Animated.View
            style={[size, { position: 'absolute', top: 0, left: 0 }, overlayStyle]}
            className={selected ? 'bg-primary-500/35' : 'bg-black/20'}
            pointerEvents="none"
          >
            <Animated.View className="absolute top-1.5 right-1.5" style={checkStyle}>
              {selected ? (
                <View className="w-6 h-6 rounded-full bg-primary-500 items-center justify-center border-2 border-white">
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              ) : (
                <View className="w-6 h-6 rounded-full border-2 border-white/80 bg-black/20" />
              )}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

export function MemoryGrid({
  memories,
  onPress,
  onLongPress,
  scrollY,
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelect,
}: MemoryGridProps) {
  const scrollHandler = useAnimatedScrollHandler((e) => {
    if (scrollY) scrollY.value = e.contentOffset.y
  })

  return (
    <AnimatedFlatList
      data={memories}
      keyExtractor={(item) => (item as Memory).id}
      numColumns={3}
      contentContainerClassName="px-5 pb-24"
      columnWrapperStyle={{ gap: CELL_GAP, marginBottom: CELL_GAP }}
      renderItem={({ item, index }) => (
        <MemoryCell
          memory={item as Memory}
          index={index}
          onPress={onPress}
          onLongPress={onLongPress}
          selectionMode={selectionMode}
          selected={selectedIds.has((item as Memory).id)}
          onToggleSelect={onToggleSelect}
        />
      )}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      removeClippedSubviews
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    />
  )
}
