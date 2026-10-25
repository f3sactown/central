import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/index.js'
import { useAuth } from '../context/AppContext.jsx'
import { addDays, eventsForDay, formatEventWhen, monthGrid, sameDay, startOfDay } from '../lib/dates.js'
import ErrorNote from './ErrorNote.jsx'
import EventFields, { draftToEvent, emptyEventDraft } from './EventFields.jsx'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_CHIPS = 3

export default function Calendar({ regionId, isAdmin, initialDay }) {
  const { user } = useAuth()
  const [selected, setSelected] = useState(() => startOfDay(initialDay || new Date()))
  const [month, setMonth] = useState(() => ({ y: selected.getFullYear(), m: selected.getMonth() }))
  const [events, setEvents] = useState([])
  const [draft, setDraft] = useState(null)
  const [shareToFeed, setShareToFeed] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const days = useMemo(() => monthGrid(month.y, month.m), [month])
  const today = startOfDay(new Date())

  useEffect(() => {
    let active = true
    setError(null)
    api
      .listEvents({ regionId, from: days[0].toISOString(), to: addDays(days[days.length - 1], 1).toISOString() })
      .then((list) => active && setEvents(list), (err) => active && setError(err))
    return () => {
      active = false
    }
  }, [regionId, days])

  function shiftMonth(n) {
    const d = new Date(month.y, month.m + n, 1)
    setMonth({ y: d.getFullYear(), m: d.getMonth() })
  }

  function goToday() {
    setSelected(today)
    setMonth({ y: today.getFullYear(), m: today.getMonth() })
  }

  function selectDay(day) {
    setSelected(day)
    setDraft(null)
    if (day.getMonth() !== month.m) setMonth({ y: day.getFullYear(), m: day.getMonth() })
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const event = await api.createEvent({ regionId, ...draftToEvent(draft) })
      if (shareToFeed) await api.createPost({ regionId, body: '', eventId: event.id })
      setEvents((prev) => [...prev, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
      setDraft(null)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function remove(event) {
    if (!window.confirm(`Delete "${event.title}"?`)) return
    try {
      await api.deleteEvent(event.id)
      setEvents((prev) => prev.filter((x) => x.id !== event.id))
    } catch (err) {
      setError(err)
    }
  }

  const dayEvents = eventsForDay(events, selected)
  const title = new Date(month.y, month.m, 1).toLocaleDateString([], { month: 'long', year: 'numeric' })

  return (
    <div className="calendar-wrap">
      <div className="card calendar">
        <div className="calendar-head">
          <button type="button" className="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            ‹
          </button>
          <h2>{title}</h2>
          <button type="button" className="button" onClick={() => shiftMonth(1)} aria-label="Next month">
            ›
          </button>
          <button type="button" className="button" onClick={goToday}>
            Today
          </button>
        </div>
        <div className="calendar-grid" role="grid">
          {WEEKDAYS.map((w) => (
            <div key={w} className="weekday" role="columnheader">
              {w}
            </div>
          ))}
          {days.map((day) => {
            const list = eventsForDay(events, day)
            const classes = ['day']
            if (day.getMonth() !== month.m) classes.push('other-month')
            if (sameDay(day, today)) classes.push('today')
            if (sameDay(day, selected)) classes.push('selected')
            return (
              <button
                key={day.toISOString()}
                type="button"
                role="gridcell"
                className={classes.join(' ')}
                onClick={() => selectDay(day)}
                aria-label={`${day.toDateString()}, ${list.length} event${list.length === 1 ? '' : 's'}`}
              >
                <span className="day-num">{day.getDate()}</span>
                {list.slice(0, MAX_CHIPS).map((e) => (
                  <span key={e.id} className={'event-chip' + (e.allDay ? ' all-day' : '')}>
                    {e.title}
                  </span>
                ))}
                {list.length > MAX_CHIPS && <span className="more">+{list.length - MAX_CHIPS} more</span>}
                {list.length > 0 && <span className="dots" aria-hidden="true">{'•'.repeat(Math.min(list.length, 4))}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="card day-panel">
        <div className="day-panel-head">
          <h3>{selected.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          {!draft && (
            <button type="button" className="button primary" onClick={() => setDraft(emptyEventDraft(selected))}>
              + Add event
            </button>
          )}
        </div>
        {dayEvents.length === 0 && !draft && <p className="muted">No events this day.</p>}
        <ul className="day-events">
          {dayEvents.map((e) => (
            <li key={e.id}>
              <div className="event-title">{e.title}</div>
              <div className="muted small">{formatEventWhen(e)}</div>
              {e.location && <div className="muted small">📍 {e.location}</div>}
              {e.description && <p className="rich-text small">{e.description}</p>}
              {(e.createdBy === user.id || isAdmin) && (
                <button type="button" className="link-button small danger" onClick={() => remove(e)}>
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
        {draft && (
          <form onSubmit={save}>
            <EventFields draft={draft} onChange={setDraft} />
            <label className="inline">
              <input type="checkbox" checked={shareToFeed} onChange={(e) => setShareToFeed(e.target.checked)} /> Also post to the region feed
            </label>
            <div className="row end">
              <button type="button" className="button" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button type="submit" className="button primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save event'}
              </button>
            </div>
          </form>
        )}
        <ErrorNote error={error} />
      </div>
    </div>
  )
}
