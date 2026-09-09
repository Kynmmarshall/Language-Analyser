import { ArrowUpRight, LogOut, Quote } from 'lucide-react'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import { LoginView } from './features/auth/LoginView'
import { FrancanglaisWorkspace } from './features/analyzer/FrancanglaisWorkspace'
import { CorpusView } from './features/corpus/CorpusView'
import { GrammarView } from './features/grammar/GrammarView'
import { NavLink, RouterProvider, useRouter } from './domain/router'
import './features/analyzer/workspace.css'

function navClass(active: boolean) {
  return `nav-link${active ? ' nav-link-active' : ''}`
}

function AuthStatus() {
  const { user, status, logout } = useAuth()
  if (status !== 'signed-in' || !user) return null
  return (
    <span className="auth-status">
      {user.username}
      <button className="text-button auth-signout" type="button" onClick={() => logout()}>
        Sign out <LogOut size={14} aria-hidden="true" />
      </button>
    </span>
  )
}

function RouteOutlet() {
  const { path } = useRouter()
  const { status } = useAuth()

  if (path === '/corpus') {
    if (status === 'checking') return <p>Loading…</p>
    if (status !== 'signed-in') return <LoginView />
    return <CorpusView />
  }
  if (path === '/grammar') return <GrammarView />
  return <FrancanglaisWorkspace />
}

function AppShell() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">Skip to workspace</a>
      <header className="app-header">
        <a className="brand" href="/" onClick={(event) => {
          event.preventDefault()
          window.history.pushState(null, '', '/')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }} aria-label="Francanglais Studio home">
          <span className="brand-mark"><Quote size={22} aria-hidden="true" /></span>
          <span>FRANCANGLAIS<span className="brand-subtitle">STUDIO / CS4110</span></span>
        </a>
        <nav className="app-nav" aria-label="Primary">
          <NavLink to="/" className={navClass}>Analyzer</NavLink>
          <NavLink to="/corpus" className={navClass}>Corpus</NavLink>
          <NavLink to="/grammar" className={navClass}>Grammar</NavLink>
          <span className="workspace-marker">Workspace <ArrowUpRight size={16} aria-hidden="true" /></span>
          <AuthStatus />
        </nav>
      </header>
      <main id="workspace" tabIndex={-1}>
        <RouteOutlet />
      </main>
      <footer className="app-footer"><span>COMPILER CONSTRUCTION / 2026</span>
        <span>Cameroonian Francanglais <span className="footer-dot" /> Single-variety study</span>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </RouterProvider>
  )
}
