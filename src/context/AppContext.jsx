import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/index.js'

const AuthContext = createContext(null)
const RegionsContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still loading

  useEffect(() => {
    let active = true
    api.getCurrentUser().then((u) => active && setUser(u), () => active && setUser(null))
    const off = api.onAuthChange((u) => active && setUser(u))
    return () => {
      active = false
      off()
    }
  }, [])

  return <AuthContext.Provider value={{ user, setUser, loading: user === undefined }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export function RegionsProvider({ children }) {
  const { user } = useAuth()
  const [regions, setRegions] = useState(null)

  const refresh = useCallback(() => api.listMyRegions().then(setRegions), [])

  useEffect(() => {
    if (user) refresh().catch(() => setRegions([]))
    else setRegions(null)
  }, [user?.id, refresh])

  const roleFor = useCallback((regionId) => regions?.find((r) => r.id === regionId)?.role, [regions])

  return <RegionsContext.Provider value={{ regions, refresh, roleFor }}>{children}</RegionsContext.Provider>
}

export const useRegions = () => useContext(RegionsContext)
