import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { WebView } from 'react-native-webview'
import * as FileSystem from 'expo-file-system/legacy'
import type { Document } from '@types/index'
import { colors } from '@lib/colors'

type DocumentWithExperience = Document & { experience_title: string | null; file_url: string }

interface DocumentCardProps {
  document: DocumentWithExperience
  onPress?: () => void
  onDelete?: () => void
}

const DELETE_WIDTH = 76
const PREVIEW_H = 112
const SCALE = 0.25

function getAccentColor(fileType: string | null): string {
  if (!fileType) return colors.neutral[300]
  if (fileType.includes('pdf')) return colors.error
  if (fileType.includes('image')) return colors.primary[500]
  return colors.neutral[300]
}

function getFileLabel(fileType: string | null): string {
  if (!fileType) return 'DOC'
  if (fileType.includes('pdf')) return 'PDF'
  if (fileType.includes('image')) return 'IMG'
  return 'DOC'
}

interface PDFThumbnailProps {
  fileUrl: string
  fileId: string
  cardWidth: number
  isDark: boolean
}

function PDFThumbnail({ fileUrl, fileId, cardWidth, isDark }: PDFThumbnailProps) {
  const [localUri, setLocalUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!cardWidth) return
    const localPath = `${FileSystem.cacheDirectory}tripsync_doc_${fileId}.pdf`
    ;(async () => {
      try {
        const info = await FileSystem.getInfoAsync(localPath)
        if (!info.exists) {
          await FileSystem.downloadAsync(fileUrl, localPath)
        }
        setLocalUri(localPath)
      } catch {
        // fallback to skeleton on error
      } finally {
        setLoading(false)
      }
    })()
  }, [fileId, fileUrl, cardWidth])

  // Render WebView at 4× card size, then scale down to fit the preview area
  const renderW = cardWidth / SCALE
  const renderH = PREVIEW_H / SCALE
  // Compensate for RN scaling from center: shift layout so visual top-left aligns to (0,0)
  const marginLeft = renderW * (SCALE - 1) / 2
  const marginTop = renderH * (SCALE - 1) / 2

  if (loading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: isDark ? colors.surface[700] : '#fafafa',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ActivityIndicator size="small" color={colors.neutral[300]} />
      </View>
    )
  }

  if (!localUri) {
    // Fallback skeleton
    return (
      <View style={{
        flex: 1,
        backgroundColor: isDark ? colors.surface[700] : '#fafafa',
        padding: 14,
        gap: 8,
      }}>
        {[55, 90, 82, 75, 88].map((w, i) => (
          <View
            key={i}
            style={{
              height: i === 0 ? 5 : 4,
              width: `${w}%`,
              backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
              borderRadius: 2,
            }}
          />
        ))}
      </View>
    )
  }

  return (
    <View style={{ width: cardWidth, height: PREVIEW_H, overflow: 'hidden' }}>
      <View style={{
        marginLeft,
        marginTop,
        width: renderW,
        height: renderH,
        transform: [{ scale: SCALE }],
      }}>
        <WebView
          source={{ uri: localUri }}
          style={{ width: renderW, height: renderH, backgroundColor: '#fff' }}
          scrollEnabled={false}
          javaScriptEnabled={false}
          originWhitelist={['file://']}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
        />
      </View>
      {/* Touch blocker so gestures pass through to the card */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="box-only" />
    </View>
  )
}

export function DocumentCard({ document, onPress, onDelete }: DocumentCardProps) {
  const translateX = useSharedValue(0)
  const savedX = useSharedValue(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'

  const accentColor = getAccentColor(document.file_type)
  const isImage = document.file_type?.includes('image')
  const canDelete = !!onDelete

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onBegin(() => { savedX.value = translateX.value })
    .onUpdate((e) => {
      if (!canDelete) return
      translateX.value = Math.min(0, Math.max(-DELETE_WIDTH, savedX.value + e.translationX))
    })
    .onEnd(() => {
      if (!canDelete) {
        translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
        return
      }
      translateX.value = translateX.value < -DELETE_WIDTH / 2
        ? withTiming(-DELETE_WIDTH, { duration: 240, easing: Easing.out(Easing.cubic) })
        : withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
    })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const handleDeletePress = () => {
    translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
    onDelete?.()
  }

  const rowWidth = containerWidth > 0 ? containerWidth + (canDelete ? DELETE_WIDTH : 0) : undefined
  const cardWidth = containerWidth > 0 ? containerWidth : undefined

  const cardBg = isDark ? colors.surface[800] : '#ffffff'
  const titleColor = isDark ? '#f1f5f9' : '#0f172a'
  const subtitleColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return (
    <View
      className="rounded-2xl"
      style={{
        ...Platform.select({
          android: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.10)' },
          default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
        }),
        opacity: containerWidth > 0 ? 1 : 0,
      }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && w !== containerWidth) setContainerWidth(w)
      }}
    >
      <View className="overflow-hidden rounded-2xl">
        <Animated.View style={[{ flexDirection: 'row', width: rowWidth }, cardStyle]}>
          <GestureDetector gesture={pan}>
            <View style={{ width: cardWidth, flex: cardWidth === undefined ? 1 : undefined }}>
              <TouchableOpacity
                onPress={onPress}
                style={{ backgroundColor: cardBg }}
                activeOpacity={0.7}
              >
                {/* Preview area */}
                <View style={{ height: PREVIEW_H, overflow: 'hidden' }}>
                  {/* Left accent bar */}
                  <View
                    style={{
                      position: 'absolute',
                      left: 0, top: 0, bottom: 0,
                      width: 3,
                      backgroundColor: accentColor,
                      zIndex: 3,
                    }}
                  />

                  {isImage && document.file_url ? (
                    <>
                      <Image
                        source={{ uri: document.file_url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.38)']}
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44 }}
                      />
                    </>
                  ) : (
                    containerWidth > 0 && (
                      <PDFThumbnail
                        fileUrl={document.file_url}
                        fileId={document.id}
                        cardWidth={containerWidth}
                        isDark={isDark}
                      />
                    )
                  )}

                  {/* File type badge */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 8, right: 8,
                      backgroundColor: accentColor,
                      borderRadius: 6,
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      zIndex: 3,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                      {getFileLabel(document.file_type)}
                    </Text>
                  </View>
                </View>

                {/* Info area */}
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    borderTopWidth: 0.5,
                    borderTopColor: borderColor,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 13, fontWeight: '600', color: titleColor }}
                    >
                      {document.name}
                    </Text>
                    {document.experience_title && (
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 13, color: subtitleColor, marginTop: 1 }}
                      >
                        {document.experience_title}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />
                </View>
              </TouchableOpacity>
            </View>
          </GestureDetector>

          {canDelete && (
            <TouchableOpacity
              onPress={handleDeletePress}
              className="bg-error items-center justify-center"
              style={{ width: DELETE_WIDTH }}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color={colors.white} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  )
}
