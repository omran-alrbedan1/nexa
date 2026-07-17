import { apiClient } from '@/lib/axios';
import { unwrap } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/types/common';

export interface SupportTicketUser {
  id: number;
  full_name: string;
  phone?: string;
}

export interface SupportTicketAttachment {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  width: number | null;
  height: number | null;
}

export interface SupportTicketMessage {
  id: number;
  message: string | null;
  is_internal: boolean;
  user: SupportTicketUser | null;
  attachments?: SupportTicketAttachment[];
  created_at: string;
}

export interface SupportTicketDetail {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  customer: SupportTicketUser | null;
  assignee: SupportTicketUser | null;
  messages: SupportTicketMessage[];
  created_at: string;
}

export interface SupportTicketListItem {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  customer: SupportTicketUser | null;
  assignee: SupportTicketUser | null;
  created_at: string;
  messages?: SupportTicketMessage[];
}

interface SupportListResponse {
  tickets: SupportTicketListItem[];
  meta: { current_page: number; last_page: number; total: number };
}

export const supportApi = {
  list: async (params?: Record<string, string>): Promise<SupportListResponse> => {
    const res = await apiClient.get<ApiResponse<SupportListResponse>>('/api/v1/admin/support-tickets', { params });
    return unwrap(res.data);
  },

  get: async (id: number): Promise<SupportTicketDetail> => {
    const res = await apiClient.get<ApiResponse<SupportTicketDetail>>(`/api/v1/admin/support-tickets/${id}`);
    return unwrap(res.data);
  },

  sendMessage: async (ticketId: number, data: { message?: string; is_internal?: boolean }): Promise<SupportTicketDetail> => {
    const res = await apiClient.post<ApiResponse<SupportTicketDetail>>(`/api/v1/admin/support-tickets/${ticketId}/messages`, data);
    return unwrap(res.data);
  },

  updateStatus: async (ticketId: number, status: string): Promise<SupportTicketDetail> => {
    const res = await apiClient.put<ApiResponse<SupportTicketDetail>>(`/api/v1/admin/support-tickets/${ticketId}/status`, { status });
    return unwrap(res.data);
  },

  assign: async (ticketId: number, staffId: number): Promise<SupportTicketDetail> => {
    const res = await apiClient.post<ApiResponse<SupportTicketDetail>>(`/api/v1/admin/support-tickets/${ticketId}/assign`, { staff_id: staffId });
    return unwrap(res.data);
  },
};
