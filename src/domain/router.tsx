import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type RouterContextValue = Readonly<{ path: string; navigate: (path: string) => void }>

const RouterContext = createContext<RouterContextValue | null>(null)

function currentPath(): string {
  return window.location.pathname || '/'
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const onPopState = () => setPath(currentPath())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const value = useMemo<RouterContextValue>(
    () => ({
      path,
      navigate: (next: string) => {
        if (next !== window.location.pathname) {
          window.history.pushState(null, '', next)
          setPath(next)
        }
      },
    }),
    [path],
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext)
  if (!context) throw new Error('useRouter must be used within a RouterProvider')
  return context
}

export function NavLink({ to, children, className }: Readonly<{
  to: string
  children: ReactNode
  className?: (active: boolean) => string
}>) {
  const { path, navigate } = useRouter()
  const active = path === to
  return (
    <a
      href={to}
      aria-current={active ? 'page' : undefined}
      className={className ? className(active) : undefined}
      onClick={(event) => {
        event.preventDefault()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}
