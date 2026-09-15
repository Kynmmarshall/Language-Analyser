import { useEffect } from 'react'
import { LogIn, LogOut, Moon, Quote, Sun } from 'lucide-react'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'motion/react'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import { LoginView } from './features/auth/LoginView'
import { SignupView } from './features/auth/SignupView'
import { FrancanglaisWorkspace } from './features/analyzer/FrancanglaisWorkspace'
import { CorpusView } from './features/corpus/CorpusView'
import { GrammarView } from './features/grammar/GrammarView'
import { StatisticsView } from './features/statistics/StatisticsView'
import { ExportView } from './features/export/ExportView'
import { NavLink, RouterProvider, useRouter } from './domain/router'
import { ThemeProvider, useTheme } from './domain/theme'
import { pressable, springSmooth } from './motion/presets'

const NAV_ITEMS = [
  { to: '/', label: 'Analyzer' },
  { to: '/corpus', label: 'Corpus' },
  { to: '/grammar', label: 'Grammar' },
  { to: '/statistics', label: 'Statistics' },
  { to: '/export', label: 'Export' },
] as const

function ThemeToggle() {
  const { mode, toggle } = useTheme()
  const isDark = mode === 'dark'
  return (
    <m.button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      data-testid="theme-toggle"
      className="relative grid size-9 place-items-center rounded-full border border-hairline bg-surface text-muted transition-colors hover:text-ink"
      {...pressable}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={mode}
          initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 70, scale: 0.6 }}
          transition={springSmooth}
          className="absolute grid place-items-center"
        >
          {isDark ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
        </m.span>
      </AnimatePresence>
    </m.button>
  )
}

function AuthStatus() {
  const { user, status, logout } = useAuth()
  const { path, navigate } = useRouter()

  if (status === 'checking') return null

  if (status !== 'signed-in' || !user) {
    if (path === '/login' || path === '/signup') return null
    return (
      <m.button
        type="button"
        onClick={() => navigate('/login')}
        data-testid="header-sign-in"
        className="flex h-9 items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 text-caption font-semibold text-muted transition-colors hover:border-strong hover:text-ink"
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0, transition: springSmooth }}
        {...pressable}
      >
        Sign in <LogIn size={13} aria-hidden="true" />
      </m.button>
    )
  }

  return (
    <m.span
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={springSmooth}
      className="flex items-center gap-2 text-caption"
    >
      <span className="font-mono text-faint">{user.username}</span>
      <m.button
        type="button"
        onClick={() => logout()}
        className="flex h-9 items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 text-caption font-semibold text-muted transition-colors hover:border-strong hover:text-ink"
        {...pressable}
      >
        Sign out <LogOut size={13} aria-hidden="true" />
      </m.button>
    </m.span>
  )
}

/** Standalone /login page: bounces to the corpus once a session exists. */
function LoginRoute() {
  const { status } = useAuth()
  const { path, navigate } = useRouter()
  const showSignup = path === '/signup'

  useEffect(() => {
    if (status === 'signed-in') navigate('/corpus')
  }, [status, navigate])

  if (status === 'checking') return <p className="text-small text-muted">Loading…</p>
  if (status === 'signed-in') return null
  return showSignup ? (
    <SignupView onShowLogin={() => navigate('/login')} />
  ) : (
    <LoginView onShowSignup={() => navigate('/signup')} />
  )
}

function ShellNav() {
  const { path } = useRouter()
  return (
    <nav
      aria-label="Primary"
      className="no-scrollbar -mx-1 flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-hairline bg-surface-sunken p-1"
    >
      {NAV_ITEMS.map((item) => {
        const active = path === item.to
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={() =>
              `relative shrink-0 rounded-full px-3.5 py-1.5 text-small font-semibold whitespace-nowrap no-underline transition-colors ${
                active ? 'text-ink' : 'text-muted hover:text-ink'
              }`
            }
          >
            {active && (
              <m.span
                layoutId="nav-active-pill"
                transition={springSmooth}
                className="absolute inset-0 rounded-full bg-surface shadow-e1 ring-1 ring-hairline"
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

function RouteOutlet() {
  const { path, navigate } = useRouter()
  const { status } = useAuth()

  if (path === '/login' || path === '/signup') return <LoginRoute />

  const gate = <LoginView onShowSignup={() => navigate('/signup')} />

  if (path === '/corpus') {
    if (status === 'checking') return <p>Loading…</p>
    if (status !== 'signed-in') return gate
    return <CorpusView />
  }
  if (path === '/statistics') {
    if (status === 'checking') return <p>Loading…</p>
    if (status !== 'signed-in') return gate
    return <StatisticsView />
  }
  if (path === '/export') {
    if (status === 'checking') return <p>Loading…</p>
    if (status !== 'signed-in') return gate
    return <ExportView />
  }
  if (path === '/grammar') return <GrammarView />
  return <FrancanglaisWorkspace />
}

function AppShell() {
  const { path } = useRouter()
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-[1320px] flex-col px-4 sm:px-6 lg:px-10">
      <a
        className="fixed top-0 left-4 z-50 -translate-y-full rounded-b-md bg-surface px-5 py-3 text-small font-semibold text-accent shadow-e2 transition-transform focus-visible:translate-y-0"
        href="#workspace"
      >
        Skip to workspace
      </a>

      <header className="sticky top-0 z-40 -mx-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-hairline bg-canvas/85 px-4 py-3.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <a
          className="group flex items-center gap-3 no-underline"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            window.history.pushState(null, '', '/')
            window.dispatchEvent(new PopStateEvent('popstate'))
          }}
          aria-label="Francanglais Studio home"
        >
          <m.span
            className="grid size-10 place-items-center rounded-lg bg-accent text-accent-contrast shadow-e1"
            whileHover={{ rotate: -6, scale: 1.05 }}
            transition={springSmooth}
          >
            <Quote size={20} aria-hidden="true" />
          </m.span>
          <span className="leading-tight">
            <span className="block text-small font-semibold tracking-wide text-ink">FRANCANGLAIS</span>
            <span className="block font-mono text-[10px] tracking-wider text-faint">STUDIO · CS4110</span>
          </span>
        </a>

        <div className="order-3 flex w-full items-center gap-2 sm:order-none sm:w-auto">
          <ShellNav />
          <div className="ml-auto flex items-center gap-2 sm:ml-2">
            <ThemeToggle />
            <AuthStatus />
          </div>
        </div>
      </header>

      <main id="workspace" tabIndex={-1} className="min-w-0 flex-1 py-8 sm:py-10 lg:py-12">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={path}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <RouteOutlet />
          </m.div>
        </AnimatePresence>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline py-6 text-caption text-faint">
        <span className="font-mono text-[10px] tracking-wider">COMPILER CONSTRUCTION / 2026</span>
        <span className="flex items-center gap-2">
          Cameroonian Francanglais
          <span className="inline-block size-1 rounded-full bg-highlight" />
          Single-variety study
        </span>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={springSmooth}>
        <ThemeProvider>
          <RouterProvider>
            <AuthProvider>
              <AppShell />
            </AuthProvider>
          </RouterProvider>
        </ThemeProvider>
      </MotionConfig>
    </LazyMotion>
  )
}
