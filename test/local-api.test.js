import { describe, expect, it } from 'vitest'
import { createLocalApi } from '../src/api/local.js'

function memory() {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}

async function freshApi() {
  return createLocalApi({ storage: memory(), seed: false })
}

describe('demo backend', () => {
  it('lets a PAX join a region only through an invite', async () => {
    const api = await freshApi()
    await api.signUp({ email: 'q@x.com', password: 'pw', name: 'Q' })
    const regionId = await api.createRegion({ name: 'Downtown' })
    const code = await api.createInvite(regionId)
    await api.signOut()

    await api.signUp({ email: 'new@x.com', password: 'pw', name: 'New' })
    expect(await api.listMyRegions()).toEqual([])
    await expect(api.listPosts({ regionId })).resolves.toEqual([])
    await expect(api.getRegion(regionId)).rejects.toThrow(/member/)

    expect((await api.getInvite(code)).regionName).toBe('Downtown')
    expect(await api.redeemInvite(code)).toBe(regionId)
    const regions = await api.listMyRegions()
    expect(regions.map((r) => [r.name, r.role])).toEqual([['Downtown', 'member']])
  })

  it('builds the main feed from every region the PAX belongs to', async () => {
    const api = await freshApi()
    await api.signUp({ email: 'a@x.com', password: 'pw', name: 'A' })
    const r1 = await api.createRegion({ name: 'One' })
    const r2 = await api.createRegion({ name: 'Two' })
    const r3 = await api.createRegion({ name: 'Not mine' })
    await api.createPost({ regionId: r1, body: 'first' })
    await api.createPost({ regionId: r2, body: 'second' })
    await api.createPost({ regionId: r3, body: 'hidden' })
    await api.removeMember(r3, (await api.getCurrentUser()).id)

    const feed = await api.listPosts()
    expect(feed.map((p) => p.body).sort()).toEqual(['first', 'second'])
    expect((await api.listPosts({ regionId: r1 })).map((p) => p.body)).toEqual(['first'])
  })

  it('only lets admins post or pin notices', async () => {
    const api = await freshApi()
    await api.signUp({ email: 'admin@x.com', password: 'pw', name: 'Admin' })
    const regionId = await api.createRegion({ name: 'R' })
    const notice = await api.createPost({ regionId, body: 'read me', isNotice: true })
    const code = await api.createInvite(regionId)
    await api.signOut()

    await api.signUp({ email: 'm@x.com', password: 'pw', name: 'Member' })
    await api.redeemInvite(code)
    await expect(api.createPost({ regionId, body: 'x', isNotice: true })).rejects.toThrow(/admins/)
    await expect(api.setNotice(notice.id, false)).rejects.toThrow(/admins/)
    expect((await api.listPosts({ regionId, isNotice: true })).map((p) => p.body)).toEqual(['read me'])
  })

  it('toggles each emoji reaction independently', async () => {
    const api = await freshApi()
    await api.signUp({ email: 'a@x.com', password: 'pw', name: 'A' })
    const regionId = await api.createRegion({ name: 'R' })
    const post = await api.createPost({ regionId, body: 'hi' })
    expect(await api.toggleReaction(post.id, '👍')).toBe(true)
    expect(await api.toggleReaction(post.id, '🔥')).toBe(true)
    expect(await api.toggleReaction(post.id, '👍')).toBe(false)
    const [p] = await api.listPosts({ regionId })
    expect(p.reactions.map((r) => r.emoji)).toEqual(['🔥'])
  })

  it('keeps private chats to invited PAX', async () => {
    const api = await freshApi()
    await api.signUp({ email: 'a@x.com', password: 'pw', name: 'A' })
    const regionId = await api.createRegion({ name: 'R' })
    const code = await api.createInvite(regionId)
    await api.signOut()
    await api.signUp({ email: 'b@x.com', password: 'pw', name: 'B' })
    const b = await api.getCurrentUser()
    await api.redeemInvite(code)
    await api.signOut()
    await api.signUp({ email: 'c@x.com', password: 'pw', name: 'C' })
    const c = await api.getCurrentUser()
    await api.redeemInvite(code)
    await api.signOut()

    await api.signIn({ email: 'a@x.com', password: 'pw' })
    const chatId = await api.createChat({ regionId, name: 'A+B', isPrivate: true, memberIds: [b.id] })
    await api.sendMessage(chatId, 'secret')
    await api.signOut()

    await api.signIn({ email: 'c@x.com', password: 'pw' })
    expect((await api.listChats(regionId)).map((ch) => ch.name)).toEqual(['General'])
    await expect(api.listMessages(chatId)).rejects.toThrow(/not found/)
    await api.signOut()

    await api.signIn({ email: 'b@x.com', password: 'pw' })
    expect((await api.listMessages(chatId)).map((m) => m.body)).toEqual(['secret'])
    await api.addChatMembers(chatId, [c.id])
    await api.signOut()

    await api.signIn({ email: 'c@x.com', password: 'pw' })
    expect((await api.listMessages(chatId)).map((m) => m.body)).toEqual(['secret'])
  })

  it('delivers new chat messages to subscribers', async () => {
    const api = await freshApi()
    await api.signUp({ email: 'a@x.com', password: 'pw', name: 'A' })
    const regionId = await api.createRegion({ name: 'R' })
    const [general] = await api.listChats(regionId)
    const got = []
    const off = api.subscribeMessages(general.id, (m) => got.push(m.body))
    await api.sendMessage(general.id, 'hello')
    off()
    await api.sendMessage(general.id, 'after')
    expect(got).toEqual(['hello'])
  })

  it('returns events overlapping the requested range, several per day', async () => {
    const api = await freshApi()
    await api.signUp({ email: 'a@x.com', password: 'pw', name: 'A' })
    const regionId = await api.createRegion({ name: 'R' })
    const day = (h) => new Date(2026, 4, 10, h).toISOString()
    await api.createEvent({ regionId, title: 'Early', startsAt: day(5), endsAt: day(6) })
    await api.createEvent({ regionId, title: 'Late', startsAt: day(18), endsAt: day(19) })
    await api.createEvent({ regionId, title: 'Before', startsAt: new Date(2026, 3, 1).toISOString() })
    const list = await api.listEvents({ regionId, from: new Date(2026, 4, 1).toISOString(), to: new Date(2026, 5, 1).toISOString() })
    expect(list.map((e) => e.title)).toEqual(['Early', 'Late'])
  })
})
