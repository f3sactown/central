import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChannelBadge } from '../components/BuildInfo.jsx'
import Icon from '../components/Icon.jsx'
import PostCard from '../components/PostCard.jsx'
import PostComposer from '../components/PostComposer.jsx'
import PostList, { usePosts } from '../components/PostList.jsx'
import ScreenHeader from '../components/ScreenHeader.jsx'
import Sheet from '../components/Sheet.jsx'
import { useRegions } from '../context/AppContext.jsx'
import { useRegionFilter } from '../lib/regionFilter.js'

const NOTICES_SHOWN = 2

// Home: pinned notices, then the feed, for all my regions or the filtered one.
export default function Feed() {
  const { regions } = useRegions()
  const [regionId] = useRegionFilter()
  const scope = regionId || undefined
  const notices = usePosts({ regionId: scope, isNotice: true })
  const feed = usePosts({ regionId: scope, isNotice: false })
  const [composing, setComposing] = useState(false)
  const [allNotices, setAllNotices] = useState(false)

  // Pinning or unpinning moves a post between the two lists.
  function handleChange(post) {
    const wasNotice = notices.posts?.some((p) => p.id === post.id) ?? false
    if (post.isNotice === wasNotice) return (post.isNotice ? notices : feed).update(post)
    ;(wasNotice ? notices : feed).remove(post.id)
    ;(post.isNotice ? notices : feed).prepend(post)
  }

  const title = (
    <>
      Central
      <ChannelBadge />
    </>
  )

  if (regions?.length === 0) {
    return (
      <>
        <ScreenHeader title={title} />
        <div className="empty-state">
          <Icon name="regions" size={40} />
          <h2>Welcome to Central</h2>
          <p>You join a region by being invited. Open the invite link you were sent, or enter the code on the Regions tab.</p>
          <Link to="/regions" className="button primary">
            Go to Regions
          </Link>
        </div>
      </>
    )
  }

  const pinned = notices.posts || []
  const shownNotices = allNotices ? pinned : pinned.slice(0, NOTICES_SHOWN)
  const composeRegions = regionId ? regions?.filter((r) => r.id === regionId) : regions

  return (
    <>
      <ScreenHeader title={title} filter />
      <div className="feed">
        {pinned.length > 0 && (
          <section className="notices" aria-label="Notices">
            <h2 className="section-label">
              <Icon name="pin" size={16} /> Notices
            </h2>
            {shownNotices.map((p) => (
              <PostCard key={p.id} post={p} showRegion={!regionId} onChange={handleChange} onDelete={notices.remove} />
            ))}
            {pinned.length > NOTICES_SHOWN && (
              <button type="button" className="link-button more-notices" onClick={() => setAllNotices((v) => !v)}>
                {allNotices ? 'Show fewer notices' : `Show all ${pinned.length} notices`}
              </button>
            )}
          </section>
        )}
        <PostList feed={feed} showRegion={!regionId} emptyText="Nothing here yet. Tap + to post." onChange={handleChange} />
      </div>
      {regions && (
        <button type="button" className="fab" onClick={() => setComposing(true)} aria-label="New post">
          <Icon name="plus" size={26} />
        </button>
      )}
      {composing && (
        <Sheet title="New post" onClose={() => setComposing(false)}>
          <PostComposer
            regions={composeRegions}
            onPosted={(p) => {
              ;(p.isNotice ? notices : feed).prepend(p)
              setComposing(false)
            }}
          />
        </Sheet>
      )}
    </>
  )
}
