import { Ionicons } from '@expo/vector-icons'
import { Linking, Text, TouchableOpacity, View } from 'react-native'
import type { Document } from '@types/index'

type DocumentWithExperience = Document & { experience_title: string | null }

interface DocumentCardProps {
  document: DocumentWithExperience
}

function getFileIcon(fileType: string | null): React.ComponentProps<typeof Ionicons>['name'] {
  if (!fileType) return 'document-outline'
  if (fileType.includes('pdf')) return 'document-text-outline'
  if (fileType.includes('image')) return 'image-outline'
  return 'document-outline'
}

function getFileIconColor(fileType: string | null): string {
  if (!fileType) return '#737373'
  if (fileType.includes('pdf')) return '#ef4444'
  if (fileType.includes('image')) return '#0284c7'
  return '#737373'
}

function getFileBg(fileType: string | null): string {
  if (!fileType) return 'bg-neutral-100'
  if (fileType.includes('pdf')) return 'bg-red-100'
  if (fileType.includes('image')) return 'bg-sky-100'
  return 'bg-neutral-100'
}

export function DocumentCard({ document }: DocumentCardProps) {
  const handleOpen = () => {
    if (document.file_url) {
      Linking.openURL(document.file_url)
    }
  }

  return (
    <TouchableOpacity
      onPress={handleOpen}
      className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center gap-3"
      activeOpacity={0.7}
    >
      <View className={`w-10 h-10 rounded-xl items-center justify-center ${getFileBg(document.file_type)}`}>
        <Ionicons
          name={getFileIcon(document.file_type)}
          size={20}
          color={getFileIconColor(document.file_type)}
        />
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold text-neutral-900" numberOfLines={1}>
          {document.name}
        </Text>
        {document.experience_title && (
          <Text className="text-xs text-neutral-400" numberOfLines={1}>
            {document.experience_title}
          </Text>
        )}
      </View>

      <Ionicons name="open-outline" size={18} color="#e5e5e5" />
    </TouchableOpacity>
  )
}
