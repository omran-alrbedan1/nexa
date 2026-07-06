import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { apiClient } from '@/lib/axios';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LifeBuoy, Search, Filter, UserCheck, Clock } from 'lucide-react';
import type { ApiResponse } from '@/types/common';

const PRIORITY_COLORS: Record<string, 'red' | 'yellow' | 'green'> = {
  urgent: 'red', high: 'red', medium: 'yellow', low: 'green',
};

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'purple'> = {
  open: 'red', in_progress: 'yellow', resolved: 'green', closed: 'purple',
};

export function SupportTicketsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [assignModal, setAssignModal] = useState<{ open: boolean; ticketId: number; staffId: string }>({ open: false, ticketId: 0, staffId: '' });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ tickets: any[]; meta: any }>>('/api/v1/admin/support-tickets');
      return response.data.data;
    },
    staleTime: 30_000,
  });

  const assignMutation = useMutation({
    mutationFn: ({ ticketId, staffId }: { ticketId: number; staffId: number }) =>
      apiClient.post(`/api/v1/admin/support-tickets/${ticketId}/assign`, { staff_id: staffId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      addToast('success', 'Ticket assigned');
      setAssignModal({ open: false, ticketId: 0, staffId: '' });
    },
    onError: () => addToast('error', 'Failed to assign ticket'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: number; status: string }) =>
      apiClient.put(`/api/v1/admin/support-tickets/${ticketId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      addToast('success', 'Ticket status updated');
    },
    onError: () => addToast('error', 'Failed to update ticket status'),
  });

  const tickets = (data?.tickets || []).filter((t: any) => {
    const matchesSearch = !search || t.subject?.toLowerCase().includes(search.toLowerCase()) || t.ticket_number?.includes(search);
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <LifeBuoy size={22} className="text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('support.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('support.description')}</p>
            </div>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('support.allTickets')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{tickets.length} {t('common.items')}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('support.searchPlaceholder')} className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none appearance-none focus:border-brand-primary">
              <option value="">{t('support.allStatuses')}</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
        ) : tickets.length === 0 ? (
          <EmptyState title={t('support.noTickets')} description={t('support.allResolved')} />
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket: any) => (
              <div key={ticket.id} className="rounded-xl border border-border-default/60 overflow-hidden">
                <div
                  onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                  className="p-4 hover:bg-bg-section-alt transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-brand-primary-light flex items-center justify-center flex-shrink-0">
                          <LifeBuoy size={16} className="text-brand-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-text-primary font-body truncate">{ticket.subject}</span>
                            <Badge variant={STATUS_BADGE[ticket.status] || 'yellow'} size="sm">{ticket.status?.replace('_', ' ')}</Badge>
                            <Badge variant={PRIORITY_COLORS[ticket.priority] || 'green'} size="sm">{ticket.priority}</Badge>
                          </div>
                           <div className="flex items-center gap-3 text-xs text-text-tertiary font-body mt-1 flex-wrap">
                            <span>#{ticket.ticket_number}</span>
                            {ticket.customer && <span>{ticket.customer.full_name}</span>}
                            {ticket.assignee && <span className="flex items-center gap-1"><UserCheck size={12} /> {ticket.assignee.full_name}</span>}
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                     <div className="flex items-center gap-2 ml-2 sm:ml-4 flex-shrink-0">
                      {!ticket.assignee && (
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setAssignModal({ open: true, ticketId: ticket.id, staffId: '' }); }}>
                          <UserCheck size={12} className="mr-1" /> {t('support.assign')}
                        </Button>
                      )}
                      {ticket.status === 'open' && (
                        <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ ticketId: ticket.id, status: 'in_progress' }); }}>
                          {t('support.start')}
                        </Button>
                      )}
                      {ticket.status === 'in_progress' && (
                        <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ ticketId: ticket.id, status: 'resolved' }); }}>
                          {t('support.resolve')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {expandedId === ticket.id && ticket.messages && ticket.messages.length > 0 && (
                  <div className="border-t border-border-default/50 px-4 py-3 bg-bg-section-alt/50">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {ticket.messages.map((msg: any) => (
                        <div key={msg.id} className={`p-3 rounded-xl text-sm ${msg.is_internal ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-border-default/60'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-text-secondary">{msg.user?.full_name || t('support.system')}</span>
                            <div className="flex items-center gap-2">
                              {msg.is_internal && <span className="text-[10px] text-amber-600 font-bold">Internal</span>}
                              <span className="text-xs text-text-tertiary">{new Date(msg.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-xs text-text-primary">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Assign Modal */}
      <Modal open={assignModal.open} onClose={() => setAssignModal({ ...assignModal, open: false })} title={t('support.assignTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('support.staffId')}</label>
            <input type="number" value={assignModal.staffId} onChange={(e) => setAssignModal({ ...assignModal, staffId: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" placeholder="Enter staff user ID" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setAssignModal({ ...assignModal, open: false })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={assignMutation.isPending} onClick={() => assignMutation.mutate({ ticketId: assignModal.ticketId, staffId: parseInt(assignModal.staffId) || 0 })}>
              {t('support.assign')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
