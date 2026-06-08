import { useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
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
import { useIsSaved } from '@features/saved/hooks/useIsSaved'
import { useToggleSaveExperience } from '@features/saved/hooks/useToggleSaveExperience'
import { Badge } from '@components/ui/Badge'
import { AttributeRatingSection } from '@features/timeline/components/AttributeRatingSection'
import { RateExperienceSheet } from '@features/saved/components/RateExperienceSheet'
import { useTranslation } from 'react-i18next'
import { EXPERIENCE_ATTRIBUTES } from '@features/timeline/config/experienceAttributes'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { BadgeVariant } from '@components/ui/Badge'
import type { Experience } from '@types/index'


const TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  transport: 'transport',
  accommodation: 'accommodation',
  activity: 'activity',
  restaurant: 'restaurant',
  entertainment: 'entertainment',
  other: 'other',
}

export default function SavedExperienceDetailScreen() {
  const router = useRouter()
  const { experienceId } = useLocalSearchParams<{ experienceId: string }>()
  const { isDark } = useTheme()
  const { t } = useTranslation()

  const { data, isLoading } = useSavedExperienceDetail(experienceId)
  const { data: isSaved = true } = useIsSaved(experienceId)
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
  const [photoDownloaded, setPhotoDownloaded] = useState(false)

  function handleUnsave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
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
    Alert.alert(
      t('saved_detail_removePhotoConfirmTitle'),
      t('saved_detail_removePhotoConfirmBody'),
      [
        { text: t('common_cancel'), style: 'cancel' },
        { text: t('common_delete'), style: 'destructive', onPress: () => removePhoto.mutate() },
      ]
    )
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
      setPhotoDownloaded(true)
      setTimeout(() => setPhotoDownloaded(false), 2000)
    } catch {
      Alert.alert(t('common_error'), t('saved_detail_photoDownloadError'))
    } finally {
      setDownloadingPhoto(false)
    }
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
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
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
        <TouchableOpacity
          onPress={handleUnsave}
          hitSlop={8}
          className="px-3 py-1.5"
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? colors.primary[500] : (isDark ? colors.neutral[400] : colors.neutral[500])}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Title card */}
        <View className="rounded-2xl mb-3" style={cardShadow}>
          <View className="bg-white dark:bg-surface-800 rounded-2xl p-4">
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
        </View>

        {/* Cover photo card */}
        <View className="rounded-2xl mb-3" style={cardShadow}>
          <TouchableOpacity
            onPress={handlePickPhoto}
            activeOpacity={0.85}
            disabled={uploadPhoto.isPending}
            className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden"
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
                <View
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleDownloadPhoto(coverPhotoUrl)}
                    hitSlop={8}
                    disabled={downloadingPhoto}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.50)',
                    }}
                  >
                    {downloadingPhoto ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons
                        name={photoDownloaded ? 'checkmark' : 'download-outline'}
                        size={16}
                        color="#fff"
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRemovePhoto}
                    hitSlop={8}
                    disabled={removePhoto.isPending}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.50)',
                    }}
                  >
                    {removePhoto.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    backgroundColor: 'rgba(0,0,0,0.50)',
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Ionicons name="camera-outline" size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                    {t('saved_detail_changePhoto', 'Cambiar foto')}
                  </Text>
                </View>
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

        {/* Price card — prominent stat layout */}
        <View className="rounded-2xl mb-3" style={cardShadow}>
          <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
            <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide px-4 pt-3.5 pb-1.5">
              {t('saved_detail_priceLabel')}
            </Text>
            <View
              className="px-4 pb-4 pt-1.5 items-center border-neutral-100 dark:border-surface-700"
              style={{ borderTopWidth: 0.5 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  backgroundColor: isDark ? colors.surface[700] : `${colors.primary[500]}14`,
                }}
              >
                <Ionicons name="pricetag" size={20} color={colors.primary[500]} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
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
                  textAlign="center"
                  style={{
                    fontSize: 30,
                    fontWeight: '800',
                    letterSpacing: -0.5,
                    color: isDark ? colors.neutral[50] : colors.neutral[900],
                    padding: 0,
                    minWidth: 36,
                  }}
                />
                {priceValue !== '' && (
                  <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? colors.neutral[500] : colors.neutral[400] }}>
                    €
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

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
