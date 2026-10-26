import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/index.js'
import { ChannelBadge } from '../components/BuildInfo.jsx'
import Icon from '../components/Icon.jsx'
import { regionQuery } from '../lib/regionFilter.js'

const TABS = [
  { to: '/', icon: 'home', label: 'Home', end: true, keepRegion: true },
  { to: '/calendar', icon: 'calendar', label: 'Calendar', keepRegion: true },
  { to: '/chats', icon: 'chat', label: 'Chats', keepRegion: true },
  { to: '/regions', icon: 'regions', label: 'Regions' },
  { to: '/me', icon: 'me', label: 'Me' },
]

// App shell: a bottom tab bar on phones, a slim left column on wider screens.
export default function Layout() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = regionQuery(params.get('region'))

  return (
    <div className={'app' + (api.mode === 'demo' ? ' demo' : '')}>
      {api.mode === 'demo' && (
        <div className="demo-banner">
          Demo mode: data is stored only in this browser.{' '}
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
      <nav className="tabbar" aria-label="Main">
        <div className="tabbar-brand">
          Central
          <ChannelBadge />
        </div>
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to + (t.keepRegion ? query : '')} end={t.end} className="tab">
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="screen">
        <Outlet />
      </main>
    </div>
  )
}
