import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as FileSystem from 'expo-file-system/legacy'
import * as Haptics from 'expo-haptics'
import * as MediaLibrary from 'expo-media-library'
import Gallery from 'react-native-awesome-gallery'
import { Avatar } from '@components/ui/Avatar'
import { colors } from '@lib/colors'
import { EASE_OUT, EASE_DRAWER } from '@lib/animations'
import type { Memory } from '@types/index'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// ─── Theme ────────────────────────────────────────────────────────────────────

function buildTheme(isDark: boolean) {
  return {
    background:   isDark ? '#000000' : '#ffffff',
    counterBg:    'rgba(0,0,0,0.45)',
    counterText:  '#ffffff' as const,
    captionColor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.78)',
    labelColor:   isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.40)',
    nameColor:    isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.82)',
    panelBorder:  isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
    deleteColor:  colors.error,
    blurTint:     (isDark ? 'dark' : 'light') as 'dark' | 'light',
  }
}

type Theme = ReturnType<typeof buildTheme>

// ─── IconBtn ──────────────────────────────────────────────────────────────────

interface IconBtnProps {
  iconName: React.ComponentProps<typeof Ionicons>['name']
  onPress: () => void
  disabled?: boolean
  size?: number
  color?: string
  tint?: 'light' | 'dark'
}

function IconBtn({
  iconName,
  onPress,
  disabled = false,
  size = 21,
  color,
  tint = 'dark',
}: IconBtnProps) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const defaultColor = tint === 'dark' ? 'rgba(255,255,255,0.90)' : 'rgba(0,0,0,0.78)'
  const disabledColor = tint === 'dark' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)'
  const iconColor = disabled ? disabledColor : (color ?? defaultColor)

  return (
    <Pressable
      onPress={() => {
        if (disabled) return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      onPressIn={() => {
        if (!disabled) scale.value = withTiming(0.85, { duration: 100, easing: EASE_OUT })
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 200, easing: EASE_OUT })
      }}
      disabled={disabled}
      hitSlop={10}
    >
      <Animated.View style={animStyle}>
        <BlurView intensity={60} tint={tint} style={styles.iconBtnBlur}>
          <Ionicons name={iconName} size={size} color={iconColor} />
        </BlurView>
      </Animated.View>
    </Pressable>
  )
}

// ─── Bottom panel ─────────────────────────────────────────────────────────────

interface BottomPanelProps {
  memory: Memory
  uploaderName: string
  uploaderAvatar: string | null | undefined
  onDownload: () => void
  onDelete?: () => void
  downloading: boolean
  downloaded: boolean
  theme: Theme
  paddingBottom: number
  t: (key: string) => string
}

function BottomPanel({
  memory,
  uploaderName,
  uploaderAvatar,
  onDownload,
  onDelete,
  downloading,
  downloaded,
  theme,
  paddingBottom,
  t,
}: BottomPanelProps) {
  return (
    <BlurView
      intensity={80}
      tint={theme.blurTint}
      style={[styles.panel, { paddingBottom, borderTopColor: theme.panelBorder }]}
    >
      <View style={styles.panelRow}>
        <View style={styles.uploaderRow}>
          <Avatar uri={uploaderAvatar} name={uploaderName} size="sm" />
          <View style={styles.uploaderInfo}>
            <Text style={[styles.uploadedByLabel, { color: theme.labelColor }]}>
              {t('memories_uploaded_by').toUpperCase()}
            </Text>
            <Text style={[styles.uploaderName, { color: theme.nameColor }]} numberOfLines={1}>
              {uploaderName}
            </Text>
          </View>
        </View>

        <View style={styles.actionGroup}>
          <IconBtn
            iconName={downloading ? 'hourglass-outline' : downloaded ? 'checkmark-outline' : 'arrow-down-outline'}
            onPress={onDownload}
            disabled={downloading}
            tint={theme.blurTint}
          />
          {onDelete && (
            <IconBtn
              iconName="trash-outline"
              onPress={onDelete}
              color={theme.deleteColor}
              tint={theme.blurTint}
            />
          )}
        </View>
      </View>

      {memory.caption ? (
        <Text style={[styles.caption, { color: theme.captionColor }]} numberOfLines={4}>
          {memory.caption}
        </Text>
      ) : null}
    </BlurView>
  )
}

// ─── Gallery render item ──────────────────────────────────────────────────────

interface GalleryItemProps {
  uri: string
  setImageDimensions: (d: { width: number; height: number }) => void
}

function GalleryItemRenderer({ uri, setImageDimensions }: GalleryItemProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="contain"
        onLoad={(e) => {
          const { width: w, height: h } = e.nativeEvent.source
          setImageDimensions({ width: w, height: h })
          setStatus('loaded')
        }}
        onError={() => setStatus('error')}
      />
      {status === 'loading' && (
        <View style={[StyleSheet.absoluteFillObject, styles.centered]}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.40)" />
        </View>
      )}
      {status === 'error' && (
        <View style={[StyleSheet.absoluteFillObject, styles.centered]}>
          <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.22)" />
        </View>
      )}
    </View>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface MemoryDetailProps {
  memories: Memory[]
  initialIndex: number
  visible: boolean
  onClose: () => void
  canDelete: (memory: Memory) => boolean
  onDelete: (id: string) => void
  getUploaderName: (userId: string) => string
  getUploaderAvatar: (userId: string) => string | null | undefined
}

export function MemoryDetail({
  memories,
  initialIndex,
  visible,
  onClose,
  canDelete,
  onDelete,
  getUploaderName,
  getUploaderAvatar,
}: MemoryDetailProps) {
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = buildTheme(isDark)

  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [galleryHeight, setGalleryHeight] = useState(SCREEN_HEIGHT - 160)

  const bgOpacity = useSharedValue(0)
  const slideY = useSharedValue(SCREEN_HEIGHT)

  const currentMemory = memories[currentIndex] ?? null

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }))
  const containerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }))

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex)
      slideY.value = SCREEN_HEIGHT
      bgOpacity.value = 0
      slideY.value = withTiming(0, { duration: 300, easing: EASE_DRAWER })
      bgOpacity.value = withTiming(1, { duration: 260, easing: EASE_OUT })
    }
  }, [visible, initialIndex])

  const dismiss = () => {
    bgOpacity.value = 0
    slideY.value = SCREEN_HEIGHT
    onClose()
  }

  const handleTranslationYChange = (translationY: number) => {
    'worklet'
    bgOpacity.value = interpolate(translationY, [0, 260], [1, 0.25], Extrapolation.CLAMP)
  }

  const handleDownload = async () => {
    if (!currentMemory || downloading) return
    const { status } = await MediaLibrary.requestPermissionsAsync(true)
    if (status !== 'granted') {
      Alert.alert(t('memories_permission_denied_title'), t('memories_permission_denied_body'))
      return
    }
    setDownloading(true)
    try {
      const localUri = `${FileSystem.cacheDirectory}pingo_${Date.now()}.jpg`
      await FileSystem.downloadAsync(currentMemory.image_url, localUri)
      await MediaLibrary.saveToLibraryAsync(localUri)
      await FileSystem.deleteAsync(localUri, { idempotent: true })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2000)
    } catch {
      Alert.alert(t('common_error'), t('memories_save_error'))
    } finally {
      setDownloading(false)
    }
  }

  if (!visible || memories.length === 0) return null

  const uris = memories.map((m) => m.image_url)

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      {/* Background */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.background }, bgStyle]}
      />

      <Animated.View style={[{ flex: 1 }, containerStyle]}>
        {/* Gallery */}
        <View
          style={{ flex: 1 }}
          onLayout={(e) => setGalleryHeight(e.nativeEvent.layout.height)}
        >
          <Gallery
            data={uris}
            renderItem={({ item, setImageDimensions }) => (
              <GalleryItemRenderer uri={item} setImageDimensions={setImageDimensions} />
            )}
            keyExtractor={(item, i) => `${item}-${i}`}
            initialIndex={initialIndex}
            onIndexChange={setCurrentIndex}
            onSwipeToClose={dismiss}
            onTranslationYChange={handleTranslationYChange}
            containerDimensions={{ width: SCREEN_WIDTH, height: galleryHeight }}
            style={{ flex: 1, backgroundColor: 'transparent' }}
            numToRender={3}
          />
        </View>

        {/* Bottom panel */}
        {currentMemory && (
          <BottomPanel
            memory={currentMemory}
            uploaderName={getUploaderName(currentMemory.user_id)}
            uploaderAvatar={getUploaderAvatar(currentMemory.user_id)}
            onDownload={handleDownload}
            downloaded={downloaded}
            onDelete={
              canDelete(currentMemory)
                ? () => {
                    Alert.alert(
                      t('memories_delete_confirm_title'),
                      t('memories_delete_confirm_body'),
                      [
                        { text: t('memories_delete_confirm_cancel'), style: 'cancel' },
                        {
                          text: t('memories_delete_confirm_action'),
                          style: 'destructive',
                          onPress: () => { onDelete(currentMemory.id); dismiss() },
                        },
                      ],
                    )
                  }
                : undefined
            }
            downloading={downloading}
            theme={theme}
            paddingBottom={insets.bottom + 16}
            t={t}
          />
        )}

        {/* Header overlay */}
        <View
          style={[styles.header, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <IconBtn iconName="close" onPress={dismiss} />
          {memories.length > 1 && (
            <View style={[styles.counterPill, { backgroundColor: theme.counterBg }]}>
              <Text style={[styles.counterText, { color: theme.counterText }]}>
                {currentIndex + 1} / {memories.length}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Icon button
  iconBtnBlur: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  // Counter pill
  counterPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Bottom panel
  panel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  uploaderInfo: {
    gap: 2,
    flex: 1,
  },
  uploadedByLabel: {
    fontSize: 9,
    letterSpacing: 1.6,
    fontWeight: '600',
  },
  uploaderName: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 12,
  },

  // Caption
  caption: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
})
