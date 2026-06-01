import { useState } from 'react'
import { Dimensions, FlatList, Image, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Skeleton } from '@components/ui/Skeleton'
import { useStaggerEnter } from '@lib/useStaggerEnter'
import type { Memory } from '@types/index'

const SCREEN_WIDTH = Dimensions.get('window').width
const ITEM_SIZE = (SCREEN_WIDTH - 40 - 8) / 3 // px-5 on each side + 2 gaps

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
  const size = { width: ITEM_SIZE, height: ITEM_SIZE }

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

  const rowIndex = Math.floor(index / 3)
  const staggerStyle = useStaggerEnter(rowIndex, { delay: 80, duration: 280 })

  return (
    <Animated.View style={staggerStyle}>
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
      delayLongPress={350}
      style={[size, { overflow: 'hidden', borderRadius: 8 }]}
    >
      {/* Image always rendered so onLoad/onError fire reliably */}
      <Image
        source={{ uri: memory.image_url }}
        style={size}
        resizeMode="cover"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />

      {/* Skeleton while loading */}
      {status === 'loading' && (
        <Skeleton width={ITEM_SIZE} height={ITEM_SIZE} className="absolute top-0 left-0" />
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

      {/* Selection overlay */}
      {selectionMode && (
        <View
          style={[size, { position: 'absolute', top: 0, left: 0 }]}
          className={selected ? 'bg-primary-500/40' : 'bg-black/20'}
        >
          {/* Checkmark circle */}
          <View className="absolute top-1.5 right-1.5">
            {selected ? (
              <View className="w-6 h-6 rounded-full bg-primary-500 items-center justify-center border-2 border-white">
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            ) : (
              <View className="w-6 h-6 rounded-full border-2 border-white/80 bg-black/20" />
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
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
      columnWrapperClassName="gap-1 mb-1"
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
