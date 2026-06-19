import React from 'react'
import { render } from '@testing-library/react-native'
import { RadarChart } from '../RadarChart'

// The test renderer treats unrecognised host elements like View nodes — they
// cannot contain raw text strings. We make SvgText render its children inside
// a real RN <Text> so the reconciler accepts string children and RTL queries
// (getByText / queryByText) can find them.
jest.mock('react-native-svg', () => {
  const React = require('react')
  const { Text: RNText, View } = require('react-native')

  const Passthrough = ({ children, ...rest }: any) =>
    React.createElement(View, rest, children)
  const SvgTextMock = ({ children, ...rest }: any) =>
    React.createElement(RNText, rest, children)

  return {
    __esModule: true,
    default: Passthrough,
    Svg: Passthrough,
    Circle: Passthrough,
    Polygon: Passthrough,
    Line: Passthrough,
    // Named export used in the source as `Text as SvgText`
    Text: SvgTextMock,
    G: Passthrough,
    Defs: Passthrough,
    RadialGradient: Passthrough,
    Stop: Passthrough,
  }
})

jest.mock('@lib/colors', () => ({
  colors: {
    primary: { 400: '#60a5fa', 500: '#3b82f6' },
    neutral: { 400: '#9ca3af', 500: '#6b7280' },
  },
}))

const THREE_ATTRS = ['Dificultad', 'Vistas', 'Diversión']
const USER_VALUES = { Dificultad: 7, Vistas: 9, Diversión: 8 }
const GROUP_AVG = { Dificultad: 5, Vistas: 6, Diversión: 7 }

beforeEach(() => jest.clearAllMocks())

describe('RadarChart', () => {
  describe('renderizado básico', () => {
    it('renders without crashing with 3 valid attributes', async () => {
      await expect(
        render(<RadarChart attributes={THREE_ATTRS} userValues={USER_VALUES} groupAvg={GROUP_AVG} />)
      ).resolves.toBeDefined()
    })

    it('renders without crashing with exactly 3 attributes (algorithm minimum)', async () => {
      const attrs = ['A', 'B', 'C']
      const vals = { A: 5, B: 5, C: 5 }
      await expect(
        render(<RadarChart attributes={attrs} userValues={vals} groupAvg={vals} />)
      ).resolves.toBeDefined()
    })

    it('renders without crashing with more than 3 attributes', async () => {
      const attrs = ['A', 'B', 'C', 'D', 'E']
      const vals = { A: 1, B: 2, C: 3, D: 4, E: 5 }
      await expect(
        render(<RadarChart attributes={attrs} userValues={vals} groupAvg={{}} />)
      ).resolves.toBeDefined()
    })
  })

  describe('lógica de renderizado condicional — retorno null', () => {
    it('returns null (renders nothing) when given an empty array', async () => {
      const { toJSON } = await render(
        <RadarChart attributes={[]} userValues={{}} groupAvg={{}} />
      )
      expect(toJSON()).toBeNull()
    })

    it('returns null when given only 1 attribute', async () => {
      const { toJSON } = await render(
        <RadarChart attributes={['Solo']} userValues={{ Solo: 5 }} groupAvg={{}} />
      )
      expect(toJSON()).toBeNull()
    })

    it('returns null when given exactly 2 attributes', async () => {
      const { toJSON } = await render(
        <RadarChart attributes={['A', 'B']} userValues={{ A: 5, B: 5 }} groupAvg={{}} />
      )
      expect(toJSON()).toBeNull()
    })
  })

  describe('labels de atributos', () => {
    it('shows all attribute labels when showLabels is true (default)', async () => {
      const { getByText } = await render(
        <RadarChart attributes={THREE_ATTRS} userValues={USER_VALUES} groupAvg={GROUP_AVG} />
      )
      expect(getByText('Dificultad')).toBeTruthy()
      expect(getByText('Vistas')).toBeTruthy()
      expect(getByText('Diversión')).toBeTruthy()
    })

    it('shows user score values next to labels when userValues are provided', async () => {
      const { getByText } = await render(
        <RadarChart attributes={THREE_ATTRS} userValues={USER_VALUES} groupAvg={GROUP_AVG} />
      )
      // Each score renders as a SvgText child — values 7, 9, 8
      expect(getByText('7')).toBeTruthy()
      expect(getByText('9')).toBeTruthy()
      expect(getByText('8')).toBeTruthy()
    })

    it('does not show labels when showLabels is false', async () => {
      const { queryByText } = await render(
        <RadarChart
          attributes={THREE_ATTRS}
          userValues={USER_VALUES}
          groupAvg={GROUP_AVG}
          showLabels={false}
        />
      )
      expect(queryByText('Dificultad')).toBeNull()
      expect(queryByText('Vistas')).toBeNull()
    })
  })

  describe('datos de usuario vs grupo', () => {
    it('renders without crashing when userValues is empty (no user polygon)', async () => {
      await expect(
        render(<RadarChart attributes={THREE_ATTRS} userValues={{}} groupAvg={GROUP_AVG} />)
      ).resolves.toBeDefined()
    })

    it('renders without crashing when groupAvg is empty (no group polygon)', async () => {
      await expect(
        render(<RadarChart attributes={THREE_ATTRS} userValues={USER_VALUES} groupAvg={{}} />)
      ).resolves.toBeDefined()
    })

    it('renders without crashing when both userValues and groupAvg are empty', async () => {
      await expect(
        render(<RadarChart attributes={THREE_ATTRS} userValues={{}} groupAvg={{}} />)
      ).resolves.toBeDefined()
    })

    it('does not show score values when userValues has no matching keys', async () => {
      // userValues keys don't match attributes — no score texts rendered
      const { queryByText } = await render(
        <RadarChart
          attributes={THREE_ATTRS}
          userValues={{ OtherKey: 9 }}
          groupAvg={{}}
        />
      )
      expect(queryByText('9')).toBeNull()
    })
  })

  describe('prop size', () => {
    it('accepts a custom size prop without crashing', async () => {
      await expect(
        render(
          <RadarChart
            attributes={THREE_ATTRS}
            userValues={USER_VALUES}
            groupAvg={GROUP_AVG}
            size={200}
          />
        )
      ).resolves.toBeDefined()
    })
  })

  describe('prop isDark', () => {
    it('renders in dark mode without crashing', async () => {
      await expect(
        render(
          <RadarChart
            attributes={THREE_ATTRS}
            userValues={USER_VALUES}
            groupAvg={GROUP_AVG}
            isDark
          />
        )
      ).resolves.toBeDefined()
    })
  })
})
