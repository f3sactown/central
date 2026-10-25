import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/index.js'
import Avatar from '../components/Avatar.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import RichText from '../components/RichText.jsx'
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

  if (error) return <div className="card"><ErrorNote error={error} /></div>
  if (!profile) return <p className="muted center">Loading…</p>
  // Show my own edits immediately after saving on the settings page.
  const shown = isMe ? { ...profile, name: user.name, bio: user.bio, avatarUrl: user.avatarUrl } : profile

  return (
    <div className="profile-page">
      <div className="card profile-card">
        <Avatar profile={shown} size={96} />
        <h1>{shown.name}</h1>
        {shown.bio ? <RichText text={shown.bio} /> : <p className="muted">No bio yet.</p>}
        {isMe && (
          <Link to="/settings" className="button">
            Edit profile
          </Link>
        )}
      </div>
      <div className="card">
        <h3>Repository</h3>
        <p className="muted">Coming soon: files and information attached to this PAX.</p>
      </div>
    </div>
  )
}
