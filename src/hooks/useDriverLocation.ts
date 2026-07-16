import { useEffect, useState } from 'react'
import echo from '@/lib/echo'

export interface DriverLocation {
  tripId: number
  latitude: number
  longitude: number
  heading: number | null
  speed: number | null
  recordedAt: string
}

export function useDriverLocation(
  orderId: number,
  initial?: DriverLocation | null,
): DriverLocation | null {
  const [location, setLocation] = useState<DriverLocation | null>(initial ?? null)

  useEffect(() => {
    if (!orderId) return

    const channel = echo.private(`order.tracking.${orderId}`)

    channel.listen('.location.updated', (data: Record<string, unknown>) => {
      setLocation({
        tripId: data.trip_id as number,
        latitude: data.latitude as number,
        longitude: data.longitude as number,
        heading: (data.heading as number) ?? null,
        speed: (data.speed as number) ?? null,
        recordedAt: data.recorded_at as string,
      })
    })

    return () => {
      channel.stopListening('.location.updated')
      echo.leave(`order.tracking.${orderId}`)
    }
  }, [orderId])

  return location
}
