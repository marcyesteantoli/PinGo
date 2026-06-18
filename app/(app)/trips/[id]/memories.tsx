import { useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import * as Haptics from 'expo-haptics'
import Animated, { useSharedValue } from 'react-native-reanimated'
import { useFabScroll } from '@lib/useFabScroll'
import { fabShadow } from '@lib/shadows'
import { EmptyState } from '@components/ui/EmptyState'
import { Skeleton } from '@components/ui/Skeleton'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { AddMemoryCaption } from '@features/memories/components/AddMemoryCaption'
import { MemoryDetail } from '@features/memories/components/MemoryDetail'
import { MemoryGrid } from '@features/memories/components/MemoryGrid'
import { SelectionToolbar } from '@features/memories/components/SelectionToolbar'
import { useAddMemory, useAddMemories } from '@features/memories/hooks/useAddMemory'
import { useDeleteMemory } from '@features/memories/hooks/useDeleteMemory'
import { useMemories } from '@features/memories/hooks/useMemories'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { LIMITS } from '@/config/limits'
import { useErrorToast } from '@lib/errorToast'
import { colors } from '@lib/colors'
import { useIsPro } from '@features/premium/hooks/useIsPro'
import { ProPaywallSheet } from '@features/premium/components/ProPaywallSheet'
import type { Memory } from '@app-types/index'

const SCREEN_WIDTH = Dimensions.get('window').width
const CELL_SIZE = (SCREEN_WIDTH - 40 - 3 * 2) / 3

export default function MemoriesScreen() {
  const { tripId, isOwner, collaborators } = useTripContext()
  const { data: memories, isLoading } = useMemories(tripId)
  const { t } = useTranslation()
  const addMemory = useAddMemory()
  const addMemories = useAddMemories()
  const deleteMemory = useDeleteMemory()
  const showError = useErrorToast()
  const { data: currentUser } = useCurrentUser()

  const [captionSheetVisible, setCaptionSheetVisible] = useState(false)
  const [pendingAsset, setPendingAsset] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [viewerIndex, setViewerIndex] = useState(-1)

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [paywallVisible, setPaywallVisible] = useState(false)

  const { isPro } = useIsPro()
  const photoCap = isPro ? LIMITS.PRO_MAX_PHOTOS_PER_TRIP : LIMITS.FREE_MAX_PHOTOS_PER_TRIP
  const displayCap = LIMITS.PRO_MAX_PHOTOS_PER_TRIP

  const count = memories?.length ?? 0
  const scrollY = useSharedValue(0)
  const { fabAnimStyle } = useFabScroll(scrollY)

  const getUploader = (userId: string | null) => collaborators.find((c) => c.user_id === userId)

  // ─── Selection helpers ──────────────────────────────────────────────────────

  const enterSelectionMode = (memory: Memory) => {
    setSelectionMode(true)
    setSelectedIds(new Set([memory.id]))
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  const toggleSelect = (memory: Memory) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(memory.id)) next.delete(memory.id)
      else next.add(memory.id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(memories?.map((m) => m.id) ?? []))
  }

  // ─── Bulk actions ────────────────────────────────────────────────────────────

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    const n = selectedIds.size
    Alert.alert(
      t(n === 1 ? 'memories_bulk_delete_title_one' : 'memories_bulk_delete_title_other', { count: n }),
      t('common_actionCannotBeUndone'),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
          style: 'destructive',
          onPress: () => {
            selectedIds.forEach((id) =>
              deleteMemory.mutate(
                { memoryId: id, tripId },
                { onError: (err) => showError(t(err.message === 'not_authorized' ? 'memories_delete_not_authorized' : 'memories_delete_error')) }
              )
            )
            exitSelectionMode()
          },
        },
      ]
    )
  }

  const handleBulkDownload = async () => {
    if (selectedIds.size === 0 || !memories) return

    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(t('memories_permission_denied_title'), t('memories_permission_denied_body'))
      return
    }

    const toDownload = memories.filter((m) => selectedIds.has(m.id))
    let saved = 0

    for (const memory of toDownload) {
      try {
        const localUri = `${FileSystem.cacheDirectory}pingo_${Date.now()}.jpg`
        await FileSystem.downloadAsync(memory.image_url, localUri)
        await MediaLibrary.saveToLibraryAsync(localUri)
        await FileSystem.deleteAsync(localUri, { idempotent: true })
        saved++
      } catch {
        // continue with remaining photos
      }
    }

    if (saved > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert(
        t('memories_saved_title'),
        t(saved === 1 ? 'memories_saved_one' : 'memories_saved_other', { count: saved })
      )
    } else {
      Alert.alert(t('common_error'), t('memories_save_error'))
    }
    exitSelectionMode()
  }

  // ─── Add photo flow ──────────────────────────────────────────────────────────

  const handlePickImage = async () => {
    const remaining = photoCap - count
    if (remaining <= 0) {
      setPaywallVisible(true)
      return
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        t('memories_pick_denied_title'),
        t('memories_pick_denied_body'),
        [{ text: t('common_understood'), style: 'default' }]
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    })

    if (result.canceled || !result.assets.length) return

    if (result.assets.length === 1) {
      setPendingAsset(result.assets[0])
      setCaptionSheetVisible(true)
    } else {
      addMemories.mutate(
        { tripId, assets: result.assets },
        {
          onError: (err: any) => {
            if (err?.code === 'LIMIT_REACHED') setPaywallVisible(true)
            else Alert.alert(t('common_error'), t('memories_upload_error'))
          },
        }
      )
    }
  }

  const handleAddMemory = async (caption?: string) => {
    try {
      await addMemory.mutateAsync({ tripId, caption, asset: pendingAsset ?? undefined })
      setCaptionSheetVisible(false)
      setPendingAsset(null)
    } catch (err: any) {
      if (err?.code === 'LIMIT_REACHED') {
        handleCloseSheet()
        setPaywallVisible(true)
      }
      // otros errores se muestran en el sheet via errorMessage
    }
  }

  const handleCloseSheet = () => {
    setCaptionSheetVisible(false)
    setPendingAsset(null)
    addMemory.reset()
  }

  const errorMessage = (() => {
    const err = addMemory.error as any
    if (!err) return null
    if (err.code === 'LIMIT_REACHED') return err.message
    return err.message ?? t('common_error')
  })()

  const fillPct = Math.min(count / displayCap, 1) * 100

  return (
    <View className="flex-1 bg-neutral-100 dark:bg-surface-900">
      <TripHeader scrollY={scrollY} />
      <View style={{ flex: 1 }}>

        {/* Counter bar */}
        <View className="flex-row items-center px-5 py-2">
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            {count} / {displayCap}
          </Text>
          <View className="flex-1 mx-3 h-[3px] rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
            <View
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${fillPct}%` }}
            />
          </View>
        </View>

        {isLoading ? (
          <View className="px-5">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} width={CELL_SIZE} height={CELL_SIZE} className="rounded-[10px]" />
              ))}
            </View>
          </View>
        ) : !memories?.length ? (
          <EmptyState
            icon="images-outline"
            title={t('memories_empty_title')}
            subtitle={t('memories_empty_subtitle')}
            actionLabel={t('memories_empty_action')}
            onAction={handlePickImage}
          />
        ) : (
          <MemoryGrid
            memories={memories}
            onPress={(_, index) => setViewerIndex(index)}
            onLongPress={enterSelectionMode}
            scrollY={scrollY}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        )}

        {/* FAB — hidden in selection mode */}
        <Animated.View className="absolute right-5" style={[fabAnimStyle, { bottom: 16 }]} pointerEvents="box-none">
          {!isLoading && !selectionMode && (
            addMemories.isPending && addMemories.progress ? (
              <View
                className="h-14 px-4 rounded-full bg-white dark:bg-surface-800 flex-row items-center gap-2"
                style={fabShadow}
              >
                <ActivityIndicator size="small" color={colors.primary[500]} />
                <Text className="text-neutral-900 dark:text-white text-sm font-medium">
                  {addMemories.progress.done}/{addMemories.progress.total}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickImage}
                className="w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
                style={fabShadow}
              >
                <Ionicons name="add" size={28} color="#ffffff" />
              </TouchableOpacity>
            )
          )}
        </Animated.View>

        {/* Selection toolbar */}
        {selectionMode && (
          <SelectionToolbar
            selectedCount={selectedIds.size}
            totalCount={count}
            onCancel={exitSelectionMode}
            onSelectAll={selectAll}
            onDownload={handleBulkDownload}
            onDelete={handleBulkDelete}
          />
        )}

        <AddMemoryCaption
          visible={captionSheetVisible}
          onClose={handleCloseSheet}
          onSubmit={handleAddMemory}
          isLoading={addMemory.isPending}
          error={errorMessage}
          imageUri={pendingAsset?.uri}
        />

        <MemoryDetail
          memories={memories ?? []}
          initialIndex={Math.max(0, viewerIndex)}
          visible={viewerIndex >= 0}
          onClose={() => setViewerIndex(-1)}
          canDelete={(memory) => isOwner || memory.user_id === currentUser?.id}
          onDelete={(id) => {
            deleteMemory.mutate(
              { memoryId: id, tripId },
              { onError: (err) => showError(t(err.message === 'not_authorized' ? 'memories_delete_not_authorized' : 'memories_delete_error')) }
            )
            setViewerIndex(-1)
          }}
          getUploaderName={(userId) => getUploader(userId)?.name ?? t('common_someone')}
          getUploaderAvatar={(userId) => getUploader(userId)?.avatar_url}
        />

        <ProPaywallSheet
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
          feature="photos"
          isLimitReached
        />
      </View>
    </View>
  )
}
