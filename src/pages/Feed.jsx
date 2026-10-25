import { Link } from 'react-router-dom'
import PostComposer from '../components/PostComposer.jsx'
import PostList, { usePosts } from '../components/PostList.jsx'
import { useRegions } from '../context/AppContext.jsx'

// The main feed: posts from every region the PAX belongs to.
export default function Feed() {
  const { regions } = useRegions()
  const feed = usePosts({})

  if (regions?.length === 0) {
    return (
      <div className="card empty-state">
        <h2>Welcome to Central</h2>
        <p>You join a region by being invited. Open the invite link you were sent, or enter the code on the Regions page.</p>
        <Link to="/regions" className="button primary">
          Go to Regions
        </Link>
      </div>
    )
  }

  return (
    <div className="feed">
      <h1 className="page-title">Feed</h1>
      {regions && <PostComposer regions={regions} onPosted={feed.prepend} />}
      <PostList feed={feed} emptyText="Nothing here yet. Be the first to post!" />
    </div>
  )
}
