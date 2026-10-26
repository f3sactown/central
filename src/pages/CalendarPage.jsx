import { useSearchParams } from 'react-router-dom'
import Calendar from '../components/Calendar.jsx'
import ScreenHeader from '../components/ScreenHeader.jsx'
import { useRegionFilter } from '../lib/regionFilter.js'

export default function CalendarPage() {
  const [regionId] = useRegionFilter()
  const [params] = useSearchParams()
  const day = params.get('day')
  return (
    <>
      <ScreenHeader title="Calendar" filter />
      <div className="screen-body wide">
        <Calendar key={`${regionId}|${day}`} regionId={regionId} initialDay={day ? new Date(day) : undefined} />
      </div>
    </>
  )
}
