import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToastStore } from '@/stores/toastStore';
import { useAssignComplaint, useResolveComplaint } from '../hooks/useOperations';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import type { Complaint } from '../api/operationsApi';

const PRIORITY_COLORS: Record<string, 'red' | 'yellow' | 'blue' | 'purple'> = {
  urgent: 'red',
  high: 'yellow',
  medium: 'blue',
  low: 'purple',
};



interface ComplaintsSectionProps {
  complaints: Complaint[];
  isLoading: boolean;
}

export function ComplaintsSection({ complaints, isLoading }: ComplaintsSectionProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const assignComplaint = useAssignComplaint();
  const resolveComplaint = useResolveComplaint();

  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = complaints.filter((c) => {
    return !statusFilter || c.status === statusFilter;
  });

  const handleAssign = (complaintId: number) => {
    assignComplaint.mutate({ complaintId, assignedTo: user?.name || 'Operations Staff' });
  };

  const urgentCount = complaints.filter((c) => c.priority === 'urgent' && c.status !== 'resolved' && c.status !== 'closed').length;

  return (
    <Card padding="md">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Complaints & Tickets</h3>
            <p className="text-xs text-gray-500">
              {complaints.length} total
              {urgentCount > 0 && (
                <span className="text-red-500 font-medium ml-1">
                  · {urgentCount} urgent
                </span>
              )}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No complaints"
          description="All tickets have been resolved"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((complaint) => (              <div
                key={complaint.id}
                className="py-3 px-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(ROUTES.COMPLAINT_DETAIL(complaint.id))}
              >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{complaint.ticketNumber}</span>
                    <Badge variant={PRIORITY_COLORS[complaint.priority]} size="sm">
                      {complaint.priority}
                    </Badge>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        complaint.status === 'open'
                          ? 'bg-red-50 text-red-700'
                          : complaint.status === 'in_progress'
                            ? 'bg-yellow-50 text-yellow-700'
                            : complaint.status === 'resolved'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mt-1 font-medium">{complaint.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{complaint.description}</p>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{complaint.customerName}</span>
                {complaint.relatedOrderNumber && (
                  <>
                    <span>·</span>
                    <span>Order: {complaint.relatedOrderNumber}</span>
                  </>
                )}
                {complaint.assignedTo && (
                  <>
                    <span>·</span>
                    <span>Assignee: {complaint.assignedTo}</span>
                  </>
                )}
                <span>·</span>
                <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                {(complaint.status === 'open' || complaint.status === 'in_progress') && !complaint.assignedTo && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={assignComplaint.isPending}
                    onClick={(e) => { e.stopPropagation(); handleAssign(complaint.id); }}
                  >
                    Assign to Me
                  </Button>
                )}
                {complaint.status === 'in_progress' && complaint.assignedTo === user?.name && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={resolveComplaint.isPending}
                    onClick={(e) => { e.stopPropagation(); resolveComplaint.mutate(complaint.id); }}
                  >
                    Mark Resolved
                  </Button>
                )}
                {complaint.assignedTo && complaint.assignedTo !== user?.name && complaint.status !== 'resolved' && complaint.status !== 'closed' && (
                  <span className="text-xs text-gray-400">
                    Assigned to: {complaint.assignedTo}
                  </span>
                )}
                {complaint.status === 'resolved' && (
                  <Badge variant="green" size="sm">Resolved</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && complaints.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            {complaints.filter((c) => c.status === 'open').length} open ·{' '}
            {complaints.filter((c) => c.status === 'in_progress').length} in progress ·{' '}
            {complaints.filter((c) => c.status === 'resolved').length} resolved
          </span>
          <button
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            onClick={() => useToastStore.getState().addToast('info', 'Full tickets page with pagination coming soon')}
          >
            View All Tickets →
          </button>
        </div>
      )}
    </Card>
  );
}
