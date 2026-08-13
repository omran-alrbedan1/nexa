import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { useTrustedPhones, useAddTrustedPhone, useDeleteTrustedPhone } from '../hooks/useSuppliers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, ShieldCheck, Plus, Trash2, Phone } from 'lucide-react';
import axios from 'axios';

export function TrustedPhonesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: phones, isLoading, isError, error, refetch } = useTrustedPhones();
  const addTrusted = useAddTrustedPhone();
  const deleteTrusted = useDeleteTrustedPhone();

  const [addModal, setAddModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; phone: string } | null>(null);

  const submitAdd = () => {
    const normalized = phoneInput.replace(/[^\d+]/g, '');
    if (!normalized) {
      setFormError(t('suppliers.trusted.phoneRequired'));
      return;
    }
    setFormError(null);
    addTrusted.mutate({ phone: normalized, note: noteInput.trim() || undefined }, {
      onSuccess: () => {
        setPhoneInput('');
        setNoteInput('');
        setAddModal(false);
      },
      onError: (err: unknown) => {
        if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
          const data = err.response.data as { message?: unknown; error_code?: unknown };
          if (data.error_code === 'phone_already_trusted' && typeof data.message === 'string') {
            setFormError(data.message);
            return;
          }
        }
        setFormError(t('suppliers.trusted.addFailed'));
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back */}
      <button onClick={() => navigate(ROUTES.SUPPLIERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('suppliers.trusted.back')}
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('suppliers.trusted.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('suppliers.trusted.description')}</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => { setFormError(null); setAddModal(true); }}>
          {t('suppliers.trusted.add')}
        </Button>
      </div>

      {isError ? (
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
        </div>
      ) : !phones || phones.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<ShieldCheck className="h-12 w-12 text-gray-300" strokeWidth={1} />}
            title={t('suppliers.trusted.emptyTitle')}
            description={t('suppliers.trusted.emptyMessage')}
          />
        </Card>
      ) : (
        <Card padding="md">
          <div className="divide-y divide-border-default/60">
            {phones.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 px-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-brand-primary-light text-brand-primary flex-shrink-0">
                    <Phone size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary font-body truncate">{p.phone}</p>
                    {p.note ? (
                      <p className="text-xs text-text-secondary font-body truncate">{p.note}</p>
                    ) : (
                      <Badge variant="teal" size="sm">{t('suppliers.trusted.autoApproved')}</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setDeleteTarget({ id: p.id, phone: p.phone })}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title={t('suppliers.trusted.addTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.trusted.phone')}</label>
            <input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
              placeholder="+9627XXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.trusted.note')}</label>
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
              placeholder={t('suppliers.trusted.notePlaceholder')}
            />
          </div>
          {formError && (
            <p className="text-xs text-red-600 font-body bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>
          )}
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setAddModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={addTrusted.isPending} onClick={submitAdd}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('suppliers.trusted.removeTitle', { phone: deleteTarget?.phone || '' })}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">{t('suppliers.trusted.removeConfirm', { phone: deleteTarget?.phone || '' })}</p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={deleteTrusted.isPending} onClick={() => {
              if (deleteTarget) {
                deleteTrusted.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
              }
            }}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
