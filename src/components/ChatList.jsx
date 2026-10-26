import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { api } from '../api/index.js'
import { useAuth, useRegions } from '../context/AppContext.jsx'
import ErrorNote from './ErrorNote.jsx'
import Icon from './Icon.jsx'
import MemberPicker from './MemberPicker.jsx'

export default function ChatList({ chats, showRegion }) {
  return (
    <nav className="chat-list" aria-label="Chats">
      {chats.map((c) => (
        <NavLink key={c.id} to={`/chats/${c.id}`} className="list-row chat-link">
          <span className="row-icon">
            <Icon name={c.isPrivate ? 'lock' : 'hash'} size={18} />
          </span>
          <span className="row-text">
            <span className="row-title">{c.name}</span>
            {showRegion && c.region && <span className="muted small">{c.region.name}</span>}
          </span>
          <Icon name="forward" size={18} />
        </NavLink>
      ))}
      {chats.length === 0 && <p className="muted center pad">No chats yet. Tap + to start one.</p>}
    </nav>
  )
}

// Form for a new chat: open to the region, or private with invited PAX.
export function NewChatForm({ defaultRegionId, onCreated }) {
  const { user } = useAuth()
  const { regions } = useRegions()
  const [regionId, setRegionId] = useState(defaultRegionId || regions?.[0]?.id || '')
  const [name, setName] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [members, setMembers] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!regionId) return
    setSelected(new Set())
    api.listMembers(regionId).then((list) => setMembers(list.map((m) => m.profile).filter((p) => p.id !== user.id)), setError)
  }, [regionId, user.id])

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const chatName = name.trim() || members.filter((m) => selected.has(m.id)).map((m) => m.name).join(', ') || 'New chat'
      const id = await api.createChat({ regionId, name: chatName.slice(0, 80), isPrivate, memberIds: [...selected] })
      await onCreated(id)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      {regions?.length > 1 && (
        <label>
          Region
          <select value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <fieldset>
        <label className="inline">
          <input type="radio" name="chat-type" checked={isPrivate} onChange={() => setIsPrivate(true)} /> Private: only PAX you invite
        </label>
        <label className="inline">
          <input type="radio" name="chat-type" checked={!isPrivate} onChange={() => setIsPrivate(false)} /> Open to everyone in the region
        </label>
      </fieldset>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder={isPrivate ? 'Optional' : 'e.g. Carpool'} required={!isPrivate} />
      </label>
      {isPrivate && <MemberPicker members={members} selected={selected} onChange={setSelected} />}
      <button type="submit" className="button primary" disabled={busy || !regionId || (isPrivate && selected.size === 0)}>
        Create chat
      </button>
      <ErrorNote error={error} />
    </form>
  )
}
