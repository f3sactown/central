import { HashRouter, Navigate, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { AuthProvider, RegionsProvider, useAuth } from './context/AppContext.jsx'
import { Login, Signup } from './pages/AuthPages.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import Chats from './pages/Chats.jsx'
import Feed from './pages/Feed.jsx'
import Join from './pages/Join.jsx'
import Layout from './pages/Layout.jsx'
import Me from './pages/Me.jsx'
import Profile from './pages/Profile.jsx'
import RegionPage from './pages/RegionPage.jsx'
import Regions from './pages/Regions.jsx'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p className="muted center">Loading…</p>
  if (!user) {
    const next = location.pathname + location.search
    return <Navigate to={next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`} replace />
  }
  return children
}

function JoinRoute() {
  const { loading } = useAuth()
  return loading ? <p className="muted center">Loading…</p> : <Join />
}

// Links from before the tab-bar layout (old invites, bookmarks, event cards).
function LegacyRegionTab({ tab }) {
  const { regionId, chatId } = useParams()
  const [params] = useSearchParams()
  if (tab === 'chats' && chatId) return <Navigate to={`/chats/${chatId}`} replace />
  const next = new URLSearchParams({ region: regionId })
  if (params.get('day')) next.set('day', params.get('day'))
  const path = { calendar: '/calendar', chats: '/chats', members: `/r/${regionId}` }[tab]
  return <Navigate to={tab === 'members' ? path : `${path}?${next}`} replace />
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <RegionsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/join/:code" element={<JoinRoute />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Feed />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="chats" element={<Chats />} />
              <Route path="chats/:chatId" element={<Chats />} />
              <Route path="regions" element={<Regions />} />
              <Route path="r/:regionId" element={<RegionPage />} />
              <Route path="r/:regionId/calendar" element={<LegacyRegionTab tab="calendar" />} />
              <Route path="r/:regionId/chats" element={<LegacyRegionTab tab="chats" />} />
              <Route path="r/:regionId/chats/:chatId" element={<LegacyRegionTab tab="chats" />} />
              <Route path="r/:regionId/members" element={<LegacyRegionTab tab="members" />} />
              <Route path="me" element={<Me />} />
              <Route path="settings" element={<Navigate to="/me" replace />} />
              <Route path="pax/:userId" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </RegionsProvider>
      </AuthProvider>
    </HashRouter>
  )
}
