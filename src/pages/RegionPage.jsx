import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/index.js'
import Avatar from '../components/Avatar.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import Icon from '../components/Icon.jsx'
import PostCard from '../components/PostCard.jsx'
import { usePosts } from '../components/PostList.jsx'
import ScreenHeader from '../components/ScreenHeader.jsx'
import { useAuth, useRegions } from '../context/AppContext.jsx'
import { regionQuery } from '../lib/regionFilter.js'

// A region's overview: shortcuts into the filtered tabs, notices, invites,
// members and (for admins) settings.
export default function RegionPage() {
  const { regionId } = useParams()
  const { user } = useAuth()
  const { refresh } = useRegions()
  const navigate = useNavigate()
  const [region, setRegion] = useState(null)
  const [members, setMembers] = useState(null)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)
  const notices = usePosts({ regionId, isNotice: true })

  const load = useCallback(async () => {
    const r = await api.getRegion(regionId)
    setRegion(r)
    setName(r.name)
    setDescription(r.description)
    setMembers(await api.listMembers(regionId))
  }, [regionId])

  useEffect(() => {
    setRegion(null)
    setError(null)
    setInviteUrl('')
    load().catch(setError)
  }, [load])

  if (error && !region) {
    return (
      <>
        <ScreenHeader title="Region" back="/regions" />
        <div className="screen-body">
          <ErrorNote error={error} />
        </div>
      </>
    )
  }
  if (!region) return <ScreenHeader title="Loading…" back="/regions" />

  const isAdmin = region.role === 'admin'
  const query = regionQuery(region.id)

  async function act(fn) {
    setError(null)
    try {
      await fn()
      await load()
    } catch (err) {
      setError(err)
    }
  }

  async function makeInvite() {
    setError(null)
    try {
      const code = await api.createInvite(region.id)
      setInviteUrl(`${window.location.origin}${window.location.pathname}#/join/${code}`)
      setCopied(false)
    } catch (err) {
      setError(err)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  async function leave() {
    if (!window.confirm(`Leave ${region.name}? You'll need a new invite to come back.`)) return
    try {
      await api.removeMember(region.id, user.id)
      await refresh()
      navigate('/regions')
    } catch (err) {
      setError(err)
    }
  }

  async function saveRegion(e) {
    e.preventDefault()
    await act(async () => {
      await api.updateRegion(region.id, { name, description })
      await refresh()
      setEditing(false)
    })
  }

  return (
    <>
      <ScreenHeader title={region.name} back="/regions" />
      <div className="screen-body">
        <section className="region-hero">
          <span className="region-initial big" aria-hidden="true">
            {region.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h2>{region.name}</h2>
            {region.description && <p className="muted">{region.description}</p>}
            <p className="muted small">
              {members?.length ?? '…'} PAX{isAdmin && ' · You are an admin'}
            </p>
          </div>
        </section>

        <nav className="shortcuts" aria-label={`${region.name} shortcuts`}>
          <Link to={`/${query}`} className="shortcut">
            <Icon name="home" /> Posts
          </Link>
          <Link to={`/calendar${query}`} className="shortcut">
            <Icon name="calendar" /> Calendar
          </Link>
          <Link to={`/chats${query}`} className="shortcut">
            <Icon name="chat" /> Chats
          </Link>
        </nav>

        {notices.posts?.length > 0 && (
          <section className="notices" aria-label="Notices">
            <h2 className="section-label">
              <Icon name="pin" size={16} /> Notices
            </h2>
            {notices.posts.map((p) => (
              <PostCard key={p.id} post={p} showRegion={false} onChange={(next) => (next.isNotice ? notices.update(next) : notices.remove(next.id))} onDelete={notices.remove} />
            ))}
          </section>
        )}

        <section className="panel">
          <h2 className="section-label">Invite PAX</h2>
          <p className="muted small">Anyone with the link can join this region for the next 14 days.</p>
          {inviteUrl ? (
            <div className="row">
              <input readOnly value={inviteUrl} onFocus={(e) => e.target.select()} aria-label="Invite link" />
              <button type="button" className="button primary" onClick={copy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <button type="button" className="button primary" onClick={makeInvite}>
              Create invite link
            </button>
          )}
        </section>

        <section className="list-group" aria-label="Members">
          <h2 className="section-label pad-x">Members</h2>
          {members?.map((m) => (
            <div key={m.profile.id} className="list-row">
              <Link to={`/pax/${m.profile.id}`} className="row-link">
                <Avatar profile={m.profile} size={36} />
                <span className="row-text">
                  <span className="row-title">
                    {m.profile.name}
                    {m.role === 'admin' && <span className="badge">Admin</span>}
                  </span>
                </span>
              </Link>
              {isAdmin && m.profile.id !== user.id && (
                <span className="member-actions">
                  <button type="button" className="link-button small" onClick={() => act(() => api.setMemberRole(region.id, m.profile.id, m.role === 'admin' ? 'member' : 'admin'))}>
                    {m.role === 'admin' ? 'Remove admin' : 'Make admin'}
                  </button>
                  <button
                    type="button"
                    className="link-button small danger"
                    onClick={() => window.confirm(`Remove ${m.profile.name} from the region?`) && act(() => api.removeMember(region.id, m.profile.id))}
                  >
                    Remove
                  </button>
                </span>
              )}
            </div>
          ))}
        </section>

        {isAdmin && (
          <section className="panel">
            <div className="row spread">
              <h2 className="section-label">Region settings</h2>
              <button type="button" className="button small" onClick={() => setEditing((v) => !v)}>
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editing && (
              <form className="stack" onSubmit={saveRegion}>
                <label>
                  Name
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
                </label>
                <label>
                  Description
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} />
                </label>
                <button className="button primary">Save</button>
              </form>
            )}
          </section>
        )}

        <ErrorNote error={error} />
        <div className="pad">
          <button type="button" className="link-button danger" onClick={leave}>
            Leave this region
          </button>
        </div>
      </div>
    </>
  )
}
