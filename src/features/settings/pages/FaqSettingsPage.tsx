import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { apiClient } from '@/lib/axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { extractErrorMessage } from '@/lib/apiHelpers';
import { Save, Plus, Pencil, Trash2, GripVertical, HelpCircle, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ApiResponse } from '@/types/common';

interface Faq {
  id: number;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FaqForm {
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FaqForm = {
  question_ar: '', question_en: '',
  answer_ar: '', answer_en: '',
  sort_order: 0, is_active: true,
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function FaqSettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FaqForm>(emptyForm);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['faqs', debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await apiClient.get<ApiResponse<{ faqs: any[]; meta: any }>>(`/api/v1/admin/faqs?${params.toString()}`);
      return res.data.data;
    },
    staleTime: 30_000,
  });

  const faqs: Faq[] = (data?.faqs || []).map((f: any) => ({
    ...f,
    is_active: Boolean(f.is_active),
  }));

  const meta = data?.meta ?? { current_page: 1, last_page: 1, total: 0 };

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['faqs'] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (data: FaqForm) =>
      apiClient.post('/api/v1/admin/faqs', {
        question_ar: data.question_ar,
        question_en: data.question_en || undefined,
        answer_ar: data.answer_ar,
        answer_en: data.answer_en || undefined,
        sort_order: data.sort_order,
        is_active: data.is_active,
      }),
    onSuccess: () => { invalidate(); addToast('success', t('settings.faq.createdToast')); setModalOpen(false); setForm(emptyForm); },
    onError: (err) => addToast('error', extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FaqForm> }) =>
      apiClient.put(`/api/v1/admin/faqs/${id}`, data),
    onSuccess: () => { invalidate(); addToast('success', t('settings.faq.updatedToast')); setModalOpen(false); setEditingId(null); setForm(emptyForm); },
    onError: (err) => addToast('error', extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/v1/admin/faqs/${id}`),
    onSuccess: () => { invalidate(); addToast('success', t('settings.faq.deletedToast')); setDeleteConfirm(null); },
    onError: (err) => addToast('error', extractErrorMessage(err)),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sort_order: faqs.length > 0 ? Math.max(...faqs.map((f) => f.sort_order)) + 1 : 0,
    });
    setModalOpen(true);
  };

  const openEdit = (faq: Faq) => {
    setEditingId(faq.id);
    setForm({
      question_ar: faq.question_ar,
      question_en: faq.question_en,
      answer_ar: faq.answer_ar,
      answer_en: faq.answer_en,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.question_ar || !form.answer_ar) {
      addToast('error', t('settings.faq.validationRequired'));
      return;
    }
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleActive = (faq: Faq) => {
    updateMutation.mutate({ id: faq.id, data: { is_active: !faq.is_active } });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <HelpCircle size={22} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('settings.faq.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('settings.faq.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-purple-500 via-brand-accent to-purple-500 rounded-full opacity-30" />
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('settings.faq.searchPlaceholder')}
              className="w-full sm:w-64 px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
            {t('settings.faq.addFaq')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : faqs.length === 0 ? (
          <EmptyState title={t('settings.faq.emptyTitle')} description={t('settings.faq.emptyDescription')} />
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-xl border border-border-default/60 bg-white overflow-hidden transition-all hover:border-border-default"
              >
                <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => toggleExpand(faq.id)}>
                  <div className="flex-shrink-0 mt-0.5">
                    <GripVertical size={16} className="text-text-tertiary/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-primary font-body truncate">
                        {faq.question_ar}
                      </h4>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        faq.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-text-tertiary'
                      )}>
                        {faq.is_active ? t('settings.faq.active') : t('settings.faq.draft')}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary font-body mt-0.5 truncate">{faq.question_en}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActive(faq); }}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        faq.is_active ? 'hover:bg-amber-50 text-green-600' : 'hover:bg-green-50 text-text-tertiary'
                      )}
                      title={faq.is_active ? t('settings.faq.deactivate') : t('settings.faq.activate')}
                    >
                      {faq.is_active ? <Check size={14} /> : <X size={14} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(faq); }}
                      className="p-1.5 rounded-lg hover:bg-brand-primary-light text-text-tertiary hover:text-brand-primary transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(faq.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-text-tertiary hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    {expanded.has(faq.id) ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />}
                  </div>
                </div>

                {expanded.has(faq.id) && (
                  <div className="px-4 pb-4 pt-0 border-t border-border-default/40 mt-0">
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">{t('settings.faq.questionAr')}</p>
                        <p className="text-sm text-text-primary font-body">{faq.question_ar}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">{t('settings.faq.questionEn')}</p>
                        <p className="text-sm text-text-primary font-body">{faq.question_en || '—'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">{t('settings.faq.answerAr')}</p>
                        <p className="text-sm text-text-primary font-body whitespace-pre-wrap">{faq.answer_ar}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">{t('settings.faq.answerEn')}</p>
                        <p className="text-sm text-text-primary font-body whitespace-pre-wrap">{faq.answer_en || '—'}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-[10px] text-text-tertiary">
                      <span>{t('settings.faq.sortLabel')} {faq.sort_order}</span>
                      <span>{t('settings.faq.createdLabel')} {new Date(faq.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <Pagination
          currentPage={meta.current_page ?? 1}
          lastPage={meta.last_page ?? 1}
          total={meta.total ?? faqs.length}
          perPage={15}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); setForm(emptyForm); }}
        title={editingId !== null ? t('settings.faq.editModalTitle') : t('settings.faq.addModalTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.faq.questionAr')} *</label>
            <input
              value={form.question_ar}
              onChange={(e) => setForm((prev) => ({ ...prev, question_ar: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              placeholder={t('settings.faq.questionArPlaceholder')}
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.faq.questionEn')}</label>
            <input
              value={form.question_en}
              onChange={(e) => setForm((prev) => ({ ...prev, question_en: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              placeholder={t('settings.faq.questionEnPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.faq.answerAr')} *</label>
            <textarea
              value={form.answer_ar}
              onChange={(e) => setForm((prev) => ({ ...prev, answer_ar: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none"
              placeholder={t('settings.faq.answerArPlaceholder')}
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.faq.answerEn')}</label>
            <textarea
              value={form.answer_en}
              onChange={(e) => setForm((prev) => ({ ...prev, answer_en: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none"
              placeholder={t('settings.faq.answerEnPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.faq.sortOrder')}</label>
              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) => setForm((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.faq.status')}</label>
              <select
                value={form.is_active ? '1' : '0'}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === '1' }))}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              >
                <option value="1">{t('settings.faq.active')}</option>
                <option value="0">{t('settings.faq.draft')}</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => { setModalOpen(false); setEditingId(null); setForm(emptyForm); }}>
              {t('settings.faq.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save size={14} />}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onClick={handleSave}
            >
              {editingId !== null ? t('settings.faq.update') : t('settings.faq.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title={t('settings.faq.deleteModalTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">{t('settings.faq.deleteModalDescription')}</p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>{t('settings.faq.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={deleteMutation.isPending} onClick={() => deleteConfirm !== null && deleteMutation.mutate(deleteConfirm)}>
              {t('settings.faq.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
