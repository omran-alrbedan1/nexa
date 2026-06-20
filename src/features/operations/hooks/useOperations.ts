import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { operationsApi, type OperationsPageData } from '../api/operationsApi';

export const operationsKeys = {
  all: ['operations'] as const,
  pageData: () => [...operationsKeys.all, 'page-data'] as const,
  orders: () => [...operationsKeys.all, 'orders'] as const,
  specialRequests: () => [...operationsKeys.all, 'special-requests'] as const,
  complaints: () => [...operationsKeys.all, 'complaints'] as const,
};

/** Fetch all operations page data (stats, recent orders, specials, complaints) */
export function useOperationsPage() {
  return useQuery<OperationsPageData>({
    queryKey: operationsKeys.pageData(),
    queryFn: () => operationsApi.getPageData(),
    staleTime: 30_000,
  });
}

// ── Order Mutations ──

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: number; newStatus: string }) =>
      operationsApi.updateOrderStatus(orderId, newStatus as any),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      const label =
        variables.newStatus === 'confirmed'
          ? 'confirmed'
          : variables.newStatus === 'cancelled'
            ? 'cancelled'
            : 'updated';
      addToast('success', `Order ${label} successfully`);
    },
    onError: () => {
      addToast('error', 'Failed to update order status');
    },
  });
}

// ── Special Request Mutations ──

export function useAssignForPricing() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ requestId, assignedTo }: { requestId: number; assignedTo: string }) =>
      operationsApi.assignForPricing(requestId, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', 'Request assigned for pricing');
    },
    onError: () => {
      addToast('error', 'Failed to assign request');
    },
  });
}

export function useSubmitPriceQuote() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ requestId, price, notes }: { requestId: number; price: number; notes: string }) =>
      operationsApi.submitPriceQuote(requestId, price, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', 'Price quote submitted — awaiting customer approval');
    },
    onError: () => {
      addToast('error', 'Failed to submit price quote');
    },
  });
}

export function useApproveSpecialOrder() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (requestId: number) => operationsApi.approveSpecialOrder(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', 'Special order approved');
    },
    onError: () => {
      addToast('error', 'Failed to approve special order');
    },
  });
}

export function useRejectSpecialOrder() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (requestId: number) => operationsApi.rejectSpecialOrder(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', 'Special order rejected');
    },
    onError: () => {
      addToast('error', 'Failed to reject special order');
    },
  });
}

export function useConvertToOrder() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (requestId: number) => operationsApi.convertToOrder(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', 'Special order converted to regular order');
    },
    onError: () => {
      addToast('error', 'Failed to convert special order');
    },
  });
}

// ── Complaint Mutations ──

export function useAssignComplaint() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ complaintId, assignedTo }: { complaintId: number; assignedTo: string }) =>
      operationsApi.assignComplaint(complaintId, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', 'Complaint assigned to you');
    },
    onError: () => {
      addToast('error', 'Failed to assign complaint');
    },
  });
}

export function useResolveComplaint() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (complaintId: number) => operationsApi.resolveComplaint(complaintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', 'Complaint resolved');
    },
    onError: () => {
      addToast('error', 'Failed to resolve complaint');
    },
  });
}
