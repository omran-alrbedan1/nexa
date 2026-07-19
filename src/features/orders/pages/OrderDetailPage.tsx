import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrderDetail, useUpdateOrderStatus, useConfirmWarehouseReceipt, useRescheduleOrder, useTransferOrder } from '../hooks/useOrders';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { useDeliveryStage } from '@/hooks/useDeliveryStage';
import DriverTrackingMap from '../components/DriverTrackingMap';
import DeliveryStageIndicator from '../components/DeliveryStageIndicator';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, Package, Truck,
  CreditCard, ShoppingBag, CheckCircle2, XCircle, AlertTriangle,
  CalendarDays, Building2, ArrowRightLeft, DollarSign, FileClock, Navigation,
} from 'lucide-react';
import type { OrderDetail } from '../api/ordersApi';
import { cn } from '@/lib/utils';
import { useFormatPrice } from '@/hooks/useFormatPrice';

const STATUS_BADGE: Record<string, 'green' | 'teal' | 'yellow' | 'purple' | 'red' | 'gray'> = {
  new: 'purple',
  pending_management: 'yellow',
  pending_pricing: 'yellow',
  pending_customer_approval: 'yellow',
  confirmed: 'teal',
  paid: 'teal',
  pending_supply: 'yellow',
  pending_aggregation: 'yellow',
  ready_to_ship: 'teal',
  out_for_delivery: 'teal',
  delivered: 'green',
  failed_delivery: 'red',
  cancelled: 'red',
  postponed: 'yellow',
  refunded: 'gray',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New', pending_management: 'Pending Mgmt', pending_pricing: 'Pending Pricing',
  pending_customer_approval: 'Awaiting Customer', confirmed: 'Confirmed', paid: 'Paid',
  pending_supply: 'In Supply', pending_aggregation: 'In Aggregation',
  ready_to_ship: 'Ready to Ship', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', failed_delivery: 'Failed Delivery',
  cancelled: 'Cancelled', postponed: 'Postponed', refunded: 'Refunded',
};

const TYPE_BADGE: Record<string, 'teal' | 'coral' | 'purple'> = {
  regular: 'teal', special: 'coral', seasonal: 'purple',
};

const PAYMENT_STATUS_VARIANT: Record<string, 'green' | 'yellow' | 'red'> = {
  paid: 'green', pending: 'yellow', failed: 'red', refunded: 'red',
};

function OrderInfoCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <Card padding="md" hover>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-brand-accent-light text-brand-accent flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-1">{label}</p>
          <div className="text-sm text-text-primary font-body leading-relaxed">{children}</div>
        </div>
      </div>
    </Card>
  );
}

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const id = parseInt(orderId || '0', 10);
  const { t } = useTranslation();
  const { data: order, isLoading, isError, error, refetch } = useOrderDetail(id);
  const updateStatus = useUpdateOrderStatus();
  const confirmReceipt = useConfirmWarehouseReceipt();
  const rescheduleOrder = useRescheduleOrder();
  const transferOrder = useTransferOrder();
  const addToast = useToastStore((s) => s.addToast);
  const formatPrice = useFormatPrice();
  void useDeliveryStage(id);
  const [cancelModal, setCancelModal] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [transferModal, setTransferModal] = useState(false);
  const [transferWarehouseId, setTransferWarehouseId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.ORDERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('orders.detail.back')}
        </button>
        <ErrorState
          title={t('orders.detail.errorTitle')}
          message={error instanceof Error ? error.message : 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading || !order) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const getAvailableActions = (o: OrderDetail) => {
    const actions: Array<{ label: string; onClick: () => void; variant: 'primary' | 'danger' | 'secondary'; icon?: React.ReactNode }> = [];
    if (o.status === 'new' || o.status === 'pending_management') {
      actions.push({ label: t('orders.detail.confirmOrder'), onClick: () => updateStatus.mutate({ orderId: o.id, newStatus: 'confirmed' }), variant: 'primary', icon: <CheckCircle2 size={14} /> });
    }
    if (o.status === 'confirmed') {
      actions.push({ label: t('orders.detail.markPaid'), onClick: () => updateStatus.mutate({ orderId: o.id, newStatus: 'paid' }), variant: 'primary', icon: <DollarSign size={14} /> });
    }
    if (o.status === 'pending_supply') {
      actions.push({ label: t('orders.detail.confirmReceipt'), onClick: () => confirmReceipt.mutate(o.id), variant: 'primary', icon: <Package size={14} /> });
    }
    if (!['delivered', 'cancelled', 'refunded'].includes(o.status)) {
      actions.push({ label: t('orders.detail.reschedule'), onClick: () => {
        setRescheduleDate('');
        setRescheduleTime('');
        setRescheduleReason('');
        setRescheduleModal(true);
      }, variant: 'secondary', icon: <CalendarDays size={14} /> });
      actions.push({ label: t('orders.detail.transfer'), onClick: () => {
        setTransferWarehouseId('');
        setTransferReason('');
        setTransferModal(true);
      }, variant: 'secondary', icon: <ArrowRightLeft size={14} /> });
      actions.push({ label: t('orders.detail.cancelOrder'), onClick: () => setCancelModal(true), variant: 'danger', icon: <XCircle size={14} /> });
    }
    return actions;
  };

  const availableActions = getAvailableActions(order);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back + Hero */}
      <button onClick={() => navigate(ROUTES.ORDERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('orders.detail.back')}
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <ShoppingBag size={24} className="text-brand-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{order.orderNumber}</h1>
                <Badge variant={TYPE_BADGE[order.orderType]} size="sm">{order.orderType}</Badge>
                <Badge variant={STATUS_BADGE[order.status] || 'gray'} size="sm">{STATUS_LABELS[order.status] || order.status}</Badge>
              </div>
              <p className="text-sm text-text-secondary font-body mt-1">
                <Calendar size={14} className="inline mr-1" />
                {new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      {/* Quick Actions */}
      {availableActions.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {availableActions.map((action, i) => (
            <Button key={i} variant={action.variant} size="sm" leftIcon={action.icon} onClick={action.onClick} isLoading={updateStatus.isPending || confirmReceipt.isPending}>
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <OrderInfoCard icon={<Phone size={16} />} label={t('orders.detail.customer')}>
          <p className="font-bold text-text-primary">{order.customerName}</p>
          <p className="text-text-secondary text-xs mt-0.5">{order.customerPhone}</p>
          {order.customerEmail && <p className="text-text-secondary text-xs truncate">{order.customerEmail}</p>}
          {order.deliveryAddress && <p className="text-text-tertiary text-xs mt-0.5 flex items-center gap-1"><MapPin size={10} />{order.deliveryAddress}</p>}
        </OrderInfoCard>

        <OrderInfoCard icon={<Package size={16} />} label={t('orders.detail.orderInfo')}>
          <p>{t('orders.detail.status')}: <span className="font-bold">{STATUS_LABELS[order.status] || order.status}</span></p>
          <p className="text-xs text-text-secondary">{t('orders.detail.type')}: {order.orderType}</p>
          <p className="text-xs text-text-secondary">{t('orders.detail.items', { count: order.items.length })}</p>
          <p className="text-xs text-text-secondary">{t('orders.detail.created')}: {new Date(order.createdAt).toLocaleDateString()}</p>
        </OrderInfoCard>

        <OrderInfoCard icon={<Truck size={16} />} label={t('orders.detail.delivery')}>
          <p className="text-xs">{order.warehouseName || order.deliveryZone || '—'}{order.deliveryZone && order.warehouseName ? ` · ${order.deliveryZone}` : ''}</p>
          {order.supplierName && <p className="text-xs text-text-secondary">Supplier: {order.supplierName}</p>}
          {order.scheduledDate ? (
            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
              <Clock size={10} />{new Date(order.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          ) : (
            <p className="text-xs text-text-tertiary">{t('orders.detail.notScheduled')}</p>
          )}
        </OrderInfoCard>

        <OrderInfoCard icon={<CreditCard size={16} />} label={t('orders.detail.payment')}>
          <p className="text-lg font-extrabold text-text-primary font-display">{formatPrice(order.total)}</p>
          <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
            <span>{t('orders.detail.subtotal')}: {formatPrice(order.subtotal)}</span>
            <span>{t('orders.detail.deliveryFee')}: {formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={PAYMENT_STATUS_VARIANT[order.paymentStatus] || 'yellow'} size="sm">{order.paymentStatus}</Badge>
            <span className="text-xs text-text-tertiary">{order.paymentMethod.replace(/_/g, ' ')}</span>
          </div>
        </OrderInfoCard>
      </div>

      {/* Order Items */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-brand-accent" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('orders.detail.orderItems', { count: order.items.length })}</h3>
        </div>
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-2.5 pr-4 text-xs font-bold text-text-secondary uppercase tracking-wider">{t('orders.detail.item')}</th>
                <th className="text-center py-2.5 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider">{t('orders.detail.qty')}</th>
                <th className="text-right py-2.5 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider">{t('orders.detail.unitPrice')}</th>
                <th className="text-right py-2.5 pl-4 text-xs font-bold text-text-secondary uppercase tracking-wider">{t('orders.detail.total')}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-border-default/50 last:border-0">
                  <td className="py-3 pr-4">
                    <span className="font-bold text-text-primary">{item.productName}</span>
                  </td>
                  <td className="py-3 px-4 text-center text-text-secondary">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-text-secondary">{item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 pl-4 text-right font-bold text-text-primary">{formatPrice(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border-default">
                <td colSpan={3} className="py-3 pr-4 text-right text-sm text-text-secondary font-body">{t('orders.detail.subtotal')}</td>
                <td className="py-3 pl-4 text-right text-sm text-text-secondary font-body">{formatPrice(order.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="py-1 pr-4 text-right text-sm text-text-secondary font-body">{t('orders.detail.deliveryFee')}</td>
                <td className="py-1 pl-4 text-right text-sm text-text-secondary font-body">{formatPrice(order.deliveryFee)}</td>
              </tr>
              <tr className="text-base">
                <td colSpan={3} className="py-3 pr-4 text-right font-extrabold text-text-primary font-display">{t('orders.detail.totalLabel')}</td>
                <td className="py-3 pl-4 text-right font-extrabold text-brand-accent font-display">{formatPrice(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* Mobile card view */}
        <div className="block sm:hidden space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-bg-section-alt border border-border-default/60 space-y-2">
              <p className="text-sm font-bold text-text-primary font-body">{item.productName}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-tertiary">{t('orders.detail.qty')} </span>
                  <span className="text-text-primary font-medium">{item.quantity}</span>
                </div>
                <div>
                  <span className="text-text-tertiary">{t('orders.detail.unitPrice')} </span>
                  <span className="text-text-primary font-medium">{item.unitPrice.toFixed(2)}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-border-default/50">
                  <span className="text-text-tertiary">{t('orders.detail.total')} </span>
                  <span className="font-bold text-text-primary">{formatPrice(item.totalPrice)}</span>
                </div>
              </div>
            </div>
          ))}
          <div className="p-4 rounded-xl bg-white border border-border-default/60 space-y-1.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>{t('orders.detail.subtotal')}</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>{t('orders.detail.deliveryFee')}</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-lg pt-1.5 border-t border-border-default text-text-primary font-display">
              <span>{t('orders.detail.totalLabel')}</span>
              <span className="text-brand-accent">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
        {order.customerNotes && (
          <div className="mt-4 p-3 rounded-xl bg-brand-accent-light/50 border border-brand-accent/10">
            <p className="text-xs font-bold text-brand-accent uppercase tracking-wider font-body mb-1">{t('orders.detail.customerNotes')}</p>
            <p className="text-sm text-text-primary font-body">{order.customerNotes}</p>
          </div>
        )}
        {order.internalNotes && (
          <div className="mt-3 p-3 rounded-xl bg-brand-primary-light/50 border border-brand-primary/10">
            <p className="text-xs font-bold text-brand-primary uppercase tracking-wider font-body mb-1">{t('orders.detail.internalNotes')}</p>
            <p className="text-sm text-text-primary font-body">{order.internalNotes}</p>
          </div>
        )}
      </Card>

      {/* Quote History — for orders converted from special orders */}
      {order.orderType === 'special' && order.priceQuote && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-text-primary font-display">Quote History</h3>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileClock size={16} className="text-amber-600" />
                <span className="text-sm font-bold text-text-primary">{order.priceQuote.quoteNumber}</span>
                <Badge variant={order.priceQuote.status === 'accepted' ? 'green' : order.priceQuote.status === 'rejected' ? 'red' : 'teal'} size="sm">
                  {order.priceQuote.status}
                </Badge>
              </div>
            </div>
            {order.specialOrder && (
              <p className="text-xs text-text-tertiary font-body">
                Special Order: {order.specialOrder.referenceNumber} ({order.specialOrder.status})
              </p>
            )}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-text-tertiary font-body">Subtotal</p>
                <p className="font-bold text-text-primary">{formatPrice(order.priceQuote.subtotal)}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-body">Delivery Fee</p>
                <p className="font-bold text-text-primary">{formatPrice(order.priceQuote.deliveryFee)}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-body">Total</p>
                <p className="font-extrabold text-brand-accent">{formatPrice(order.priceQuote.total)}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Driver Tracking — shown when order is out for delivery */}
      {(order.status === 'out_for_delivery' || order.trip?.driverLocation) && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Navigation size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">Driver Tracking</h3>
          </div>
          <div className="space-y-4">
            <DeliveryStageIndicator orderId={id} currentStatus={order.status} />
            <DriverTrackingMap
              orderId={id}
              initialLocation={
                order.trip?.driverLocation
                  ? {
                      tripId: order.trip.id,
                      latitude: order.trip.driverLocation.latitude,
                      longitude: order.trip.driverLocation.longitude,
                      heading: null,
                      speed: null,
                      recordedAt: order.trip.driverLocation.updatedAt,
                    }
                  : null
              }
            />
          </div>
        </Card>
      )}

      {/* Timeline */}
      {order.timeline.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('orders.detail.orderTimeline')}</h3>
          </div>
          <div className="relative pl-8">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-default" />
            {order.timeline.map((log, idx) => (
              <div key={idx} className="relative pb-10 last:pb-0">
                <div className={cn(
                  'absolute -left-[23px] w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center',
                  idx === order.timeline.length - 1 ? 'bg-brand-accent' : 'bg-white'
                )}>
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    idx === order.timeline.length - 1 ? 'bg-white' : 'bg-border-default'
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary font-body">
                      {STATUS_LABELS[log.toStatus.toLowerCase()] || log.toStatus}
                    </span>
                    <span className="text-xs text-text-tertiary font-body">
                      {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary font-body mt-0.5">
                    {log.actor === 'system' ? 'System' : t('orders.detail.by', { actor: log.actor })}
                    {log.fromStatus && ` (from ${STATUS_LABELS[log.fromStatus.toLowerCase()] || log.fromStatus})`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payments */}
      {order.payments.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('orders.detail.payments')}</h3>
          </div>
          {order.payments.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-border-default/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50 text-green-600">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary font-body">{formatPrice(p.amount)}</p>
                  <p className="text-xs text-text-secondary font-body">{p.method}</p>
                </div>
              </div>
              <Badge variant={p.status === 'paid' ? 'green' : p.status === 'pending' ? 'yellow' : 'red'} size="sm">{p.status}</Badge>
            </div>
          ))}
        </Card>
      )}

      {/* Cancel Modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title={t('orders.detail.cancelModalTitle', { number: order.orderNumber })}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-body">
              {t('orders.detail.cancelModalWarning')}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setCancelModal(false)}>{t('orders.detail.keepOrder')}</Button>
            <Button variant="danger" size="sm" isLoading={updateStatus.isPending} onClick={() => {
              updateStatus.mutate({ orderId: order.id, newStatus: 'cancelled' });
              setCancelModal(false);
            }}>
              {t('orders.detail.yesCancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal open={rescheduleModal} onClose={() => setRescheduleModal(false)} title={t('orders.detail.rescheduleTitle', { number: order.orderNumber })}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('orders.detail.newDate')}</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('orders.detail.newTime')}</label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('orders.detail.rescheduleReason')}</label>
            <textarea
              rows={2}
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none"
              placeholder={t('orders.detail.reschedulePlaceholder')}
            />
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <CalendarDays size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-body">{t('orders.detail.rescheduleWarning')}</p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setRescheduleModal(false)}>{t('common.cancel')}</Button>
            <Button variant="accent" size="sm" isLoading={rescheduleOrder.isPending} disabled={!rescheduleDate} onClick={() => {
              const scheduledAt = rescheduleTime
                ? `${rescheduleDate}T${rescheduleTime}:00`
                : rescheduleDate;
              rescheduleOrder.mutate({
                orderId: order.id,
                scheduledDate: scheduledAt,
                reason: rescheduleReason,
              });
              setRescheduleModal(false);
            }}>
              {t('orders.detail.confirmReschedule')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={transferModal} onClose={() => setTransferModal(false)} title={t('orders.detail.transferTitle', { number: order.orderNumber })}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('orders.detail.transferWarehouse')}</label>
            <input
              type="number"
              value={transferWarehouseId}
              onChange={(e) => setTransferWarehouseId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              placeholder={t('orders.detail.warehouseIdPlaceholder')}
              min="1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('orders.detail.transferReason')}</label>
            <textarea
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none"
              placeholder={t('orders.detail.transferPlaceholder')}
            />
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <Building2 size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 font-body">{t('orders.detail.transferWarning')}</p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setTransferModal(false)}>{t('common.cancel')}</Button>
            <Button variant="accent" size="sm" isLoading={transferOrder.isPending} disabled={!transferWarehouseId} onClick={() => {
              transferOrder.mutate({
                orderId: order.id,
                warehouseId: parseInt(transferWarehouseId),
                reason: transferReason,
              });
              setTransferModal(false);
            }}>
              {t('orders.detail.confirmTransfer')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
