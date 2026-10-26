import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/index.js'
import Avatar from '../components/Avatar.jsx'
import { VersionLabel } from '../components/BuildInfo.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import ScreenHeader from '../components/ScreenHeader.jsx'
import { useAuth } from '../context/AppContext.jsx'

// My profile, editable in place, plus account actions and the app version.
export default function Me() {
  const { user, setUser } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
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

  async function signOut() {
    await api.signOut()
    navigate('/login')
  }

  const dirty = name !== user.name || bio !== (user.bio || '') || avatarFile

  return (
    <>
      <ScreenHeader title="Me" />
      <div className="screen-body">
        {params.get('welcome') && <p className="hint">Welcome! Add a photo and a short bio so other PAX know who you are.</p>}
        <form className="panel stack" onSubmit={submit}>
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
          <button className="button primary" disabled={busy || !name.trim() || !dirty}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
          {saved && <p className="success">Saved.</p>}
          <ErrorNote error={error} />
        </form>

        <section className="panel">
          <h2 className="section-label">Repository</h2>
          <p className="muted">Coming soon: files and information attached to your profile.</p>
        </section>

        <section className="panel stack">
          <p className="muted small">Signed in as {user.email}</p>
          <button type="button" className="button" onClick={signOut}>
            Sign out
          </button>
          <p className="center">
            <VersionLabel />
          </p>
        </section>
      </div>
    </>
  )
}
