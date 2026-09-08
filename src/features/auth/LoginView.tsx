import { useState } from 'react'
import type { FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { useAuth } from './AuthContext'
import './auth.css'

export function LoginView() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(username, password)
    } catch {
      setError('Invalid username or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <span className="section-index">RESTRICTED / CORPUS</span>
        <h1>Collector sign-in</h1>
        <p className="auth-hint">Provisioned collector accounts only. No public signup.</p>
        <label htmlFor="auth-username">Username</label>
        <input id="auth-username" name="username" autoComplete="username" required
          value={username} onChange={(event) => setUsername(event.target.value)} />
        <label htmlFor="auth-password">Password</label>
        <input id="auth-password" name="password" type="password" autoComplete="current-password"
          required value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'} <LogIn size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
