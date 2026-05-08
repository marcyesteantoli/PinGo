import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheet } from '@components/ui/BottomSheet'

interface DeleteExperienceSheetProps {
  visible: boolean
  documentCount: number
  onClose: () => void
  onConfirm: () => void
}

export function DeleteExperienceSheet({ visible, documentCount, onClose, onConfirm }: DeleteExperienceSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Eliminar experiencia">
      <View className="gap-4 mb-2">
        <View className="flex-row items-start gap-3 bg-error/10 rounded-2xl p-4">
          <Ionicons name="warning-outline" size={20} color="#ef4444" />
          <Text className="text-sm text-neutral-700 flex-1">
            Esta experiencia tiene {documentCount}{' '}
            {documentCount === 1 ? 'documento adjunto' : 'documentos adjuntos'} que también se eliminarán permanentemente.
          </Text>
        </View>

        <TouchableOpacity
          onPress={onConfirm}
          className="bg-error rounded-2xl py-3.5 items-center"
        >
          <Text className="text-white font-semibold">Eliminar todo</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} className="py-2 items-center">
          <Text className="text-neutral-500 font-medium">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
