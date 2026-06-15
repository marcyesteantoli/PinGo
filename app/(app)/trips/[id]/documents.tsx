import { useState, useEffect, useCallback } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import { Ionicons } from '@expo/vector-icons'
import { Dimensions, Modal, Pressable, SectionList, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDecay,
  runOnJS,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated'
import { EASE_DRAWER, EASE_DRAWER_OUT, DURATION } from '@lib/animations'
import { useFabScroll } from '@lib/useFabScroll'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fabShadow } from '@lib/shadows'
import { colors } from '@lib/colors'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { DocumentCard } from '@features/documents/components/DocumentCard'
import { DocumentViewer } from '@features/documents/components/DocumentViewer'
import { UploadDocumentSheet } from '@features/documents/components/UploadDocumentSheet'
import { AddLinkSheet } from '@features/documents/components/AddLinkSheet'
import { AddPassSheet } from '@features/documents/components/AddPassSheet'
import { DeleteDocumentSheet } from '@features/documents/components/DeleteDocumentSheet'
import { useDocuments, type DocumentWithExperience } from '@features/documents/hooks/useDocuments'
import { useUploadDocument } from '@features/documents/hooks/useUploadDocument'
import { useAddDocumentLink } from '@features/documents/hooks/useAddDocumentLink'
import { useAddDocumentPass } from '@features/documents/hooks/useAddDocumentPass'
import { useDeleteDocument } from '@features/documents/hooks/useDeleteDocument'
import { ProPaywallSheet } from '@features/premium/components/ProPaywallSheet'
import type { UploadDocumentFormData, AddLinkFormData } from '@features/documents/types'

type ActionSheetOption = 'file' | 'link' | 'pass'

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

function AddDocumentActionSheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean
  onClose: () => void
  onSelect: (type: ActionSheetOption) => void
}) {
  const { t } = useTranslation()
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'
  const insets = useSafeAreaInsets()

  const SCREEN_HEIGHT = Dimensions.get('window').height
  const translateY = useSharedValue(SCREEN_HEIGHT)
  const backdropOpacity = useSharedValue(0)
  const [isRendered, setIsRendered] = useState(false)

  useEffect(() => {
    if (visible) {
      translateY.value = SCREEN_HEIGHT
      backdropOpacity.value = 0
      setIsRendered(true)
    } else {
      if (translateY.value >= SCREEN_HEIGHT - 1) {
        setIsRendered(false)
        return
      }
      backdropOpacity.value = withTiming(0, { duration: DURATION.sheetClose })
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: DURATION.sheetClose, easing: EASE_DRAWER_OUT }, () => {
        runOnJS(setIsRendered)(false)
      })
    }
  }, [visible])

  const handleGestureClose = useCallback(() => { onClose() }, [onClose])

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY
        backdropOpacity.value = Math.max(0, 1 - e.translationY / 300)
      }
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 700) {
        backdropOpacity.value = withTiming(0, { duration: 250 })
        if (e.velocityY > 500) {
          translateY.value = withDecay(
            { velocity: e.velocityY, clamp: [0, SCREEN_HEIGHT] },
            () => { runOnJS(handleGestureClose)() }
          )
        } else {
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: DURATION.sheetClose, easing: EASE_DRAWER_OUT }, () => {
            runOnJS(handleGestureClose)()
          })
        }
      } else {
        translateY.value = withTiming(0, { duration: DURATION.sheet, easing: EASE_DRAWER })
        backdropOpacity.value = withTiming(1, { duration: 200 })
      }
    })

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const bg = isDark ? colors.surface[800] : '#ffffff'
  const titleColor = isDark ? '#f1f5f9' : '#0f172a'
  const subtitleColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const handleColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'

  const options: Array<{
    type: ActionSheetOption
    icon: string
    iconColor: string
    iconBg: string
    label: string
    subtitle: string
  }> = [
    {
      type: 'file',
      icon: 'document-text',
      iconColor: colors.error,
      iconBg: isDark ? 'rgba(239,68,68,0.15)' : '#fff1f2',
      label: t('docs_type_file'),
      subtitle: t('docs_type_file_sub'),
    },
    {
      type: 'link',
      icon: 'link',
      iconColor: colors.primary[500],
      iconBg: isDark ? 'rgba(99,102,241,0.15)' : '#eff6ff',
      label: t('docs_type_link'),
      subtitle: t('docs_type_link_sub'),
    },
    {
      type: 'pass',
      icon: 'airplane',
      iconColor: '#6c63ff',
      iconBg: isDark ? 'rgba(108,99,255,0.15)' : '#f5f3ff',
      label: t('docs_type_pass'),
      subtitle: t('docs_type_pass_sub'),
    },
  ]

  return (
    <Modal
      visible={isRendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={() => {
        translateY.value = withTiming(0, { duration: DURATION.sheet, easing: EASE_DRAWER })
        backdropOpacity.value = withTiming(1, { duration: 280 })
      }}
    >
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
            },
            backdropAnimStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View style={sheetStyle}>
          <View
            style={{
              backgroundColor: bg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 16,
            }}
          >
            <GestureDetector gesture={gesture}>
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: handleColor }} />
              </View>
            </GestureDetector>

            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: subtitleColor,
              paddingHorizontal: 4,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>
              {t('docs_addSheet_title')}
            </Text>

            {options.map((opt, i) => (
              <TouchableOpacity
                key={opt.type}
                onPress={() => { onClose(); onSelect(opt.type) }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 13,
                  paddingHorizontal: 4,
                  borderTopWidth: i === 0 ? 0 : 0.5,
                  borderTopColor: borderColor,
                }}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: opt.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name={opt.icon as any} size={22} color={opt.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: titleColor }}>{opt.label}</Text>
                  <Text style={{ fontSize: 13, color: subtitleColor, marginTop: 1 }}>{opt.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  )
}

export default function DocumentsScreen() {
  const { tripId } = useTripContext()
  const { t } = useTranslation()
  const { data: documents, isLoading, isFetching, refetch } = useDocuments(tripId)
  const uploadDocument = useUploadDocument()
  const addLink = useAddDocumentLink()
  const addPass = useAddDocumentPass()
  const deleteDocument = useDeleteDocument()

  const [actionSheetVisible, setActionSheetVisible] = useState(false)
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false)
  const [pendingAsset, setPendingAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null)
  const [linkSheetVisible, setLinkSheetVisible] = useState(false)
  const [passSheetVisible, setPassSheetVisible] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithExperience | null>(null)
  const [documentToDelete, setDocumentToDelete] = useState<DocumentWithExperience | null>(null)
  const [paywallVisible, setPaywallVisible] = useState(false)

  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })
  const { fabAnimStyle } = useFabScroll(scrollY)

  const sections = Object.values(
    (documents ?? []).reduce((acc: Record<string, { title: string; data: typeof documents }>, doc) => {
      const key = doc.experience_title ?? t('docs_noTitle')
      if (!acc[key]) acc[key] = { title: key, data: [] }
      acc[key].data!.push(doc)
      return acc
    }, {})
  ) as { title: string; data: NonNullable<typeof documents> }[]

  const handleActionSelect = async (type: ActionSheetOption) => {
    if (type === 'file') {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets?.[0]) return
      setPendingAsset(result.assets[0])
      setUploadSheetVisible(true)
    } else if (type === 'link') {
      setLinkSheetVisible(true)
    } else {
      setPassSheetVisible(true)
    }
  }

  const handleUpload = async (data: UploadDocumentFormData) => {
    try {
      await uploadDocument.mutateAsync({ ...data, tripId, asset: pendingAsset ?? undefined })
      setUploadSheetVisible(false)
      setPendingAsset(null)
    } catch (err: any) {
      if (err?.code === 'LIMIT_REACHED') {
        setUploadSheetVisible(false)
        setPendingAsset(null)
        uploadDocument.reset()
        setPaywallVisible(true)
      }
    }
  }

  const handleAddLink = async (data: AddLinkFormData) => {
    try {
      await addLink.mutateAsync({ ...data, tripId })
      setLinkSheetVisible(false)
    } catch {}
  }

  const handleAddPass = async (data: { name: string; experience_id: string }) => {
    try {
      await addPass.mutateAsync({ ...data, tripId })
      setPassSheetVisible(false)
    } catch {}
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
    } catch {}
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
              <Animated.View entering={FadeIn.duration(240)} className="pt-4 pb-2">
                <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  {(section as unknown as { title: string }).title}
                </Text>
              </Animated.View>
            )}
            renderItem={({ item, index }) => (
              <Animated.View
                className="mb-5"
                entering={FadeInDown.duration(280).delay(Math.min(index * 50, 200))}
              >
                <DocumentCard
                  document={item as DocumentWithExperience}
                  onPress={() => setSelectedDocument(item as DocumentWithExperience)}
                  onDelete={() => setDocumentToDelete(item as DocumentWithExperience)}
                />
              </Animated.View>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="document-text-outline"
                title={t('docs_empty_title')}
                subtitle={t('docs_empty_subtitle')}
                actionLabel={t('docs_empty_action')}
                onAction={() => setActionSheetVisible(true)}
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
              onPress={() => setActionSheetVisible(true)}
              className="w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
              style={fabShadow}
            >
              <Ionicons name="add" size={28} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
        )}

        <AddDocumentActionSheet
          visible={actionSheetVisible}
          onClose={() => setActionSheetVisible(false)}
          onSelect={handleActionSelect}
        />

        <UploadDocumentSheet
          visible={uploadSheetVisible}
          onClose={() => setUploadSheetVisible(false)}
          onSubmit={handleUpload}
          isLoading={uploadDocument.isPending}
          error={uploadDocument.error?.message}
        />

        <AddLinkSheet
          visible={linkSheetVisible}
          onClose={() => setLinkSheetVisible(false)}
          onSubmit={handleAddLink}
          isLoading={addLink.isPending}
          error={addLink.error?.message}
        />

        <AddPassSheet
          visible={passSheetVisible}
          onClose={() => setPassSheetVisible(false)}
          onSubmit={handleAddPass}
          isLoading={addPass.isPending}
        />

        <DeleteDocumentSheet
          visible={documentToDelete !== null}
          documentName={documentToDelete?.name}
          onClose={() => setDocumentToDelete(null)}
          onConfirm={handleDeleteConfirm}
          isLoading={deleteDocument.isPending}
        />

        <ProPaywallSheet
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
          feature="documents"
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
