import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/index.js'
import { useAuth } from '../context/AppContext.jsx'
import { formatDate, formatTime, sameDay } from '../lib/dates.js'
import Avatar from './Avatar.jsx'
import Icon from './Icon.jsx'
import ErrorNote from './ErrorNote.jsx'
import MemberPicker from './MemberPicker.jsx'

function addUnique(list, msg) {
  return list.some((m) => m.id === msg.id) ? list : [...list, msg]
}

export default function ChatRoom({ chatId, onLeft }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatMembers, setChatMembers] = useState([])
  const [body, setBody] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [inviteList, setInviteList] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [error, setError] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    let active = true
    setChat(null)
    setMessages([])
    setError(null)
    setShowMembers(false)
    setInviteList(null)
    Promise.all([api.getChat(chatId), api.listMessages(chatId), api.listChatMembers(chatId)]).then(
      ([c, msgs, mem]) => {
        if (!active) return
        setChat(c)
        setMessages((prev) => msgs.concat(prev.filter((m) => !msgs.some((x) => x.id === m.id))))
        setChatMembers(mem)
      },
      (err) => active && setError(err),
    )
    const off = api.subscribeMessages(chatId, (m) => active && setMessages((prev) => addUnique(prev, m)))
    return () => {
      active = false
      off()
    }
  }, [chatId])

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function send(e) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setBody('')
    try {
      const m = await api.sendMessage(chatId, text)
      setMessages((prev) => addUnique(prev, m))
    } catch (err) {
      setBody(text)
      setError(err)
    }
  }

  async function openInvite() {
    try {
      const all = await api.listMembers(chat.regionId)
      const inChat = new Set(chatMembers.map((m) => m.id))
      setInviteList(all.map((m) => m.profile).filter((p) => !inChat.has(p.id)))
      setSelected(new Set())
    } catch (err) {
      setError(err)
    }
  }

  async function invite() {
    try {
      await api.addChatMembers(chatId, [...selected])
      setChatMembers(await api.listChatMembers(chatId))
      setInviteList(null)
    } catch (err) {
      setError(err)
    }
  }

  async function leave() {
    if (!window.confirm('Leave this chat? You will need to be invited back.')) return
    try {
      await api.leaveChat(chatId)
      await onLeft()
      navigate('/chats')
    } catch (err) {
      setError(err)
    }
  }

  if (error && !chat) return <div className="chat-room"><ErrorNote error={error} /></div>
  if (!chat) return <div className="chat-room"><p className="muted">Loading chat…</p></div>

  return (
    <div className="chat-room">
      <header className="chat-head">
        <Link to="/chats" className="icon-button chat-back" aria-label="All chats">
          <Icon name="back" />
        </Link>
        <span className="chat-kind">
          <Icon name={chat.isPrivate ? 'lock' : 'hash'} size={18} label={chat.isPrivate ? 'Private chat' : 'Open chat'} />
        </span>
        <div className="chat-title">
          <h2>{chat.name}</h2>
          {chat.region && <div className="muted small">{chat.region.name}</div>}
        </div>
        <button type="button" className="chip" onClick={() => setShowMembers((v) => !v)} aria-expanded={showMembers} aria-label={`${chatMembers.length} members`}>
          <Icon name="regions" size={16} /> {chatMembers.length}
        </button>
      </header>

      {showMembers && (
        <div className="chat-members">
          <ul>
            {chatMembers.map((m) => (
              <li key={m.id}>
                <Link to={`/pax/${m.id}`} className="inline">
                  <Avatar profile={m} size={24} /> {m.name}
                </Link>
              </li>
            ))}
          </ul>
          {chat.isPrivate && (
            <div className="row">
              {inviteList === null ? (
                <button type="button" className="button small" onClick={openInvite}>
                  + Invite PAX
                </button>
              ) : (
                <div className="invite-box">
                  <MemberPicker members={inviteList} selected={selected} onChange={setSelected} />
                  <div className="row">
                    <button type="button" className="button small" onClick={() => setInviteList(null)}>
                      Cancel
                    </button>
                    <button type="button" className="button small primary" onClick={invite} disabled={!selected.size}>
                      Invite
                    </button>
                  </div>
                </div>
              )}
              <button type="button" className="link-button small danger" onClick={leave}>
                Leave chat
              </button>
            </div>
          )}
          {!chat.isPrivate && <p className="muted small">Everyone in the region can see this chat.</p>}
        </div>
      )}

      <div className="messages" aria-live="polite">
        {messages.length === 0 && <p className="muted center">No messages yet. Say hello!</p>}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const newDay = !prev || !sameDay(new Date(prev.createdAt), new Date(m.createdAt))
          const grouped = !newDay && prev.author?.id === m.author?.id && new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60e3
          const mine = m.author?.id === user.id
          return (
            <div key={m.id}>
              {newDay && <div className="day-divider">{formatDate(m.createdAt, { weekday: 'long', month: 'short', day: 'numeric' })}</div>}
              <div className={'message' + (mine ? ' mine' : '') + (grouped ? ' grouped' : '')}>
                {!mine && !grouped && <Avatar profile={m.author} size={32} />}
                <div className="bubble-wrap">
                  {!mine && !grouped && <div className="small name">{m.author?.name || 'Former PAX'}</div>}
                  <div className="bubble" title={new Date(m.createdAt).toLocaleString()}>
                    {m.body}
                  </div>
                  {!grouped && <div className="muted tiny">{formatTime(m.createdAt)}</div>}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={send}>
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" maxLength={4000} aria-label="Message" />
        <button type="submit" className="button primary" disabled={!body.trim()}>
          Send
        </button>
      </form>
      <ErrorNote error={error} />
    </div>
  )
}
