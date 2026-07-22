import { useTranslation } from 'react-i18next'
import { useDeliveryStage } from '@/hooks/useDeliveryStage'

interface Props {
  orderId: number
  currentStatus: string
}

export default function DeliveryStageIndicator({ orderId, currentStatus }: Props) {
  const { t } = useTranslation()
  const liveStage = useDeliveryStage(orderId)
  const stage = (liveStage?.stage ?? currentStatus).toLowerCase()
  const colorMap: Record<string, string> = {
    pending: 'bg-gray-400',
    out_for_delivery: 'bg-blue-500 animate-pulse',
    delivered: 'bg-green-500',
    failed: 'bg-red-500',
  }
  const color = colorMap[stage] ?? colorMap.pending

  const labelMap: Record<string, string> = {
    pending: t('orders.deliveryStage.pending'),
    out_for_delivery: t('orders.deliveryStage.out_for_delivery'),
    delivered: t('orders.deliveryStage.delivered'),
    failed: t('orders.deliveryStage.failed'),
  }
  const label = labelMap[stage] ?? labelMap.pending

  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
