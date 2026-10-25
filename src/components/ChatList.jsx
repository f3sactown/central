import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { api } from '../api/index.js'
import { useAuth } from '../context/AppContext.jsx'
import ErrorNote from './ErrorNote.jsx'
import MemberPicker from './MemberPicker.jsx'

export default function ChatList({ regionId, chats, onCreated }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [members, setMembers] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (creating) api.listMembers(regionId).then((list) => setMembers(list.map((m) => m.profile).filter((p) => p.id !== user.id)), setError)
  }, [creating, regionId, user.id])

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const chatName = name.trim() || members.filter((m) => selected.has(m.id)).map((m) => m.name).join(', ') || 'New chat'
      const id = await api.createChat({ regionId, name: chatName.slice(0, 80), isPrivate, memberIds: [...selected] })
      setCreating(false)
      setName('')
      setSelected(new Set())
      await onCreated()
      navigate(`/r/${regionId}/chats/${id}`)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card chat-list">
      <div className="chat-list-head">
        <h3>Chats</h3>
        <button type="button" className="button small" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Cancel' : '+ New'}
        </button>
      </div>
      {creating && (
        <form className="new-chat" onSubmit={submit}>
          <label className="block">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder={isPrivate ? 'Optional' : 'e.g. Carpool'} required={!isPrivate} />
          </label>
          <fieldset>
            <label className="inline">
              <input type="radio" name="chat-type" checked={isPrivate} onChange={() => setIsPrivate(true)} /> 🔒 Private — only PAX you invite
            </label>
            <label className="inline">
              <input type="radio" name="chat-type" checked={!isPrivate} onChange={() => setIsPrivate(false)} /> # Open to the whole region
            </label>
          </fieldset>
          {isPrivate && <MemberPicker members={members} selected={selected} onChange={setSelected} />}
          <button type="submit" className="button primary" disabled={busy || (isPrivate && selected.size === 0)}>
            Create chat
          </button>
          <ErrorNote error={error} />
        </form>
      )}
      <nav>
        {chats.map((c) => (
          <NavLink key={c.id} to={`/r/${regionId}/chats/${c.id}`} className="chat-link">
            <span aria-hidden="true">{c.isPrivate ? '🔒' : '#'}</span> {c.name}
          </NavLink>
        ))}
        {chats.length === 0 && <p className="muted small">No chats yet.</p>}
      </nav>
    </div>
  )
}
