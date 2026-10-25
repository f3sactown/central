import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/index.js'
import ErrorNote from '../components/ErrorNote.jsx'
import { useAuth, useRegions } from '../context/AppContext.jsx'

export default function Join() {
  const { code } = useParams()
  const { user } = useAuth()
  const regionsCtx = useRegions()
  const navigate = useNavigate()
  const [invite, setInvite] = useState(undefined)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.getInvite(code).then(setInvite, (err) => {
      setInvite(null)
      setError(err)
    })
  }, [code])

  async function join() {
    setBusy(true)
    setError(null)
    try {
      const regionId = await api.redeemInvite(code)
      await regionsCtx?.refresh()
      navigate(`/r/${regionId}`, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const next = `?next=${encodeURIComponent(`/join/${code}`)}`

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="brand big">Central</h1>
        {invite === undefined && <p className="muted">Checking invite…</p>}
        {invite === null && !error && <p>This invite link isn't valid.</p>}
        {invite && (
          <>
            <p className="muted">You've been invited to join</p>
            <h2>{invite.regionName}</h2>
            {invite.regionDescription && <p>{invite.regionDescription}</p>}
            {!invite.valid && <p className="error">This invite has expired or been used up. Ask for a new link.</p>}
            {invite.valid && user && (
              <button type="button" className="button primary wide" onClick={join} disabled={busy}>
                {busy ? 'Joining…' : `Join as ${user.name}`}
              </button>
            )}
            {invite.valid && !user && (
              <div className="stack">
                <Link className="button primary wide" to={`/signup${next}`}>
                  Create an account to join
                </Link>
                <Link className="button wide" to={`/login${next}`}>
                  I already have an account
                </Link>
              </div>
            )}
          </>
        )}
        <ErrorNote error={error} />
        {user && (
          <p>
            <Link to="/">Back to my feed</Link>
          </p>
        )}
      </div>
    </div>
  )
}
