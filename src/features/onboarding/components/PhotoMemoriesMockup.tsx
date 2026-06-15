import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface PolaroidConfig {
  key: string
  source: ImageSourcePropType
  size: number
  rotate: number
  top: number
  left: number
}

interface PhotoMemoriesMockupProps {
  width: number
}

export function PhotoMemoriesMockup({ width }: PhotoMemoriesMockupProps) {
  const stageSize = Math.min(width, 280)
  const baseSize = stageSize * 0.42

  const photos: PolaroidConfig[] = [
    {
      key: 'a',
      source: require('../../../../assets/images/onboarding-photo-1.png'),
      size: baseSize,
      rotate: -8,
      top: 0,
      left: stageSize * 0.04,
    },
    {
      key: 'b',
      source: require('../../../../assets/images/onboarding-photo-2.png'),
      size: baseSize * 1.05,
      rotate: 6,
      top: stageSize * 0.08,
      left: stageSize * 0.46,
    },
    {
      key: 'c',
      source: require('../../../../assets/images/onboarding-photo-3.png'),
      size: baseSize * 0.95,
      rotate: 10,
      top: stageSize * 0.5,
      left: 0,
    },
    {
      key: 'd',
      source: require('../../../../assets/images/onboarding-photo-4.png'),
      size: baseSize,
      rotate: -5,
      top: stageSize * 0.46,
      left: stageSize * 0.5,
    },
  ]

  return (
    <View style={[styles.stage, { width: stageSize, height: stageSize }]}>
      {photos.map((photo) => (
        <View
          key={photo.key}
          style={[
            styles.polaroid,
            {
              width: photo.size,
              top: photo.top,
              left: photo.left,
              transform: [{ rotate: `${photo.rotate}deg` }],
            },
          ]}
        >
          <Image
            source={photo.source}
            style={[styles.photo, { width: photo.size - 16, height: photo.size - 16 }]}
            resizeMode="cover"
          />
        </View>
      ))}

      <View style={styles.peopleBadge}>
        <Ionicons name="people" size={26} color="#ffffff" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  stage: {
    position: 'relative',
  },
  polaroid: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    padding: 8,
    paddingBottom: 22,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  photo: {
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  peopleBadge: {
    position: 'absolute',
    bottom: -16,
    right: -8,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
})
