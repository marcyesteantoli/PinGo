import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { SectionList, Text, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fabShadow } from '@lib/shadows'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { DocumentCard } from '@features/documents/components/DocumentCard'
import { UploadDocumentSheet } from '@features/documents/components/UploadDocumentSheet'
import { useDocuments } from '@features/documents/hooks/useDocuments'
import { useUploadDocument } from '@features/documents/hooks/useUploadDocument'
import type { UploadDocumentFormData } from '@features/documents/types'

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

export default function DocumentsScreen() {
  const { tripId } = useTripContext()
  const { data: documents, isLoading, isFetching, refetch } = useDocuments(tripId)
  const uploadDocument = useUploadDocument()
  const [sheetVisible, setSheetVisible] = useState(false)
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })

  const sections = Object.values(
    (documents ?? []).reduce((acc: Record<string, { title: string; data: typeof documents }>, doc) => {
      const key = doc.experience_title ?? 'Sin título'
      if (!acc[key]) acc[key] = { title: key, data: [] }
      acc[key].data!.push(doc)
      return acc
    }, {})
  ) as { title: string; data: NonNullable<typeof documents> }[]

  const handleUpload = async (data: UploadDocumentFormData) => {
    try {
      await uploadDocument.mutateAsync({ ...data, tripId })
      setSheetVisible(false)
    } catch {
      // Error se muestra en el sheet
    }
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-surface-900">
      <TripHeader scrollY={scrollY} />

      {isLoading ? (
        <View className="px-5 pt-4 gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <AnimatedSectionList
          sections={sections}
          keyExtractor={(item) => (item as { id: string }).id}
          contentContainerClassName="px-5 pb-24"
          renderSectionHeader={({ section }) => (
            <View className="pt-4 pb-2">
              <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">{(section as { title: string }).title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="mb-3">
              <DocumentCard document={item as any} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="Sin documentos"
              subtitle="Sube reservas, entradas y confirmaciones"
              actionLabel="Subir documento"
              onAction={() => setSheetVisible(true)}
            />
          }
          onRefresh={refetch}
          refreshing={isFetching && !isLoading}
          stickySectionHeadersEnabled={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />
      )}

      {!isLoading && (
        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          className="absolute right-5 w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
          style={{ bottom: insets.bottom + 16, ...fabShadow }}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}

      <UploadDocumentSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleUpload}
        isLoading={uploadDocument.isPending}
        error={uploadDocument.error?.message}
      />
    </View>
  )
}
