import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { ErrorToast } from '@components/ui/ErrorToast'

interface ErrorToastState {
  message: string
  visible: boolean
}

interface ErrorToastContextValue {
  showError: (message: string) => void
  state: ErrorToastState
}

const ErrorToastContext = createContext<ErrorToastContextValue | null>(null)

export function ErrorToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ErrorToastState>({ message: '', visible: false })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showError = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setState({ message, visible: true })
    timerRef.current = setTimeout(() => setState(prev => ({ ...prev, visible: false })), 4000)
  }, [])

  return (
    <ErrorToastContext.Provider value={{ showError, state }}>
      {children}
    </ErrorToastContext.Provider>
  )
}

export function ErrorToastPortal() {
  const ctx = useContext(ErrorToastContext)
  if (!ctx) return null
  return <ErrorToast visible={ctx.state.visible} message={ctx.state.message} />
}

export function useErrorToast() {
  const ctx = useContext(ErrorToastContext)
  if (!ctx) throw new Error('useErrorToast must be used within ErrorToastProvider')
  return ctx.showError
}
