import { Easing } from 'react-native-reanimated'

// iOS drawer curve — cubic-bezier(0.32, 0.72, 0, 1) — ease-out, for OPEN
export const EASE_DRAWER = Easing.bezier(0.32, 0.72, 0, 1)
// Ease-in for CLOSE — sheet accelerates away, feels natural
export const EASE_DRAWER_OUT = Easing.bezier(0.32, 0, 0.67, 0)
// Strong ease-out for UI interactions — cubic-bezier(0.23, 1, 0.32, 1)
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)
// Fast ease-out for dismiss/close — cubic-bezier(0.25, 0, 0.3, 1)
export const EASE_OUT_FAST = Easing.bezier(0.25, 0, 0.3, 1)

export const DURATION = {
  press: 120,
  micro: 160,
  fast: 200,
  normal: 280,
  sheet: 320,
  sheetClose: 240,
}
