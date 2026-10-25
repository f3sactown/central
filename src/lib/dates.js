// Calendar and formatting helpers. All calendar math is in local time.

export function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// The 6 weeks (42 days) shown for a month, starting on Sunday.
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const start = addDays(first, -first.getDay())
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

// Does the event touch the given local day?
export function eventOnDay(event, day) {
  const dayStart = startOfDay(day)
  const dayEnd = addDays(dayStart, 1)
  const start = new Date(event.startsAt)
  const end = event.endsAt ? new Date(event.endsAt) : start
  // An event ending exactly at midnight does not spill into the next day.
  if (end > start && end.getTime() === dayStart.getTime()) return false
  return start < dayEnd && end >= dayStart
}

// Events for one day, all-day ones first, then by start time.
export function eventsForDay(events, day) {
  return events
    .filter((e) => eventOnDay(e, day))
    .sort((a, b) => (a.allDay === b.allDay ? a.startsAt.localeCompare(b.startsAt) : a.allDay ? -1 : 1))
}

// "YYYY-MM-DD" for <input type="date">, in local time.
export function toDateInput(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Builds a local Date from "YYYY-MM-DD" and optional "HH:MM".
export function fromInputs(date, time = '00:00') {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh || 0, mm || 0)
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function formatDate(iso, opts = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return new Date(iso).toLocaleDateString([], opts)
}

export function formatEventWhen(event) {
  if (event.allDay) {
    const start = formatDate(event.startsAt)
    if (!event.endsAt || sameDay(new Date(event.startsAt), new Date(event.endsAt))) return `${start} · All day`
    return `${start} – ${formatDate(event.endsAt)} · All day`
  }
  const start = `${formatDate(event.startsAt)} · ${formatTime(event.startsAt)}`
  if (!event.endsAt) return start
  if (sameDay(new Date(event.startsAt), new Date(event.endsAt))) return `${start} – ${formatTime(event.endsAt)}`
  return `${start} – ${formatDate(event.endsAt)} ${formatTime(event.endsAt)}`
}

export function timeAgo(iso, now = Date.now()) {
  const s = Math.round((now - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`
  return formatDate(iso, { month: 'short', day: 'numeric', year: 'numeric' })
}
