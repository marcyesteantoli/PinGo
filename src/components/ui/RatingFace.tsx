import Svg, { Circle, Path, Line } from 'react-native-svg'

type FaceLevel = 1 | 2 | 3 | 4 | 5

// 5-pointed star: outer r=42, inner r=17, center (50,50), tip at top
const STAR_PATH = 'M50,8 L60,36 L90,37 L66,55 L75,84 L50,67 L25,84 L34,55 L10,37 L40,36 Z'

interface Brow { x1: number; y1: number; x2: number; y2: number }

// viewBox 0 0 100 100, face at cx=50 cy=50 r=43
// Brow convention: leftBrow goes left→right (outer→inner)
// Sad:    outer high (low Y), inner low (high Y)  → \ /  (V shape)
// Happy:  outer low (high Y), inner high (low Y)  → / \  (arch)
const FACES: Record<1 | 2 | 3 | 4, {
  leftBrow: Brow
  rightBrow: Brow
  mouth: string
  happyEyes?: boolean
}> = {
  1: {
    leftBrow:  { x1: 28, y1: 28, x2: 44, y2: 38 },
    rightBrow: { x1: 56, y1: 38, x2: 72, y2: 28 },
    mouth: 'M32,68 Q50,54 68,68',
  },
  2: {
    leftBrow:  { x1: 29, y1: 30, x2: 44, y2: 36 },
    rightBrow: { x1: 56, y1: 36, x2: 71, y2: 30 },
    mouth: 'M34,65 Q50,58 66,65',
  },
  3: {
    leftBrow:  { x1: 29, y1: 33, x2: 44, y2: 33 },
    rightBrow: { x1: 56, y1: 33, x2: 71, y2: 33 },
    mouth: 'M34,62 L66,62',
  },
  4: {
    leftBrow:  { x1: 28, y1: 36, x2: 44, y2: 30 },
    rightBrow: { x1: 56, y1: 30, x2: 72, y2: 36 },
    mouth: 'M32,60 Q50,73 68,60',
    happyEyes: true,
  },
}

interface RatingFaceProps {
  level: FaceLevel
  size: number
  color: string
}

export function RatingFace({ level, size, color }: RatingFaceProps) {
  const sw = 5

  if (level === 5) {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path
          d={STAR_PATH}
          fill="#FBBF24"
          stroke="#D97706"
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </Svg>
    )
  }

  const expr = FACES[level]

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={43} fill={`${color}20`} stroke={color} strokeWidth={sw} />

      <Line {...expr.leftBrow}  stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line {...expr.rightBrow} stroke={color} strokeWidth={sw} strokeLinecap="round" />

      {expr.happyEyes ? (
        <>
          <Path d="M33,47 Q38,41 43,47" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
          <Path d="M57,47 Q62,41 67,47" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
          <Circle cx={32} cy={58} r={7} fill={`${color}28`} />
          <Circle cx={68} cy={58} r={7} fill={`${color}28`} />
        </>
      ) : (
        <>
          <Circle cx={38} cy={46} r={4} fill={color} />
          <Circle cx={62} cy={46} r={4} fill={color} />
        </>
      )}

      <Path d={expr.mouth} stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
    </Svg>
  )
}
