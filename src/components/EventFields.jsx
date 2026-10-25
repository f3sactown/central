import { fromInputs, toDateInput } from '../lib/dates.js'

export function emptyEventDraft(day = new Date()) {
  const date = toDateInput(day)
  return { title: '', date, endDate: date, allDay: false, startTime: '06:00', endTime: '07:00', location: '', description: '' }
}

// Converts the form draft into the API's event fields.
export function draftToEvent(d) {
  if (!d.title.trim()) throw new Error('Event title is required')
  if (!d.date) throw new Error('Event date is required')
  const endDate = d.endDate || d.date
  const startsAt = d.allDay ? fromInputs(d.date) : fromInputs(d.date, d.startTime)
  // All-day events end at the last minute of their final day.
  const endsAt = d.allDay ? fromInputs(endDate, '23:59') : d.endTime ? fromInputs(endDate, d.endTime) : null
  if (endsAt && endsAt < startsAt) throw new Error('Event ends before it starts')
  return { title: d.title.trim(), description: d.description, location: d.location.trim(), allDay: d.allDay, startsAt: startsAt.toISOString(), endsAt: endsAt?.toISOString() ?? null }
}

export default function EventFields({ draft, onChange }) {
  const set = (k) => (e) => onChange({ ...draft, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const setStartDate = (e) => {
    const date = e.target.value
    onChange({ ...draft, date, endDate: !draft.endDate || draft.endDate < date ? date : draft.endDate })
  }
  return (
    <div className="event-fields">
      <label>
        Event title
        <input value={draft.title} onChange={set('title')} maxLength={200} required />
      </label>
      <label className="inline">
        <input type="checkbox" checked={draft.allDay} onChange={set('allDay')} /> All day
      </label>
      <div className="row">
        <label>
          Starts
          <input type="date" value={draft.date} onChange={setStartDate} required />
        </label>
        {!draft.allDay && (
          <label>
            Time
            <input type="time" value={draft.startTime} onChange={set('startTime')} required />
          </label>
        )}
      </div>
      <div className="row">
        <label>
          Ends
          <input type="date" value={draft.endDate} min={draft.date} onChange={set('endDate')} />
        </label>
        {!draft.allDay && (
          <label>
            Time
            <input type="time" value={draft.endTime} onChange={set('endTime')} />
          </label>
        )}
      </div>
      <label>
        Location
        <input value={draft.location} onChange={set('location')} maxLength={300} />
      </label>
      <label>
        Details
        <textarea value={draft.description} onChange={set('description')} rows={2} maxLength={4000} />
      </label>
    </div>
  )
}
