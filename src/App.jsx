import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, RegionsProvider, useAuth } from './context/AppContext.jsx'
import { Login, Signup } from './pages/AuthPages.jsx'
import Feed from './pages/Feed.jsx'
import Join from './pages/Join.jsx'
import Layout from './pages/Layout.jsx'
import Profile from './pages/Profile.jsx'
import RegionPage, { RegionCalendar, RegionChats, RegionMembers, RegionPosts } from './pages/RegionPage.jsx'
import Regions from './pages/Regions.jsx'
import Settings from './pages/Settings.jsx'

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
              <Route path="regions" element={<Regions />} />
              <Route path="r/:regionId" element={<RegionPage />}>
                <Route index element={<RegionPosts />} />
                <Route path="calendar" element={<RegionCalendar />} />
                <Route path="chats" element={<RegionChats />} />
                <Route path="chats/:chatId" element={<RegionChats />} />
                <Route path="members" element={<RegionMembers />} />
              </Route>
              <Route path="pax/:userId" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </RegionsProvider>
      </AuthProvider>
    </HashRouter>
  )
}
