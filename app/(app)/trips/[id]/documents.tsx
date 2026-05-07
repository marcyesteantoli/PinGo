import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { SectionList, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { DocumentCard } from '@features/documents/components/DocumentCard'
import { UploadDocumentSheet } from '@features/documents/components/UploadDocumentSheet'
import { useDocuments } from '@features/documents/hooks/useDocuments'
import { useUploadDocument } from '@features/documents/hooks/useUploadDocument'
import type { UploadDocumentFormData } from '@features/documents/types'

export default function DocumentsScreen() {
  const { tripId } = useTripContext()
  const { data: documents, isLoading, refetch } = useDocuments(tripId)
  const uploadDocument = useUploadDocument()
  const [sheetVisible, setSheetVisible] = useState(false)

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
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <TripHeader />

      {isLoading ? (
        <View className="px-5 pt-4 gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-24"
          renderSectionHeader={({ section }) => (
            <View className="pt-4 pb-2">
              <Text className="text-sm font-semibold text-neutral-500">{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="mb-3">
              <DocumentCard document={item} />
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
          refreshing={isLoading}
          stickySectionHeadersEnabled={false}
        />
      )}

      {!isLoading && (
        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
          style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
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
    </SafeAreaView>
  )
}
