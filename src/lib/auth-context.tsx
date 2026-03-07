import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { setApiUserId } from '@/lib/api'

type AuthContextValue = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: false })

/**
 * Синхронно читает пользователя из localStorage (Supabase JS v2 хранит сессию там).
 * Позволяет избежать блокирующего спиннера при первом рендере — getSession() проверит
 * токен в фоне и обновит состояние при необходимости.
 */
function getInitialUser(): User | null {
  try {
    const projectRef = 'tzwvyfvskwgeggwjpass'
    const raw = localStorage.getItem(`sb-${projectRef}-auth-token`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { user?: User; expires_at?: number } | null
    // Если токен уже истёк — не используем кешированного пользователя
    if (parsed?.expires_at && parsed.expires_at * 1000 < Date.now()) return null
    return parsed?.user ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Инициализируем из localStorage синхронно — нет блокирующей «Загрузки…»
  const [user, setUser] = useState<User | null>(getInitialUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Фоновая проверка/обновление сессии (в т.ч. refresh токена если нужен)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      setApiUserId(u?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setApiUserId(u?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo(() => ({ user, loading }), [user, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
