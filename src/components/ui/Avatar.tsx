import { useState } from 'react'
import { Image, Text, View } from 'react-native'

type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarProps {
  uri?: string | null
  name: string
  size?: AvatarSize
}

const sizeConfig: Record<AvatarSize, { dim: number; textClass: string }> = {
  sm: { dim: 32, textClass: 'text-xs font-semibold' },
  md: { dim: 40, textClass: 'text-sm font-semibold' },
  lg: { dim: 56, textClass: 'text-base font-semibold' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const { dim, textClass } = sizeConfig[size]
  const showFallback = !uri || imgError

  return (
    <View
      style={{ width: dim, height: dim, borderRadius: dim / 2 }}
      className="bg-primary-100 items-center justify-center overflow-hidden"
    >
      {showFallback ? (
        <Text className={`${textClass} text-primary-700`}>{getInitials(name)}</Text>
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
