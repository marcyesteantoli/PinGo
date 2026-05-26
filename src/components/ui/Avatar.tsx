import { useState } from 'react'
import { useColorScheme } from 'nativewind'
import { Image, Text, View } from 'react-native'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'

interface AvatarProps {
  uri?: string | null
  name: string
  size?: AvatarSize
}

const sizeConfig: Record<AvatarSize, { dim: number; fontSize: number; letterSpacing: number }> = {
  xs: { dim: 22, fontSize: 8,  letterSpacing: -0.3 },
  sm: { dim: 32, fontSize: 12, letterSpacing: -0.3 },
  md: { dim: 40, fontSize: 14, letterSpacing: -0.3 },
  lg: { dim: 56, fontSize: 18, letterSpacing: -0.5 },
}

// Apple system color palette — tinted fills with chromatic text
const AVATAR_PALETTE = [
  { light: { bg: '#E1EDFF', text: '#007AFF' }, dark: { bg: '#001D40', text: '#0A84FF' } },
  { light: { bg: '#E5F7EC', text: '#28A745' }, dark: { bg: '#091F11', text: '#30D158' } },
  { light: { bg: '#F3EAFD', text: '#9B4DCA' }, dark: { bg: '#210D35', text: '#BF5AF2' } },
  { light: { bg: '#FFEEE8', text: '#E8380D' }, dark: { bg: '#3D0D04', text: '#FF453A' } },
  { light: { bg: '#FFF1DC', text: '#D97706' }, dark: { bg: '#2D1900', text: '#FF9F0A' } },
  { light: { bg: '#E0F5FD', text: '#0099CC' }, dark: { bg: '#022535', text: '#64D2FF' } },
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
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
  const { dim, fontSize, letterSpacing } = sizeConfig[size]
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
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
      }}
      className="items-center justify-center overflow-hidden"
    >
      {showFallback ? (
        <Text
          style={{
            fontSize,
            fontWeight: '600',
            color: color.text,
            letterSpacing,
            includeFontPadding: false,
          }}
        >
          {getInitials(name)}
        </Text>
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
