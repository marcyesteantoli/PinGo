import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@lib/supabase'
import { i18n } from '@/i18n'

interface SessionContextValue {
  session: Session | null
  isLoading: boolean
}

const SessionContext = createContext<SessionContextValue>({ session: null, isLoading: true })

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setIsLoading(false)
      if (event === 'SIGNED_IN' && newSession) {
        supabase.from('profiles').update({ locale: i18n.language }).eq('id', newSession.user.id)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <SessionContext.Provider value={{ session, isLoading }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
