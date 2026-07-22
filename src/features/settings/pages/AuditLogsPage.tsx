import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuditLogs } from '../hooks/useSettings';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ClipboardList, User, Globe, Clock, ChevronRight } from 'lucide-react';
import type { AuditLog } from '../api/settingsApi';

const ACTION_COLORS: Record<string, 'teal' | 'green' | 'yellow' | 'red' | 'purple'> = {
  created: 'green',
  updated: 'yellow',
  deleted: 'red',
  login: 'teal',
  logout: 'teal',
};

export function AuditLogsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useAuditLogs(page);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const logs = data?.data || [];
  const meta = data?.meta || { currentPage: 1, lastPage: 1, perPage: 20, total: 0 };

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.audit.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('settings.audit.description')}</p>
        </div>
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <ClipboardList size={22} className="text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.audit.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('settings.audit.description')}</p>
            </div>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('settings.audit.activityLog')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('settings.audit.totalEntries', { count: meta.total })}</p>
          </div>
        </CardHeader>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState title={t('settings.audit.noLogs')} description={t('settings.audit.noLogsDescription')} />
        ) : (
          <>
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-3 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={ACTION_COLORS[log.action] || 'yellow'} size="sm">{log.action}</Badge>
                        <span className="text-sm font-bold text-text-primary font-body">{log.entityType}</span>
                        <span className="text-xs text-text-tertiary">#{log.entityId}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-tertiary font-body mt-1">
                        {log.user && (
                          <span className="flex items-center gap-1">
                            <User size={12} /> {log.user.fullName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Globe size={12} /> {log.ipAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-tertiary flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            {meta.lastPage > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  lastPage={meta.lastPage}
                  total={meta.total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal open={!!selectedLog} onClose={() => setSelectedLog(null)} title={t('settings.audit.logDetail')}>
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-bg-section-alt">
                <p className="text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.audit.action')}</p>
                <Badge variant={ACTION_COLORS[selectedLog.action] || 'yellow'} size="sm">{selectedLog.action}</Badge>
              </div>
              <div className="p-3 rounded-xl bg-bg-section-alt">
                <p className="text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.audit.entity')}</p>
                <p className="text-sm font-bold text-text-primary font-body">{selectedLog.entityType} #{selectedLog.entityId}</p>
              </div>
            </div>

            {selectedLog.user && (
              <div className="p-3 rounded-xl bg-bg-section-alt">
                <p className="text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.audit.user')}</p>
                <p className="text-sm text-text-primary font-body">{selectedLog.user.fullName}</p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-bg-section-alt">
              <p className="text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.audit.ipAddress')}</p>
              <p className="text-sm text-text-primary font-body">{selectedLog.ipAddress}</p>
            </div>

            <div className="p-3 rounded-xl bg-bg-section-alt">
              <p className="text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.audit.timestamp')}</p>
              <p className="text-sm text-text-primary font-body">{new Date(selectedLog.createdAt).toLocaleString()}</p>
            </div>

            {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <p className="text-xs font-bold text-green-700 mb-2 font-body">{t('settings.audit.newValues')}</p>
                <pre className="text-xs text-green-800 font-mono whitespace-pre-wrap">{JSON.stringify(selectedLog.newValues, null, 2)}</pre>
              </div>
            )}

            {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-bold text-red-700 mb-2 font-body">{t('settings.audit.oldValues')}</p>
                <pre className="text-xs text-red-800 font-mono whitespace-pre-wrap">{JSON.stringify(selectedLog.oldValues, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
