import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'
import { ScrollView as GHScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import { Avatar } from '@components/ui/Avatar'
import { colors } from '@lib/colors'
import type { Memory } from '@types/index'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const DISMISS_THRESHOLD = 100
const DISMISS_VELOCITY = 600

const DARK_BG = '#111111'
const LIGHT_BG = '#ffffff'

function getTheme(isDark: boolean) {
  return {
    bg: isDark ? DARK_BG : LIGHT_BG,
    iconColor: isDark ? '#ffffff' : '#111111',
    btnBg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    btnBorder: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
    captionColor: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)',
    labelColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    nameColor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)',
    counterColor: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    spinnerColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
    errorIconColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)',
    errorTextColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
  }
}

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

function PhotoSlide({ uri, bg, theme }: { uri: string; bg: string; theme: ReturnType<typeof getTheme> }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: bg }}>
      <Image
        source={{ uri }}
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
        resizeMode="contain"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
      {status === 'loading' && (
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          className="items-center justify-center"
        >
          <ActivityIndicator size="large" color={theme.spinnerColor} />
        </View>
      )}
      {status === 'error' && (
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          className="items-center justify-center gap-3"
        >
          <Ionicons name="image-outline" size={48} color={theme.errorIconColor} />
          <Text style={{ color: theme.errorTextColor, fontSize: 13 }}>
            No se pudo cargar la imagen
          </Text>
        </View>
      )}
    </View>
  )
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
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'
  const theme = getTheme(isDark)

  const scrollRef = useRef<any>(null)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [downloading, setDownloading] = useState(false)

  const translateY = useSharedValue(0)
  const bgOpacity = useSharedValue(1)

  const currentMemory = memories[currentIndex] ?? null

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex)
      translateY.value = 0
      bgOpacity.value = 1
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * initialIndex, animated: false })
      })
    }
  }, [visible, initialIndex])

  const dismiss = () => {
    translateY.value = 0
    bgOpacity.value = 1
    onClose()
  }

  const animateDismiss = () => {
    bgOpacity.value = withTiming(0, { duration: 180 }, () => {
      runOnJS(onClose)()
    })
    translateY.value = withTiming(translateY.value + SCREEN_HEIGHT * 0.3, { duration: 180 })
  }

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .activeOffsetY([-10000, 12])
    .failOffsetX([-8, 8])
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY
        bgOpacity.value = interpolate(
          e.translationY,
          [0, 260],
          [1, 0.25],
          Extrapolation.CLAMP
        )
      }
    })
    .onFinalize((e, success) => {
      const shouldDismiss =
        success &&
        (translateY.value > DISMISS_THRESHOLD || e.velocityY > DISMISS_VELOCITY)

      if (shouldDismiss) {
        runOnJS(animateDismiss)()
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 280 })
        bgOpacity.value = withSpring(1)
      }
    })

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }))

  const handleDownload = async () => {
    if (!currentMemory || downloading) return

    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Acceso denegado',
        'Ve a Ajustes › Privacidad › Fotos para permitir guardar imágenes.'
      )
      return
    }

    setDownloading(true)
    try {
      const localUri = `${FileSystem.cacheDirectory}pingo_${Date.now()}.jpg`
      await FileSystem.downloadAsync(currentMemory.image_url, localUri)
      await MediaLibrary.saveToLibraryAsync(localUri)
      await FileSystem.deleteAsync(localUri, { idempotent: true })
    } catch {
      Alert.alert('Error', 'No se pudo guardar la imagen. Inténtalo de nuevo.')
    } finally {
      setDownloading(false)
    }
  }

  if (!visible || memories.length === 0) return null

  const btnStyle = {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.btnBg,
    borderWidth: 0.5,
    borderColor: theme.btnBorder,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }

  const btnDangerStyle = {
    ...btnStyle,
    backgroundColor: 'rgba(239,35,60,0.12)',
    borderColor: 'rgba(239,35,60,0.35)',
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.bg },
          bgStyle,
        ]}
      />

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1 }, containerStyle]}>
          <GHScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
              setCurrentIndex(idx)
            }}
          >
            {memories.map((m) => (
              <PhotoSlide key={m.id} uri={m.image_url} bg={theme.bg} theme={theme} />
            ))}
          </GHScrollView>

          {/* Header controls */}
          <View
            style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top }}
            className="flex-row items-center justify-between px-4 py-3"
          >
            <TouchableOpacity onPress={dismiss} hitSlop={8} style={btnStyle}>
              <Ionicons name="close" size={17} color={theme.iconColor} />
            </TouchableOpacity>

            {memories.length > 1 && (
              <Text style={{ color: theme.counterColor, fontSize: 13, fontWeight: '500' }}>
                {currentIndex + 1} / {memories.length}
              </Text>
            )}

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleDownload}
                hitSlop={8}
                disabled={downloading}
                style={btnStyle}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color={theme.iconColor} />
                ) : (
                  <Ionicons name="arrow-down-circle-outline" size={20} color={theme.iconColor} />
                )}
              </TouchableOpacity>

              {currentMemory && canDelete(currentMemory) && (
                <TouchableOpacity
                  onPress={() => {
                    onDelete(currentMemory.id)
                    dismiss()
                  }}
                  hitSlop={8}
                  style={btnDangerStyle}
                >
                  <Ionicons name="trash-outline" size={17} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer */}
          {currentMemory && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingBottom: insets.bottom + 16,
                paddingHorizontal: 16,
              }}
            >
              <View
                style={{
                  backgroundColor: theme.btnBg,
                  borderWidth: 0.5,
                  borderColor: theme.btnBorder,
                  borderRadius: 16,
                  padding: 14,
                  gap: 10,
                }}
              >
                {currentMemory.caption ? (
                  <Text
                    style={{
                      color: theme.captionColor,
                      fontSize: 15,
                      lineHeight: 22,
                      fontWeight: '400',
                    }}
                  >
                    {currentMemory.caption}
                  </Text>
                ) : null}

                <View className="flex-row items-center gap-3">
                  <Avatar
                    uri={getUploaderAvatar(currentMemory.user_id)}
                    name={getUploaderName(currentMemory.user_id)}
                    size="sm"
                  />
                  <View className="gap-0.5">
                    <Text style={{ color: theme.labelColor, fontSize: 11, letterSpacing: 0.3 }}>
                      SUBIDO POR
                    </Text>
                    <Text style={{ color: theme.nameColor, fontSize: 14, fontWeight: '500' }}>
                      {getUploaderName(currentMemory.user_id)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </Modal>
  )
}
