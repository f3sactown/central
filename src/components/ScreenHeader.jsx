import { useNavigate } from 'react-router-dom'
import { useRegions } from '../context/AppContext.jsx'
import { useRegionFilter } from '../lib/regionFilter.js'
import Icon from './Icon.jsx'

export function RegionFilter() {
  const { regions } = useRegions()
  const [regionId, setRegionId] = useRegionFilter()
  if (!regions?.length) return null
  return (
    <select className="region-filter" value={regionId} onChange={(e) => setRegionId(e.target.value)} aria-label="Show region">
      <option value="">All regions</option>
      {regions.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </select>
  )
}

// Sticky top bar for a screen. `back` is a path, or true to go back in history.
export default function ScreenHeader({ title, back, filter = false, children }) {
  const navigate = useNavigate()
  return (
    <header className="screen-header">
      {back && (
        <button type="button" className="icon-button" onClick={() => (back === true ? navigate(-1) : navigate(back))} aria-label="Back">
          <Icon name="back" />
        </button>
      )}
      <h1 className="screen-title">{title}</h1>
      {filter && <RegionFilter />}
      {children}
    </header>
  )
}
