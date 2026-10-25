import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/index.js'
import { FEED_PAGE_SIZE } from '../api/shared.js'
import ErrorNote from './ErrorNote.jsx'
import PostCard from './PostCard.jsx'

// Loads posts page by page. `query` is { regionId?, isNotice? }.
export function usePosts(query) {
  const key = JSON.stringify(query)
  const [posts, setPosts] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setPosts(null)
    setError(null)
    setLoading(true)
    api
      .listPosts(JSON.parse(key))
      .then(
        (page) => {
          if (!active) return
          setPosts(page)
          setHasMore(page.length === FEED_PAGE_SIZE)
        },
        (err) => active && setError(err),
      )
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [key])

  const loadMore = useCallback(async () => {
    if (!posts?.length) return
    setLoading(true)
    try {
      const page = await api.listPosts({ ...JSON.parse(key), before: posts[posts.length - 1].createdAt })
      setPosts((prev) => [...prev, ...page.filter((p) => !prev.some((q) => q.id === p.id))])
      setHasMore(page.length === FEED_PAGE_SIZE)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [key, posts])

  const update = useCallback((post) => setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p))), [])
  const remove = useCallback((id) => setPosts((prev) => prev.filter((p) => p.id !== id)), [])
  const prepend = useCallback((post) => setPosts((prev) => [post, ...(prev || [])]), [])

  return { posts, hasMore, loading, error, loadMore, update, remove, prepend }
}

export default function PostList({ feed, showRegion = true, emptyText = 'No posts yet.', onChange, onDelete }) {
  const { posts, hasMore, loading, error, loadMore, update, remove } = feed
  return (
    <div className="post-list">
      <ErrorNote error={error} />
      {posts === null && loading && <p className="muted center">Loading…</p>}
      {posts?.length === 0 && <p className="muted center">{emptyText}</p>}
      {posts?.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          showRegion={showRegion}
          onChange={(next) => {
            update(next)
            onChange?.(next)
          }}
          onDelete={(id) => {
            remove(id)
            onDelete?.(id)
          }}
        />
      ))}
      {hasMore && (
        <button type="button" className="button wide" onClick={loadMore} disabled={loading}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
