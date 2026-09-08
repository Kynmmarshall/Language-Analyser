import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnalysisApiError, fetchCurrentUser, login as loginRequest, logout as logoutRequest } from '../../domain/api'
import type { UserPublic } from '../../domain/api'

type AuthContextValue = Readonly<{
  user: UserPublic | null
  status: 'checking' | 'signed-out' | 'signed-in'
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}>

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [status, setStatus] = useState<'checking' | 'signed-out' | 'signed-in'>('checking')

  useEffect(() => {
    let cancelled = false
    fetchCurrentUser()
      .then((current) => {
        if (!cancelled) {
          setUser(current)
          setStatus('signed-in')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('signed-out')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const current = await loginRequest(username, password)
    setUser(current)
    setStatus('signed-in')
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch (error) {
      if (!(error instanceof AnalysisApiError) || error.status !== 401) throw error
    }
    setUser(null)
    setStatus('signed-out')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
