import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/index.js'
import ErrorNote from '../components/ErrorNote.jsx'
import Icon from '../components/Icon.jsx'
import ScreenHeader from '../components/ScreenHeader.jsx'
import Sheet from '../components/Sheet.jsx'
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
    <>
      <ScreenHeader title="Regions">
        <button type="button" className="icon-button" onClick={() => setCreating(true)} aria-label="Start a new region">
          <Icon name="plus" />
        </button>
      </ScreenHeader>
      <div className="screen-body">
        <section className="list-group" aria-label="My regions">
          {regions?.map((r) => (
            <Link key={r.id} to={`/r/${r.id}`} className="list-row">
              <span className="row-icon region-initial" aria-hidden="true">
                {r.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="row-text">
                <span className="row-title">
                  {r.name}
                  {r.role === 'admin' && <span className="badge">Admin</span>}
                </span>
                {r.description && <span className="muted small clamp">{r.description}</span>}
              </span>
              <Icon name="forward" size={18} />
            </Link>
          ))}
          {regions?.length === 0 && <p className="muted center pad">You haven't joined a region yet.</p>}
        </section>

        <section className="panel">
          <h2 className="section-label">Join with an invite</h2>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault()
              if (code.trim()) navigate(`/join/${encodeURIComponent(inviteCodeFrom(code))}`)
            }}
          >
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Invite code or link" aria-label="Invite code or link" />
            <button className="button primary" disabled={!code.trim()}>
              Join
            </button>
          </form>
        </section>
      </div>

      {creating && (
        <Sheet title="Start a new region" onClose={() => setCreating(false)}>
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
            <ErrorNote error={error} />
          </form>
        </Sheet>
      )}
    </>
  )
}
