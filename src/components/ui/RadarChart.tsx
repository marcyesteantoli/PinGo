import React from 'react'
import { View } from 'react-native'
import Svg, { G, Line, Polygon, Text as SvgText } from 'react-native-svg'
import { colors } from '@lib/colors'

interface RadarChartProps {
  attributes: string[]
  userValues: Record<string, number>
  groupAvg: Record<string, number>
  size?: number
  isDark?: boolean
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

function buildRingPoints(
  n: number,
  fraction: number,
  radius: number,
  cx: number,
  cy: number,
): string {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    const { x, y } = polarToCartesian(cx, cy, radius * fraction, angle)
    return `${x},${y}`
  }).join(' ')
}

export function RadarChart({
  attributes,
  userValues,
  groupAvg,
  size = 180,
  isDark = false,
}: RadarChartProps) {
  if (attributes.length < 3) return null

  const padding = 44
  const svgSize = size + padding * 2
  const cx = svgSize / 2
  const cy = svgSize / 2
  const radius = size / 2

  const gridColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const axisColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const labelColor = isDark ? colors.neutral[400] : colors.neutral[500]
  const userLabelColor = colors.secondary[400]

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

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={svgSize} height={svgSize}>
        {/* Concentric grid rings */}
        {[0.33, 0.66, 1.0].map((fraction, idx) => (
          <Polygon
            key={idx}
            points={buildRingPoints(attributes.length, fraction, radius, cx, cy)}
            fill="none"
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines center → vertex */}
        {vertexAngles.map((angle, i) => {
          const { x, y } = polarToCartesian(cx, cy, radius, angle)
          return (
            <Line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={axisColor}
              strokeWidth={1}
            />
          )
        })}

        {/* Group average polygon */}
        {groupPoints && (
          <Polygon
            points={groupPoints}
            fill={`${colors.primary[500]}30`}
            stroke={colors.primary[400]}
            strokeWidth={1.5}
          />
        )}

        {/* User values polygon */}
        {userPoints && (
          <Polygon
            points={userPoints}
            fill={`${colors.secondary[500]}20`}
            stroke={colors.secondary[400]}
            strokeWidth={2}
            strokeDasharray="5,3"
          />
        )}

        {/* Vertex labels */}
        {attributes.map((attr, i) => {
          const angle = vertexAngles[i]
          const labelR = radius + 16
          const lx = cx + labelR * Math.cos(angle)
          const ly = cy + labelR * Math.sin(angle)

          const cosA = Math.cos(angle)
          const textAnchor =
            cosA > 0.3 ? 'start' : cosA < -0.3 ? 'end' : 'middle'

          const userVal = userValues[attr]
          const groupVal = groupAvg[attr]

          return (
            <G key={i}>
              <SvgText
                x={lx}
                y={ly - (userVal !== undefined || groupVal !== undefined ? 6 : 0)}
                textAnchor={textAnchor}
                fontSize={10}
                fontWeight="600"
                fill={labelColor}
              >
                {attr}
              </SvgText>
              {userVal !== undefined && (
                <SvgText
                  x={lx}
                  y={ly + 8}
                  textAnchor={textAnchor}
                  fontSize={10}
                  fontWeight="700"
                  fill={userLabelColor}
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
