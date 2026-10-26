import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/index.js'
import Avatar from '../components/Avatar.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import RichText from '../components/RichText.jsx'
import ScreenHeader from '../components/ScreenHeader.jsx'
import { useAuth } from '../context/AppContext.jsx'

export default function Profile() {
  const { userId } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const isMe = userId === user.id

  useEffect(() => {
    setProfile(null)
    setError(null)
    api.getProfile(userId).then(setProfile, setError)
  }, [userId])

  if (error)
    return (
      <>
        <ScreenHeader title="PAX" back />
        <div className="screen-body">
          <ErrorNote error={error} />
        </div>
      </>
    )
  if (!profile) return <ScreenHeader title="Loading…" back />
  // Show my own edits immediately after saving on the Me tab.
  const shown = isMe ? { ...profile, name: user.name, bio: user.bio, avatarUrl: user.avatarUrl } : profile

  return (
    <>
      <ScreenHeader title={shown.name} back />
      <div className="screen-body">
        <div className="panel profile-card">
          <Avatar profile={shown} size={96} />
          <h1>{shown.name}</h1>
          {shown.bio ? <RichText text={shown.bio} /> : <p className="muted">No bio yet.</p>}
          {isMe && (
            <Link to="/me" className="button">
              Edit profile
            </Link>
          )}
        </div>
        <section className="panel">
          <h2 className="section-label">Repository</h2>
          <p className="muted">Coming soon: files and information attached to this PAX.</p>
        </section>
      </div>
    </>
  )
}
