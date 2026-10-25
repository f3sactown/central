// Demo backend: keeps everything in this browser's localStorage so the app
// is usable on GitHub Pages before a Supabase project is connected.
// Not secure and not shared between devices — for trying the app out only.

import { FEED_PAGE_SIZE, newId, normalizeUrl } from './shared.js'

const DB_KEY = 'central-demo-db-v1'
const SESSION_KEY = 'central-demo-session'
export const DEMO_INVITE_CODE = 'DEMO'

function memoryStorage() {
  const data = new Map()
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  }
}

function defaultStorage() {
  try {
    const s = globalThis.localStorage
    s.setItem('central-probe', '1')
    s.removeItem('central-probe')
    return s
  } catch {
    return memoryStorage()
  }
}

function seedDb() {
  const now = Date.now()
  const hour = 3600e3
  const day = 24 * hour
  const at = (ms) => new Date(ms).toISOString()
  const users = [
    { id: 'u-demo', email: 'demo@pax.local', password: 'demo', name: 'Demo PAX', bio: 'Exploring the demo.', avatarUrl: null },
    { id: 'u-sparky', email: 'sparky@pax.local', password: 'demo', name: 'Sparky', bio: 'Site Q for Saturday beatdowns.', avatarUrl: null },
    { id: 'u-gator', email: 'gator@pax.local', password: 'demo', name: 'Gator', bio: 'Coffeeteria regular.', avatarUrl: null },
  ].map((u) => ({ ...u, createdAt: at(now - 30 * day) }))
  const regions = [
    { id: 'r-demo', name: 'Demo Region', description: 'A sample region to try things out.', createdBy: 'u-sparky', createdAt: at(now - 30 * day) },
    { id: 'r-north', name: 'North Side', description: 'Second sample region.', createdBy: 'u-demo', createdAt: at(now - 20 * day) },
  ]
  const members = [
    { regionId: 'r-demo', userId: 'u-sparky', role: 'admin', joinedAt: at(now - 30 * day) },
    { regionId: 'r-demo', userId: 'u-gator', role: 'member', joinedAt: at(now - 29 * day) },
    { regionId: 'r-demo', userId: 'u-demo', role: 'member', joinedAt: at(now - 28 * day) },
    { regionId: 'r-north', userId: 'u-demo', role: 'admin', joinedAt: at(now - 20 * day) },
    { regionId: 'r-north', userId: 'u-gator', role: 'member', joinedAt: at(now - 19 * day) },
  ]
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const sat = new Date(startOfToday)
  sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7))
  sat.setHours(6, 30)
  const events = [
    { id: 'e-1', regionId: 'r-demo', createdBy: 'u-sparky', title: 'Saturday beatdown', description: 'Bring a coupon.', location: 'Central Park', startsAt: at(sat.getTime()), endsAt: at(sat.getTime() + hour), allDay: false, createdAt: at(now - 2 * day) },
    { id: 'e-2', regionId: 'r-demo', createdBy: 'u-gator', title: 'Coffeeteria', description: '', location: 'Corner cafe', startsAt: at(sat.getTime() + 1.5 * hour), endsAt: at(sat.getTime() + 2.5 * hour), allDay: false, createdAt: at(now - 2 * day) },
    { id: 'e-3', regionId: 'r-north', createdBy: 'u-demo', title: 'Ruck day', description: '', location: '', startsAt: at(startOfToday.getTime() + 3 * day), endsAt: null, allDay: true, createdAt: at(now - day) },
  ]
  const posts = [
    { id: 'p-1', regionId: 'r-demo', authorId: 'u-sparky', body: 'Welcome to the Demo Region! Read the notices, check the calendar, and say hi in the General chat.', linkUrl: null, imageUrls: [], eventId: null, isNotice: true, createdAt: at(now - 5 * day) },
    { id: 'p-2', regionId: 'r-demo', authorId: 'u-sparky', body: 'Saturday beatdown is on the calendar. HC below!', linkUrl: null, imageUrls: [], eventId: 'e-1', isNotice: false, createdAt: at(now - 2 * day) },
    { id: 'p-3', regionId: 'r-north', authorId: 'u-gator', body: 'Good read on rucking form:', linkUrl: 'https://en.wikipedia.org/wiki/Rucking', imageUrls: [], eventId: null, isNotice: false, createdAt: at(now - 6 * hour) },
  ]
  const reactions = [
    { postId: 'p-1', userId: 'u-gator', emoji: '👍', createdAt: at(now - 4 * day) },
    { postId: 'p-2', userId: 'u-gator', emoji: '💪', createdAt: at(now - day) },
    { postId: 'p-2', userId: 'u-demo', emoji: '💪', createdAt: at(now - day) },
  ]
  const comments = [
    { id: 'c-1', postId: 'p-2', authorId: 'u-gator', body: 'HC!', createdAt: at(now - day) },
  ]
  const chats = [
    { id: 'ch-1', regionId: 'r-demo', name: 'General', isPrivate: false, createdBy: 'u-sparky', createdAt: at(now - 30 * day) },
    { id: 'ch-2', regionId: 'r-north', name: 'General', isPrivate: false, createdBy: 'u-demo', createdAt: at(now - 20 * day) },
  ]
  const messages = [
    { id: 'm-1', chatId: 'ch-1', authorId: 'u-sparky', body: 'Who is in for Saturday?', createdAt: at(now - 3 * hour) },
    { id: 'm-2', chatId: 'ch-1', authorId: 'u-gator', body: 'Count me in.', createdAt: at(now - 2 * hour) },
  ]
  const invites = [
    { code: DEMO_INVITE_CODE, regionId: 'r-demo', createdBy: 'u-sparky', createdAt: at(now - 30 * day), expiresAt: null, maxUses: null, uses: 0 },
  ]
  return { users, regions, members, invites, events, posts, reactions, comments, chats, chatMembers: [], messages }
}

const emptyDb = () => ({ users: [], regions: [], members: [], invites: [], events: [], posts: [], reactions: [], comments: [], chats: [], chatMembers: [], messages: [] })

// Downscales an image file to a data URL so it fits in localStorage.
async function fileToDataUrl(file, maxSize = 1280) {
  const raw = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  if (typeof document === 'undefined') return raw
  const img = await new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = raw
  })
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

export function createLocalApi({ storage = defaultStorage(), seed = true } = {}) {
  let db
  try {
    db = JSON.parse(storage.getItem(DB_KEY))
  } catch {
    db = null
  }
  if (!db) db = seed ? seedDb() : emptyDb()

  const authListeners = new Set()
  const messageListeners = new Map() // chatId -> Set(cb)

  function save() {
    try {
      storage.setItem(DB_KEY, JSON.stringify(db))
    } catch (e) {
      throw new Error('Demo storage is full. Try smaller images, or reset the demo data. (' + e.message + ')')
    }
  }
  save()

  function sessionUserId() {
    try {
      return storage.getItem(SESSION_KEY)
    } catch {
      return null
    }
  }

  function me() {
    const id = sessionUserId()
    const user = id && db.users.find((u) => u.id === id)
    if (!user) throw new Error('Not signed in')
    return user
  }

  const profile = (u) => (u ? { id: u.id, name: u.name, bio: u.bio, avatarUrl: u.avatarUrl } : null)
  const userById = (id) => db.users.find((u) => u.id === id)
  const membership = (regionId, userId = me().id) =>
    db.members.find((m) => m.regionId === regionId && m.userId === userId)
  const isAdmin = (regionId) => membership(regionId)?.role === 'admin'

  function requireMember(regionId) {
    const m = membership(regionId)
    if (!m) throw new Error('Not a member of this region')
    return m
  }

  function canAccessChat(chat) {
    if (!chat || !membership(chat.regionId)) return false
    return !chat.isPrivate || db.chatMembers.some((cm) => cm.chatId === chat.id && cm.userId === me().id)
  }

  function requireChat(chatId) {
    const chat = db.chats.find((c) => c.id === chatId)
    if (!canAccessChat(chat)) throw new Error('Chat not found')
    return chat
  }

  const eventOut = (e) => (e ? { id: e.id, regionId: e.regionId, title: e.title, description: e.description, location: e.location, startsAt: e.startsAt, endsAt: e.endsAt, allDay: e.allDay, createdBy: e.createdBy } : null)

  function postOut(p) {
    const region = db.regions.find((r) => r.id === p.regionId)
    return {
      id: p.id,
      regionId: p.regionId,
      region: region ? { id: region.id, name: region.name } : null,
      author: profile(userById(p.authorId)),
      body: p.body,
      linkUrl: p.linkUrl,
      imageUrls: p.imageUrls,
      isNotice: p.isNotice,
      createdAt: p.createdAt,
      event: eventOut(db.events.find((e) => e.id === p.eventId)),
      reactions: db.reactions.filter((r) => r.postId === p.id).map((r) => ({ emoji: r.emoji, userId: r.userId })),
      commentCount: db.comments.filter((c) => c.postId === p.id).length,
    }
  }

  const messageOut = (m) => ({ id: m.id, chatId: m.chatId, author: profile(userById(m.authorId)), body: m.body, createdAt: m.createdAt })
  const chatOut = (c) => ({ id: c.id, regionId: c.regionId, name: c.name, isPrivate: c.isPrivate, createdBy: c.createdBy, createdAt: c.createdAt })

  function emitAuth() {
    const id = sessionUserId()
    const u = id ? userById(id) : null
    for (const cb of authListeners) cb(u ? { ...profile(u), email: u.email } : null)
  }

  // Keep other tabs of the demo in sync.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === DB_KEY && e.newValue) {
        const before = new Set(db.messages.map((m) => m.id))
        db = JSON.parse(e.newValue)
        for (const m of db.messages) {
          if (!before.has(m.id)) messageListeners.get(m.chatId)?.forEach((cb) => cb(messageOut(m)))
        }
      }
      if (e.key === SESSION_KEY) emitAuth()
    })
  }

  const ok = (v) => Promise.resolve(v)
  const wrap = (fn) => (...args) => {
    try {
      return ok(fn(...args))
    } catch (e) {
      return Promise.reject(e)
    }
  }

  return {
    mode: 'demo',
    demoInviteCode: DEMO_INVITE_CODE,

    resetDemo: wrap(() => {
      db = seedDb()
      save()
      storage.removeItem(SESSION_KEY)
      emitAuth()
    }),

    // --- auth -------------------------------------------------------------
    getCurrentUser: wrap(() => {
      const id = sessionUserId()
      const u = id && userById(id)
      return u ? { ...profile(u), email: u.email } : null
    }),
    onAuthChange(cb) {
      authListeners.add(cb)
      return () => authListeners.delete(cb)
    },
    signUp: wrap(({ email, password, name }) => {
      email = email.trim().toLowerCase()
      if (!email || !password) throw new Error('Email and password are required')
      if (db.users.some((u) => u.email === email)) throw new Error('An account with that email already exists')
      const user = { id: newId(), email, password, name: name.trim() || email.split('@')[0], bio: '', avatarUrl: null, createdAt: new Date().toISOString() }
      db.users.push(user)
      save()
      storage.setItem(SESSION_KEY, user.id)
      emitAuth()
      return { needsConfirmation: false }
    }),
    signIn: wrap(({ email, password }) => {
      const user = db.users.find((u) => u.email === email.trim().toLowerCase())
      if (!user || user.password !== password) throw new Error('Wrong email or password')
      storage.setItem(SESSION_KEY, user.id)
      emitAuth()
    }),
    signOut: wrap(() => {
      storage.removeItem(SESSION_KEY)
      emitAuth()
    }),

    // --- profiles ---------------------------------------------------------
    getProfile: wrap((id) => {
      const viewer = me()
      const u = userById(id)
      const shares = db.members.some((a) => a.userId === viewer.id && db.members.some((b) => b.userId === id && b.regionId === a.regionId))
      if (!u || (id !== viewer.id && !shares)) throw new Error('PAX not found')
      return profile(u)
    }),
    updateProfile: async ({ name, bio, avatarFile }) => {
      const u = me()
      const avatarUrl = avatarFile ? await fileToDataUrl(avatarFile, 256) : undefined
      if (name !== undefined) u.name = name.trim()
      if (bio !== undefined) u.bio = bio
      if (avatarUrl) u.avatarUrl = avatarUrl
      save()
      emitAuth()
      return profile(u)
    },

    // --- regions ----------------------------------------------------------
    listMyRegions: wrap(() => {
      const uid = me().id
      return db.members
        .filter((m) => m.userId === uid)
        .map((m) => ({ ...db.regions.find((r) => r.id === m.regionId), role: m.role }))
        .filter((r) => r.id)
        .sort((a, b) => a.name.localeCompare(b.name))
    }),
    getRegion: wrap((id) => {
      const m = requireMember(id)
      return { ...db.regions.find((r) => r.id === id), role: m.role }
    }),
    createRegion: wrap(({ name, description = '' }) => {
      const uid = me().id
      if (!name.trim()) throw new Error('Region name is required')
      const now = new Date().toISOString()
      const region = { id: newId(), name: name.trim(), description, createdBy: uid, createdAt: now }
      db.regions.push(region)
      db.members.push({ regionId: region.id, userId: uid, role: 'admin', joinedAt: now })
      db.chats.push({ id: newId(), regionId: region.id, name: 'General', isPrivate: false, createdBy: uid, createdAt: now })
      save()
      return region.id
    }),
    updateRegion: wrap((id, { name, description }) => {
      if (!isAdmin(id)) throw new Error('Only admins can edit the region')
      const r = db.regions.find((x) => x.id === id)
      if (name !== undefined) r.name = name.trim()
      if (description !== undefined) r.description = description
      save()
    }),
    listMembers: wrap((regionId) => {
      requireMember(regionId)
      return db.members
        .filter((m) => m.regionId === regionId)
        .map((m) => ({ role: m.role, joinedAt: m.joinedAt, profile: profile(userById(m.userId)) }))
        .sort((a, b) => a.profile.name.localeCompare(b.profile.name))
    }),
    setMemberRole: wrap((regionId, userId, role) => {
      if (!isAdmin(regionId)) throw new Error('Only admins can change roles')
      membership(regionId, userId).role = role
      save()
    }),
    removeMember: wrap((regionId, userId) => {
      if (userId !== me().id && !isAdmin(regionId)) throw new Error('Only admins can remove PAX')
      db.members = db.members.filter((m) => !(m.regionId === regionId && m.userId === userId))
      save()
    }),

    // --- invites ----------------------------------------------------------
    createInvite: wrap((regionId) => {
      requireMember(regionId)
      const code = newId().replace(/-/g, '').slice(0, 12)
      db.invites.push({ code, regionId, createdBy: me().id, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 14 * 864e5).toISOString(), maxUses: null, uses: 0 })
      save()
      return code
    }),
    getInvite: wrap((code) => {
      const inv = db.invites.find((i) => i.code === code)
      if (!inv) return null
      const r = db.regions.find((x) => x.id === inv.regionId)
      const valid = (!inv.expiresAt || new Date(inv.expiresAt) > new Date()) && (inv.maxUses == null || inv.uses < inv.maxUses)
      return { regionId: r.id, regionName: r.name, regionDescription: r.description, valid }
    }),
    redeemInvite: wrap((code) => {
      const uid = me().id
      const inv = db.invites.find((i) => i.code === code)
      if (!inv) throw new Error('Invite not found')
      if (membership(inv.regionId)) return inv.regionId
      if (inv.expiresAt && new Date(inv.expiresAt) <= new Date()) throw new Error('Invite has expired')
      if (inv.maxUses != null && inv.uses >= inv.maxUses) throw new Error('Invite has been used up')
      db.members.push({ regionId: inv.regionId, userId: uid, role: 'member', joinedAt: new Date().toISOString() })
      inv.uses += 1
      save()
      return inv.regionId
    }),

    // --- posts ------------------------------------------------------------
    listPosts: wrap(({ regionId, isNotice, before, limit = FEED_PAGE_SIZE } = {}) => {
      const uid = me().id
      const mine = new Set(db.members.filter((m) => m.userId === uid).map((m) => m.regionId))
      return db.posts
        .filter((p) => mine.has(p.regionId))
        .filter((p) => !regionId || p.regionId === regionId)
        .filter((p) => isNotice === undefined || p.isNotice === isNotice)
        .filter((p) => !before || p.createdAt < before)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit)
        .map(postOut)
    }),
    createPost: async ({ regionId, body = '', linkUrl, imageFiles = [], eventId = null, isNotice = false }) => {
      requireMember(regionId)
      if (isNotice && !isAdmin(regionId)) throw new Error('Only admins can post notices')
      const imageUrls = []
      for (const f of imageFiles) imageUrls.push(await fileToDataUrl(f))
      const post = { id: newId(), regionId, authorId: me().id, body, linkUrl: normalizeUrl(linkUrl), imageUrls, eventId, isNotice, createdAt: new Date().toISOString() }
      db.posts.push(post)
      save()
      return postOut(post)
    },
    deletePost: wrap((postId) => {
      const p = db.posts.find((x) => x.id === postId)
      if (!p || (p.authorId !== me().id && !isAdmin(p.regionId))) throw new Error('Not allowed')
      db.posts = db.posts.filter((x) => x.id !== postId)
      db.reactions = db.reactions.filter((r) => r.postId !== postId)
      db.comments = db.comments.filter((c) => c.postId !== postId)
      save()
    }),
    setNotice: wrap((postId, isNotice) => {
      const p = db.posts.find((x) => x.id === postId)
      if (!p || !isAdmin(p.regionId)) throw new Error('Only admins can change notices')
      p.isNotice = isNotice
      save()
    }),

    // --- reactions & comments --------------------------------------------
    toggleReaction: wrap((postId, emoji) => {
      const uid = me().id
      const p = db.posts.find((x) => x.id === postId)
      requireMember(p?.regionId)
      const i = db.reactions.findIndex((r) => r.postId === postId && r.userId === uid && r.emoji === emoji)
      if (i >= 0) db.reactions.splice(i, 1)
      else db.reactions.push({ postId, userId: uid, emoji, createdAt: new Date().toISOString() })
      save()
      return i < 0
    }),
    listComments: wrap((postId) => {
      requireMember(db.posts.find((x) => x.id === postId)?.regionId)
      return db.comments
        .filter((c) => c.postId === postId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((c) => ({ id: c.id, postId, author: profile(userById(c.authorId)), body: c.body, createdAt: c.createdAt }))
    }),
    addComment: wrap((postId, body) => {
      requireMember(db.posts.find((x) => x.id === postId)?.regionId)
      if (!body.trim()) throw new Error('Comment is empty')
      const c = { id: newId(), postId, authorId: me().id, body: body.trim(), createdAt: new Date().toISOString() }
      db.comments.push(c)
      save()
      return { id: c.id, postId, author: profile(me()), body: c.body, createdAt: c.createdAt }
    }),
    deleteComment: wrap((commentId) => {
      const c = db.comments.find((x) => x.id === commentId)
      const p = c && db.posts.find((x) => x.id === c.postId)
      if (!c || (c.authorId !== me().id && !isAdmin(p?.regionId))) throw new Error('Not allowed')
      db.comments = db.comments.filter((x) => x.id !== commentId)
      save()
    }),

    // --- events -----------------------------------------------------------
    listEvents: wrap(({ regionId, from, to }) => {
      requireMember(regionId)
      return db.events
        .filter((e) => e.regionId === regionId)
        .filter((e) => (e.endsAt || e.startsAt) >= from && e.startsAt < to)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .map(eventOut)
    }),
    createEvent: wrap(({ regionId, title, description = '', location = '', startsAt, endsAt = null, allDay = false }) => {
      requireMember(regionId)
      if (!title.trim()) throw new Error('Event title is required')
      if (endsAt && endsAt < startsAt) throw new Error('Event ends before it starts')
      const e = { id: newId(), regionId, createdBy: me().id, title: title.trim(), description, location, startsAt, endsAt, allDay, createdAt: new Date().toISOString() }
      db.events.push(e)
      save()
      return eventOut(e)
    }),
    deleteEvent: wrap((eventId) => {
      const e = db.events.find((x) => x.id === eventId)
      if (!e || (e.createdBy !== me().id && !isAdmin(e.regionId))) throw new Error('Not allowed')
      db.events = db.events.filter((x) => x.id !== eventId)
      for (const p of db.posts) if (p.eventId === eventId) p.eventId = null
      save()
    }),

    // --- chats ------------------------------------------------------------
    listChats: wrap((regionId) => {
      requireMember(regionId)
      return db.chats
        .filter((c) => c.regionId === regionId && canAccessChat(c))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map(chatOut)
    }),
    getChat: wrap((chatId) => chatOut(requireChat(chatId))),
    createChat: wrap(({ regionId, name, isPrivate, memberIds = [] }) => {
      requireMember(regionId)
      if (!name.trim()) throw new Error('Chat name is required')
      const uid = me().id
      const chat = { id: newId(), regionId, name: name.trim(), isPrivate, createdBy: uid, createdAt: new Date().toISOString() }
      db.chats.push(chat)
      if (isPrivate) {
        for (const id of new Set([uid, ...memberIds])) {
          if (membership(regionId, id)) db.chatMembers.push({ chatId: chat.id, userId: id, addedAt: chat.createdAt })
        }
      }
      save()
      return chat.id
    }),
    listChatMembers: wrap((chatId) => {
      const chat = requireChat(chatId)
      const ids = chat.isPrivate
        ? db.chatMembers.filter((cm) => cm.chatId === chatId).map((cm) => cm.userId)
        : db.members.filter((m) => m.regionId === chat.regionId).map((m) => m.userId)
      return ids.map((id) => profile(userById(id))).filter(Boolean)
    }),
    addChatMembers: wrap((chatId, userIds) => {
      const chat = requireChat(chatId)
      if (!chat.isPrivate) return
      for (const id of userIds) {
        const already = db.chatMembers.some((cm) => cm.chatId === chatId && cm.userId === id)
        if (!already && membership(chat.regionId, id)) db.chatMembers.push({ chatId, userId: id, addedAt: new Date().toISOString() })
      }
      save()
    }),
    leaveChat: wrap((chatId) => {
      const uid = me().id
      db.chatMembers = db.chatMembers.filter((cm) => !(cm.chatId === chatId && cm.userId === uid))
      save()
    }),
    listMessages: wrap((chatId) => {
      requireChat(chatId)
      return db.messages
        .filter((m) => m.chatId === chatId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(-200)
        .map(messageOut)
    }),
    sendMessage: wrap((chatId, body) => {
      requireChat(chatId)
      if (!body.trim()) throw new Error('Message is empty')
      const m = { id: newId(), chatId, authorId: me().id, body: body.trim(), createdAt: new Date().toISOString() }
      db.messages.push(m)
      save()
      const out = messageOut(m)
      messageListeners.get(chatId)?.forEach((cb) => cb(out))
      return out
    }),
    subscribeMessages(chatId, cb) {
      if (!messageListeners.has(chatId)) messageListeners.set(chatId, new Set())
      messageListeners.get(chatId).add(cb)
      return () => messageListeners.get(chatId)?.delete(cb)
    },
  }
}
