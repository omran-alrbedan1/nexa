import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { PendingApproval } from '../api/dashboardApi';

interface PendingApprovalsWidgetProps {
  approvals: PendingApproval[];
  isLoading?: boolean;
}

export function PendingApprovalsWidget({ approvals, isLoading }: PendingApprovalsWidgetProps) {
  return (
    <Card padding="md">
      <CardHeader>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Pending Approvals</h3>
          <p className="text-xs text-gray-500">Special requests needing pricing</p>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <div className="py-6 text-center">
          <svg
            className="mx-auto h-8 w-8 text-gray-300 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-400">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="bg-amber-50 border border-amber-200 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {approval.customerName}
                </span>
                <StatusBadge status="Pending Pricing" color="yellow" />
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{approval.requestDetails}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{approval.orderNumber}</span>
                <button className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  Set Price →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
