import { apiClient } from '@/lib/axios'
import type { ApiResponse } from '@/types/common'

export interface TripOrder {
  id: number
  orderId: number
  orderNumber: string
  deliveryStatus: string
  customerName: string
}

export interface SimulatorTrip {
  id: number
  tripNumber: string
  driverId: number | null
  driverName: string | null
  status: string
  orders: TripOrder[]
}

interface BackendTripOrder {
  id: number
  order_id: number
  order_number: string
  delivery_status: string
  customer_name: string
}

interface BackendSimulatorTrip {
  id: number
  trip_number: string
  driver_id: number | null
  driver_name: string | null
  status: string
  orders: BackendTripOrder[]
}

function mapTrip(bt: BackendSimulatorTrip): SimulatorTrip {
  return {
    id: bt.id,
    tripNumber: bt.trip_number,
    driverId: bt.driver_id ?? null,
    driverName: bt.driver_name ?? null,
    status: bt.status,
    orders: (bt.orders ?? []).map((o) => ({
      id: o.id,
      orderId: o.order_id,
      orderNumber: o.order_number,
      deliveryStatus: o.delivery_status,
      customerName: o.customer_name,
    })),
  }
}

export const deliveryMonitorApi = {
  getActiveTrips: async (): Promise<SimulatorTrip[]> => {
    const res = await apiClient.get<ApiResponse<BackendSimulatorTrip[]>>(
      '/api/v1/admin/trips/simulator/active',
    )
    const data = res.data.data
    return (Array.isArray(data) ? data : []).map(mapTrip)
  },

  simulateLocation: async (
    tripId: number,
    data: { latitude: number; longitude: number; heading?: number; speed?: number },
  ): Promise<void> => {
    await apiClient.post(`/api/v1/admin/trips/${tripId}/simulate/location`, data)
  },

  startTrip: async (tripId: number): Promise<void> => {
    await apiClient.post(`/api/v1/admin/trips/${tripId}/simulate/start-trip`)
  },

  startDelivery: async (orderId: number): Promise<void> => {
    await apiClient.post(`/api/v1/admin/orders/${orderId}/simulate/start-delivery`)
  },

  deliver: async (orderId: number): Promise<void> => {
    await apiClient.post(`/api/v1/admin/orders/${orderId}/simulate/deliver`)
  },

  fail: async (orderId: number, failureReasonId?: number, note?: string): Promise<void> => {
    await apiClient.post(`/api/v1/admin/orders/${orderId}/simulate/fail`, {
      failure_reason_id: failureReasonId,
      note,
    })
  },
}
