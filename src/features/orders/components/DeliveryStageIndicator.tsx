import { useDeliveryStage } from '@/hooks/useDeliveryStage'

const STAGES: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-400' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-blue-500 animate-pulse' },
  delivered: { label: 'Delivered', color: 'bg-green-500' },
  failed: { label: 'Failed', color: 'bg-red-500' },
}

interface Props {
  orderId: number
  currentStatus: string
}

export default function DeliveryStageIndicator({ orderId, currentStatus }: Props) {
  const liveStage = useDeliveryStage(orderId)
  const stage = (liveStage?.stage ?? currentStatus).toLowerCase()
  const config = STAGES[stage] ?? STAGES.pending

  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${config.color}`} />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  )
}
