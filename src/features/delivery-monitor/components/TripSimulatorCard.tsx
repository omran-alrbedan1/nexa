import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { deliveryMonitorApi, type SimulatorTrip } from '../api/deliveryMonitorApi'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const STATUS_BADGE: Record<string, 'green' | 'teal' | 'yellow' | 'purple' | 'red'> = {
  scheduled: 'purple',
  assigned: 'yellow',
  accepted: 'teal',
  in_progress: 'teal',
  completed: 'green',
  cancelled: 'red',
  failed: 'red',
}

interface Props {
  trip: SimulatorTrip
}

export default function TripSimulatorCard({ trip }: Props) {
  const queryClient = useQueryClient()
  const [lat, setLat] = useState('24.713552')
  const [lng, setLng] = useState('46.675297')
  const [loading, setLoading] = useState<string | null>(null)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['trips', 'simulator', 'active'] })

  const handleAction = async (key: string, fn: () => Promise<unknown>) => {
    setLoading(key)
    try {
      await fn()
      await invalidate()
    } catch {
      // error handled by axios interceptor
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card padding="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-text-primary">{trip.tripNumber}</h4>
            <p className="text-xs text-text-secondary">
              Driver: {trip.driverName || 'Unassigned'}
            </p>
          </div>
          <Badge variant={STATUS_BADGE[trip.status] || 'purple'} size="sm">
            {trip.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        <div className="bg-bg-section-alt p-3 rounded-xl space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Location Simulator
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.000001"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Latitude"
              className="w-full px-2 py-1.5 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
            <input
              type="number"
              step="0.000001"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Longitude"
              className="w-full px-2 py-1.5 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
          </div>
          <Button
            variant="accent"
            size="sm"
            isLoading={loading === 'location'}
            onClick={() =>
              handleAction('location', () =>
                deliveryMonitorApi.simulateLocation(trip.id, {
                  latitude: parseFloat(lat),
                  longitude: parseFloat(lng),
                }),
              )
            }
          >
            Send Location
          </Button>
        </div>

        {['assigned', 'accepted'].includes(trip.status) && (
          <Button
            variant="primary"
            size="sm"
            isLoading={loading === 'start-trip'}
            onClick={() =>
              handleAction('start-trip', () => deliveryMonitorApi.startTrip(trip.id))
            }
          >
            Start Trip
          </Button>
        )}

        <div className="space-y-2">
          {trip.orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-border-default/60"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">
                  {order.orderNumber}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-text-secondary truncate">
                    {order.customerName}
                  </p>
                  <Badge
                    variant={
                      order.deliveryStatus === 'delivered'
                        ? 'green'
                        : order.deliveryStatus === 'failed'
                          ? 'red'
                          : 'yellow'
                    }
                    size="sm"
                  >
                    {order.deliveryStatus.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {order.deliveryStatus === 'pending' && trip.status === 'in_progress' && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={loading === `start-${order.orderId}`}
                    onClick={() =>
                      handleAction(`start-${order.orderId}`, () =>
                        deliveryMonitorApi.startDelivery(order.orderId),
                      )
                    }
                  >
                    Start Delivery
                  </Button>
                )}
                {order.deliveryStatus === 'out_for_delivery' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={loading === `deliver-${order.orderId}`}
                      onClick={() =>
                        handleAction(`deliver-${order.orderId}`, () =>
                          deliveryMonitorApi.deliver(order.orderId),
                        )
                      }
                    >
                      Deliver
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={loading === `fail-${order.orderId}`}
                      onClick={() =>
                        handleAction(`fail-${order.orderId}`, () =>
                          deliveryMonitorApi.fail(order.orderId),
                        )
                      }
                    >
                      Fail
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
