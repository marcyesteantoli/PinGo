import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@components/ui/Avatar'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useProfile } from '@features/auth/hooks/useProfile'
import { useSignOut } from '@features/auth/hooks/useSignOut'
import { DeleteAccountSheet } from '@features/auth/components/DeleteAccountSheet'
import { useUpdateProfile } from '@features/auth/hooks/useUpdateProfile'
import { useTrips } from '@features/trips/hooks/useTrips'
import { useSavedExperiences } from '@features/saved/hooks/useSavedExperiences'
import { useIsPro } from '@features/premium/hooks/useIsPro'
import { useRestorePurchases } from '@features/premium/hooks/useRestorePurchases'
import { ProPaywallSheet } from '@features/premium/components/ProPaywallSheet'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import { useTheme } from '@lib/theme'
import { useLanguage, type SupportedLanguage } from '@lib/language'
import { LEGAL_URLS } from '@/config/legal'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDecay, runOnJS } from 'react-native-reanimated'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import { EASE_DRAWER, EASE_DRAWER_OUT, DURATION } from '@lib/animations'

const LANG_OFFSCREEN = Dimensions.get('window').height
const LANG_CLOSE_THRESHOLD = 80

export default function ProfileScreen() {
  const router = useRouter()
  const { isDark, toggleTheme } = useTheme()
  const { language, changeLanguage } = useLanguage()
  const { t } = useTranslation()
  const { data: user } = useCurrentUser()
  const { data: profile } = useProfile(user?.id)
  const { data: trips = [] } = useTrips()
  const { data: savedExperiences = [] } = useSavedExperiences()
  const updateProfile = useUpdateProfile()
  const signOut = useSignOut()
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const { isPro } = useIsPro()
  const restorePurchases = useRestorePurchases()
  const [paywallVisible, setPaywallVisible] = useState(false)
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false)
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false)
  const [langModalMounted, setLangModalMounted] = useState(false)
  const langTranslateY = useSharedValue(LANG_OFFSCREEN)
  const langBackdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (languagePickerOpen) {
      langTranslateY.value = LANG_OFFSCREEN
      langBackdropOpacity.value = 0
      setLangModalMounted(true)
    } else {
      langBackdropOpacity.value = withTiming(0, { duration: DURATION.sheetClose })
      langTranslateY.value = withTiming(LANG_OFFSCREEN, { duration: DURATION.sheetClose, easing: EASE_DRAWER_OUT }, () => {
        runOnJS(setLangModalMounted)(false)
      })
    }
  }, [languagePickerOpen])

  const langSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: langTranslateY.value }],
  }))

  const langBackdropStyle = useAnimatedStyle(() => ({
    opacity: langBackdropOpacity.value,
  }))

  const handleLangGestureClose = useCallback(() => {
    setLanguagePickerOpen(false)
  }, [])

  const langGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        langTranslateY.value = e.translationY
        langBackdropOpacity.value = Math.max(0, 1 - e.translationY / 300)
      }
    })
    .onEnd((e) => {
      if (e.translationY > LANG_CLOSE_THRESHOLD || e.velocityY > 700) {
        langBackdropOpacity.value = withTiming(0, { duration: 250 })
        if (e.velocityY > 500) {
          langTranslateY.value = withDecay(
            { velocity: e.velocityY, clamp: [0, LANG_OFFSCREEN] },
            () => { runOnJS(handleLangGestureClose)() }
          )
        } else {
          langTranslateY.value = withTiming(LANG_OFFSCREEN, { duration: DURATION.sheetClose, easing: EASE_DRAWER_OUT }, () => {
            runOnJS(handleLangGestureClose)()
          })
        }
      } else {
        langTranslateY.value = withTiming(0, { duration: DURATION.sheet, easing: EASE_DRAWER })
        langBackdropOpacity.value = withTiming(1, { duration: 200 })
      }
    })

  const displayName = profile?.name ?? user?.user_metadata?.name ?? '—'
  const email = user?.email ?? '—'
  const memberSince = user?.created_at
    ? new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(user.created_at))
    : '—'
  const appVersion = Constants.expoConfig?.version ?? '1.0.0'

  const startEditName = () => {
    setNameValue(displayName)
    setEditingName(true)
  }

  const saveName = async () => {
    if (!user?.id || !nameValue.trim()) return
    await updateProfile.mutateAsync({ userId: user.id, name: nameValue.trim() })
    setEditingName(false)
  }

  const cancelEditName = () => {
    setEditingName(false)
    setNameValue('')
  }

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0] && user?.id) {
      await updateProfile.mutateAsync({ userId: user.id, avatar_url: result.assets[0].uri })
    }
  }

  const removeAvatar = async () => {
    if (!user?.id) return
    await updateProfile.mutateAsync({ userId: user.id, avatar_url: null })
  }

  const handleAvatarPress = () => {
    if (profile?.avatar_url) {
      Alert.alert(t('profile_avatar_title'), undefined, [
        { text: t('profile_avatar_change'), onPress: pickAvatar },
        { text: t('profile_avatar_remove'), style: 'destructive', onPress: removeAvatar },
        { text: t('common_cancel'), style: 'cancel' },
      ])
    } else {
      pickAvatar()
    }
  }

  const handleReplayOnboarding = () => {
    router.back()
    setTimeout(() => router.push('/(app)/onboarding?replay=1'), 50)
  }

  const handleSignOut = () => {
    Alert.alert(t('profile_signout_title'), t('profile_signout_confirm'), [
      { text: t('common_cancel'), style: 'cancel' },
      {
        text: t('profile_signout'),
        style: 'destructive',
        onPress: () => signOut.mutate(),
      },
    ])
  }

  const iconColor = isDark ? colors.neutral[500] : colors.neutral[400]
  const rowBase = 'flex-row items-center px-4 py-3.5'
  const labelBase = 'text-[17px] text-neutral-900 dark:text-neutral-50'
  const valueBase = 'text-[17px] text-neutral-500 dark:text-neutral-400'
  const sectionCard = 'rounded-2xl overflow-hidden bg-white dark:bg-surface-800 mx-4'
  const sectionLabel = 'text-[13px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mx-4 mb-2 mt-6'
  const divider = 'h-px bg-neutral-100 dark:bg-surface-700 ml-[52px]'

  const LANGUAGES: { key: SupportedLanguage; label: string; native: string }[] = [
    { key: 'es', label: t('lang_es'), native: 'Español' },
    { key: 'en', label: t('lang_en'), native: 'English' },
    { key: 'fr', label: t('lang_fr'), native: 'Français' },
    { key: 'de', label: t('lang_de'), native: 'Deutsch' },
    { key: 'pt', label: t('lang_pt'), native: 'Português' },
    { key: 'it', label: t('lang_it'), native: 'Italiano' },
  ]

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top', 'bottom']}>
      {/* Nav bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text className="text-[17px] font-semibold text-neutral-900 dark:text-neutral-50">
          {t('profile_title')}
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-12">
        {/* Avatar hero */}
        <View className="items-center pt-6 pb-6">
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.75}>
            <View className="relative">
              <View className="items-center justify-center">
                <Avatar
                  uri={profile?.avatar_url}
                  name={displayName}
                  size="lg"
                />
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-500 items-center justify-center border-2 border-white dark:border-surface-900">
                <Ionicons name="camera" size={14} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text className="mt-3 text-[22px] font-bold text-neutral-900 dark:text-neutral-50">
            {displayName}
          </Text>
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            {email}
          </Text>
        </View>

        {/* Stats bar */}
        <View className="flex-row mx-4 mb-2 rounded-2xl overflow-hidden bg-white dark:bg-surface-800" style={cardShadow}>
          <View className="flex-1 items-center py-4">
            <Text className="text-[24px] font-bold text-neutral-900 dark:text-neutral-50">
              {trips.length}
            </Text>
            <Text className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t('profile_stats_trips')}
            </Text>
          </View>
          <View className="w-px bg-neutral-100 dark:bg-surface-700 my-3" />
          <View className="flex-1 items-center py-4">
            <Text className="text-[24px] font-bold text-neutral-900 dark:text-neutral-50">
              {savedExperiences.length}
            </Text>
            <Text className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t('profile_stats_saved')}
            </Text>
          </View>
        </View>

        {/* Sección: Suscripción */}
        <Text className={sectionLabel}>{t('profile_section_subscription')}</Text>
        <View className={sectionCard} style={cardShadow}>
          {isPro ? (
            <>
              <View className={`${rowBase} gap-3`}>
                <View className="w-8 h-8 rounded-full bg-primary-500/15 items-center justify-center" style={{ marginRight: 4 }}>
                  <Ionicons name="sparkles" size={16} color={colors.primary[500]} />
                </View>
                <View className="flex-1">
                  <Text className={labelBase}>{t('profile_pro_active_title')}</Text>
                </View>
                <View className="bg-primary-500 rounded-md px-2 py-0.5">
                  <Text className="text-xs font-bold text-white">PRO</Text>
                </View>
              </View>
              <View className={divider} />
              <TouchableOpacity
                className={rowBase}
                activeOpacity={0.7}
                onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
              >
                <Ionicons name="card-outline" size={20} color={iconColor} style={{ marginRight: 12 }} />
                <Text className={`${labelBase} flex-1`}>{t('profile_manage_subscription')}</Text>
                <Ionicons name="chevron-forward" size={16} color={iconColor} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              className={rowBase}
              activeOpacity={0.7}
              onPress={() => setPaywallVisible(true)}
            >
              <View className="w-8 h-8 rounded-full bg-primary-500/15 items-center justify-center" style={{ marginRight: 12 }}>
                <Ionicons name="sparkles" size={16} color={colors.primary[500]} />
              </View>
              <View className="flex-1">
                <Text className={labelBase}>{t('profile_upgrade_to_pro')}</Text>
                <Text className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {t('profile_upgrade_to_pro_subtitle')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={iconColor} />
            </TouchableOpacity>
          )}
          <View className={divider} />
          <TouchableOpacity
            className={rowBase}
            activeOpacity={0.7}
            disabled={restorePurchases.isPending}
            onPress={() => restorePurchases.mutate()}
          >
            <Ionicons name="refresh-outline" size={20} color={iconColor} style={{ marginRight: 12 }} />
            <Text className={`${labelBase} flex-1`}>{t('premium_restore_purchases')}</Text>
          </TouchableOpacity>
        </View>

        {/* Sección: Cuenta */}
        <Text className={sectionLabel}>{t('profile_section_account')}</Text>
        <View className={sectionCard} style={cardShadow}>
          {/* Nombre */}
          <View className={rowBase}>
            <Ionicons name="person-outline" size={20} color={iconColor} style={{ marginRight: 12 }} />
            <Text className={`${labelBase} flex-1`}>{t('profile_field_name')}</Text>
            {editingName ? (
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={nameValue}
                  onChangeText={setNameValue}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                  className="text-[17px] text-neutral-900 dark:text-neutral-50 text-right min-w-[120px]"
                  style={{ color: isDark ? colors.neutral[50] : colors.neutral[900] }}
                />
                <TouchableOpacity onPress={saveName} className="ml-1">
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelEditName}>
                  <Ionicons name="close-circle" size={24} color={iconColor} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={startEditName}
                className="flex-row items-center gap-1"
              >
                <Text className={valueBase}>{displayName}</Text>
                <Ionicons name="chevron-forward" size={16} color={iconColor} />
              </TouchableOpacity>
            )}
          </View>

          <View className={divider} />

          {/* Email */}
          <View className={rowBase}>
            <Ionicons name="mail-outline" size={20} color={iconColor} style={{ marginRight: 12 }} />
            <Text className={`${labelBase} flex-1`}>{t('profile_field_email')}</Text>
            <Text className={valueBase}>{email}</Text>
          </View>

          <View className={divider} />

          {/* Miembro desde */}
          <View className={rowBase}>
            <Ionicons name="calendar-outline" size={20} color={iconColor} style={{ marginRight: 12 }} />
            <Text className={`${labelBase} flex-1`}>{t('profile_field_member')}</Text>
            <Text className={valueBase} style={{ textTransform: 'capitalize' }}>{memberSince}</Text>
          </View>
        </View>

        {/* Sección: Apariencia */}
        <Text className={sectionLabel}>{t('profile_section_appearance')}</Text>
        <View className={sectionCard} style={cardShadow}>
          <View className={rowBase}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={20}
              color={isDark ? colors.primary[400] : colors.tertiary[400]}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>{t('profile_darkMode')}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
            />
          </View>

          <View className={divider} />

          {/* Idioma inline */}
          <TouchableOpacity
            className={rowBase}
            activeOpacity={0.7}
            onPress={() => setLanguagePickerOpen(true)}
          >
            <Ionicons name="globe-outline" size={20} color={iconColor} style={{ marginRight: 12 }} />
            <Text className={`${labelBase} flex-1`}>{t('profile_section_language')}</Text>
            <View className="flex-row items-center gap-1.5">
              <Text className={valueBase}>
                {LANGUAGES.find(l => l.key === language)?.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={iconColor} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Sección: App */}
        <Text className={sectionLabel}>{t('profile_section_app')}</Text>
        <View className={sectionCard} style={cardShadow}>
          <View className={rowBase}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={iconColor}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>{t('profile_field_version')}</Text>
            <Text className={valueBase}>{appVersion}</Text>
          </View>
          <View className={divider} />
          <TouchableOpacity
            onPress={handleReplayOnboarding}
            className={rowBase}
            activeOpacity={0.7}
          >
            <Ionicons
              name="play-circle-outline"
              size={20}
              color={iconColor}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>{t('profile_replay_onboarding')}</Text>
            <Ionicons name="chevron-forward" size={16} color={iconColor} />
          </TouchableOpacity>
          <View className={divider} />
          <TouchableOpacity
            onPress={() => Linking.openURL(LEGAL_URLS.terms)}
            className={rowBase}
            activeOpacity={0.7}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={iconColor}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>{t('profile_terms')}</Text>
            <Ionicons name="chevron-forward" size={16} color={iconColor} />
          </TouchableOpacity>
          <View className={divider} />
          <TouchableOpacity
            onPress={() => Linking.openURL(LEGAL_URLS.privacy)}
            className={rowBase}
            activeOpacity={0.7}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={iconColor}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>{t('profile_privacy')}</Text>
            <Ionicons name="chevron-forward" size={16} color={iconColor} />
          </TouchableOpacity>
        </View>

        {/* Sección: Gestión de cuenta */}
        <Text className={sectionLabel}>{t('profile_section_accountActions')}</Text>
        <View className={sectionCard} style={cardShadow}>
          <TouchableOpacity
            onPress={handleSignOut}
            className={rowBase}
            activeOpacity={0.7}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={colors.error}
              style={{ marginRight: 12 }}
            />
            <Text className="text-[17px] text-error font-medium">
              {t('profile_signout')}
            </Text>
          </TouchableOpacity>

          <View className={divider} />

          <TouchableOpacity
            onPress={() => setDeleteSheetVisible(true)}
            className={rowBase}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-remove-outline"
              size={20}
              color={iconColor}
              style={{ marginRight: 12 }}
            />
            <View className="flex-1">
              <Text className={labelBase}>{t('profile_deleteAccount')}</Text>
              <Text className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                {t('profile_deleteAccount_subtitle')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={iconColor} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DeleteAccountSheet visible={deleteSheetVisible} onClose={() => setDeleteSheetVisible(false)} />
      <ProPaywallSheet visible={paywallVisible} onClose={() => setPaywallVisible(false)} feature="trips" />

      {/* Language picker sheet */}
      <Modal
        visible={langModalMounted}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setLanguagePickerOpen(false)}
        onShow={() => {
          langTranslateY.value = withTiming(0, { duration: DURATION.sheet, easing: EASE_DRAWER })
          langBackdropOpacity.value = withTiming(1, { duration: 280 })
        }}
      >
        <GestureHandlerRootView style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View
            style={[
              { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
              langBackdropStyle,
            ]}
          >
            <Pressable style={{ flex: 1 }} onPress={() => setLanguagePickerOpen(false)} />
          </Animated.View>

          <Animated.View style={langSheetStyle}>
            <View
              className="bg-white dark:bg-surface-800 rounded-t-[28px] pb-8 pt-2"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 20 }}
            >
              <GestureDetector gesture={langGesture}>
                <View style={{ width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 16 }}>
                  <View className="w-9 h-[5px] rounded-full bg-neutral-300 dark:bg-surface-500" />
                </View>
              </GestureDetector>

              <View className="px-4 pb-2">
                <Text className="text-[22px] font-semibold text-neutral-900 dark:text-neutral-50">
                  {t('profile_section_language')}
                </Text>
                <Text className="text-[14px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {t('profile_language_subtitle', { defaultValue: 'Choose your preferred language' })}
                </Text>
              </View>

              <View className="mx-4 mt-3 rounded-2xl overflow-hidden bg-neutral-50 dark:bg-surface-700">
                {LANGUAGES.map((lang, idx) => {
                  const isActive = language === lang.key
                  return (
                    <View key={lang.key}>
                      {idx > 0 && <View className="h-px bg-neutral-100 dark:bg-surface-600 mx-0" />}
                      <TouchableOpacity
                        activeOpacity={0.65}
                        onPress={() => { changeLanguage(lang.key); setLanguagePickerOpen(false) }}
                        style={[
                          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 },
                          isActive && { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)' },
                        ]}
                      >
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            backgroundColor: isActive
                              ? colors.primary[500]
                              : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 13,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              letterSpacing: 0.5,
                              color: isActive ? '#fff' : isDark ? colors.neutral[300] : colors.neutral[600],
                            }}
                          >
                            {lang.key.toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: isActive ? '600' : '400',
                              color: isActive
                                ? colors.primary[500]
                                : isDark ? colors.neutral[50] : colors.neutral[900],
                            }}
                          >
                            {lang.label}
                          </Text>
                          {lang.label !== lang.native && (
                            <Text
                              style={{
                                fontSize: 13,
                                color: isDark ? colors.neutral[400] : colors.neutral[500],
                                marginTop: 1,
                              }}
                            >
                              {lang.native}
                            </Text>
                          )}
                        </View>
                        {isActive && (
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: colors.primary[500],
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="checkmark" size={13} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </View>
            </View>
          </Animated.View>
        </GestureHandlerRootView>
      </Modal>
    </SafeAreaView>
  )
}
