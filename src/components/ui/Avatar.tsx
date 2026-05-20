import { useState } from 'react'
import { Image, Text, View } from 'react-native'

type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarProps {
  uri?: string | null
  name: string
  size?: AvatarSize
}

const sizeConfig: Record<AvatarSize, { dim: number; fontSize: number }> = {
  sm: { dim: 32, fontSize: 11 },
  md: { dim: 40, fontSize: 13 },
  lg: { dim: 56, fontSize: 16 },
}

const AVATAR_PALETTE = [
  { bg: '#e0e0ff', text: '#131e8c' }, // primary
  { bg: '#ffe4e6', text: '#be123c' }, // secondary
  { bg: '#ffefc7', text: '#c04010' }, // tertiary
  { bg: '#dcfce7', text: '#15803d' }, // success
  { bg: '#fef3c7', text: '#b45309' }, // warning
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const { dim, fontSize } = sizeConfig[size]
  const showFallback = !uri || imgError
  const color = getAvatarColor(name)

  return (
    <View
      style={{ width: dim, height: dim, borderRadius: dim / 2, backgroundColor: color.bg }}
      className="items-center justify-center overflow-hidden"
    >
      {showFallback ? (
        <Text style={{ fontSize, fontWeight: '600', color: color.text }}>{getInitials(name)}</Text>
      ) : (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim }}
          onError={() => setImgError(true)}
        />
      )}
    </View>
  )
}
