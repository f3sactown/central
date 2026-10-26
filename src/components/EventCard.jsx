import { Link } from 'react-router-dom'
import { formatEventWhen } from '../lib/dates.js'

export default function EventCard({ event, linkToCalendar = true }) {
  const d = new Date(event.startsAt)
  const content = (
    <>
      <div className="event-date" aria-hidden="true">
        <span>{d.toLocaleDateString([], { month: 'short' })}</span>
        <strong>{d.getDate()}</strong>
      </div>
      <div>
        <div className="event-title">{event.title}</div>
        <div className="muted small">{formatEventWhen(event)}</div>
        {event.location && <div className="muted small">📍 {event.location}</div>}
      </div>
    </>
  )
  if (!linkToCalendar) return <div className="event-card">{content}</div>
  return (
    <Link className="event-card" to={`/calendar?region=${event.regionId}&day=${encodeURIComponent(event.startsAt)}`}>
      {content}
    </Link>
  )
}
