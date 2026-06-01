import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { SectionList, Text, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { useFabScroll } from '@lib/useFabScroll'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fabShadow } from '@lib/shadows'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { DocumentCard } from '@features/documents/components/DocumentCard'
import { DocumentViewer } from '@features/documents/components/DocumentViewer'
import { UploadDocumentSheet } from '@features/documents/components/UploadDocumentSheet'
import { DeleteDocumentSheet } from '@features/documents/components/DeleteDocumentSheet'
import { useDocuments } from '@features/documents/hooks/useDocuments'
import { useUploadDocument } from '@features/documents/hooks/useUploadDocument'
import { useDeleteDocument } from '@features/documents/hooks/useDeleteDocument'
import type { UploadDocumentFormData } from '@features/documents/types'
import type { Document } from '@types/index'

type DocumentWithExperience = Document & { experience_title: string | null }

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

export default function DocumentsScreen() {
  const { tripId } = useTripContext()
  const { data: documents, isLoading, isFetching, refetch } = useDocuments(tripId)
  const uploadDocument = useUploadDocument()
  const deleteDocument = useDeleteDocument()
  const [sheetVisible, setSheetVisible] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithExperience | null>(null)
  const [documentToDelete, setDocumentToDelete] = useState<DocumentWithExperience | null>(null)
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })

  const { fabAnimStyle } = useFabScroll(scrollY)

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
      // error shown in sheet
    }
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return
    try {
      await deleteDocument.mutateAsync({
        documentId: documentToDelete.id,
        tripId,
        fileUrl: documentToDelete.file_url,
      })
      setDocumentToDelete(null)
    } catch {
      // silent — could add toast here
    }
  }

  return (
    <View className="flex-1 bg-neutral-100 dark:bg-surface-900">
      <TripHeader scrollY={scrollY} />
      <View style={{ flex: 1 }}>
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
                    <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                      {(section as { title: string }).title}
                    </Text>
                  </View>
                )}
                renderItem={({ item }) => (
                  <View className="mb-5">
                    <DocumentCard
                      document={item as DocumentWithExperience}
                      onPress={() => setSelectedDocument(item as DocumentWithExperience)}
                      onDelete={() => setDocumentToDelete(item as DocumentWithExperience)}
                    />
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
              <Animated.View className="absolute right-5" style={[fabAnimStyle, { bottom: 16 }]} pointerEvents="box-none">
                <TouchableOpacity
                  onPress={() => setSheetVisible(true)}
                  className="w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
                  style={fabShadow}
                >
                  <Ionicons name="add" size={28} color="#ffffff" />
                </TouchableOpacity>
              </Animated.View>
            )}

            <UploadDocumentSheet
              visible={sheetVisible}
              onClose={() => setSheetVisible(false)}
              onSubmit={handleUpload}
              isLoading={uploadDocument.isPending}
              error={uploadDocument.error?.message}
            />

            <DeleteDocumentSheet
              visible={documentToDelete !== null}
              documentName={documentToDelete?.name}
              onClose={() => setDocumentToDelete(null)}
              onConfirm={handleDeleteConfirm}
              isLoading={deleteDocument.isPending}
            />
      </View>

      <DocumentViewer
        document={selectedDocument}
        visible={selectedDocument !== null}
        onClose={() => setSelectedDocument(null)}
      />
    </View>
  )
}
