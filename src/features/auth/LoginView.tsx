import { useState } from 'react'
import type { FormEvent } from 'react'
import { LogIn, ShieldCheck } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useAuth } from './AuthContext'
import { fadeInUp, pressable, springSmooth, staggerContainer } from '../../motion/presets'

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

  const fieldClass =
    'h-11 w-full rounded-control border border-hairline bg-surface-inset px-3.5 text-body text-ink transition-colors placeholder:text-faint hover:border-strong focus:border-accent focus:outline-none'

  return (
    <div className="grid min-h-[62svh] place-items-center py-6">
      <m.form
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        onSubmit={onSubmit}
        className="panel w-full max-w-[26rem] p-8 shadow-e2"
      >
        <m.span
          variants={fadeInUp}
          className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-accent"
        >
          <ShieldCheck size={13} aria-hidden="true" /> RESTRICTED · CORPUS
        </m.span>

        <m.h1 variants={fadeInUp} className="mt-3 text-h1 text-ink">
          Collector sign-in
        </m.h1>

        <m.p variants={fadeInUp} className="mt-2 text-small text-muted">
          Provisioned collector accounts only. No public signup.
        </m.p>

        <m.div variants={fadeInUp} className="mt-7 space-y-1.5">
          <label htmlFor="auth-username" className="block text-caption font-semibold text-muted">
            Username
          </label>
          <input
            id="auth-username"
            name="username"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className={fieldClass}
          />
        </m.div>

        <m.div variants={fadeInUp} className="mt-4 space-y-1.5">
          <label htmlFor="auth-password" className="block text-caption font-semibold text-muted">
            Password
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClass}
          />
        </m.div>

        <AnimatePresence initial={false}>
          {error && (
            <m.p
              key="auth-error"
              role="alert"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={springSmooth}
              className="overflow-hidden rounded-control border-l-2 border-danger bg-danger-subtle px-3 py-2 text-small text-danger"
            >
              {error}
            </m.p>
          )}
        </AnimatePresence>

        <m.button
          variants={fadeInUp}
          type="submit"
          disabled={submitting}
          className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-control bg-accent text-small font-semibold text-accent-contrast shadow-e1 transition-colors hover:bg-accent-hover disabled:opacity-60"
          {...(submitting ? {} : pressable)}
        >
          {submitting ? 'Signing in…' : 'Sign in'} <LogIn size={16} aria-hidden="true" />
        </m.button>
      </m.form>
    </div>
  )
}
