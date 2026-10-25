import { describe, expect, it } from 'vitest'
import { draftToEvent } from '../src/components/EventFields.jsx'
import { eventsForDay, monthGrid } from '../src/lib/dates.js'

describe('calendar helpers', () => {
  it('shows six full weeks starting on Sunday', () => {
    const grid = monthGrid(2026, 9) // October 2026 starts on a Thursday
    expect(grid).toHaveLength(42)
    expect(grid[0].getDay()).toBe(0)
    expect(grid[0].getDate()).toBe(27)
    expect(grid[4].getDate()).toBe(1)
  })

  it('puts multi-day all-day events on every day they cover', () => {
    const e = { id: '1', title: 'Camp', allDay: true, ...draftToEvent({ title: 'Camp', date: '2026-10-09', endDate: '2026-10-11', allDay: true, startTime: '', endTime: '', location: '', description: '' }) }
    const on = (d) => eventsForDay([e], new Date(2026, 9, d)).length
    expect([on(8), on(9), on(10), on(11), on(12)]).toEqual([0, 1, 1, 1, 0])
  })

  it('lists all-day events first, then by start time', () => {
    const at = (h) => new Date(2026, 9, 9, h).toISOString()
    const events = [
      { id: 'b', title: 'Late', allDay: false, startsAt: at(18), endsAt: null },
      { id: 'a', title: 'Early', allDay: false, startsAt: at(6), endsAt: at(7) },
      { id: 'c', title: 'All day', allDay: true, startsAt: at(0), endsAt: new Date(2026, 9, 9, 23, 59).toISOString() },
    ]
    expect(eventsForDay(events, new Date(2026, 9, 9)).map((e) => e.title)).toEqual(['All day', 'Early', 'Late'])
  })

  it('rejects events that end before they start', () => {
    expect(() => draftToEvent({ title: 'x', date: '2026-10-09', endDate: '2026-10-09', allDay: false, startTime: '09:00', endTime: '08:00', location: '', description: '' })).toThrow(/ends before/)
  })
})
