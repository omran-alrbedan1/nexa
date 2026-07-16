import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getEcho } from '@/lib/echo'

export type DeliveryStage = 'out_for_delivery' | 'delivered' | 'failed'

export interface DeliveryStageEvent {
  orderId: number
  stage: DeliveryStage
  previousStage: string | null
  timestamp: string
}

export function useDeliveryStage(orderId: number) {
  const [stage, setStage] = useState<DeliveryStageEvent | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!orderId) return

    const echo = getEcho()
    if (!echo) return

    const channel = echo.private(`order.tracking.${orderId}`)

    const handleStageChange = (data: Record<string, unknown>) => {
      setStage({
        orderId: data.order_id as number,
        stage: data.stage as DeliveryStage,
        previousStage: (data.previous_stage as string) ?? null,
        timestamp: data.timestamp as string,
      })
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', orderId] })
    }

    const handleTripStage = () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', orderId] })
    }

    channel.listen('.delivery.stage.changed', handleStageChange)
    channel.listen('.trip.stage.changed', handleTripStage)

    return () => {
      channel.stopListening('.delivery.stage.changed')
      channel.stopListening('.trip.stage.changed')
      echo.leave(`order.tracking.${orderId}`)
    }
  }, [orderId, queryClient])

  return stage
}
