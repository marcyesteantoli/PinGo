import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Share,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'
import { WebView } from 'react-native-webview'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import * as Haptics from 'expo-haptics'
import * as Sharing from 'expo-sharing'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@lib/colors'
import type { Document } from '@types/index'

type DocumentWithExperience = Document & { experience_title: string | null }

interface DocumentViewerProps {
  document: DocumentWithExperience | null
  visible: boolean
  onClose: () => void
}

export function DocumentViewer({ document, visible, onClose }: DocumentViewerProps) {
  const insets = useSafeAreaInsets()
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'
  const [localUri, setLocalUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    if (!visible || !document) return

    setLoading(true)
    setError(false)
    setLocalUri(null)
    setSavedOk(false)

    if (document.file_type?.includes('image')) {
      setLocalUri(document.file_url)
      setLoading(false)
      return
    }

    // WKWebView can't render remote PDFs — download to cache and load via file://
    const localPath = `${FileSystem.cacheDirectory}tripsync_doc_${document.id}.pdf`
    ;(async () => {
      try {
        const info = await FileSystem.getInfoAsync(localPath)
        if (!info.exists) {
          await FileSystem.downloadAsync(document.file_url, localPath)
        }
        setLocalUri(localPath)
      } catch {
        try { await FileSystem.deleteAsync(localPath, { idempotent: true }) } catch {}
        setError(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [visible, document?.id])

  const handleShare = async () => {
    if (!document?.file_url) return
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
        // PDF: Sharing.shareAsync works on both iOS (share sheet → Save to Files) and Android (content URI)
        const available = await Sharing.isAvailableAsync()
        if (available) {
          await Sharing.shareAsync(localUri, {
            mimeType: 'application/pdf',
            dialogTitle: document?.name ?? 'Documento',
          })
        }
      }
    } catch {} finally {
      setDownloading(false)
    }
  }

  if (!visible || !document) return null

  const bg = isDark ? '#111111' : '#f2f2f7'
  const headerBg = isDark ? '#1c1c1e' : '#ffffff'
  const titleColor = isDark ? '#ffffff' : '#000000'
  const subtitleColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'
  const isImage = document.file_type?.includes('image')
  const actionColor = loading ? colors.neutral[400] : colors.primary[500]

  const downloadIconName = savedOk
    ? 'checkmark-circle'
    : downloading
    ? undefined
    : 'download-outline'

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: bg }}>
        {/* iOS-style header */}
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
            <Text
              numberOfLines={1}
              style={{ fontSize: 16, fontWeight: '600', color: titleColor }}
            >
              {document.name}
            </Text>
            {document.experience_title && (
              <Text
                numberOfLines={1}
                style={{ fontSize: 12, color: subtitleColor, marginTop: 1 }}
              >
                {document.experience_title}
              </Text>
            )}
          </View>

          {/* Right actions: download + share */}
          <View style={{ minWidth: 52, flexDirection: 'row', gap: 18, justifyContent: 'flex-end', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={handleDownload}
              hitSlop={8}
              disabled={loading || downloading}
            >
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

            <TouchableOpacity
              onPress={handleShare}
              hitSlop={8}
              disabled={loading}
            >
              <Ionicons name="share-outline" size={22} color={actionColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {loading && (
            <View
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: bg,
              }}
            >
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={{ marginTop: 12, fontSize: 14, color: subtitleColor }}>
                Cargando documento…
              </Text>
            </View>
          )}

          {error && (
            <View
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={56}
                color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
              />
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: titleColor }}>
                  No se pudo cargar
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: subtitleColor,
                    textAlign: 'center',
                    paddingHorizontal: 32,
                  }}
                >
                  Comprueba tu conexión e inténtalo de nuevo
                </Text>
              </View>
            </View>
          )}

          {!loading && !error && localUri && (
            isImage ? (
              <Image
                source={{ uri: localUri }}
                style={{ flex: 1 }}
                resizeMode="contain"
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
      </View>
    </Modal>
  )
}
