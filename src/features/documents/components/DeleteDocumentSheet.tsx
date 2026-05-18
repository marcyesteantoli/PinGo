import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheet } from '@components/ui/BottomSheet'
import { colors } from '@lib/colors'

interface DeleteDocumentSheetProps {
  visible: boolean
  documentName?: string
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteDocumentSheet({ visible, documentName, onClose, onConfirm, isLoading }: DeleteDocumentSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Eliminar documento">
      <View className="gap-4 mb-2">
        <View className="flex-row items-start gap-3 bg-error/10 rounded-2xl p-4">
          <Ionicons name="warning-outline" size={20} color={colors.error} />
          <Text className="text-sm text-neutral-700 dark:text-neutral-300 flex-1">
            {documentName
              ? `"${documentName}" se eliminará permanentemente.`
              : 'Este documento se eliminará permanentemente.'}
            {' '}Esta acción no se puede deshacer.
          </Text>
        </View>

        <TouchableOpacity
          onPress={onConfirm}
          disabled={isLoading}
          className="bg-error rounded-2xl py-3.5 items-center"
          style={{ opacity: isLoading ? 0.6 : 1 }}
        >
          <Text className="text-white font-semibold">Eliminar documento</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} className="py-2 items-center">
          <Text className="text-neutral-500 font-medium">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
