import { useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import MapView, { Marker } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSavedExperienceDetail } from '@features/saved/hooks/useSavedExperienceDetail'
import { useUpsertSavedNote } from '@features/saved/hooks/useUpsertSavedNote'
import { useUpsertSavedMeta } from '@features/saved/hooks/useUpsertSavedMeta'
import { useUploadSavedCoverPhoto } from '@features/saved/hooks/useUploadSavedCoverPhoto'
import { useRemoveSavedCoverPhoto } from '@features/saved/hooks/useRemoveSavedCoverPhoto'
import { useToggleSaveExperience } from '@features/saved/hooks/useToggleSaveExperience'
import { Badge } from '@components/ui/Badge'
import { AttributeRatingSection } from '@features/timeline/components/AttributeRatingSection'
import { RateExperienceSheet } from '@features/saved/components/RateExperienceSheet'
import { EditSavedExperienceSheet } from '@features/saved/components/EditSavedExperienceSheet'
import { ConfirmDeleteSheet } from '@components/ui/ConfirmDeleteSheet'
import { DetailActionBar } from '@components/ui/DetailActionBar'
import { useTranslation } from 'react-i18next'
import { EXPERIENCE_ATTRIBUTES } from '@features/timeline/config/experienceAttributes'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { BadgeVariant } from '@components/ui/Badge'
import type { Experience } from '@app-types/index'


const TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  transport: 'transport',
  accommodation: 'accommodation',
  activity: 'activity',
  restaurant: 'restaurant',
  city: 'city',
  entertainment: 'entertainment',
  other: 'other',
}

export default function SavedExperienceDetailScreen() {
  const router = useRouter()
  const { experienceId } = useLocalSearchParams<{ experienceId: string }>()
  const { isDark } = useTheme()
  const { t } = useTranslation()

  const { data, isLoading } = useSavedExperienceDetail(experienceId)
  const toggleSave = useToggleSaveExperience(experienceId)
  const upsertNote = useUpsertSavedNote(experienceId)
  const upsertMeta = useUpsertSavedMeta(experienceId)
  const uploadPhoto = useUploadSavedCoverPhoto(experienceId)
  const removePhoto = useRemoveSavedCoverPhoto(experienceId)

  const [noteText, setNoteText] = useState<string | undefined>(undefined)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [priceText, setPriceText] = useState<string | undefined>(undefined)
  const priceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [ratingSheetVisible, setRatingSheetVisible] = useState(false)
  const [downloadingPhoto, setDownloadingPhoto] = useState(false)
  const [removePhotoConfirmVisible, setRemovePhotoConfirmVisible] = useState(false)
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false)
  const [photoMenuPos, setPhotoMenuPos] = useState({ top: 0, right: 0 })
  const photoMenuButtonRef = useRef<View>(null)
  const [unsaveSheetVisible, setUnsaveSheetVisible] = useState(false)
  const [editInfoSheetVisible, setEditInfoSheetVisible] = useState(false)

  function handleUnsave() {
    toggleSave.mutate(true, {
      onSuccess: () => router.back(),
    })
  }

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [16, 9],
    })
    if (result.canceled) return
    uploadPhoto.mutate(result.assets[0])
  }

  function handleRemovePhoto() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setRemovePhotoConfirmVisible(true)
  }

  async function handleDownloadPhoto(url: string) {
    if (downloadingPhoto) return
    const { status } = await MediaLibrary.requestPermissionsAsync(true)
    if (status !== 'granted') {
      Alert.alert(t('saved_detail_photoPermissionTitle'), t('saved_detail_photoPermissionBody'))
      return
    }
    setDownloadingPhoto(true)
    try {
      const localUri = `${FileSystem.cacheDirectory}saved_${experienceId}_${Date.now()}.jpg`
      await FileSystem.downloadAsync(url, localUri)
      await MediaLibrary.saveToLibraryAsync(localUri)
      await FileSystem.deleteAsync(localUri, { idempotent: true })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      Alert.alert(t('common_error'), t('saved_detail_photoDownloadError'))
    } finally {
      setDownloadingPhoto(false)
    }
  }

  function handlePhotoMenuPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    photoMenuButtonRef.current?.measureInWindow((x, y, width, height) => {
      setPhotoMenuPos({ top: y + height + 4, right: Dimensions.get('window').width - (x + width) })
      setPhotoMenuVisible(true)
    })
  }

  function closePhotoMenu() {
    setPhotoMenuVisible(false)
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">{t('common_loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="flex-row items-center px-4 py-3.5"
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary[500]} />
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center">
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">{t('saved_detail_notFound')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const { experience, note, price_paid, coverPhotoUrl } = data
  const priceValue = priceText ?? (price_paid != null ? String(price_paid) : '')
  const attributes = EXPERIENCE_ATTRIBUTES[experience.type as Experience['type']] ?? []
  const hasAttributes = attributes.length > 0
  const location = experience.location

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top', 'bottom']}>
      {/* iOS-style nav bar */}
      <View className="flex-row items-center px-2 py-2.5 bg-neutral-100 dark:bg-surface-900">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="flex-row items-center pl-2 pr-3 min-w-[80px]"
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary[500]} />
          <Text className="text-[17px] ml-0.5" style={{ color: colors.primary[500] }}>{t('saved_detail_back')}</Text>
        </TouchableOpacity>
        <View className="flex-1" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Title card */}
        <View className="rounded-2xl mb-3 overflow-hidden" style={cardShadow}>
          {/* Cover photo */}
          <TouchableOpacity
            onPress={handlePickPhoto}
            activeOpacity={0.85}
            disabled={uploadPhoto.isPending}
            className="bg-white dark:bg-surface-800"
            style={{ height: coverPhotoUrl ? 200 : 72 }}
          >
            {uploadPhoto.isPending ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.primary[500]} />
              </View>
            ) : coverPhotoUrl ? (
              <>
                <Image
                  source={{ uri: coverPhotoUrl }}
                  style={{ flex: 1 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  ref={photoMenuButtonRef}
                  onPress={handlePhotoMenuPress}
                  hitSlop={8}
                  disabled={downloadingPhoto || removePhoto.isPending}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.50)',
                  }}
                >
                  {downloadingPhoto || removePhoto.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="ellipsis-vertical" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color={isDark ? colors.neutral[500] : colors.neutral[400]}
                />
                <Text style={{ fontSize: 15, fontWeight: '500', color: isDark ? colors.neutral[400] : colors.neutral[500] }}>
                  {t('saved_detail_addPhoto', 'Añadir foto de portada')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View className="bg-white dark:bg-surface-800 p-4">
            <View className="flex-row items-start justify-between mb-2.5">
              <Badge
                label={t(`expType_${experience.type}`)}
                variant={TYPE_BADGE_VARIANT[experience.type]}
              />
              {experience.trip?.name && (
                <Text
                  numberOfLines={1}
                  className="text-[13px] text-neutral-500 dark:text-neutral-400 shrink ml-2 mt-0.5"
                >
                  {experience.trip.name}
                </Text>
              )}
            </View>
            <Text className="text-[24px] font-bold text-neutral-900 dark:text-neutral-50 leading-[30px]">
              {experience.title}
            </Text>
          </View>
          {experience.type !== 'city' && (
            <View
              className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-surface-800 border-neutral-100 dark:border-surface-700"
              style={{ borderTopWidth: 0.5 }}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="pricetag-outline" size={17} color={isDark ? colors.neutral[400] : colors.neutral[500]} />
                <Text className="text-[15px] text-neutral-700 dark:text-neutral-200">
                  {t('saved_detail_priceLabel')}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: isDark ? colors.surface[700] : colors.neutral[100],
                }}
              >
                <TextInput
                  value={priceValue}
                  onChangeText={(v) => {
                    const clean = v.replace(/[^0-9]/g, '')
                    setPriceText(clean)
                    clearTimeout(priceTimer.current)
                    priceTimer.current = setTimeout(() => {
                      const parsed = clean === '' ? null : parseInt(clean, 10)
                      upsertMeta.mutate({ price_paid: isNaN(parsed as number) ? null : parsed })
                    }, 800)
                  }}
                  onBlur={() => {
                    clearTimeout(priceTimer.current)
                    const parsed = priceValue === '' ? null : parseInt(priceValue, 10)
                    upsertMeta.mutate({ price_paid: parsed !== null && !isNaN(parsed) ? parsed : null })
                  }}
                  placeholder={t('saved_detail_pricePlaceholder')}
                  placeholderTextColor={isDark ? colors.neutral[600] : colors.neutral[400]}
                  keyboardType="numeric"
                  returnKeyType="done"
                  textAlign="right"
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: isDark ? colors.neutral[50] : colors.neutral[900],
                    padding: 0,
                    minWidth: 24,
                  }}
                />
                <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? colors.neutral[400] : colors.neutral[500] }}>
                  €
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Location + map card */}
        {location && (
          <View className="rounded-2xl mb-3" style={cardShadow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                const googleNativeUrl = `comgooglemaps://?q=${encodeURIComponent(location.name)}&center=${location.lat},${location.lng}`
                const fallbackUrl = Platform.OS === 'ios'
                  ? `maps://?ll=${location.lat},${location.lng}&q=${encodeURIComponent(location.name)}`
                  : `geo:${location.lat},${location.lng}?q=${encodeURIComponent(location.name)}`
                Linking.canOpenURL(googleNativeUrl).then((supported) =>
                  Linking.openURL(supported ? googleNativeUrl : fallbackUrl)
                )
              }}
              className="rounded-2xl overflow-hidden"
            >
              <MapView
                style={{ height: 180, width: '100%' }}
                region={{
                  latitude: location.lat,
                  longitude: location.lng,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                pointerEvents="none"
              >
                <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} />
              </MapView>
              <View className="bg-white dark:bg-surface-800 px-4 py-3 flex-row items-center gap-2.5">
                <Ionicons name="location" size={16} color={colors.primary[500]} />
                <Text
                  numberOfLines={1}
                  className="flex-1 text-sm text-neutral-700 dark:text-neutral-200"
                >
                  {location.name}
                </Text>
                <Ionicons name="open-outline" size={14} color={colors.neutral[400]} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Personal note card */}
        <View className="rounded-2xl mb-3" style={cardShadow}>
          <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
            <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide px-4 pt-3.5 pb-1.5">
              {t('saved_detail_noteLabel')}
            </Text>
            <View
              className="px-4 py-3 border-neutral-100 dark:border-surface-700"
              style={{ borderTopWidth: 0.5 }}
            >
              <TextInput
                value={noteText ?? note ?? ''}
                onChangeText={(text) => {
                  setNoteText(text)
                  clearTimeout(noteTimer.current)
                  noteTimer.current = setTimeout(() => upsertNote.mutate(text), 800)
                }}
                onBlur={() => {
                  clearTimeout(noteTimer.current)
                  upsertNote.mutate(noteText ?? note ?? '')
                }}
                placeholder={t('saved_detail_notePlaceholder')}
                placeholderTextColor={isDark ? colors.neutral[600] : colors.neutral[400]}
                multiline
                style={{
                  fontSize: 15,
                  color: isDark ? colors.neutral[50] : colors.neutral[900],
                  minHeight: 80,
                  textAlignVertical: 'top',
                  padding: 0,
                }}
              />
            </View>
          </View>
        </View>

        {hasAttributes && (
          <AttributeRatingSection
            experienceId={experienceId}
            experienceType={experience.type as Experience['type']}
            cardBg={isDark ? colors.surface[800] : colors.white}
            labelColor={isDark ? colors.neutral[500] : colors.neutral[400]}
            borderColor={isDark ? colors.surface[700] : colors.neutral[100]}
            onEditPress={() => setRatingSheetVisible(true)}
          />
        )}
      </ScrollView>

      <DetailActionBar
        onEdit={() => setEditInfoSheetVisible(true)}
        onDelete={() => setUnsaveSheetVisible(true)}
        deleteLabel={t('saved_detail_unsaveLabel')}
        isDeleting={toggleSave.isPending}
      />

      <Modal visible={photoMenuVisible} transparent animationType="fade" onRequestClose={closePhotoMenu}>
        <Pressable style={{ flex: 1 }} onPress={closePhotoMenu}>
          <View
            style={{
              position: 'absolute',
              top: photoMenuPos.top,
              right: photoMenuPos.right,
              width: 210,
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: isDark ? colors.surface[800] : colors.white,
              ...cardShadow,
            }}
          >
            <TouchableOpacity
              onPress={() => { closePhotoMenu(); handlePickPhoto() }}
              className="flex-row items-center justify-between px-4 py-3"
            >
              <Text className="text-[15px] text-neutral-900 dark:text-neutral-50">
                {t('saved_detail_changePhoto', 'Cambiar foto')}
              </Text>
              <Ionicons name="image-outline" size={18} color={isDark ? colors.neutral[300] : colors.neutral[600]} />
            </TouchableOpacity>
            <View className="border-neutral-100 dark:border-surface-700" style={{ borderTopWidth: 0.5 }} />
            <TouchableOpacity
              onPress={() => { closePhotoMenu(); handleDownloadPhoto(coverPhotoUrl ?? '') }}
              className="flex-row items-center justify-between px-4 py-3"
            >
              <Text className="text-[15px] text-neutral-900 dark:text-neutral-50">
                {t('saved_detail_downloadPhoto', 'Descargar foto')}
              </Text>
              <Ionicons name="arrow-down-circle-outline" size={18} color={isDark ? colors.neutral[300] : colors.neutral[600]} />
            </TouchableOpacity>
            <View className="border-neutral-100 dark:border-surface-700" style={{ borderTopWidth: 0.5 }} />
            <TouchableOpacity
              onPress={() => { closePhotoMenu(); handleRemovePhoto() }}
              className="flex-row items-center justify-between px-4 py-3"
            >
              <Text className="text-[15px]" style={{ color: colors.error }}>
                {t('common_delete')}
              </Text>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <ConfirmDeleteSheet
        visible={removePhotoConfirmVisible}
        onClose={() => setRemovePhotoConfirmVisible(false)}
        onConfirm={() => {
          removePhoto.mutate(undefined, { onSuccess: () => setRemovePhotoConfirmVisible(false) })
        }}
        isLoading={removePhoto.isPending}
        title={t('saved_detail_removePhotoConfirmTitle')}
        message={t('saved_detail_removePhotoConfirmBody')}
      />

      <ConfirmDeleteSheet
        visible={unsaveSheetVisible}
        onClose={() => setUnsaveSheetVisible(false)}
        onConfirm={handleUnsave}
        isLoading={toggleSave.isPending}
        title={t('saved_detail_unsaveConfirmTitle')}
        message={t('saved_detail_unsaveConfirmBody')}
        confirmLabel={t('saved_detail_unsaveLabel')}
      />

      <EditSavedExperienceSheet
        visible={editInfoSheetVisible}
        onClose={() => setEditInfoSheetVisible(false)}
        experienceId={experienceId}
        initialTitle={experience.title}
        initialType={experience.type as Experience['type']}
        initialLocation={location}
      />

      <RateExperienceSheet
        visible={ratingSheetVisible}
        onClose={() => setRatingSheetVisible(false)}
        experienceId={experienceId}
        experienceType={experience.type as Experience['type']}
        initialCoverPhotoUrl={coverPhotoUrl ?? null}
      />
    </SafeAreaView>
  )
}
