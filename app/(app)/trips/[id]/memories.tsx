import { useState } from 'react'
import { ActivityIndicator, Alert, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import * as Haptics from 'expo-haptics'
import Animated, { useSharedValue } from 'react-native-reanimated'
import { useFabScroll } from '@lib/useFabScroll'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fabShadow } from '@lib/shadows'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { AddMemoryCaption } from '@features/memories/components/AddMemoryCaption'
import { MemoryDetail } from '@features/memories/components/MemoryDetail'
import { MemoryGrid } from '@features/memories/components/MemoryGrid'
import { useAddMemory, useAddMemories } from '@features/memories/hooks/useAddMemory'
import { useDeleteMemory } from '@features/memories/hooks/useDeleteMemory'
import { useMemories } from '@features/memories/hooks/useMemories'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { LIMITS } from '@/config/limits'
import { DEV_MODE } from '@/dev/mockData'
import { colors } from '@lib/colors'
import type { Memory } from '@types/index'

export default function MemoriesScreen() {
  const { tripId, isOwner, collaborators } = useTripContext()
  const { data: memories, isLoading } = useMemories(tripId)
  const { t } = useTranslation()
  const addMemory = useAddMemory()
  const addMemories = useAddMemories()
  const deleteMemory = useDeleteMemory()
  const { data: currentUser } = useCurrentUser()

  const [captionSheetVisible, setCaptionSheetVisible] = useState(false)
  const [pendingAsset, setPendingAsset] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [viewerIndex, setViewerIndex] = useState(-1) // -1 = closed

  // Multi-select
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const insets = useSafeAreaInsets()
  const isDark = useColorScheme() === 'dark'
  const count = memories?.length ?? 0
  const scrollY = useSharedValue(0)

  const { fabAnimStyle } = useFabScroll(scrollY)

  const getUploader = (userId: string) => collaborators.find((c) => c.user_id === userId)

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
    const count = selectedIds.size
    Alert.alert(
      t(count === 1 ? 'memories_bulk_delete_title_one' : 'memories_bulk_delete_title_other', { count }),
      t('common_actionCannotBeUndone'),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
          style: 'destructive',
          onPress: () => {
            selectedIds.forEach((id) => deleteMemory.mutate({ memoryId: id, tripId }))
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
      Alert.alert(
        t('memories_permission_denied_title'),
        t('memories_permission_denied_body')
      )
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
    const remaining = LIMITS.MAX_PHOTOS_PER_TRIP - count
    if (remaining <= 0) return

    if (DEV_MODE) {
      const seeds = ['tokyo', 'kyoto', 'osaka', 'hiroshima', 'nara']
      const seed = seeds[Math.floor(Math.random() * seeds.length)]
      setPendingAsset({ uri: `https://picsum.photos/seed/${seed}${Date.now()}/800/600` } as ImagePicker.ImagePickerAsset)
      setCaptionSheetVisible(true)
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
          onError: () => {
            Alert.alert(t('common_error'), t('memories_upload_error'))
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
    } catch {
      // error shown in sheet via errorMessage
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

  // ─── Selection toolbar ───────────────────────────────────────────────────────

  const SelectionToolbar = () => (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: insets.bottom,
      }}
      className="flex-row items-center justify-between px-6 pt-3 pb-2 bg-white dark:bg-surface-800 border-t border-neutral-200 dark:border-white/[0.08]"
    >
      {/* Left: cancel */}
      <TouchableOpacity onPress={exitSelectionMode} hitSlop={8} className="items-center gap-1">
        <Ionicons name="close-circle-outline" size={26} color={isDark ? colors.neutral[400] : colors.neutral[500]} />
        <Text className="text-neutral-500 dark:text-neutral-400 text-xs">{t('memories_bulk_cancel')}</Text>
      </TouchableOpacity>

      {/* Center: selection count + select all */}
      <TouchableOpacity onPress={selectAll} hitSlop={8} className="items-center gap-1">
        <Text className="text-primary-400 text-base font-semibold">
          {t(selectedIds.size === 1 ? 'memories_bulk_selected_one' : 'memories_bulk_selected_other', { count: selectedIds.size })}
        </Text>
        <Text className="text-primary-400/70 text-xs">{t('memories_bulk_selectAll')}</Text>
      </TouchableOpacity>

      {/* Right: actions */}
      <View className="flex-row items-center gap-5">
        <TouchableOpacity
          onPress={handleBulkDownload}
          hitSlop={8}
          disabled={selectedIds.size === 0}
          className="items-center gap-1"
        >
          <Ionicons
            name="arrow-down-circle-outline"
            size={26}
            color={selectedIds.size === 0 ? colors.neutral[400] : isDark ? colors.white : colors.neutral[800]}
          />
          <Text
            className={`text-xs ${selectedIds.size === 0 ? 'text-neutral-400' : 'text-neutral-800 dark:text-white'}`}
          >
            {t('memories_bulk_save')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBulkDelete}
          hitSlop={8}
          disabled={selectedIds.size === 0}
          className="items-center gap-1"
        >
          <Ionicons
            name="trash-outline"
            size={26}
            color={selectedIds.size === 0 ? colors.neutral[400] : colors.error}
          />
          <Text
            className={`text-xs ${selectedIds.size === 0 ? 'text-neutral-400' : 'text-red-500'}`}
          >
            {t('common_delete')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View className="flex-1 bg-neutral-100 dark:bg-surface-900">
      <TripHeader scrollY={scrollY} />
      <View style={{ flex: 1 }}>
      {/* Counter */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('memories_counter', { count, max: LIMITS.MAX_PHOTOS_PER_TRIP })}
        </Text>
        <View className="flex-row items-center gap-1">
          <View
            className="h-1.5 rounded-full bg-primary-500"
            style={{ width: Math.max(4, (count / LIMITS.MAX_PHOTOS_PER_TRIP) * 80) }}
          />
          <View
            className="h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-100/30"
            style={{ width: Math.max(0, 80 - (count / LIMITS.MAX_PHOTOS_PER_TRIP) * 80) }}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="px-5 gap-3">
          {[1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
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
            count < LIMITS.MAX_PHOTOS_PER_TRIP && (
              <TouchableOpacity
                onPress={handlePickImage}
                className="w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
                style={fabShadow}
              >
                <Ionicons name="add" size={28} color="#ffffff" />
              </TouchableOpacity>
            )
          )
        )}
      </Animated.View>

      {/* Selection toolbar */}
      {selectionMode && <SelectionToolbar />}

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
          deleteMemory.mutate({ memoryId: id, tripId })
          setViewerIndex(-1)
        }}
        getUploaderName={(userId) => getUploader(userId)?.name ?? t('common_someone')}
        getUploaderAvatar={(userId) => getUploader(userId)?.avatar_url}
      />
      </View>
    </View>
  )
}
