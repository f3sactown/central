import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api } from '../api/index.js'
import Avatar from '../components/Avatar.jsx'
import { ChannelBadge, VersionLabel } from '../components/BuildInfo.jsx'
import { useAuth, useRegions } from '../context/AppContext.jsx'

export default function Layout() {
  const { user } = useAuth()
  const { regions } = useRegions()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function signOut() {
    await api.signOut()
    navigate('/login')
  }

  return (
    <div className="app">
      {api.mode === 'demo' && (
        <div className="demo-banner">
          Demo mode — data is stored only in this browser.{' '}
          <button
            type="button"
            className="link-button"
            onClick={async () => {
              if (window.confirm('Erase all demo data and start over?')) {
                await api.resetDemo()
                navigate('/login')
              }
            }}
          >
            Reset demo
          </button>
        </div>
      )}
      <header className="topbar">
        <Link to="/" className="brand">
          Central
          <ChannelBadge />
        </Link>
        <nav className="topnav">
          <NavLink to="/" end>
            Feed
          </NavLink>
          <NavLink to="/regions">Regions</NavLink>
        </nav>
        <div className="menu-wrap">
          <button type="button" className="avatar-button" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label="Account menu">
            <Avatar profile={user} size={34} />
          </button>
          {menuOpen && (
            <div className="menu" onClick={() => setMenuOpen(false)}>
              <div className="menu-name">{user.name}</div>
              <Link to={`/pax/${user.id}`}>My profile</Link>
              <Link to="/settings">Edit profile</Link>
              <button type="button" onClick={signOut}>
                Sign out
              </button>
              <div className="menu-version">
                <VersionLabel />
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="shell">
        <aside className="sidebar">
          <h4>My regions</h4>
          {regions?.map((r) => (
            <NavLink key={r.id} to={`/r/${r.id}`} className="side-link">
              {r.name}
            </NavLink>
          ))}
          {regions?.length === 0 && <p className="muted small">You haven't joined a region yet.</p>}
          <Link to="/regions" className="side-link muted">
            + Join or create
          </Link>
        </aside>
        <main className="main">
          <Outlet />
        </main>
      </div>
      <footer className="app-footer">
        <VersionLabel />
      </footer>
    </div>
  )
}
