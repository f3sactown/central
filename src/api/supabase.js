// Supabase backend: real accounts, shared data, image storage and live chat.
// Access rules live in supabase/schema.sql (row-level security), so these
// queries only ever return what the signed-in PAX is allowed to see.

import { createClient } from '@supabase/supabase-js'
import { FEED_PAGE_SIZE, newId, normalizeUrl } from './shared.js'

const PROFILE_COLS = 'id, name, bio, avatar_url'
const EVENT_COLS = 'id, region_id, title, description, location, starts_at, ends_at, all_day, created_by'
const EVENT_SELECT = `${EVENT_COLS}, region:regions(id, name)`
const CHAT_SELECT = 'id, region_id, name, is_private, created_by, created_at, region:regions(id, name)'
const POST_SELECT = `id, region_id, body, link_url, image_urls, is_notice, created_at,
  author:profiles(${PROFILE_COLS}),
  region:regions(id, name),
  event:events(${EVENT_COLS}),
  reactions(emoji, user_id),
  comments(count)`

const profileOut = (p) => (p ? { id: p.id, name: p.name, bio: p.bio, avatarUrl: p.avatar_url } : null)

const eventOut = (e) =>
  e ? { id: e.id, regionId: e.region_id, region: e.region || null, title: e.title, description: e.description, location: e.location, startsAt: e.starts_at, endsAt: e.ends_at, allDay: e.all_day, createdBy: e.created_by } : null

const postOut = (p) => ({
  id: p.id,
  regionId: p.region_id,
  region: p.region,
  author: profileOut(p.author),
  body: p.body,
  linkUrl: p.link_url,
  imageUrls: p.image_urls || [],
  isNotice: p.is_notice,
  createdAt: p.created_at,
  event: eventOut(p.event),
  reactions: (p.reactions || []).map((r) => ({ emoji: r.emoji, userId: r.user_id })),
  commentCount: p.comments?.[0]?.count ?? 0,
})

const chatOut = (c) => ({ id: c.id, regionId: c.region_id, region: c.region || null, name: c.name, isPrivate: c.is_private, createdBy: c.created_by, createdAt: c.created_at })
const messageOut = (m) => ({ id: m.id, chatId: m.chat_id, author: profileOut(m.author), body: m.body, createdAt: m.created_at })
const commentOut = (c) => ({ id: c.id, postId: c.post_id, author: profileOut(c.author), body: c.body, createdAt: c.created_at })

// Supabase returns { data, error }; turn errors into exceptions.
function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

export function createSupabaseApi(url, anonKey) {
  const sb = createClient(url, anonKey)
  const profileCache = new Map()

  async function uid() {
    const { data } = await sb.auth.getSession()
    const id = data.session?.user?.id
    if (!id) throw new Error('Not signed in')
    return id
  }

  async function currentUser() {
    const { data } = await sb.auth.getSession()
    const user = data.session?.user
    if (!user) return null
    const { data: p } = await sb.from('profiles').select(PROFILE_COLS).eq('id', user.id).maybeSingle()
    return { ...(profileOut(p) || { id: user.id, name: user.email, bio: '', avatarUrl: null }), email: user.email }
  }

  async function upload(file, folder = '') {
    const owner = await uid()
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${owner}/${folder}${newId()}.${ext}`
    unwrap(await sb.storage.from('media').upload(path, file, { contentType: file.type, upsert: false }))
    return sb.storage.from('media').getPublicUrl(path).data.publicUrl
  }

  async function cachedProfile(id) {
    if (!id) return null
    if (!profileCache.has(id)) {
      const { data } = await sb.from('profiles').select(PROFILE_COLS).eq('id', id).maybeSingle()
      profileCache.set(id, profileOut(data))
    }
    return profileCache.get(id)
  }

  return {
    mode: 'supabase',

    // --- auth -------------------------------------------------------------
    getCurrentUser: currentUser,
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((event) => {
        if (event === 'TOKEN_REFRESHED') return
        // Defer so we don't call Supabase from inside its own auth callback.
        setTimeout(() => currentUser().then(cb), 0)
      })
      return () => data.subscription.unsubscribe()
    },
    async signUp({ email, password, name }) {
      const redirect = window.location.origin + window.location.pathname
      const data = unwrap(await sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: redirect } }))
      return { needsConfirmation: !data.session }
    },
    async signIn({ email, password }) {
      unwrap(await sb.auth.signInWithPassword({ email, password }))
    },
    async signOut() {
      unwrap(await sb.auth.signOut())
    },

    // --- profiles ---------------------------------------------------------
    async getProfile(id) {
      const p = unwrap(await sb.from('profiles').select(PROFILE_COLS).eq('id', id).maybeSingle())
      if (!p) throw new Error('PAX not found')
      return profileOut(p)
    },
    async updateProfile({ name, bio, avatarFile }) {
      const id = await uid()
      const patch = {}
      if (name !== undefined) patch.name = name.trim()
      if (bio !== undefined) patch.bio = bio
      if (avatarFile) patch.avatar_url = await upload(avatarFile, 'avatar-')
      const p = unwrap(await sb.from('profiles').update(patch).eq('id', id).select(PROFILE_COLS).single())
      profileCache.delete(id)
      return profileOut(p)
    },

    // --- regions ----------------------------------------------------------
    async listMyRegions() {
      const id = await uid()
      const rows = unwrap(await sb.from('region_members').select('role, region:regions(id, name, description, created_at)').eq('user_id', id))
      return rows
        .filter((r) => r.region)
        .map((r) => ({ id: r.region.id, name: r.region.name, description: r.region.description, createdAt: r.region.created_at, role: r.role }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    async getRegion(regionId) {
      const id = await uid()
      const r = unwrap(await sb.from('regions').select('id, name, description, created_at').eq('id', regionId).maybeSingle())
      if (!r) throw new Error('Not a member of this region')
      const m = unwrap(await sb.from('region_members').select('role').eq('region_id', regionId).eq('user_id', id).maybeSingle())
      return { id: r.id, name: r.name, description: r.description, createdAt: r.created_at, role: m?.role }
    },
    async createRegion({ name, description = '' }) {
      return unwrap(await sb.rpc('create_region', { p_name: name.trim(), p_description: description }))
    },
    async updateRegion(regionId, { name, description }) {
      const patch = {}
      if (name !== undefined) patch.name = name.trim()
      if (description !== undefined) patch.description = description
      unwrap(await sb.from('regions').update(patch).eq('id', regionId))
    },
    async listMembers(regionId) {
      const rows = unwrap(await sb.from('region_members').select(`role, joined_at, profile:profiles(${PROFILE_COLS})`).eq('region_id', regionId))
      return rows
        .filter((r) => r.profile)
        .map((r) => ({ role: r.role, joinedAt: r.joined_at, profile: profileOut(r.profile) }))
        .sort((a, b) => a.profile.name.localeCompare(b.profile.name))
    },
    async setMemberRole(regionId, userId, role) {
      unwrap(await sb.from('region_members').update({ role }).eq('region_id', regionId).eq('user_id', userId))
    },
    async removeMember(regionId, userId) {
      unwrap(await sb.from('region_members').delete().eq('region_id', regionId).eq('user_id', userId))
    },

    // --- invites ----------------------------------------------------------
    async createInvite(regionId) {
      const created_by = await uid()
      const row = unwrap(await sb.from('invites').insert({ region_id: regionId, created_by }).select('code').single())
      return row.code
    },
    async getInvite(code) {
      const rows = unwrap(await sb.rpc('get_invite', { p_code: code }))
      const r = rows?.[0]
      return r ? { regionId: r.region_id, regionName: r.region_name, regionDescription: r.region_description, valid: r.valid } : null
    },
    async redeemInvite(code) {
      return unwrap(await sb.rpc('redeem_invite', { p_code: code }))
    },

    // --- posts ------------------------------------------------------------
    async listPosts({ regionId, isNotice, before, limit = FEED_PAGE_SIZE } = {}) {
      let q = sb.from('posts').select(POST_SELECT).order('created_at', { ascending: false }).limit(limit)
      if (regionId) q = q.eq('region_id', regionId)
      if (isNotice !== undefined) q = q.eq('is_notice', isNotice)
      if (before) q = q.lt('created_at', before)
      return unwrap(await q).map(postOut)
    },
    async createPost({ regionId, body = '', linkUrl, imageFiles = [], eventId = null, isNotice = false }) {
      const author_id = await uid()
      const image_urls = []
      for (const f of imageFiles) image_urls.push(await upload(f))
      const row = unwrap(
        await sb
          .from('posts')
          .insert({ region_id: regionId, author_id, body, link_url: normalizeUrl(linkUrl), image_urls, event_id: eventId, is_notice: isNotice })
          .select(POST_SELECT)
          .single(),
      )
      return postOut(row)
    },
    async deletePost(postId) {
      unwrap(await sb.from('posts').delete().eq('id', postId))
    },
    async setNotice(postId, isNotice) {
      unwrap(await sb.from('posts').update({ is_notice: isNotice }).eq('id', postId))
    },

    // --- reactions & comments --------------------------------------------
    async toggleReaction(postId, emoji) {
      const user_id = await uid()
      const existing = unwrap(await sb.from('reactions').select('emoji').eq('post_id', postId).eq('user_id', user_id).eq('emoji', emoji))
      if (existing.length) {
        unwrap(await sb.from('reactions').delete().eq('post_id', postId).eq('user_id', user_id).eq('emoji', emoji))
        return false
      }
      unwrap(await sb.from('reactions').insert({ post_id: postId, user_id, emoji }))
      return true
    },
    async listComments(postId) {
      const rows = unwrap(await sb.from('comments').select(`id, post_id, body, created_at, author:profiles(${PROFILE_COLS})`).eq('post_id', postId).order('created_at'))
      return rows.map(commentOut)
    },
    async addComment(postId, body) {
      const author_id = await uid()
      const row = unwrap(await sb.from('comments').insert({ post_id: postId, author_id, body: body.trim() }).select(`id, post_id, body, created_at, author:profiles(${PROFILE_COLS})`).single())
      return commentOut(row)
    },
    async deleteComment(commentId) {
      unwrap(await sb.from('comments').delete().eq('id', commentId))
    },

    // --- events -----------------------------------------------------------
    // Without a regionId, returns events from every region I belong to (RLS).
    async listEvents({ regionId, from, to }) {
      // Events overlapping [from, to): starts before `to` and ends (or starts) after `from`.
      let q = sb
        .from('events')
        .select(EVENT_SELECT)
        .lt('starts_at', to)
        .or(`ends_at.gte.${from},and(ends_at.is.null,starts_at.gte.${from})`)
        .order('starts_at')
      if (regionId) q = q.eq('region_id', regionId)
      return unwrap(await q).map(eventOut)
    },
    async createEvent({ regionId, title, description = '', location = '', startsAt, endsAt = null, allDay = false }) {
      const created_by = await uid()
      const row = unwrap(
        await sb
          .from('events')
          .insert({ region_id: regionId, created_by, title: title.trim(), description, location, starts_at: startsAt, ends_at: endsAt, all_day: allDay })
          .select(EVENT_SELECT)
          .single(),
      )
      return eventOut(row)
    },
    async deleteEvent(eventId) {
      unwrap(await sb.from('events').delete().eq('id', eventId))
    },

    // --- chats ------------------------------------------------------------
    // Without a regionId, returns chats from every region I belong to (RLS).
    async listChats(regionId) {
      let q = sb.from('chats').select(CHAT_SELECT).order('created_at')
      if (regionId) q = q.eq('region_id', regionId)
      return unwrap(await q).map(chatOut)
    },
    async getChat(chatId) {
      const row = unwrap(await sb.from('chats').select(CHAT_SELECT).eq('id', chatId).maybeSingle())
      if (!row) throw new Error('Chat not found')
      return chatOut(row)
    },
    async createChat({ regionId, name, isPrivate, memberIds = [] }) {
      return unwrap(await sb.rpc('create_chat', { p_region: regionId, p_name: name.trim(), p_private: isPrivate, p_members: memberIds }))
    },
    async listChatMembers(chatId) {
      const chat = unwrap(await sb.from('chats').select('region_id, is_private').eq('id', chatId).single())
      if (!chat.is_private) return (await this.listMembers(chat.region_id)).map((m) => m.profile)
      const rows = unwrap(await sb.from('chat_members').select(`profile:profiles(${PROFILE_COLS})`).eq('chat_id', chatId))
      return rows.map((r) => profileOut(r.profile)).filter(Boolean)
    },
    async addChatMembers(chatId, userIds) {
      unwrap(await sb.rpc('add_chat_members', { p_chat: chatId, p_members: userIds }))
    },
    async leaveChat(chatId) {
      const id = await uid()
      unwrap(await sb.from('chat_members').delete().eq('chat_id', chatId).eq('user_id', id))
    },
    async listMessages(chatId) {
      const rows = unwrap(
        await sb.from('messages').select(`id, chat_id, body, created_at, author:profiles(${PROFILE_COLS})`).eq('chat_id', chatId).order('created_at', { ascending: false }).limit(200),
      )
      return rows.reverse().map(messageOut)
    },
    async sendMessage(chatId, body) {
      const author_id = await uid()
      const row = unwrap(await sb.from('messages').insert({ chat_id: chatId, author_id, body: body.trim() }).select(`id, chat_id, body, created_at, author:profiles(${PROFILE_COLS})`).single())
      return messageOut(row)
    },
    subscribeMessages(chatId, cb) {
      const channel = sb
        .channel(`chat:${chatId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, async ({ new: m }) => {
          cb({ id: m.id, chatId: m.chat_id, author: await cachedProfile(m.author_id), body: m.body, createdAt: m.created_at })
        })
        .subscribe()
      return () => sb.removeChannel(channel)
    },
  }
}
