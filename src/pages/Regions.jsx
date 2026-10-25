import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/index.js'
import ErrorNote from '../components/ErrorNote.jsx'
import { useRegions } from '../context/AppContext.jsx'

// Accepts a bare code or a full invite link.
function inviteCodeFrom(input) {
  const s = input.trim()
  const m = s.match(/join\/([^/?#\s]+)/)
  return m ? m[1] : s
}

export default function Regions() {
  const { regions, refresh } = useRegions()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function create(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const id = await api.createRegion({ name, description })
      await refresh()
      navigate(`/r/${id}`)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="regions-page">
      <h1 className="page-title">Regions</h1>
      <div className="region-grid">
        {regions?.map((r) => (
          <Link key={r.id} to={`/r/${r.id}`} className="card region-card">
            <h3>{r.name}</h3>
            {r.description && <p className="muted">{r.description}</p>}
            {r.role === 'admin' && <span className="badge">Admin</span>}
          </Link>
        ))}
      </div>

      <div className="card">
        <h3>Join with an invite</h3>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            if (code.trim()) navigate(`/join/${encodeURIComponent(inviteCodeFrom(code))}`)
          }}
        >
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Invite code or link" aria-label="Invite code or link" />
          <button className="button primary" disabled={!code.trim()}>
            Continue
          </button>
        </form>
      </div>

      <div className="card">
        <div className="row spread">
          <h3>Start a new region</h3>
          <button type="button" className="button small" onClick={() => setCreating((v) => !v)}>
            {creating ? 'Cancel' : 'Create'}
          </button>
        </div>
        {creating && (
          <form className="stack" onSubmit={create}>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
            </label>
            <label>
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={2000} />
            </label>
            <p className="muted small">You'll be the region's admin and can invite PAX. Each PAX can start one region per day.</p>
            <button className="button primary" disabled={busy || !name.trim()}>
              Create region
            </button>
          </form>
        )}
        <ErrorNote error={error} />
      </div>
    </div>
  )
}
