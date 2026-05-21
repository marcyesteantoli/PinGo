import { useState } from 'react'
import { useColorScheme } from 'nativewind'
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
  { light: { bg: '#bfdbfe', text: '#1e40af' }, dark: { bg: '#1e3a6e', text: '#93c5fd' } },
  { light: { bg: '#fecdd3', text: '#9f1239' }, dark: { bg: '#6b1a2f', text: '#fca5a5' } },
  { light: { bg: '#bbf7d0', text: '#166534' }, dark: { bg: '#14532d', text: '#86efac' } },
  { light: { bg: '#ddd6fe', text: '#5b21b6' }, dark: { bg: '#4c1d95', text: '#c4b5fd' } },
  { light: { bg: '#fca5a5', text: '#991b1b' }, dark: { bg: '#7f1d1d', text: '#fca5a5' } },
  { light: { bg: '#bae6fd', text: '#075985' }, dark: { bg: '#0c4a6e', text: '#7dd3fc' } },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getAvatarColor(name: string): typeof AVATAR_PALETTE[0] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const { colorScheme } = useColorScheme()
  const { dim, fontSize } = sizeConfig[size]
  const showFallback = !uri || imgError
  const palette = getAvatarColor(name)
  const color = colorScheme === 'dark' ? palette.dark : palette.light

  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: color.bg,
        borderWidth: 1.5,
        borderColor: color.text + '55',
      }}
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
