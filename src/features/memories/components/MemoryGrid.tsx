import { Dimensions, FlatList, Image, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import type { Memory } from '@types/index'

const SCREEN_WIDTH = Dimensions.get('window').width
const ITEM_SIZE = (SCREEN_WIDTH - 40 - 8) / 3 // px-5 on each side + 2 gaps

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

interface MemoryGridProps {
  memories: Memory[]
  onPress: (memory: Memory) => void
  scrollY?: SharedValue<number>
}

export function MemoryGrid({ memories, onPress, scrollY }: MemoryGridProps) {
  const scrollHandler = useAnimatedScrollHandler(e => {
    if (scrollY) {
      scrollY.value = e.contentOffset.y
    }
  })

  return (
    <AnimatedFlatList
      data={memories}
      keyExtractor={(item) => (item as Memory).id}
      numColumns={3}
      contentContainerClassName="px-5 pb-24"
      columnWrapperClassName="gap-1 mb-1"
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onPress(item as Memory)}
          activeOpacity={0.85}
          style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
        >
          <Image
            source={{ uri: (item as Memory).image_url }}
            style={{ width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: 8 }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      removeClippedSubviews
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    />
  )
}
