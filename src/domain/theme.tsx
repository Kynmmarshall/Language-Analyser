import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'francanglais-theme'

type ThemeContextValue = Readonly<{
  mode: ThemeMode
  toggle: () => void
  setMode: (mode: ThemeMode) => void
}>

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialMode(): ThemeMode {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  }, [mode])

  // Follow the OS only while the user has expressed no explicit preference.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => {
      if (!window.localStorage.getItem(THEME_STORAGE_KEY)) {
        setModeState(event.matches ? 'dark' : 'light')
      }
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const setMode = useCallback((next: ThemeMode) => setModeState(next), [])
  const toggle = useCallback(() => setModeState((current) => (current === 'dark' ? 'light' : 'dark')), [])

  const value = useMemo<ThemeContextValue>(() => ({ mode, toggle, setMode }), [mode, toggle, setMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
