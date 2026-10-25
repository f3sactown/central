import { useEffect, useState } from 'react'
import { api } from '../api/index.js'
import { useAuth } from '../context/AppContext.jsx'
import Avatar from './Avatar.jsx'
import ErrorNote from './ErrorNote.jsx'
import EventFields, { draftToEvent, emptyEventDraft } from './EventFields.jsx'

const MAX_IMAGES = 10

// regions: the regions the PAX can post to. If there is only one, no picker is shown.
export default function PostComposer({ regions, onPosted }) {
  const { user } = useAuth()
  const [regionId, setRegionId] = useState(regions[0]?.id || '')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [linkUrl, setLinkUrl] = useState('')
  const [showLink, setShowLink] = useState(false)
  const [eventDraft, setEventDraft] = useState(null)
  const [isNotice, setIsNotice] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const region = regions.find((r) => r.id === regionId)
  const isAdmin = region?.role === 'admin'

  useEffect(() => {
    if (!regions.some((r) => r.id === regionId)) setRegionId(regions[0]?.id || '')
  }, [regions, regionId])

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  function addFiles(e) {
    const picked = [...e.target.files].filter((f) => f.type.startsWith('image/'))
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_IMAGES))
    e.target.value = ''
  }

  const empty = !body.trim() && !files.length && !linkUrl.trim() && !eventDraft

  async function submit(e) {
    e.preventDefault()
    if (empty || !regionId) return
    setBusy(true)
    setError(null)
    try {
      let eventId = null
      if (eventDraft) {
        const event = await api.createEvent({ regionId, ...draftToEvent(eventDraft) })
        eventId = event.id
      }
      const post = await api.createPost({ regionId, body: body.trim(), linkUrl: showLink ? linkUrl : null, imageFiles: files, eventId, isNotice: isAdmin && isNotice })
      setBody('')
      setFiles([])
      setLinkUrl('')
      setShowLink(false)
      setEventDraft(null)
      setIsNotice(false)
      onPosted(post)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (!regions.length) return null

  return (
    <form className="card composer" onSubmit={submit}>
      <div className="composer-top">
        <Avatar profile={user} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share something with your region…" rows={3} maxLength={10000} aria-label="Post text" />
      </div>

      {previews.length > 0 && (
        <div className="thumbs">
          {previews.map((src, i) => (
            <div key={src} className="thumb">
              <img src={src} alt={`Selected photo ${i + 1}`} />
              <button type="button" aria-label="Remove photo" onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showLink && (
        <label className="block">
          Link
          <input type="text" inputMode="url" autoComplete="url" aria-label="Link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
        </label>
      )}

      {eventDraft && <EventFields draft={eventDraft} onChange={setEventDraft} />}

      <div className="composer-tools">
        <label className="tool" title="Add photos">
          📷 Photo
          <input type="file" accept="image/*" multiple onChange={addFiles} hidden />
        </label>
        <button type="button" className="tool" onClick={() => setShowLink((v) => !v)} aria-pressed={showLink}>
          🔗 Link
        </button>
        <button type="button" className="tool" onClick={() => setEventDraft((d) => (d ? null : emptyEventDraft()))} aria-pressed={!!eventDraft}>
          📅 Event
        </button>
        {isAdmin && (
          <label className="tool inline">
            <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} /> 📌 Notice
          </label>
        )}
        <span className="spacer" />
        {regions.length > 1 && (
          <select value={regionId} onChange={(e) => setRegionId(e.target.value)} aria-label="Post to region">
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="button primary" disabled={busy || empty}>
          {busy ? 'Posting…' : 'Post'}
        </button>
      </div>
      <ErrorNote error={error} />
    </form>
  )
}
