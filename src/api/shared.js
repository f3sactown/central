// Shapes shared by both backends. Every API function returns objects in
// these camelCase shapes so the UI never sees backend-specific rows.
//
// Profile  { id, name, bio, avatarUrl, email? }
// Region   { id, name, description, createdAt, role }   (role = my role)
// Post     { id, regionId, region, author, body, linkUrl, imageUrls,
//            isNotice, createdAt, event, reactions: [{emoji, userId}],
//            commentCount }
// Event    { id, regionId, title, description, location, startsAt,
//            endsAt, allDay, createdBy }
// Chat     { id, regionId, name, isPrivate, createdBy, createdAt }
// Message  { id, chatId, author, body, createdAt }

export const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '💪', '🔥']

export const FEED_PAGE_SIZE = 20

export function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function normalizeUrl(url) {
  const trimmed = (url || '').trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed
}

// Turns a list of reactions into [{emoji, count, mine}] in EMOJIS order,
// followed by any other emoji in first-seen order.
export function summarizeReactions(reactions, userId) {
  const byEmoji = new Map()
  for (const r of reactions) {
    const entry = byEmoji.get(r.emoji) || { emoji: r.emoji, count: 0, mine: false }
    entry.count += 1
    if (r.userId === userId) entry.mine = true
    byEmoji.set(r.emoji, entry)
  }
  const order = (e) => {
    const i = EMOJIS.indexOf(e)
    return i === -1 ? EMOJIS.length : i
  }
  return [...byEmoji.values()].sort((a, b) => order(a.emoji) - order(b.emoji))
}
