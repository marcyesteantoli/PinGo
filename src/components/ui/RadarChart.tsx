import React from 'react'
import { useWindowDimensions, View } from 'react-native'
import Svg, { Circle, Defs, G, Line, Polygon, RadialGradient, Stop, Text as SvgText } from 'react-native-svg'
import { colors } from '@lib/colors'

interface RadarChartProps {
  attributes: string[]
  userValues: Record<string, number>
  groupAvg: Record<string, number>
  size?: number
  isDark?: boolean
  showLabels?: boolean
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) }
}

function buildPolygonPoints(
  attributes: string[],
  values: Record<string, number>,
  radius: number,
  cx: number,
  cy: number,
): string {
  return attributes
    .map((attr, i) => {
      const angle = (2 * Math.PI * i) / attributes.length - Math.PI / 2
      const val = Math.max(1, Math.min(10, values[attr] ?? 1))
      const r = (val / 10) * radius
      const { x, y } = polarToCartesian(cx, cy, r, angle)
      return `${x},${y}`
    })
    .join(' ')
}

export function RadarChart({
  attributes,
  userValues,
  groupAvg,
  size: sizeProp,
  isDark = false,
  showLabels = true,
}: RadarChartProps) {
  const { width: screenW } = useWindowDimensions()

  const hPad = 76
  const vPad = 52
  const size = sizeProp ?? Math.min(screenW - 32 - hPad * 2, 220)

  if (attributes.length < 3) return null

  const svgW = size + hPad * 2
  const svgH = size + vPad * 2
  const cx = svgW / 2
  const cy = svgH / 2
  const radius = size / 2

  const ringStroke = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'
  const axisColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const labelColor = isDark ? colors.neutral[400] : colors.neutral[500]
  const primaryColor = colors.primary[500]
  const primaryFill = isDark ? `${colors.primary[500]}28` : `${colors.primary[500]}1A`
  const scoreColor = colors.primary[400]

  const vertexAngles = attributes.map(
    (_, i) => (2 * Math.PI * i) / attributes.length - Math.PI / 2,
  )

  const hasGroupData = attributes.some((a) => groupAvg[a] !== undefined)
  const hasUserData = attributes.some((a) => userValues[a] !== undefined)

  const groupPoints = hasGroupData
    ? buildPolygonPoints(attributes, groupAvg, radius, cx, cy)
    : null
  const userPoints = hasUserData
    ? buildPolygonPoints(attributes, userValues, radius, cx, cy)
    : null

  const userVertices = hasUserData
    ? attributes.map((attr, i) => {
        const angle = vertexAngles[i]
        const val = Math.max(1, Math.min(10, userValues[attr] ?? 1))
        const r = (val / 10) * radius
        return {
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
          hasVal: userValues[attr] !== undefined,
        }
      })
    : []

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={svgW} height={svgH}>
        <Defs>
          <RadialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.10" />
            <Stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Subtle radial background glow */}
        <Circle cx={cx} cy={cy} r={radius} fill="url(#bgGlow)" />

        {/* Circular grid rings */}
        {[0.25, 0.5, 0.75, 1.0].map((frac, i) => (
          <Circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius * frac}
            fill="none"
            stroke={ringStroke}
            strokeWidth={i === 3 ? 1.5 : 0.75}
          />
        ))}

        {/* Axis lines center → vertex */}
        {vertexAngles.map((angle, i) => {
          const { x, y } = polarToCartesian(cx, cy, radius, angle)
          return (
            <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={axisColor} strokeWidth={1} />
          )
        })}

        {/* Group average polygon */}
        {groupPoints && (
          <Polygon
            points={groupPoints}
            fill={`${colors.neutral[500]}15`}
            stroke={colors.neutral[400]}
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        )}

        {/* User values polygon */}
        {userPoints && (
          <Polygon
            points={userPoints}
            fill={primaryFill}
            stroke={primaryColor}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}

        {/* Vertex dots */}
        {userVertices.map((v, i) =>
          v.hasVal ? (
            <Circle key={i} cx={v.x} cy={v.y} r={4.5} fill={primaryColor} />
          ) : null,
        )}

        {/* Center dot */}
        <Circle
          cx={cx}
          cy={cy}
          r={3}
          fill={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)'}
        />

        {/* Vertex labels */}
        {showLabels &&
          attributes.map((attr, i) => {
            const angle = vertexAngles[i]
            const labelR = radius + 20
            const lx = cx + labelR * Math.cos(angle)
            const ly = cy + labelR * Math.sin(angle)
            const cosA = Math.cos(angle)
            const textAnchor = cosA > 0.3 ? 'start' : cosA < -0.3 ? 'end' : 'middle'
            const userVal = userValues[attr]

            return (
              <G key={i}>
                <SvgText
                  x={lx}
                  y={ly - (userVal !== undefined ? 6 : 0)}
                  textAnchor={textAnchor}
                  fontSize={10}
                  fontWeight="500"
                  fill={labelColor}
                >
                  {attr}
                </SvgText>
                {userVal !== undefined && (
                  <SvgText
                    x={lx}
                    y={ly + 8}
                    textAnchor={textAnchor}
                    fontSize={11}
                    fontWeight="700"
                    fill={scoreColor}
                  >
                    {userVal}
                  </SvgText>
                )}
              </G>
            )
          })}
      </Svg>
    </View>
  )
}
