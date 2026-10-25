import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/index.js'
import { timeAgo } from '../lib/dates.js'
import Avatar from './Avatar.jsx'
import ErrorNote from './ErrorNote.jsx'

export default function Comments({ postId, userId, isAdmin, onCountChange }) {
  const [comments, setComments] = useState(null)
  const [body, setBody] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.listComments(postId).then(setComments, setError)
  }, [postId])

  async function submit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    setError(null)
    try {
      const c = await api.addComment(postId, body)
      const next = [...(comments || []), c]
      setComments(next)
      onCountChange(next.length)
      setBody('')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    try {
      await api.deleteComment(id)
      const next = comments.filter((c) => c.id !== id)
      setComments(next)
      onCountChange(next.length)
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="comments">
      {comments === null && !error && <p className="muted">Loading comments…</p>}
      {comments?.map((c) => (
        <div key={c.id} className="comment">
          <Avatar profile={c.author} size={28} />
          <div className="comment-body">
            <div>
              {c.author ? <Link to={`/pax/${c.author.id}`} className="name">{c.author.name}</Link> : <span className="name">Former PAX</span>}{' '}
              <span className="muted small">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="rich-text">{c.body}</p>
          </div>
          {(c.author?.id === userId || isAdmin) && (
            <button type="button" className="link-button small" onClick={() => remove(c.id)}>
              Delete
            </button>
          )}
        </div>
      ))}
      <form className="comment-form" onSubmit={submit}>
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment…" maxLength={4000} aria-label="Comment" />
        <button type="submit" className="button" disabled={busy || !body.trim()}>
          Send
        </button>
      </form>
      <ErrorNote error={error} />
    </div>
  )
}
