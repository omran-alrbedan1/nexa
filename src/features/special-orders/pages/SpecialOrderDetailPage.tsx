import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { useSpecialOrderDetail, useAssignStaff, useAssignSupplier, useApproveSpecialOrder, useRejectSpecialOrder, useUpdateNotes, useConvertToOrder, useCreatePriceQuote, useSuppliers } from '../hooks/useSpecialOrders';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import {
  ArrowLeft, FileClock, User, Phone, Package, DollarSign,
  CheckCircle2, XCircle, Calendar, MessageSquare,
  Building2, Pencil, RefreshCw, BadgePercent, MessageCircle, Store, MapPin, Search,
} from 'lucide-react';

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'purple' | 'teal' | 'gray'> = {
  pending_admin: 'purple',
  pending_pricing: 'yellow',
  pending_customer: 'teal',
  priced: 'teal',
  approved: 'green',
  rejected: 'red',
  cancelled: 'red',
  converted: 'gray',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function SpecialOrderDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const id = parseInt(requestId || '0', 10);
  const { t } = useTranslation();
  const STATUS_LABELS: Record<string, string> = {
    pending_admin: t('specialOrders.statusLabels.pending_admin'),
    pending_pricing: t('specialOrders.statusLabels.pending_pricing'),
    pending_customer: t('specialOrders.statusLabels.pending_customer'),
    priced: t('specialOrders.statusLabels.priced'),
    approved: t('specialOrders.statusLabels.approved'),
    rejected: t('specialOrders.statusLabels.rejected'),
    cancelled: t('specialOrders.statusLabels.cancelled'),
    converted: t('specialOrders.statusLabels.converted'),
  };
  const formatPrice = useFormatPrice();

  const { data: order, isLoading, isError, error, refetch } = useSpecialOrderDetail(id);
  const assignStaff = useAssignStaff();
  const assignSupplier = useAssignSupplier();
  const approveOrder = useApproveSpecialOrder();
  const rejectOrder = useRejectSpecialOrder();
  const updateNotes = useUpdateNotes();
  const convertOrder = useConvertToOrder();
  const createPriceQuote = useCreatePriceQuote();
  const { data: suppliers = [] } = useSuppliers();

  const [notesModal, setNotesModal] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [priceQuoteModal, setPriceQuoteModal] = useState(false);
  const [priceNotes, setPriceNotes] = useState('');
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; reason: string }>({ open: false, reason: '' });
  const [assignStaffModal, setAssignStaffModal] = useState<{ open: boolean; userId: string }>({ open: false, userId: '' });
  const [assignSupplierModal, setAssignSupplierModal] = useState<{ open: boolean; search: string }>({ open: false, search: '' });
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: number; name: string } | null>(null);
  const [convertModal, setConvertModal] = useState(false);
  const [convertDeliveryFee, setConvertDeliveryFee] = useState('');
  const [zonesList, setZonesList] = useState<Array<{ id: number; name: string }>>([]);
  const [warehousesList, setWarehousesList] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedZone, setSelectedZone] = useState<{ id: number; name: string } | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<{ id: number; name: string } | null>(null);
  const [zoneSearch, setZoneSearch] = useState('');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const zoneDropdownRef = useRef<HTMLDivElement>(null);
  const warehouseDropdownRef = useRef<HTMLDivElement>(null);
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);
  const [warehouseDropdownOpen, setWarehouseDropdownOpen] = useState(false);

  const fetchZones = useCallback(async () => {
    setLoadingZones(true);
    try {
      const res = await apiClient.get<ApiResponse<{ zones: Array<{ id: number; name_ar: string; name_en: string }> }>>('/api/v1/admin/zones?per_page=200');
      const items = res.data.data.zones.map((z) => ({ id: z.id, name: z.name_ar || z.name_en }));
      setZonesList(items);
    } catch {
      setZonesList([]);
    } finally {
      setLoadingZones(false);
    }
  }, []);

  const fetchWarehouses = useCallback(async (zoneId: number) => {
    setLoadingWarehouses(true);
    setWarehousesList([]);
    try {
      const res = await apiClient.get<ApiResponse<{ warehouses: Array<{ id: number; name: string }> }>>(`/api/v1/admin/warehouses?zone_id=${zoneId}&per_page=200`);
      setWarehousesList(res.data.data.warehouses.map((w) => ({ id: w.id, name: w.name })));
    } catch {
      setWarehousesList([]);
    } finally {
      setLoadingWarehouses(false);
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(e.target as Node)) {
        setZoneDropdownOpen(false);
      }
      if (warehouseDropdownRef.current && !warehouseDropdownRef.current.contains(e.target as Node)) {
        setWarehouseDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const [quoteItems, setQuoteItems] = useState<Array<{ name: string; quantity: number; unit: string; unitPrice: string }>>([]);
  const [deliveryFee, setDeliveryFee] = useState('');
  const [validUntil, setValidUntil] = useState('');

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.SPECIAL_ORDERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('specialOrders.detail.back')}
        </button>
        <ErrorState title={t('specialOrders.detail.errorTitle')} message={error instanceof Error ? error.message : ''} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !order) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-5">
            <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = () => {
    approveOrder.mutate({ id: order.id }, { onSuccess: () => setApproveModal(false) });
  };

  const handleReject = () => {
    if (rejectModal.reason.trim()) {
      rejectOrder.mutate({ id: order.id, reason: rejectModal.reason }, { onSuccess: () => setRejectModal({ open: false, reason: '' }) });
    }
  };

  const handleAssignStaff = () => {
    const staffId = parseInt(assignStaffModal.userId);
    if (staffId > 0) {
      assignStaff.mutate({ id: order.id, staffUserId: staffId }, { onSuccess: () => setAssignStaffModal({ open: false, userId: '' }) });
    }
  };

  const handleAssignSupplier = () => {
    if (selectedSupplier) {
      assignSupplier.mutate({ id: order.id, supplierId: selectedSupplier.id }, { onSuccess: () => {
        setAssignSupplierModal({ open: false, search: '' });
        setSelectedSupplier(null);
      }});
    }
  };

  const handleUpdateNotes = () => {
    updateNotes.mutate({ id: order.id, notes: notesText }, { onSuccess: () => setNotesModal(false) });
  };

  const openNotesModal = () => {
    setNotesText(order.internalNotes);
    setNotesModal(true);
  };

  const filteredZones = zonesList.filter((z) =>
    z.name.toLowerCase().includes(zoneSearch.toLowerCase())
  );

  const filteredWarehouses = warehousesList.filter((w) =>
    w.name.toLowerCase().includes(warehouseSearch.toLowerCase())
  );

  const handleOpenConvertModal = () => {
    const acceptedQuote = order.priceQuotes.find((q) => q.status === 'accepted');
    setConvertDeliveryFee(acceptedQuote ? String(acceptedQuote.deliveryFee) : '');
    setSelectedZone(null);
    setSelectedWarehouse(null);
    setZoneSearch('');
    setWarehouseSearch('');
    setZonesList([]);
    setWarehousesList([]);
    setConvertModal(true);
    fetchZones();
  };

  // Build workflow timeline steps
  const timelineSteps = [
    { statusKey: 'created', time: order.createdAt, descKey: 'created', descArgs: undefined, done: true },
    ...(order.status !== 'pending_admin' ? [{
      statusKey: 'assigned', time: order.updatedAt,
      descKey: order.assignedSupplier ? 'assignedTo' : 'staffAssigned',
      descArgs: order.assignedSupplier ? { name: order.assignedSupplier.businessName } : undefined,
      done: true,
    }] : []),
    ...(order.priceQuotes.length > 0 ? [{
      statusKey: 'priced', time: order.updatedAt,
      descKey: 'priced',
      descArgs: { amount: formatPrice(order.priceQuotes[0].total) },
      done: true,
    }] : []),
    ...(order.status === 'approved' || order.status === 'converted' ? [{ statusKey: 'approved', time: order.updatedAt, descKey: 'approved', descArgs: undefined, done: true }] : []),
    ...(order.status === 'converted' ? [{ statusKey: 'converted', time: order.updatedAt, descKey: 'converted', descArgs: undefined, done: true }] : []),
    ...(order.status === 'rejected' ? [{ statusKey: 'rejected', time: order.updatedAt, descKey: 'rejected', descArgs: undefined, done: true }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <button onClick={() => navigate(ROUTES.SPECIAL_ORDERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('specialOrders.detail.back')}
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-amber-500/10 via-amber-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <FileClock size={24} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-extrabold text-text-primary font-display">{order.referenceNumber}</h1>
                <Badge variant={STATUS_BADGE[order.status] || 'yellow'} size="sm">{STATUS_LABELS[order.status]}</Badge>
              </div>
              <p className="text-sm text-text-secondary font-body mt-1">{t('specialOrders.detail.specialRequest')} · {order.customer?.fullName || 'Unknown'}</p>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {order.status === 'pending_admin' && (
                <>
                  <Button variant="outline" size="sm" leftIcon={<Building2 size={14} />} onClick={() => setAssignSupplierModal({ open: true, search: '' })}>
                    {t('specialOrders.detail.assignSupplier')}
                  </Button>
                  <Button variant="secondary" size="sm" leftIcon={<User size={14} />} onClick={() => setAssignStaffModal({ open: true, userId: '' })}>
                    {t('specialOrders.detail.assignStaff')}
                  </Button>
                  <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} onClick={() => setApproveModal(true)}>
                    {t('specialOrders.detail.approve')}
                  </Button>
                  <Button variant="secondary" size="sm" leftIcon={<XCircle size={14} />} onClick={() => setRejectModal({ open: true, reason: '' })}>
                    {t('specialOrders.detail.reject')}
                  </Button>
                </>
              )}
              {order.status === 'pending_customer' && (
                <>
                  <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} isLoading={approveOrder.isPending} onClick={() => approveOrder.mutate({ id: order.id })}>
                    {t('specialOrders.detail.approve')}
                  </Button>
                  <Button variant="secondary" size="sm" leftIcon={<XCircle size={14} />} isLoading={rejectOrder.isPending} onClick={() => setRejectModal({ open: true, reason: '' })}>
                    {t('specialOrders.detail.reject')}
                  </Button>
                </>
              )}
              {order.status === 'approved' && (
                <Button variant="primary" size="sm" leftIcon={<RefreshCw size={14} />} isLoading={convertOrder.isPending} onClick={handleOpenConvertModal}>
                  {t('specialOrders.detail.convertToOrder')}
                </Button>
              )}
              {order.status === 'pending_pricing' && (
                <>
                  <Button variant="primary" size="sm" leftIcon={<BadgePercent size={14} />} onClick={() => {
                    setQuoteItems(order.items.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit, unitPrice: '' })));
                    setDeliveryFee('');
                    setValidUntil('');
                    setPriceNotes('');
                    setPriceQuoteModal(true);
                  }}>
                    {t('specialOrders.detail.submitPriceQuote')}
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<Pencil size={14} />} onClick={openNotesModal}>
                    {t('specialOrders.detail.updateNotes')}
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" leftIcon={<Pencil size={14} />} onClick={openNotesModal}>
                {t('specialOrders.detail.notes')}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-amber-500 via-brand-primary to-amber-500 rounded-full opacity-30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Items + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Notes */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-amber-600" />
              <h3 className="text-sm font-bold text-text-primary font-display">{t('specialOrders.detail.customerNotes')}</h3>
            </div>
            <p className="text-sm text-text-primary font-body leading-relaxed">{order.customerNotes || t('specialOrders.detail.noNotes')}</p>
          </Card>

          {/* Items */}
          {order.items.length > 0 && (
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-amber-600" />
                <h3 className="text-sm font-bold text-text-primary font-display">{t('specialOrders.detail.items')} ({order.items.length})</h3>
              </div>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-border-default/60">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-text-primary font-body">{item.name}</span>
                        <p className="text-xs text-text-tertiary font-body mt-0.5">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <span className="text-xs font-bold text-text-primary">{item.quantity} {item.unit}</span>
                      </div>
                    </div>
                    {item.customerNote && (
                      <p className="text-xs text-text-secondary font-body mt-1.5 italic">"{item.customerNote}"</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Price Quotes */}
          {order.priceQuotes.length > 0 && (
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={16} className="text-amber-600" />
                <h3 className="text-sm font-bold text-text-primary font-display">{t('specialOrders.detail.priceQuotes')}</h3>
              </div>
              <div className="space-y-3">
                {order.priceQuotes.map((quote) => (
                  <div key={quote.id} className="p-3 rounded-xl bg-bg-section-alt border border-border-default/60">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary font-body">{quote.quoteNumber}</span>
                        <Badge variant={quote.status === 'accepted' ? 'green' : quote.status === 'rejected' ? 'red' : quote.status === 'superseded' ? 'gray' : 'yellow'} size="sm">
                          {t('specialOrders.quoteStatus.' + quote.status, quote.status)}
                        </Badge>
                      </div>
                      <span className="text-sm font-extrabold text-brand-accent">{formatPrice(quote.total)}</span>
                    </div>
                    {quote.supplier && (
                      <p className="text-xs text-text-tertiary font-body">
                        <Store size={11} className="inline mr-1" />
                        {quote.supplier.businessName}
                      </p>
                    )}
                    {quote.items && quote.items.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {quote.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-text-secondary font-body">
                            <span>{item.name} × {item.quantity} {item.unit}</span>
                            <span>{formatPrice(item.total)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-bold text-text-primary pt-1 border-t border-border-default/50 mt-1">
                          <span>{t('specialOrders.detail.subtotal')}</span>
                          <span>{formatPrice(quote.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-text-secondary">
                          <span>{t('specialOrders.detail.deliveryFeeLabel')}</span>
                          <span>{formatPrice(quote.deliveryFee)}</span>
                        </div>
                      </div>
                    )}
                    {quote.customerResponseNote && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg p-2 font-body">
                        {t('specialOrders.detail.customerResponse', { note: quote.customerResponseNote })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Negotiations */}
          {order.negotiations.length > 0 && (
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-text-primary font-display">{t('specialOrders.negotiations.title')}</h3>
              </div>
              <div className="space-y-3">
                {order.negotiations.map((n) => (
                  <div key={n.id} className="flex gap-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-text-primary font-body">
                          {n.actorType === 'customer' ? t('specialOrders.negotiations.customer') : n.user?.fullName || t('specialOrders.negotiations.staff')}
                        </span>
                        <span className="text-text-tertiary">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-text-primary font-body mt-1">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-tertiary mt-3 font-body">
                {t('specialOrders.negotiations.responseHint')}
              </p>
            </Card>
          )}

          {/* Timeline */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-amber-600" />
              <h3 className="text-sm font-bold text-text-primary font-display">{t('specialOrders.detail.timeline')}</h3>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-default" />
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative pb-8 last:pb-0">
                  <div className={cn(
                    'absolute -left-[23px] w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center',
                    step.done ? 'bg-brand-primary' : 'bg-gray-200'
                  )}>
                    <div className={cn('w-2 h-2 rounded-full', step.done ? 'bg-white' : 'bg-gray-400')} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary font-body">{t('specialOrders.timelineLabels.' + step.statusKey, step.statusKey)}</span>
                    <span className="text-xs text-text-tertiary font-body ml-2">{new Date(step.time).toLocaleString()}</span>
                    <p className="text-xs text-text-secondary font-body mt-0.5">
                      {t('specialOrders.timelineDescriptions.' + step.descKey, step.descArgs)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column — Details + Actions */}
        <div className="space-y-6">
          <Card padding="md">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 font-body">{t('specialOrders.detail.customerInfo')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-text-tertiary" />
                <span className="font-bold text-text-primary">{order.customer?.fullName || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-text-tertiary" />
                <span className="font-bold text-text-primary">{order.customer?.phone || '—'}</span>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 font-body">{t('specialOrders.detail.assignment')}</h3>
            <div className="space-y-3 text-sm">
              {order.assignedSupplier ? (
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-text-tertiary" />
                  <div>
                    <p className="text-xs text-text-tertiary font-body">{t('specialOrders.detail.supplier')}</p>
                    <p className="font-bold text-text-primary">{order.assignedSupplier.businessName}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-text-tertiary" />
                  <span className="text-text-tertiary">{t('specialOrders.detail.noSupplier')}</span>
                </div>
              )}
            </div>
          </Card>

          <Card padding="md">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 font-body">{t('specialOrders.detail.internalNotes')}</h3>
            <p className="text-sm text-text-primary font-body whitespace-pre-wrap">{order.internalNotes || t('specialOrders.detail.noInternalNotes')}</p>
            <Button variant="outline" size="sm" className="mt-3" leftIcon={<Pencil size={12} />} onClick={openNotesModal}>
              {t('specialOrders.detail.editNotes')}
            </Button>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between text-xs text-text-tertiary font-body">
              <span>{t('specialOrders.detail.created')}</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-text-tertiary font-body mt-2">
              <span>{t('specialOrders.detail.updated')}</span>
              <span>{new Date(order.updatedAt).toLocaleString()}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Approve Modal */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)} title={t('specialOrders.detail.approveTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">{t('specialOrders.detail.approveDescription')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setApproveModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={approveOrder.isPending} onClick={handleApprove}>{t('specialOrders.detail.confirmApprove')}</Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, reason: '' })} title={t('specialOrders.detail.rejectTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.rejectReason')}</label>
            <textarea rows={3} value={rejectModal.reason} onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none" placeholder={t('specialOrders.detail.rejectPlaceholder')} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setRejectModal({ open: false, reason: '' })}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={rejectOrder.isPending} disabled={!rejectModal.reason.trim()} onClick={handleReject}>{t('specialOrders.detail.confirmReject')}</Button>
          </div>
        </div>
      </Modal>

      {/* Notes Modal */}
      <Modal open={notesModal} onClose={() => setNotesModal(false)} title={t('specialOrders.detail.editNotesTitle')}>
        <div className="space-y-4">
          <textarea rows={5} value={notesText} onChange={(e) => setNotesText(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none" placeholder={t('specialOrders.detail.notesPlaceholder')} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setNotesModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={updateNotes.isPending} onClick={handleUpdateNotes}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal open={assignStaffModal.open} onClose={() => setAssignStaffModal({ open: false, userId: '' })} title={t('specialOrders.detail.assignStaffTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.staffUserId')}</label>
            <input type="number" value={assignStaffModal.userId} onChange={(e) => setAssignStaffModal({ ...assignStaffModal, userId: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setAssignStaffModal({ open: false, userId: '' })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={assignStaff.isPending} disabled={!assignStaffModal.userId} onClick={handleAssignStaff}>{t('specialOrders.detail.assign')}</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Supplier Modal — searchable dropdown */}
      <Modal open={assignSupplierModal.open} onClose={() => { setAssignSupplierModal({ open: false, search: '' }); setSelectedSupplier(null); }} title={t('specialOrders.detail.assignSupplierTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.supplier')}</label>
            <input
              type="text"
              value={assignSupplierModal.search}
              onChange={(e) => setAssignSupplierModal({ ...assignSupplierModal, search: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              placeholder={t('specialOrders.detail.searchSupplierPlaceholder') || t('specialOrders.detail.searchSupplier')}
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 border border-border-default rounded-lg p-1">
            {suppliers
              .filter((s) => (s.name || '').toLowerCase().includes((assignSupplierModal.search || '').toLowerCase()))
              .map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSupplier(s)}
                  className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                    selectedSupplier?.id === s.id
                      ? 'bg-brand-primary/10 text-brand-primary font-bold'
                      : 'hover:bg-bg-section-alt text-text-primary'
                  }`}
                >
                  {s.name}
                </div>
              ))}
            {suppliers.filter((s) => (s.name || '').toLowerCase().includes((assignSupplierModal.search || '').toLowerCase())).length === 0 && (
              <p className="text-xs text-text-tertiary text-center py-3">{t('specialOrders.detail.noSuppliers')}</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => { setAssignSupplierModal({ open: false, search: '' }); setSelectedSupplier(null); }}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={assignSupplier.isPending} disabled={!selectedSupplier} onClick={handleAssignSupplier}>{t('specialOrders.detail.assign')}</Button>
          </div>
        </div>
      </Modal>

      {/* Price Quote Modal — item-level pricing (temporary admin-proxy until supplier app is ready) */}
      <Modal open={priceQuoteModal} onClose={() => setPriceQuoteModal(false)} title={t('specialOrders.detail.priceQuoteTitle')}>
        <div className="space-y-4">
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
            ⚠️ This is a temporary admin proxy for supplier pricing. Remove once the supplier app is live.
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-bold text-text-secondary font-body">{t('specialOrders.detail.items')}</label>
            {quoteItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border-default/60">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary font-body">{item.name}</p>
                  <p className="text-xs text-text-tertiary font-body">{item.quantity} {item.unit}</p>
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const updated = [...quoteItems];
                      updated[idx] = { ...updated[idx], unitPrice: e.target.value };
                      setQuoteItems(updated);
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary text-right"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.deliveryFee') || t('specialOrders.detail.deliveryFeeLabel')}</label>
              <input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" placeholder="0.00" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.validUntil') || t('specialOrders.detail.validUntil')}</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.priceQuoteNotes')}</label>
            <textarea rows={2} value={priceNotes} onChange={(e) => setPriceNotes(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none" placeholder={t('specialOrders.detail.priceQuoteNotesPlaceholder')} />
          </div>
          {order.priceQuotes.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <RefreshCw size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-body">{t('specialOrders.detail.priceQuoteUpdateWarning')}</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setPriceQuoteModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={createPriceQuote.isPending} disabled={quoteItems.some((i) => !i.unitPrice || parseFloat(i.unitPrice) <= 0)} onClick={() => {
              createPriceQuote.mutate({
                id: order.id,
                data: {
                  items: quoteItems.map((i) => ({
                    name: i.name,
                    quantity: i.quantity,
                    unit: i.unit,
                    unit_price: parseFloat(i.unitPrice),
                  })),
                  delivery_fee: deliveryFee ? parseFloat(deliveryFee) : undefined,
                  valid_until: validUntil || undefined,
                  customer_notes: priceNotes || undefined,
                },
              });
              setPriceQuoteModal(false);
            }}>
              {t('specialOrders.detail.submitQuote')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Convert to Order Modal */}
      <Modal open={convertModal} onClose={() => setConvertModal(false)} title={t('specialOrders.detail.convertToOrder') || t('specialOrders.detail.convertToOrder')}>
        <div className="space-y-4">
          {/* Zone selector */}
          <div ref={zoneDropdownRef} className="relative">
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">
              <MapPin size={12} className="inline mr-1" />Zone
            </label>
            <div
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input cursor-pointer flex items-center justify-between"
              onClick={() => { setZoneDropdownOpen(!zoneDropdownOpen); setWarehouseDropdownOpen(false); }}
            >
              <span className={selectedZone ? 'text-text-primary' : 'text-text-tertiary'}>
                {selectedZone ? selectedZone.name : loadingZones ? t('specialOrders.detail.loadingZones') : t('specialOrders.detail.selectZone')}
              </span>
              <Search size={14} className="text-text-tertiary" />
            </div>
            {zoneDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full border border-border-default rounded-lg bg-white shadow-lg max-h-56 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-border-default/50">
                  <input
                    type="text"
                    value={zoneSearch}
                    onChange={(e) => setZoneSearch(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-border-default rounded-md bg-bg-input outline-none focus:border-brand-primary"
                    placeholder={t('specialOrders.detail.searchZone')}
                    autoFocus
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingZones ? (
                    <p className="text-xs text-text-tertiary text-center py-4">{t('common.loading')}</p>
                  ) : filteredZones.length === 0 ? (
                    <p className="text-xs text-text-tertiary text-center py-4">{t('specialOrders.detail.noZones')}</p>
                  ) : (
                    filteredZones.map((z) => (
                      <div
                        key={z.id}
                        onClick={() => {
                          setSelectedZone(z);
                          setWarehouseSearch('');
                          setSelectedWarehouse(null);
                          setWarehousesList([]);
                          setZoneDropdownOpen(false);
                          fetchWarehouses(z.id);
                        }}
                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                          selectedZone?.id === z.id
                            ? 'bg-brand-primary/10 text-brand-primary font-bold'
                            : 'hover:bg-bg-section-alt text-text-primary'
                        }`}
                      >
                        {z.name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Warehouse selector */}
          <div ref={warehouseDropdownRef} className="relative">
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">
              <Store size={12} className="inline mr-1" />{t('specialOrders.detail.warehouse')}
            </label>
            <div
              className={`w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input cursor-pointer flex items-center justify-between ${
                !selectedZone ? 'opacity-50 pointer-events-none' : ''
              }`}
              onClick={() => { if (selectedZone) { setWarehouseDropdownOpen(!warehouseDropdownOpen); setZoneDropdownOpen(false); } }}
            >
              <span className={selectedWarehouse ? 'text-text-primary' : 'text-text-tertiary'}>
                {selectedWarehouse ? selectedWarehouse.name
                  : !selectedZone ? t('specialOrders.detail.selectZoneFirst')
                  : loadingWarehouses ? t('specialOrders.detail.loadingWarehouses')
                  : t('specialOrders.detail.selectWarehouse')}
              </span>
              <Search size={14} className="text-text-tertiary" />
            </div>
            {warehouseDropdownOpen && selectedZone && (
              <div className="absolute z-50 mt-1 w-full border border-border-default rounded-lg bg-white shadow-lg max-h-56 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-border-default/50">
                  <input
                    type="text"
                    value={warehouseSearch}
                    onChange={(e) => setWarehouseSearch(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-border-default rounded-md bg-bg-input outline-none focus:border-brand-primary"
                    placeholder={t('specialOrders.detail.searchWarehouse')}
                    autoFocus
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingWarehouses ? (
                    <p className="text-xs text-text-tertiary text-center py-4">{t('common.loading')}</p>
                  ) : filteredWarehouses.length === 0 ? (
                    <p className="text-xs text-text-tertiary text-center py-4">{t('specialOrders.detail.noWarehouses')}</p>
                  ) : (
                    filteredWarehouses.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => {
                          setSelectedWarehouse(w);
                          setWarehouseDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                          selectedWarehouse?.id === w.id
                            ? 'bg-brand-primary/10 text-brand-primary font-bold'
                            : 'hover:bg-bg-section-alt text-text-primary'
                        }`}
                      >
                        {w.name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.deliveryFeeLabel')}</label>
            <input
              type="number"
              value={convertDeliveryFee}
              onChange={(e) => setConvertDeliveryFee(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          {order.priceQuotes.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
              <RefreshCw size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-green-700 font-body">
                <p className="font-bold">Prices will auto-populate from the accepted quote.</p>
                <p className="mt-1">{t('specialOrders.detail.quoteAutoHint')}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setConvertModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={convertOrder.isPending}
              disabled={!selectedZone || !selectedWarehouse}
              onClick={() => {
                const acceptedQuote = order.priceQuotes.find((q) => q.status === 'accepted');
                convertOrder.mutate({
                  id: order.id,
                  data: {
                    warehouse_id: selectedWarehouse!.id,
                    zone_id: selectedZone!.id,
                    delivery_fee: convertDeliveryFee ? parseFloat(convertDeliveryFee) : (acceptedQuote?.deliveryFee || undefined),
                  },
                });
                setConvertModal(false);
              }}>
              {t('specialOrders.detail.convertToOrder') || 'Convert'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
