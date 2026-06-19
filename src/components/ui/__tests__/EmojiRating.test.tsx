import React from 'react'
import { render } from '@testing-library/react-native'

// Self-contained reanimated mock — does NOT require react-native-reanimated/mock
// (which pulls in react-native-worklets and breaks in jest).
jest.mock('react-native-reanimated', () => {
  const { View: RNView, Text: RNText, Image: RNImage, ScrollView: RNScrollView } = require('react-native')
  const mockAnimated = {
    View: RNView,
    Text: RNText,
    Image: RNImage,
    ScrollView: RNScrollView,
    createAnimatedComponent: (C: any) => C,
  }
  return {
    __esModule: true,
    default: mockAnimated,
    ...mockAnimated,
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: (fn: () => any) => { try { return fn() } catch { return {} } },
    useDerivedValue: (fn: () => any) => { try { return { value: fn() } } catch { return { value: 0 } } },
    withSpring: (v: any) => v,
    withTiming: (v: any) => v,
    withDelay: (_d: any, v: any) => v,
    withSequence: (...args: any[]) => args[args.length - 1],
    withRepeat: (v: any) => v,
    runOnJS: (fn: any) => fn,
    runOnUI: (fn: any) => fn,
    interpolateColor: (_v: any, _range: any, colors: string[]) => colors[0],
    interpolate: (v: any) => v,
    Easing: { bezier: () => 0, linear: 0, ease: 0, out: () => 0, in: () => 0 },
    cancelAnimation: jest.fn(),
    makeMutable: (v: any) => ({ value: v }),
  }
})

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light' },
}))

jest.mock('react-native-gesture-handler', () => {
  return {
    Gesture: {
      Pan: () => ({
        activeOffsetX: function () { return this },
        failOffsetY: function () { return this },
        onUpdate: function () { return this },
        onEnd: function () { return this },
      }),
    },
    GestureDetector: ({ children }: any) => children,
  }
})

// RatingFace renders an Image with a require() — mock to a simple View with testID
jest.mock('../RatingFace', () => {
  const mockReact = require('react')
  const { View: RNView } = require('react-native')
  return {
    RatingFace: ({ level, size }: { level: number; size: number }) =>
      mockReact.createElement(RNView, {
        testID: `rating-face-level-${level}`,
        style: { width: size, height: size },
      }),
  }
})

import { EmojiRating } from '../EmojiRating'

beforeEach(() => jest.clearAllMocks())

// ─── getLevel logic ────────────────────────────────────────────────────────
// value 1-2 → level 1, 3-4 → level 2, 5-6 → level 3, 7-8 → level 4, 9-10 → level 5

describe('getLevel mapping (via render)', () => {
  const cases: [number, number][] = [
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 2],
    [5, 3],
    [6, 3],
    [7, 4],
    [8, 4],
    [9, 5],
    [10, 5],
  ]

  it.each(cases)('value=%i renders level %i face', async (value, expectedLevel) => {
    const { getByTestId } = await render(<EmojiRating value={value} size="sm" />)
    expect(getByTestId(`rating-face-level-${expectedLevel}`)).toBeTruthy()
  })
})

// ─── size='sm' display ─────────────────────────────────────────────────────

describe("EmojiRating size='sm'", () => {
  it('renders null (returns nothing) when value is null', async () => {
    const { toJSON } = await render(<EmojiRating value={null} size="sm" />)
    expect(toJSON()).toBeNull()
  })

  it('shows "7/10" when value=7', async () => {
    const { getByText } = await render(<EmojiRating value={7} size="sm" />)
    expect(getByText('7/10')).toBeTruthy()
  })

  it('shows "1/10" when value=1', async () => {
    const { getByText } = await render(<EmojiRating value={1} size="sm" />)
    expect(getByText('1/10')).toBeTruthy()
  })

  it('shows "10/10" when value=10', async () => {
    const { getByText } = await render(<EmojiRating value={10} size="sm" />)
    expect(getByText('10/10')).toBeTruthy()
  })

  it('shows the correct emoji face for value=7 (level 4)', async () => {
    const { getByTestId } = await render(<EmojiRating value={7} size="sm" />)
    expect(getByTestId('rating-face-level-4')).toBeTruthy()
  })

  it('shows the correct emoji face for value=3 (level 2)', async () => {
    const { getByTestId } = await render(<EmojiRating value={3} size="sm" />)
    expect(getByTestId('rating-face-level-2')).toBeTruthy()
  })

  it('shows the correct emoji face for value=10 (level 5)', async () => {
    const { getByTestId } = await render(<EmojiRating value={10} size="sm" />)
    expect(getByTestId('rating-face-level-5')).toBeTruthy()
  })

  it('formats decimal values with one decimal place (e.g. 7.5 → "7.5/10")', async () => {
    const { getByText } = await render(<EmojiRating value={7.5} size="sm" />)
    expect(getByText('7.5/10')).toBeTruthy()
  })
})

// ─── size='lg' display ─────────────────────────────────────────────────────

describe("EmojiRating size='lg'", () => {
  it('renders null when value is null', async () => {
    const { toJSON } = await render(<EmojiRating value={null} size="lg" />)
    expect(toJSON()).toBeNull()
  })

  it('shows "5/10" when value=5', async () => {
    const { getByText } = await render(<EmojiRating value={5} size="lg" />)
    expect(getByText('5/10')).toBeTruthy()
  })

  it('shows "9/10" when value=9', async () => {
    const { getByText } = await render(<EmojiRating value={9} size="lg" />)
    expect(getByText('9/10')).toBeTruthy()
  })

  it('shows the correct emoji face for value=5 (level 3)', async () => {
    const { getByTestId } = await render(<EmojiRating value={5} size="lg" />)
    expect(getByTestId('rating-face-level-3')).toBeTruthy()
  })
})

// ─── size='md' (default slider mode) ──────────────────────────────────────

describe("EmojiRating size='md' (default slider)", () => {
  it('renders without crashing with value=null', async () => {
    await expect(render(<EmojiRating value={null} />)).resolves.toBeDefined()
  })

  it('renders without crashing with value=5', async () => {
    await expect(render(<EmojiRating value={5} />)).resolves.toBeDefined()
  })

  it('renders without crashing with value=undefined', async () => {
    await expect(render(<EmojiRating value={undefined as any} />)).resolves.toBeDefined()
  })
})

// ─── Edge cases ────────────────────────────────────────────────────────────

describe('EmojiRating edge cases', () => {
  it('value=0 is falsy — component returns null (treated as no rating)', async () => {
    // The source checks `if (!value) return null`, so 0 is treated as no rating
    const { toJSON } = await render(<EmojiRating value={0} size="sm" />)
    expect(toJSON()).toBeNull()
  })

  it('clamps value > 10 to 10 — renders level 5 face', async () => {
    // value=15 → Math.min(10, ...) = 10 → getLevel(10) = 5
    const { getByTestId } = await render(<EmojiRating value={15} size="sm" />)
    expect(getByTestId('rating-face-level-5')).toBeTruthy()
  })
})
