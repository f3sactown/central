import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/index.js'
import { ChannelBadge, VersionLabel } from '../components/BuildInfo.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import { useAuth } from '../context/AppContext.jsx'

// Only follow in-app redirects like "/join/abc".
function safeNext(params) {
  const next = params.get('next') || '/'
  return next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

function AuthShell({ title, children }) {
  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="brand big">
          Central
          <ChannelBadge />
        </h1>
        <h2>{title}</h2>
        {children}
        <p className="center">
          <VersionLabel />
        </p>
      </div>
    </div>
  )
}

export function Login() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const next = safeNext(params)

  if (user) return <Navigate to={next} replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.signIn({ email, password })
      navigate(next, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Sign in">
      <form onSubmit={submit} className="stack">
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="button primary wide" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <ErrorNote error={error} />
      </form>
      <p className="muted">
        New PAX? <Link to={`/signup${params.toString() ? '?' + params : ''}`}>Create an account</Link>
      </p>
      {api.mode === 'demo' && (
        <p className="hint">
          Demo mode: sign in as <code>demo@pax.local</code> / <code>demo</code>, or create an account and join with invite code <code>{api.demoInviteCode}</code>.
        </p>
      )}
    </AuthShell>
  )
}

export function Signup() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)
  const next = safeNext(params)

  if (user) return <Navigate to={next} replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { needsConfirmation } = await api.signUp({ email, password, name })
      if (needsConfirmation) setCheckEmail(true)
      else navigate(next === '/' ? '/me?welcome=1' : next, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (checkEmail) {
    return (
      <AuthShell title="Check your email">
        <p>We sent a confirmation link to <strong>{email}</strong>. Open it, then sign in{next !== '/' ? ' and use your invite link again' : ''}.</p>
        <Link className="button wide" to={`/login${params.toString() ? '?' + params : ''}`}>
          Go to sign in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create your account">
      <form onSubmit={submit} className="stack">
        <label>
          Name
          <input autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
        </label>
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="button primary wide" disabled={busy}>
          {busy ? 'Creating…' : 'Sign up'}
        </button>
        <ErrorNote error={error} />
      </form>
      <p className="muted">
        Already have an account? <Link to={`/login${params.toString() ? '?' + params : ''}`}>Sign in</Link>
      </p>
    </AuthShell>
  )
}
