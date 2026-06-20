import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Complaint } from '../api/operationsApi';
import { useAssignComplaint, useResolveComplaint } from '../hooks/useOperations';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import {
  ArrowLeft, AlertTriangle, MessageSquare, User,
  CheckCircle2, Clock, Tag, Calendar,
} from 'lucide-react';

const PRIORITY_BADGE: Record<string, 'red' | 'yellow' | 'teal' | 'purple'> = {
  urgent: 'red', high: 'red', medium: 'yellow', low: 'teal',
};

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'teal'> = {
  open: 'red', in_progress: 'yellow', resolved: 'green', closed: 'teal',
};

const now = new Date();
const today = now.toISOString().split('T')[0];

const DUMMY_COMPLAINTS: Complaint[] = [
  { id: 1, ticketNumber: 'TKT-2025-001', customerId: 108, customerName: 'Majid Sultan', subject: 'Delivery not received', description: 'Order ORD-2025-108 was marked as failed delivery. Customer claims they were home at the time of delivery. Requesting re-delivery or refund.', status: 'open', priority: 'high', assignedTo: null, relatedOrderNumber: 'ORD-2025-108', createdAt: `${today}T11:45:00Z`, updatedAt: `${today}T11:45:00Z` },
  { id: 2, ticketNumber: 'TKT-2025-002', customerId: 111, customerName: 'Huda Ahmed', subject: 'Wrong item received', description: 'Received chicken instead of beef in my order. Need replacement or refund for the difference.', status: 'in_progress', priority: 'medium', assignedTo: 'Operations Staff', relatedOrderNumber: 'ORD-2025-111', createdAt: `${today}T01:00:00Z`, updatedAt: `${today}T08:00:00Z` },
  { id: 3, ticketNumber: 'TKT-2025-003', customerId: 112, customerName: 'Sami Walid', subject: 'Delivery delay', description: 'Order was supposed to arrive yesterday. Still not received. Customer has been waiting for 24+ hours.', status: 'open', priority: 'urgent', assignedTo: null, relatedOrderNumber: 'ORD-2025-112', createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T06:00:00Z` },
];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function ComplaintDetailPage() {
  const { complaintId } = useParams<{ complaintId: string }>();
  const navigate = useNavigate();
  const id = parseInt(complaintId || '0', 10);
  const queryClient = useQueryClient();

  const { data: complaint, isLoading, isError, error, refetch } = useQuery<Complaint>({
    queryKey: ['complaints-detail', id],
    queryFn: async () => {
      try {
        // Try real backend first
        const response = await operationsApi.getSupportTickets({ complaintId: id });
        const found = response.data.find((c) => c.id === id);
        if (found) return found;
      } catch {
        // Fall through to dummy
      }
      // Fallback: find in dummy data
      const found = DUMMY_COMPLAINTS.find((c) => c.id === id);
      if (!found) throw new Error('Complaint not found');
      return found;
    },
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });

  const assignComplaint = useAssignComplaint();
  const resolveComplaint = useResolveComplaint();
  const [assignModal, setAssignModal] = useState<{ open: boolean }>({ open: false });
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([]);

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.OPERATIONS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> Back to Operations
        </button>
        <ErrorState title="Failed to load complaint" message={error instanceof Error ? error.message : 'An error occurred'} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !complaint) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages((prev) => [...prev, {
      sender: 'You (Staff)',
      text: message,
      time: new Date().toISOString(),
    }]);
    setMessage('');
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <button onClick={() => navigate(ROUTES.OPERATIONS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Operations
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <AlertTriangle size={24} className="text-brand-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-extrabold text-text-primary font-display">{complaint.ticketNumber}</h1>
                <Badge variant={PRIORITY_BADGE[complaint.priority] || 'teal'} size="sm">{complaint.priority}</Badge>
                <Badge variant={STATUS_BADGE[complaint.status] || 'yellow'} size="sm">{complaint.status.replace('_', ' ')}</Badge>
              </div>
              <h2 className="text-base font-bold text-text-primary font-body mt-1">{complaint.subject}</h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {complaint.status === 'open' && (
                <Button variant="primary" size="sm" leftIcon={<User size={14} />} onClick={() => setAssignModal({ open: true })}>
                  Assign to Me
                </Button>
              )}
              {(complaint.status === 'in_progress' || complaint.status === 'open') && (
                <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} isLoading={resolveComplaint.isPending} onClick={() => resolveComplaint.mutate(complaint.id)}>
                  Resolve
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <h3 className="text-sm font-bold text-text-primary font-display mb-3">Description</h3>
            <p className="text-sm text-text-primary font-body leading-relaxed">{complaint.description}</p>
            <div className="flex items-center gap-3 mt-4 text-xs text-text-tertiary font-body">
              <Calendar size={12} /> {new Date(complaint.createdAt).toLocaleString()}
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-brand-accent" />
              <h3 className="text-sm font-bold text-text-primary font-display">Conversation</h3>
            </div>
            {messages.length === 0 ? (
              <p className="text-sm text-text-tertiary font-body">No messages yet. Write a response below.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {messages.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-brand-primary-light/50 border border-brand-primary/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-brand-primary">{m.sender}</span>
                      <span className="text-xs text-text-tertiary">{new Date(m.time).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-text-primary font-body">{m.text}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="flex-1 px-3 py-2 text-sm border border-border-default rounded-lg outline-none focus:border-brand-primary resize-none bg-bg-input"
                placeholder="Type a response..."
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              />
              <Button variant="primary" size="sm" onClick={sendMessage}>Send</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="md">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 font-body">Customer</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-text-tertiary" />
                <span className="font-bold text-text-primary">{complaint.customerName}</span>
              </div>
              {complaint.relatedOrderNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag size={14} className="text-text-tertiary" />
                  <span className="text-text-primary">{complaint.relatedOrderNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-text-tertiary" />
                <span className="text-text-secondary">{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {complaint.assignedTo && (
              <div className="mt-3 pt-3 border-t border-border-default/50">
                <span className="text-xs text-text-secondary">Assigned to: <span className="font-bold text-text-primary">{complaint.assignedTo}</span></span>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={assignModal.open} onClose={() => setAssignModal({ open: false })} title={`Assign Complaint ${complaint.ticketNumber}`}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">Assign this complaint to yourself to start working on it.</p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setAssignModal({ open: false })}>Cancel</Button>
            <Button variant="primary" size="sm" isLoading={assignComplaint.isPending} onClick={() => {
              assignComplaint.mutate({ complaintId: complaint.id, assignedTo: 'Operations Staff' });
              setAssignModal({ open: false });
            }}>Assign to Me</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
