import Avatar from './Avatar.jsx'

// Checkbox list of PAX. `members` are profiles; `selected` is a Set of ids.
export default function MemberPicker({ members, selected, onChange }) {
  if (!members.length) return <p className="muted small">No one else to invite yet.</p>
  const toggle = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }
  return (
    <ul className="member-picker">
      {members.map((m) => (
        <li key={m.id}>
          <label className="inline">
            <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
            <Avatar profile={m} size={24} /> {m.name}
          </label>
        </li>
      ))}
    </ul>
  )
}
