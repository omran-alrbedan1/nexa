import { useEffect, useRef, useState } from 'react'
import { getEcho } from '@/lib/echo'

export interface TripLiveLocation {
  tripId: number
  tripNumber: string | null
  driverId: number | null
  latitude: number
  longitude: number
  heading: number | null
  speed: number | null
  recordedAt: string
}

export function useTripsMonitor(): Map<number, TripLiveLocation> {
  const [locations, setLocations] = useState<Map<number, TripLiveLocation>>(new Map())
  const locationsRef = useRef<Map<number, TripLiveLocation>>(new Map())

  useEffect(() => {
    const echo = getEcho()
    if (!echo) return

    const channel = echo.private('trips.monitor')

    channel.listen('.location.updated', (data: Record<string, unknown>) => {
      const tripId = data.trip_id as number
      if (!tripId) return

      const next = new Map(locationsRef.current)
      next.set(tripId, {
        tripId,
        tripNumber: (data.trip_number as string) ?? null,
        driverId: (data.driver_id as number) ?? null,
        latitude: data.latitude as number,
        longitude: data.longitude as number,
        heading: (data.heading as number) ?? null,
        speed: (data.speed as number) ?? null,
        recordedAt: data.recorded_at as string,
      })
      locationsRef.current = next
      setLocations(next)
    })

    return () => {
      channel.stopListening('.location.updated')
      echo.leave('trips.monitor')
    }
  }, [])

  return locations
}
