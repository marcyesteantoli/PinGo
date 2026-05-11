import { Ionicons } from '@expo/vector-icons'
import { Linking, Text, TouchableOpacity, View } from 'react-native'
import type { Document } from '@types/index'
import { colors } from '@lib/colors'

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
  if (!fileType) return colors.neutral[400]
  if (fileType.includes('pdf')) return colors.error
  if (fileType.includes('image')) return colors.primary[500]
  return colors.neutral[400]
}

function getFileBg(fileType: string | null): string {
  if (!fileType) return 'bg-neutral-100 dark:bg-surface-700'
  if (fileType.includes('pdf')) return 'bg-red-100 dark:bg-red-900/30'
  if (fileType.includes('image')) return 'bg-sky-100 dark:bg-sky-900/30'
  return 'bg-neutral-100 dark:bg-surface-700'
}

export function DocumentCard({ document }: DocumentCardProps) {
  const handleOpen = () => {
    if (document.file_url) {
      Linking.openURL(document.file_url)
    }
  }

  return (
    <View
      className="rounded-2xl"
      style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 }}
    >
      <TouchableOpacity
        onPress={handleOpen}
        className="bg-white dark:bg-surface-800 rounded-2xl p-4 flex-row items-center gap-3"
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
          <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
            {document.name}
          </Text>
          {document.experience_title && (
            <Text className="text-xs text-neutral-400 dark:text-neutral-500" numberOfLines={1}>
              {document.experience_title}
            </Text>
          )}
        </View>

        <Ionicons name="open-outline" size={18} color={colors.neutral[300]} />
      </TouchableOpacity>
    </View>
  )
}
