import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, UserPlus } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { AnalysisApiError } from '../../domain/api'
import { useAuth } from './AuthContext'
import { fadeInUp, pressable, springSmooth, staggerContainer } from '../../motion/presets'
import { useMagnetic } from '../../motion/useMagnetic'

const fieldClass =
  'h-11 w-full rounded-control border border-hairline bg-surface-inset px-3.5 text-body text-ink transition-colors placeholder:text-faint hover:border-strong focus:border-accent focus:outline-none'

export function SignupView({ onShowLogin }: Readonly<{ onShowLogin: () => void }>) {
  const { signup } = useAuth()
  const magnetic = useMagnetic()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signup(username, password, code)
    } catch (caught) {
      setError(
        caught instanceof AnalysisApiError
          ? caught.message
          : 'Could not create the account. Try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

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
          <UserPlus size={13} aria-hidden="true" /> NEW COLLECTOR
        </m.span>

        <m.h1 variants={fadeInUp} className="mt-3 text-h1 text-ink">
          Create an account
        </m.h1>

        <m.p variants={fadeInUp} className="mt-2 text-small text-muted">
          Registration needs the team code. Accounts can read and edit the private corpus.
        </m.p>

        <m.div variants={fadeInUp} className="mt-7 space-y-1.5">
          <label htmlFor="signup-username" className="block text-caption font-semibold text-muted">
            Username
          </label>
          <input
            id="signup-username"
            name="username"
            autoComplete="username"
            required
            minLength={3}
            pattern="[A-Za-z0-9_.\-]+"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className={fieldClass}
          />
          <p className="text-caption text-faint">Letters, digits, dot, dash or underscore.</p>
        </m.div>

        <m.div variants={fadeInUp} className="mt-4 space-y-1.5">
          <label htmlFor="signup-password" className="block text-caption font-semibold text-muted">
            Password
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClass}
          />
          <p className="text-caption text-faint">At least 8 characters.</p>
        </m.div>

        <m.div variants={fadeInUp} className="mt-4 space-y-1.5">
          <label htmlFor="signup-code" className="block text-caption font-semibold text-muted">
            Team registration code
          </label>
          <input
            id="signup-code"
            name="signup-code"
            type="password"
            autoComplete="off"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={fieldClass}
          />
        </m.div>

        <AnimatePresence initial={false}>
          {error && (
            <m.p
              key="signup-error"
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
          data-testid="signup-submit"
          className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-control bg-accent text-small font-semibold text-accent-contrast shadow-e1 transition-colors hover:bg-accent-hover disabled:opacity-60"
          {...(submitting ? {} : pressable)}
          {...(submitting ? {} : magnetic)}
        >
          {submitting ? 'Creating account…' : 'Create account'}{' '}
          <UserPlus size={16} aria-hidden="true" />
        </m.button>

        <m.p variants={fadeInUp} className="mt-5 text-center text-small text-muted">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onShowLogin}
            data-testid="switch-to-login"
            className="font-semibold text-accent underline-offset-2 hover:underline"
          >
            <KeyRound size={13} aria-hidden="true" className="mr-1 inline" />
            Sign in
          </button>
        </m.p>
      </m.form>
    </div>
  )
}
