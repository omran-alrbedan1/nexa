import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminNotifications, useSendNotification, useBroadcastNotification } from '../hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Bell, Send, Radio, Users, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data: notifData, isLoading, isError, error, refetch } = useAdminNotifications({ page });
  const sendNotification = useSendNotification();
  const broadcastNotification = useBroadcastNotification();

  const [activeTab, setActiveTab] = useState('history');
  const [sendModal, setSendModal] = useState(false);
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [sendForm, setSendForm] = useState({ userId: '' as string, title: '', body: '', channel: 'in_app' });
  const [broadcastForm, setBroadcastForm] = useState({ title: '', body: '', channel: 'in_app', userType: 'customer' });

  const notifications = notifData?.data || [];
  const meta = notifData?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };

  const handleSend = () => {
    sendNotification.mutate({
      userId: parseInt(sendForm.userId),
      title: sendForm.title,
      body: sendForm.body,
      channel: sendForm.channel,
    }, {
      onSuccess: () => {
        setSendModal(false);
        setSendForm({ userId: '', title: '', body: '', channel: 'in_app' });
      },
    });
  };

  const handleBroadcast = () => {
    broadcastNotification.mutate(broadcastForm, {
      onSuccess: () => {
        setBroadcastModal(false);
        setBroadcastForm({ title: '', body: '', channel: 'in_app', userType: 'customer' });
      },
    });
  };

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.notifications.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('settings.notifications.description')}</p>
        </div>
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <Bell size={22} className="text-brand-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.notifications.title')}</h1>
                <p className="text-sm text-text-secondary font-body">{t('settings.notifications.description')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" leftIcon={<Send size={14} />} onClick={() => setSendModal(true)}>
                {t('settings.notifications.send')}
              </Button>
              <Button variant="primary" size="sm" leftIcon={<Radio size={14} />} onClick={() => setBroadcastModal(true)}>
                {t('settings.notifications.broadcast')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-bg-section-alt rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('history')}
          className={cn('px-4 py-2 rounded-lg text-sm font-body font-medium transition-all', activeTab === 'history' ? 'bg-white text-brand-primary shadow-sm font-bold' : 'text-text-secondary')}
        >
          {t('settings.notifications.history')}
        </button>
      </div>

      <Card padding="lg">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState title={t('settings.notifications.noNotifications')} description={t('settings.notifications.sendFirst')} />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 rounded-xl border border-border-default/60">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-brand-primary flex-shrink-0" />
                      <span className="text-sm font-bold text-text-primary font-body">{notif.title}</span>
                      <Badge variant={notif.channel === 'in_app' ? 'teal' : notif.channel === 'sms' ? 'purple' : 'green'} size="sm">{notif.channel}</Badge>
                    </div>
                    <p className="text-xs text-text-secondary font-body mt-1">{notif.body}</p>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary font-body mt-1.5">
                      {notif.user && <span className="flex items-center gap-1"><Users size={12} /> {notif.user.fullName}</span>}
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(notif.createdAt).toLocaleString()}</span>
                      {notif.readAt && <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> {t('settings.notifications.read')}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination
          currentPage={meta.currentPage}
          lastPage={meta.lastPage}
          total={meta.total}
          perPage={15}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </Card>

      {/* Send Modal */}
      <Modal open={sendModal} onClose={() => setSendModal(false)} title={t('settings.notifications.sendTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.notifications.userId')}</label>
            <input type="number" value={sendForm.userId} onChange={(e) => setSendForm({ ...sendForm, userId: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.notifications.titleField')}</label>
            <input value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.notifications.body')}</label>
            <textarea rows={3} value={sendForm.body} onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setSendModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={sendNotification.isPending} onClick={handleSend}>{t('settings.notifications.send')}</Button>
          </div>
        </div>
      </Modal>

      {/* Broadcast Modal */}
      <Modal open={broadcastModal} onClose={() => setBroadcastModal(false)} title={t('settings.notifications.broadcastTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.notifications.titleField')}</label>
            <input value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.notifications.body')}</label>
            <textarea rows={3} value={broadcastForm.body} onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.notifications.userType')}</label>
            <select value={broadcastForm.userType} onChange={(e) => setBroadcastForm({ ...broadcastForm, userType: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary">
              <option value="customer">{t('settings.notifications.customers')}</option>
              <option value="supplier">{t('settings.notifications.suppliers')}</option>
              <option value="driver">{t('settings.notifications.drivers')}</option>
              <option value="all">{t('settings.notifications.all')}</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setBroadcastModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={broadcastNotification.isPending} onClick={handleBroadcast}>{t('settings.notifications.broadcast')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
