import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export interface DeliverySlot {
  id: number;
  trip_date: string;
  departure_time: string;
  cutoff_time: string;
  max_capacity: number;
  booked_count: number;
  remaining_capacity: number;
  delivery_fee: number;
  is_available: boolean;
  warehouse?: { id: number; name: string } | null;
  zone?: { id: number; name: string } | null;
}

export interface DeliverySlotsPageData {
  stats: {
    totalSlots: number;
    activeSlots: number;
    totalCapacity: number;
    totalBooked: number;
    totalRemaining: number;
    todaySlots: number;
  };
  slots: DeliverySlot[];
}

interface BackendDeliverySlot {
  id: number;
  trip_date: string;
  departure_time: string;
  cutoff_time: string;
  max_capacity: number;
  booked_count: number;
  remaining_capacity: number;
  delivery_fee: number;
  is_available: boolean;
  warehouse?: { id: number; name: string } | null;
  zone?: { id: number; name_ar: string; name_en?: string | null } | null;
}

function mapBackendSlot(s: BackendDeliverySlot): DeliverySlot {
  return {
    ...s,
    zone: s.zone ? { id: s.zone.id, name: s.zone.name_ar || s.zone.name_en || '' } : null,
  };
}

export const deliverySlotsApi = {
  getPageData: async (): Promise<DeliverySlotsPageData> => {
    const response = await apiClient.get<ApiResponse<{ delivery_slots: BackendDeliverySlot[]; meta: Record<string, unknown> }>>('/api/v1/admin/delivery-slots');
    const backendData = response.data.data;
    const slots = (backendData.delivery_slots || []).map(mapBackendSlot);

    const today = new Date().toISOString().split('T')[0];
    const totalCapacity = slots.reduce((sum, s) => sum + s.max_capacity, 0);
    const totalBooked = slots.reduce((sum, s) => sum + s.booked_count, 0);

    return {
      stats: {
        totalSlots: slots.length,
        activeSlots: slots.filter((s) => s.is_available).length,
        totalCapacity,
        totalBooked,
        totalRemaining: totalCapacity - totalBooked,
        todaySlots: slots.filter((s) => s.trip_date === today).length,
      },
      slots,
    };
  },

  createSlot: async (data: {
    warehouse_id?: number;
    zone_id: number;
    trip_date: string;
    departure_time: string;
    cutoff_time?: string;
    max_capacity?: number;
    delivery_fee?: number;
  }): Promise<Record<string, unknown>> => {
    const response = await apiClient.post('/api/v1/admin/delivery-slots', data);
    return response.data;
  },

  updateSlot: async (id: number, data: {
    departure_time?: string;
    cutoff_time?: string;
    max_capacity?: number;
    delivery_fee?: number;
    is_available?: boolean;
  }): Promise<Record<string, unknown>> => {
    const response = await apiClient.put(`/api/v1/admin/delivery-slots/${id}`, data);
    return response.data;
  },
};
