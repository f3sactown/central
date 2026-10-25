import { BUILD, VERSION_LABEL } from '../lib/build.js'

export function ChannelBadge() {
  if (BUILD.channel === 'stable') return null
  return (
    <span className="channel-badge" title={`This is ${BUILD.channel} software: expect bugs and changes.`}>
      {BUILD.channel}
    </span>
  )
}

export function VersionLabel({ className = 'muted tiny' }) {
  return (
    <span className={className} title={BUILD.date ? `Built ${new Date(BUILD.date).toLocaleString()}` : undefined}>
      {VERSION_LABEL}
    </span>
  )
}
