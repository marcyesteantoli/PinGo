import { Ionicons } from '@expo/vector-icons'
import { Image, Modal, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar } from '@components/ui/Avatar'
import type { Memory } from '@types/index'
import { colors } from '@lib/colors'

interface MemoryDetailProps {
  memory: Memory | null
  visible: boolean
  onClose: () => void
  canDelete?: boolean
  onDelete?: (id: string) => void
  uploaderName?: string
  uploaderAvatar?: string | null
}

export function MemoryDetail({
  memory,
  visible,
  onClose,
  canDelete,
  onDelete,
  uploaderName = 'Desconocido',
  uploaderAvatar,
}: MemoryDetailProps) {
  const insets = useSafeAreaInsets()

  if (!memory) return null

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <Ionicons name="close" size={22} color={colors.white} />
          </TouchableOpacity>

          {canDelete && onDelete && (
            <TouchableOpacity
              onPress={() => { onDelete(memory.id); onClose() }}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Image */}
        <Image
          source={{ uri: memory.image_url }}
          className="flex-1 w-full"
          resizeMode="contain"
        />

        {/* Footer */}
        <View className="px-5 py-4 gap-3">
          {memory.caption && (
            <Text className="text-white text-base">{memory.caption}</Text>
          )}
          <View className="flex-row items-center gap-2">
            <Avatar uri={uploaderAvatar} name={uploaderName} size="sm" />
            <Text className="text-neutral-400 text-sm">{uploaderName}</Text>
          </View>
        </View>
      </View>
    </Modal>
  )
}
