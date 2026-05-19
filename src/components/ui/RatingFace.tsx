import { Image } from 'react-native'

type FaceLevel = 1 | 2 | 3 | 4 | 5

const ICONS: Record<FaceLevel, ReturnType<typeof require>> = {
  1: require('../../../assets/images/ratingIcons/1.png'),
  2: require('../../../assets/images/ratingIcons/2.png'),
  3: require('../../../assets/images/ratingIcons/3.png'),
  4: require('../../../assets/images/ratingIcons/4.png'),
  5: require('../../../assets/images/ratingIcons/5.png'),
}

interface RatingFaceProps {
  level: FaceLevel
  size: number
}

export function RatingFace({ level, size }: RatingFaceProps) {
  return (
    <Image
      source={ICONS[level]}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  )
}
