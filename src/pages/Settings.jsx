import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/index.js'
import Avatar from '../components/Avatar.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import { useAuth } from '../context/AppContext.jsx'

export default function Settings() {
  const { user, setUser } = useAuth()
  const [params] = useSearchParams()
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!avatarFile) return setPreview(null)
    const url = URL.createObjectURL(avatarFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const p = await api.updateProfile({ name, bio, avatarFile })
      setUser({ ...user, ...p })
      setAvatarFile(null)
      setSaved(true)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="settings-page">
      <h1 className="page-title">{params.get('welcome') ? 'Welcome! Set up your profile' : 'Edit profile'}</h1>
      <form className="card stack" onSubmit={submit}>
        <div className="avatar-edit">
          <Avatar profile={{ ...user, name, avatarUrl: preview || user.avatarUrl }} size={88} />
          <label className="button">
            Change photo
            <input type="file" accept="image/*" hidden onChange={(e) => setAvatarFile(e.target.files[0] || null)} />
          </label>
        </div>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
        </label>
        <label>
          Bio
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={1000} placeholder="Tell other PAX about yourself" />
        </label>
        <p className="muted small">Signed in as {user.email}</p>
        <button className="button primary" disabled={busy || !name.trim()}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        {saved && <p className="success">Saved.</p>}
        <ErrorNote error={error} />
      </form>
    </div>
  )
}
