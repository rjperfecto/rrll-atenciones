import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import type { Profile } from '@/types'

const DEMO_PROFILE_KEY = 'rrll-demo-profile'

interface AuthState {
  profile: Profile | null
  loading: boolean
  isDemo: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signInDemo: (nombre: string) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    const demoRaw = localStorage.getItem(DEMO_PROFILE_KEY)
    if (demoRaw) {
      setProfile(JSON.parse(demoRaw) as Profile)
      setIsDemo(true)
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (user) {
        void loadProfile(user.id, user.email ?? '')
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (user) {
        void loadProfile(user.id, user.email ?? '')
      } else {
        setProfile(null)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string, email: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      setProfile(data as Profile)
    } else {
      setProfile({ id: userId, email, nombre_completo: email, rol: 'CAMPO' })
    }
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  function signInDemo(nombre: string) {
    const demoProfile: Profile = {
      id: 'demo-user',
      email: 'demo@rrll.local',
      nombre_completo: nombre || 'Usuario demo',
      rol: 'ADMIN',
    }
    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(demoProfile))
    setProfile(demoProfile)
    setIsDemo(true)
  }

  async function signOut() {
    localStorage.removeItem(DEMO_PROFILE_KEY)
    setIsDemo(false)
    setProfile(null)
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
  }

  return (
    <AuthContext.Provider value={{ profile, loading, isDemo, signIn, signInDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
