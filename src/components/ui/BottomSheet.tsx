import { ReactNode } from 'react'
import { Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
        </TouchableWithoutFeedback>

        <View className="bg-white rounded-t-3xl px-5 pb-10">
          <View className="items-center pt-3 pb-4">
            <View className="w-10 h-1 rounded-full bg-neutral-200" />
          </View>

          {title && (
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-semibold text-neutral-900">{title}</Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Text className="text-sm text-neutral-500">Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}

          {children}
        </View>
      </View>
    </Modal>
  )
}
