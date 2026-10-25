const COLORS = ['#2563eb', '#475569', '#1e40af', '#64748b', '#0369a1', '#334155', '#1d4ed8', '#52525b']

function colorFor(id = '') {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}

export default function Avatar({ profile, size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.42 }
  if (profile?.avatarUrl) return <img className="avatar" style={style} src={profile.avatarUrl} alt="" />
  const initials = (profile?.name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  return (
    <span className="avatar" style={{ ...style, background: colorFor(profile?.id) }} aria-hidden="true">
      {initials || '?'}
    </span>
  )
}
