import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/index.js'
import Avatar from '../components/Avatar.jsx'
import Calendar from '../components/Calendar.jsx'
import ChatList from '../components/ChatList.jsx'
import ChatRoom from '../components/ChatRoom.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import PostCard from '../components/PostCard.jsx'
import PostComposer from '../components/PostComposer.jsx'
import PostList, { usePosts } from '../components/PostList.jsx'
import { useAuth, useRegions } from '../context/AppContext.jsx'

export default function RegionPage() {
  const { regionId } = useParams()
  const [region, setRegion] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => api.getRegion(regionId).then(setRegion, setError), [regionId])

  useEffect(() => {
    setRegion(null)
    setError(null)
    load()
  }, [load])

  if (error) return <div className="card"><ErrorNote error={error} /><Link to="/regions">Back to regions</Link></div>
  if (!region) return <p className="muted center">Loading…</p>

  return (
    <div className="region-page">
      <div className="card region-header">
        <h1>{region.name}</h1>
        {region.description && <p className="muted">{region.description}</p>}
        <nav className="tabs">
          <NavLink to={`/r/${regionId}`} end>
            Posts
          </NavLink>
          <NavLink to={`/r/${regionId}/calendar`}>Calendar</NavLink>
          <NavLink to={`/r/${regionId}/chats`}>Chats</NavLink>
          <NavLink to={`/r/${regionId}/members`}>Members</NavLink>
        </nav>
      </div>
      <Outlet context={{ region, reload: load }} />
    </div>
  )
}

const useRegion = () => useOutletContext()

export function RegionPosts() {
  const { region } = useRegion()
  const notices = usePosts({ regionId: region.id, isNotice: true })
  const feed = usePosts({ regionId: region.id, isNotice: false })

  // Pinning or unpinning moves a post between the two lists.
  function handleChange(post) {
    const wasNotice = notices.posts?.some((p) => p.id === post.id) ?? false
    if (post.isNotice === wasNotice) return (post.isNotice ? notices : feed).update(post)
    ;(wasNotice ? notices : feed).remove(post.id)
    ;(post.isNotice ? notices : feed).prepend(post)
  }

  return (
    <div className="feed">
      {notices.posts?.length > 0 && (
        <section className="notices">
          <h2 className="section-title">📌 Notices</h2>
          {notices.posts.map((p) => (
            <PostCard key={p.id} post={p} showRegion={false} onChange={handleChange} onDelete={notices.remove} />
          ))}
        </section>
      )}
      <PostComposer regions={[region]} onPosted={(p) => (p.isNotice ? notices : feed).prepend(p)} />
      <PostList feed={feed} showRegion={false} emptyText="No posts in this region yet." onChange={handleChange} />
    </div>
  )
}

export function RegionCalendar() {
  const { region } = useRegion()
  const [params] = useSearchParams()
  const day = params.get('day')
  return <Calendar key={day || 'now'} regionId={region.id} isAdmin={region.role === 'admin'} initialDay={day ? new Date(day) : undefined} />
}

export function RegionChats() {
  const { region } = useRegion()
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [chats, setChats] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => api.listChats(region.id).then(setChats, setError), [region.id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    // On wide screens open the first chat automatically.
    if (!chatId && chats?.length && window.matchMedia('(min-width: 900px)').matches) {
      navigate(`/r/${region.id}/chats/${chats[0].id}`, { replace: true })
    }
  }, [chatId, chats, navigate, region.id])

  return (
    <div className={'chats-layout' + (chatId ? ' has-chat' : '')}>
      <ErrorNote error={error} />
      {chats && <ChatList regionId={region.id} chats={chats} onCreated={load} />}
      {chatId ? (
        <div className="chat-pane">
          <Link to={`/r/${region.id}/chats`} className="back-link">
            ‹ All chats
          </Link>
          <ChatRoom key={chatId} chatId={chatId} regionId={region.id} onLeft={load} />
        </div>
      ) : (
        <div className="card chat-placeholder muted">Pick a chat, or start a new one.</div>
      )}
    </div>
  )
}

export function RegionMembers() {
  const { region, reload } = useRegion()
  const { user } = useAuth()
  const { refresh } = useRegions()
  const navigate = useNavigate()
  const [members, setMembers] = useState(null)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(region.name)
  const [description, setDescription] = useState(region.description)
  const [error, setError] = useState(null)
  const isAdmin = region.role === 'admin'

  const load = useCallback(() => api.listMembers(region.id).then(setMembers, setError), [region.id])
  useEffect(() => {
    load()
  }, [load])

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

  async function act(fn) {
    setError(null)
    try {
      await fn()
      await load()
    } catch (err) {
      setError(err)
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
    try {
      await api.updateRegion(region.id, { name, description })
      await Promise.all([reload(), refresh()])
      setEditing(false)
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="members-page">
      <div className="card">
        <h3>Invite PAX</h3>
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
      </div>

      <div className="card">
        <h3>Members {members && <span className="muted">({members.length})</span>}</h3>
        <ul className="member-list">
          {members?.map((m) => (
            <li key={m.profile.id}>
              <Link to={`/pax/${m.profile.id}`} className="inline">
                <Avatar profile={m.profile} size={36} />
                <span>
                  <span className="name">{m.profile.name}</span>
                  {m.role === 'admin' && <span className="badge">Admin</span>}
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
            </li>
          ))}
        </ul>
      </div>

      {isAdmin && (
        <div className="card">
          <div className="row spread">
            <h3>Region settings</h3>
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
        </div>
      )}

      <ErrorNote error={error} />
      <button type="button" className="link-button danger" onClick={leave}>
        Leave this region
      </button>
    </div>
  )
}
