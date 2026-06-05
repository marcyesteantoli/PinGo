import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated'
import { EASE_DRAWER, EASE_DRAWER_OUT, DURATION } from '@lib/animations'
import { WebView } from 'react-native-webview'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import * as Haptics from 'expo-haptics'
import * as Sharing from 'expo-sharing'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import JSZip from 'jszip'
import QRCode from 'react-native-qrcode-svg'
import { colors } from '@lib/colors'
import type { Document } from '@types/index'

type DocumentWithExperience = Document & { experience_title: string | null; file_url: string | null }

interface DocumentViewerProps {
  document: DocumentWithExperience | null
  visible: boolean
  onClose: () => void
}

type PassData = {
  organizationName?: string
  description?: string
  serialNumber?: string
  backgroundColor?: string
  foregroundColor?: string
  barcodeMessage?: string
  barcodeFormat?: string
  boardingPass?: {
    transitType?: string
    headerFields?: Array<{ key: string; label?: string; value?: string }>
    primaryFields?: Array<{ key: string; label?: string; value?: string }>
    secondaryFields?: Array<{ key: string; label?: string; value?: string }>
    auxiliaryFields?: Array<{ key: string; label?: string; value?: string }>
  }
}

async function parsePassFile(localPath: string): Promise<PassData> {
  const base64 = await FileSystem.readAsStringAsync(localPath, {
    encoding: FileSystem.EncodingType.Base64,
  })
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  const zip = await JSZip.loadAsync(bytes.buffer)
  const passJsonFile = zip.file('pass.json')
  if (!passJsonFile) throw new Error('Invalid .pkpass: missing pass.json')

  const json = await passJsonFile.async('string')
  const pass = JSON.parse(json)

  const barcode = pass.barcodes?.[0] ?? pass.barcode
  const boardingPassData = pass.boardingPass ?? pass.eventTicket ?? pass.storeCard ?? pass.coupon ?? pass.generic

  return {
    organizationName: pass.organizationName,
    description: pass.description,
    serialNumber: pass.serialNumber,
    backgroundColor: pass.backgroundColor,
    foregroundColor: pass.foregroundColor,
    barcodeMessage: barcode?.message,
    barcodeFormat: barcode?.format,
    boardingPass: boardingPassData,
  }
}

function PassViewer({ passData, isDark }: { passData: PassData; isDark: boolean }) {
  const textColor = '#ffffff'
  const mutedColor = 'rgba(255,255,255,0.6)'
  const primary = passData.boardingPass?.primaryFields ?? []
  const secondary = passData.boardingPass?.secondaryFields ?? []
  const auxiliary = passData.boardingPass?.auxiliaryFields ?? []
  const headers = passData.boardingPass?.headerFields ?? []

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, overflow: 'hidden', padding: 20, gap: 16 }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: mutedColor, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {passData.organizationName ?? 'Boarding Pass'}
            </Text>
            <Text style={{ color: textColor, fontSize: 16, fontWeight: '700', marginTop: 2 }}>
              {passData.description ?? ''}
            </Text>
          </View>
          {headers.length > 0 && (
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              {headers.map((f, i) => (
                <View key={i} style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: mutedColor, fontSize: 10, letterSpacing: 1 }}>
                    {(f.label ?? '').toUpperCase()}
                  </Text>
                  <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>
                    {f.value ?? ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Primary fields (e.g., FROM → TO) */}
        {primary.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {primary.map((f, i) => (
              <View key={i} style={{ alignItems: i === 1 ? 'flex-end' : 'flex-start', flex: 1 }}>
                <Text style={{ color: mutedColor, fontSize: 10, letterSpacing: 1.5 }}>
                  {(f.label ?? '').toUpperCase()}
                </Text>
                <Text style={{ color: textColor, fontSize: 32, fontWeight: '800', letterSpacing: -1 }}>
                  {f.value ?? ''}
                </Text>
              </View>
            ))}
            {primary.length === 2 && (
              <View style={{ position: 'absolute', left: '50%', transform: [{ translateX: -12 }] }}>
                <Ionicons name="airplane" size={22} color="rgba(255,255,255,0.6)" />
              </View>
            )}
          </View>
        )}

        {/* Separator */}
        <View style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed' }} />

        {/* Secondary / auxiliary fields */}
        {[...secondary, ...auxiliary].length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {[...secondary, ...auxiliary].map((f, i) => (
              <View key={i} style={{ minWidth: 80 }}>
                <Text style={{ color: mutedColor, fontSize: 10, letterSpacing: 1 }}>
                  {(f.label ?? '').toUpperCase()}
                </Text>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                  {f.value ?? ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Barcode / QR */}
        {passData.barcodeMessage && (
          <>
            <View style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed' }} />
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12 }}>
                <QRCode
                  value={passData.barcodeMessage}
                  size={160}
                  color="#000000"
                  backgroundColor="#ffffff"
                />
              </View>
              {passData.barcodeFormat && (
                <Text style={{ color: mutedColor, fontSize: 10, marginTop: 8, letterSpacing: 1 }}>
                  {passData.barcodeFormat}
                </Text>
              )}
            </View>
          </>
        )}
      </LinearGradient>
    </ScrollView>
  )
}

export function DocumentViewer({ document, visible, onClose }: DocumentViewerProps) {
  const SCREEN_HEIGHT = Dimensions.get('window').height
  const insets = useSafeAreaInsets()
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'
  const [localUri, setLocalUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [passData, setPassData] = useState<PassData | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Keep last valid document alive during exit animation
  const currentDocRef = useRef<DocumentWithExperience | null>(null)
  if (document) currentDocRef.current = document
  const currentDoc = currentDocRef.current

  const translateY = useSharedValue(SCREEN_HEIGHT)

  useEffect(() => {
    if (visible && document) {
      translateY.value = SCREEN_HEIGHT
      setModalVisible(true)
    } else {
      if (translateY.value >= SCREEN_HEIGHT - 1) {
        setModalVisible(false)
        return
      }
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: DURATION.sheetClose, easing: EASE_DRAWER_OUT }, () => {
        runOnJS(setModalVisible)(false)
      })
    }
  }, [visible, document?.id])

  useEffect(() => {
    if (!visible || !document) return

    setLoading(true)
    setError(false)
    setLocalUri(null)
    setSavedOk(false)
    setPassData(null)

    // Links open externally — no viewer content needed
    if (document.document_type === 'link') {
      setLoading(false)
      return
    }

    if (!document.file_url) {
      setLoading(false)
      return
    }

    if (document.file_type?.includes('image')) {
      setLocalUri(document.file_url)
      setLoading(false)
      return
    }

    // Android WebView can't render PDFs from file:// URIs — use HTTPS URL directly for Google Docs viewer
    if (Platform.OS === 'android' && document.document_type !== 'pass') {
      setLocalUri(document.file_url)
      setLoading(false)
      return
    }

    const ext = document.document_type === 'pass' ? 'pkpass' : 'pdf'
    const localPath = `${FileSystem.cacheDirectory}tripsync_doc_${document.id}.${ext}`

    ;(async () => {
      try {
        const info = await FileSystem.getInfoAsync(localPath)
        if (!info.exists || info.isDirectory) {
          if (info.exists) await FileSystem.deleteAsync(localPath, { idempotent: true })
          await FileSystem.downloadAsync(document.file_url!, localPath)
        }
        if (document.document_type === 'pass') {
          const parsed = await parsePassFile(localPath)
          setPassData(parsed)
        } else {
          setLocalUri(localPath)
        }
      } catch {
        try { await FileSystem.deleteAsync(localPath, { idempotent: true }) } catch {}
        setError(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [visible, document?.id])

  const handleGestureClose = useCallback(() => { onClose() }, [onClose])

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 700) {
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
      }
    })

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const handleShare = async () => {
    if (!document) return
    if (document.document_type === 'link' && document.url) {
      await Share.share({ url: document.url, message: document.name })
      return
    }
    if (!document.file_url) return
    try {
      await Share.share({ url: document.file_url, message: document.name })
    } catch {}
  }

  const handleDownload = async () => {
    if (!localUri || downloading || loading) return
    setDownloading(true)
    try {
      if (document?.file_type?.includes('image')) {
        const { status } = await MediaLibrary.requestPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Permite el acceso a la galería para guardar imágenes.')
          return
        }
        await MediaLibrary.saveToLibraryAsync(localUri)
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setSavedOk(true)
        setTimeout(() => setSavedOk(false), 2000)
      } else {
        let shareUri = localUri
        if (Platform.OS === 'android' && localUri?.startsWith('http')) {
          const ext = document?.document_type === 'pass' ? 'pkpass' : 'pdf'
          const localPath = `${FileSystem.cacheDirectory}tripsync_doc_${document?.id}.${ext}`
          const info = await FileSystem.getInfoAsync(localPath)
          if (!info.exists) {
            await FileSystem.downloadAsync(localUri, localPath)
          }
          shareUri = localPath
        }
        const available = await Sharing.isAvailableAsync()
        if (available) {
          await Sharing.shareAsync(shareUri!, {
            mimeType: document?.document_type === 'pass' ? 'application/vnd.apple.pkpass' : 'application/pdf',
            dialogTitle: document?.name ?? 'Documento',
          })
        }
      }
    } catch {} finally {
      setDownloading(false)
    }
  }

  if (!currentDoc) return null

  const isLink = currentDoc.document_type === 'link'
  const isPass = currentDoc.document_type === 'pass'
  const isImage = currentDoc.file_type?.includes('image')

  const bg = isDark ? '#111111' : '#f2f2f7'
  const headerBg = isDark ? '#1c1c1e' : '#ffffff'
  const titleColor = isDark ? '#ffffff' : '#000000'
  const subtitleColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'
  const actionColor = loading ? colors.neutral[400] : colors.primary[500]

  const downloadIconName = savedOk ? 'checkmark-circle' : downloading ? undefined : 'download-outline'

  const showDownloadButton = !isLink

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={() => {
        translateY.value = withTiming(0, { duration: DURATION.sheet, easing: EASE_DRAWER })
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[{ flex: 1, backgroundColor: isPass ? '#0a0a1a' : bg }, sheetStyle]}>
          {/* Header */}
          <GestureDetector gesture={gesture}>
            <View
              style={{
                paddingTop: insets.top + 12,
                paddingBottom: 12,
                paddingHorizontal: 16,
                backgroundColor: headerBg,
                borderBottomWidth: 0.5,
                borderBottomColor: borderColor,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity onPress={onClose} hitSlop={8} style={{ minWidth: 52 }}>
                <Text style={{ color: colors.primary[500], fontSize: 17, fontWeight: '400' }}>
                  Listo
                </Text>
              </TouchableOpacity>

              <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
                <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '600', color: titleColor }}>
                  {currentDoc.name}
                </Text>
                {currentDoc.experience_title && (
                  <Text numberOfLines={1} style={{ fontSize: 12, color: subtitleColor, marginTop: 1 }}>
                    {currentDoc.experience_title}
                  </Text>
                )}
              </View>

              <View style={{ minWidth: 52, flexDirection: 'row', gap: 18, justifyContent: 'flex-end', alignItems: 'center' }}>
                {showDownloadButton && (
                  <TouchableOpacity onPress={handleDownload} hitSlop={8} disabled={loading || downloading}>
                    {downloading ? (
                      <ActivityIndicator size="small" color={colors.primary[500]} />
                    ) : (
                      <Ionicons
                        name={downloadIconName ?? 'download-outline'}
                        size={22}
                        color={savedOk ? colors.success[600] : actionColor}
                      />
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleShare} hitSlop={8} disabled={loading}>
                  <Ionicons name="share-outline" size={22} color={isLink ? colors.primary[500] : actionColor} />
                </TouchableOpacity>
              </View>
            </View>
          </GestureDetector>

          {/* Content */}
          <View style={{ flex: 1 }}>
          {/* Link type — prompt to open in browser */}
          {isLink && currentDoc.url && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
              <Animated.View entering={FadeIn.duration(240)}>
                <View
                  style={{
                    width: 72, height: 72,
                    borderRadius: 20,
                    backgroundColor: isDark ? colors.surface[700] : '#f0f4ff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="link" size={32} color={colors.primary[500]} />
                </View>
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(240).delay(80)} style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: titleColor, textAlign: 'center' }}>
                  {currentDoc.name}
                </Text>
                <Text numberOfLines={2} style={{ fontSize: 13, color: subtitleColor, textAlign: 'center' }}>
                  {currentDoc.url}
                </Text>
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(240).delay(160)}>
                <TouchableOpacity
                  onPress={() => Linking.openURL(currentDoc.url!)}
                  style={{
                    backgroundColor: colors.primary[500],
                    paddingHorizontal: 24,
                    paddingVertical: 13,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="open-outline" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                    Abrir enlace
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}

          {/* Loading */}
          {!isLink && loading && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: isPass ? '#0a0a1a' : bg }}
            >
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={{ marginTop: 12, fontSize: 14, color: subtitleColor }}>
                {isPass ? 'Cargando boarding pass…' : 'Cargando documento…'}
              </Text>
            </Animated.View>
          )}

          {/* Error */}
          {!isLink && error && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <Animated.View entering={FadeIn.duration(300)}>
                <Ionicons name="document-text-outline" size={56} color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} />
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(280).delay(80)} style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: titleColor }}>No se pudo cargar</Text>
                <Text style={{ fontSize: 14, color: subtitleColor, textAlign: 'center', paddingHorizontal: 32 }}>
                  Comprueba tu conexión e inténtalo de nuevo
                </Text>
              </Animated.View>
            </View>
          )}

          {/* Pass */}
          {isPass && !loading && !error && passData && (
            <PassViewer passData={passData} isDark={isDark} />
          )}

          {/* File (image or PDF) */}
          {!isLink && !isPass && !loading && !error && localUri && (
            isImage ? (
              <Image source={{ uri: localUri }} style={{ flex: 1 }} resizeMode="contain" />
            ) : Platform.OS === 'android' ? (
              <WebView
                source={{ uri: `https://docs.google.com/gviewer?embedded=true&url=${encodeURIComponent(localUri)}` }}
                style={{ flex: 1, backgroundColor: bg }}
              />
            ) : (
              <WebView
                source={{ uri: localUri }}
                style={{ flex: 1, backgroundColor: bg }}
                originWhitelist={['file://', 'https://', 'http://']}
                allowFileAccess
                allowFileAccessFromFileURLs
                allowUniversalAccessFromFileURLs
              />
            )
          )}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  )
}
