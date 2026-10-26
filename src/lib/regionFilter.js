import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRegions } from '../context/AppContext.jsx'

// The region filter lives in the URL (?region=<id>) so it survives reloads
// and links. An id for a region I'm not in is treated as "All regions".
export function useRegionFilter() {
  const [params, setParams] = useSearchParams()
  const { regions } = useRegions()
  const raw = params.get('region') || ''
  const regionId = regions?.some((r) => r.id === raw) ? raw : ''

  const setRegionId = useCallback(
    (id) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id) next.set('region', id)
          else next.delete('region')
          next.delete('day')
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  return [regionId, setRegionId]
}

// "?region=<id>" to carry the filter across tabs, or "".
export const regionQuery = (regionId) => (regionId ? `?region=${encodeURIComponent(regionId)}` : '')
