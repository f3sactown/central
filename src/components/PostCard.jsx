import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/index.js'
import { useAuth, useRegions } from '../context/AppContext.jsx'
import { timeAgo } from '../lib/dates.js'
import Avatar from './Avatar.jsx'
import Comments from './Comments.jsx'
import ErrorNote from './ErrorNote.jsx'
import EventCard from './EventCard.jsx'
import ReactionBar from './ReactionBar.jsx'
import RichText from './RichText.jsx'

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function PostCard({ post, showRegion = true, onChange, onDelete }) {
  const { user } = useAuth()
  const { roleFor } = useRegions()
  const [showComments, setShowComments] = useState(false)
  const [error, setError] = useState(null)
  const isAdmin = roleFor(post.regionId) === 'admin'
  const canDelete = isAdmin || post.author?.id === user.id

  async function toggleReaction(emoji) {
    const had = post.reactions.some((r) => r.userId === user.id && r.emoji === emoji)
    const reactions = had
      ? post.reactions.filter((r) => !(r.userId === user.id && r.emoji === emoji))
      : [...post.reactions, { emoji, userId: user.id }]
    onChange({ ...post, reactions })
    try {
      await api.toggleReaction(post.id, emoji)
    } catch (err) {
      onChange(post)
      setError(err)
    }
  }

  async function toggleNotice() {
    try {
      await api.setNotice(post.id, !post.isNotice)
      onChange({ ...post, isNotice: !post.isNotice })
    } catch (err) {
      setError(err)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this post?')) return
    try {
      await api.deletePost(post.id)
      onDelete(post.id)
    } catch (err) {
      setError(err)
    }
  }

  return (
    <article className={'card post' + (post.isNotice ? ' notice' : '')}>
      <header className="post-head">
        <Avatar profile={post.author} />
        <div className="post-meta">
          <div>
            {post.author ? <Link to={`/pax/${post.author.id}`} className="name">{post.author.name}</Link> : <span className="name">Former PAX</span>}
            {showRegion && post.region && (
              <>
                {' '}<span className="muted">in</span>{' '}
                <Link to={`/r/${post.regionId}`} className="region-link">{post.region.name}</Link>
              </>
            )}
          </div>
          <div className="muted small">
            {timeAgo(post.createdAt)}
            {post.isNotice && <span className="badge">📌 Notice</span>}
          </div>
        </div>
        {(isAdmin || canDelete) && (
          <div className="post-actions">
            {isAdmin && (
              <button type="button" className="link-button small" onClick={toggleNotice}>
                {post.isNotice ? 'Unpin' : 'Pin as notice'}
              </button>
            )}
            {canDelete && (
              <button type="button" className="link-button small danger" onClick={remove}>
                Delete
              </button>
            )}
          </div>
        )}
      </header>

      <RichText text={post.body} />

      {post.imageUrls.length > 0 && (
        <div className={'post-images count-' + Math.min(post.imageUrls.length, 4)}>
          {post.imageUrls.map((src, i) => (
            <a key={i} href={src} target="_blank" rel="noopener noreferrer">
              <img src={src} alt={`Photo ${i + 1}`} loading="lazy" />
            </a>
          ))}
        </div>
      )}

      {post.linkUrl && (
        <a className="link-card" href={post.linkUrl} target="_blank" rel="noopener noreferrer">
          <span aria-hidden="true">🔗</span>
          <span>
            <strong>{hostOf(post.linkUrl)}</strong>
            <span className="muted small link-url">{post.linkUrl}</span>
          </span>
        </a>
      )}

      {post.event && <EventCard event={post.event} />}

      <footer className="post-foot">
        <ReactionBar reactions={post.reactions} userId={user.id} onToggle={toggleReaction} />
        <button type="button" className="link-button" onClick={() => setShowComments((v) => !v)} aria-expanded={showComments}>
          💬 {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
        </button>
      </footer>
      <ErrorNote error={error} />
      {showComments && (
        <Comments postId={post.id} userId={user.id} isAdmin={isAdmin} onCountChange={(n) => onChange({ ...post, commentCount: n })} />
      )}
    </article>
  )
}
