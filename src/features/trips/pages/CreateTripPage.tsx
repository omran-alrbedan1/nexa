import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ordersApi } from '@/features/orders/api/ordersApi';
import { aggregationApi } from '@/features/aggregation/api/aggregationApi';
import { regionsApi } from '@/features/regions/api/regionsApi';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { tripsApi } from '../api/tripsApi';
import { usePickupOrders } from '../hooks/useTrips';
import type { TripType } from '../api/tripsApi';
import type { OrderStatus, OrderType } from '@/types/marketplace';
import {
  ArrowLeft, Truck, Save, User, Warehouse, AlertTriangle, Loader2,
  Search, MapPin, Phone, CheckCircle2,
} from 'lucide-react';
import axios from 'axios';

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

const ORDER_STATUSES: OrderStatus[] = [
  'new', 'pending_management', 'pending_pricing', 'pending_customer_approval',
  'confirmed', 'paid', 'pending_supply', 'pending_aggregation',
  'ready_to_ship', 'ready_to_deliver', 'out_for_delivery', 'delivered',
  'failed_delivery', 'cancelled', 'postponed', 'suspended', 'refunded',
];

const ORDER_TYPES: OrderType[] = ['regular', 'special', 'seasonal'];

function SelectedOrdersBadge({ count, total }: { count: number; total: number }) {
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();
  if (count === 0) return null;
  return (
    <Badge variant="teal">
      {t('trips.create.selectedTotal', { count, total: formatPrice(total) })}
    </Badge>
  );
}

export function CreateTripPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formatPrice = useFormatPrice();
  const addToast = useToastStore((s) => s.addToast);
  const today = new Date().toLocaleDateString('en-CA');
  const [tripType, setTripType] = useState<TripType>('delivery');
  const [form, setForm] = useState({
    tripCode: '', warehouseId: '', plannedDate: '', departureTime: '', cutoffTime: '',
    expectedArrival: '', minOrders: '', maxCapacity: '200',
    assignmentType: 'manual', deliveryFeeOverride: '',
  });
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  // Order picker filters
  const [orderStatus, setOrderStatus] = useState<OrderStatus | ''>('ready_to_ship');
  const [orderType, setOrderType] = useState<OrderType | ''>('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(1);

  // Pickup picker filters
  const [pickupSearch, setPickupSearch] = useState('');
  const [pickupSupplierId, setPickupSupplierId] = useState<number | ''>('');

  // Driver picker filters
  const [driverSearch, setDriverSearch] = useState('');
  const [driverZoneId, setDriverZoneId] = useState<number | ''>('');

  // Delivery zones
  const [selectedZoneIds, setSelectedZoneIds] = useState<number[]>([]);

  const isPickup = tripType === 'supplier_pickup';

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['create-trip', 'orders', orderStatus, orderType, orderSearch, orderPage],
    queryFn: () => ordersApi.getOrders({
      status: orderStatus || undefined,
      type: orderType || undefined,
      search: orderSearch || undefined,
      page: orderPage,
      perPage: 15,
    }),
    staleTime: 15_000,
    enabled: !isPickup,
  });

  const { data: pickupGroups, isLoading: pickupLoading } = usePickupOrders({
    search: pickupSearch || undefined,
    supplierId: pickupSupplierId || undefined,
  });

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['create-trip', 'all-drivers', driverSearch, driverZoneId, form.plannedDate],
    queryFn: () => tripsApi.getAllDrivers({
      search: driverSearch || undefined,
      zoneId: driverZoneId || undefined,
      plannedDate: form.plannedDate || undefined,
    }),
    staleTime: 15_000,
  });

  const { data: availability, isFetching: checkingAvailability } = useQuery({
    queryKey: ['create-trip', 'driver-availability', selectedDriver, form.plannedDate],
    queryFn: () => tripsApi.checkDriverAvailability(selectedDriver!, form.plannedDate),
    enabled: selectedDriver !== null && !!form.plannedDate,
    staleTime: 30_000,
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['create-trip', 'warehouses'],
    queryFn: () => aggregationApi.getWarehouses(),
    staleTime: 60_000,
  });

  const { data: zonesData } = useQuery({
    queryKey: ['create-trip', 'zones'],
    queryFn: () => regionsApi.getPageData().then((d) => d.regions),
    staleTime: 60_000,
  });

  const availableOrders = ordersData?.orders ?? [];
  const availableDrivers = driversData ?? [];
  const warehouses = warehousesData ?? [];
  const zones = zonesData ?? [];
  const pagination = ordersData?.pagination ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };

  const selectedOrdersFull = useMemo(
    () => (ordersData?.orders ?? []).filter((o) => selectedOrders.includes(o.id)),
    [ordersData, selectedOrders],
  );
  const selectedTotal = selectedOrdersFull.reduce((s, o) => s + o.total, 0);
  const selectedCount = selectedOrders.length;

  const activeZone = zones.find((z) => z.id === (selectedZoneIds[0] ?? 0));

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleOrder = (id: number) => {
    setSelectedOrders((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]);
  };

  const toggleZone = (id: number) => {
    setSelectedZoneIds((prev) => prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]);
  };

  const switchType = (type: TripType) => {
    setTripType(type);
    setSelectedOrders([]);
    setOrderPage(1);
  };

  const handleSubmit = async () => {
    if (!form.plannedDate || !form.departureTime) {
      addToast('error', t('trips.create.validationRequired'));
      return;
    }
    if (form.plannedDate < today) {
      addToast('error', t('trips.create.validationDate'));
      return;
    }
    if (!form.warehouseId) {
      addToast('error', t('trips.create.validationWarehouse'));
      return;
    }
    if (selectedOrders.length === 0) {
      addToast('error', t(isPickup ? 'trips.create.noPickupOrdersSelected' : 'trips.create.noOrdersSelected'));
      return;
    }
    if (selectedDriver && availability?.available === false) {
      addToast('error', t('trips.create.driverUnavailable'));
      return;
    }
    try {
      await tripsApi.createTrip({
        type: tripType,
        warehouse_id: Number(form.warehouseId),
        planned_date: form.plannedDate,
        departure_time: form.departureTime,
        cutoff_time: form.cutoffTime || undefined,
        expected_arrival: form.expectedArrival || undefined,
        min_orders: form.minOrders ? Number(form.minOrders) : undefined,
        max_capacity: Number(form.maxCapacity) || 200,
        delivery_fee_override: form.deliveryFeeOverride ? Number(form.deliveryFeeOverride) : undefined,
        assignment_type: form.assignmentType === 'automatic' ? 'normal' : 'manual',
        zone_ids: selectedZoneIds.length > 0 ? selectedZoneIds : undefined,
        driver_id: selectedDriver || undefined,
        order_ids: selectedOrders,
      });
      addToast('success', t('trips.create.successTitle'));
      navigate(ROUTES.TRIPS);
    } catch (err) {
      addToast('error', getApiErrorMessage(err, t('trips.create.errorGeneric')));
    }
  };

  const driverBusy = selectedDriver !== null && !checkingAvailability && availability?.available === false;

  return (
    <div className="space-y-6 animate-fade-up max-w-6xl">
      <button onClick={() => navigate(ROUTES.TRIPS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('trips.create.back')}
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Truck size={22} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('trips.create.title')}</h1>
            <p className="text-sm text-text-secondary font-body">{t('trips.create.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">{t('trips.create.tripType')}</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => switchType('delivery')}
              className={`p-3 rounded-xl border text-left transition-all ${tripType === 'delivery' ? 'border-brand-primary bg-brand-primary-light' : 'border-border-default/60 hover:border-brand-primary/20'}`}
            >
              <Truck size={18} className={`mb-1.5 ${tripType === 'delivery' ? 'text-brand-primary' : 'text-text-secondary'}`} />
              <p className="text-sm font-bold text-text-primary font-body">{t('trips.create.typeDelivery')}</p>
              <p className="text-xs text-text-secondary font-body mt-0.5">{t('trips.create.typeDeliveryDesc')}</p>
            </button>
            <button
              type="button"
              onClick={() => switchType('supplier_pickup')}
              className={`p-3 rounded-xl border text-left transition-all ${isPickup ? 'border-brand-primary bg-brand-primary-light' : 'border-border-default/60 hover:border-brand-primary/20'}`}
            >
              <Warehouse size={18} className={`mb-1.5 ${isPickup ? 'text-brand-primary' : 'text-text-secondary'}`} />
              <p className="text-sm font-bold text-text-primary font-body">{t('trips.create.typePickup')}</p>
              <p className="text-xs text-text-secondary font-body mt-0.5">{t('trips.create.typePickupDesc')}</p>
            </button>
          </div>

          <h3 className="text-sm font-bold text-text-primary font-display mb-4">{t('trips.create.tripDetails')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('trips.create.plannedDate')}</label>
              <input type="date" min={today} value={form.plannedDate} onChange={(e) => handleChange('plannedDate', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
              <p className="text-xs text-text-tertiary font-body mt-1">{t('trips.create.plannedDateHint')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">{t('trips.create.departureTime')}</label>
                <input type="time" value={form.departureTime} onChange={(e) => handleChange('departureTime', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">{t('trips.create.cutoffTime')}</label>
                <input type="time" value={form.cutoffTime} onChange={(e) => handleChange('cutoffTime', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('trips.create.expectedArrival')}</label>
              <input type="time" value={form.expectedArrival} onChange={(e) => handleChange('expectedArrival', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">{t('trips.create.minOrders')}</label>
                <input type="number" min="0" value={form.minOrders} onChange={(e) => handleChange('minOrders', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">{t('trips.create.maxOrders')}</label>
                <input type="number" min="0" value={form.maxCapacity} onChange={(e) => handleChange('maxCapacity', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('trips.create.deliveryFeeOverride')}</label>
              <input type="number" min="0" value={form.deliveryFeeOverride} onChange={(e) => handleChange('deliveryFeeOverride', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('trips.create.feePlaceholder')} />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">{t('trips.create.configuration')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('trips.create.warehouse')}</label>
              <select value={form.warehouseId} onChange={(e) => handleChange('warehouseId', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="">{t('trips.create.selectWarehouse')}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('trips.create.zonesTitle')}</label>
              <div className="flex flex-wrap gap-2">
                {zones.length === 0 ? (
                  <p className="text-xs text-text-tertiary font-body">{t('trips.create.loadingZones')}</p>
                ) : (
                  zones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => toggleZone(z.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-body transition-all ${
                        selectedZoneIds.includes(z.id)
                          ? 'border-brand-primary bg-brand-primary-light text-brand-primary'
                          : 'border-border-default/60 text-text-secondary hover:border-brand-primary/20'
                      }`}
                    >
                      {z.name}
                    </button>
                  ))
                )}
              </div>
              <p className="text-xs text-text-tertiary font-body mt-1">{t('trips.create.zonesHint')}</p>
            </div>
            {activeZone && activeZone.clusters?.some((c) => c.isActive) && (
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">{t('trips.create.cluster')}</label>
                <select
                  value=""
                  onChange={(e) => e.target.value}
                  className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
                >
                  <option value="">{activeZone.name} — {t('trips.create.generalCluster')}</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('trips.create.assignmentType')}</label>
              <select value={form.assignmentType} onChange={(e) => handleChange('assignmentType', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="manual">{t('trips.create.manual')}</option>
                <option value="automatic">{t('trips.create.automatic')}</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Order Selector */}
      <Card padding="lg">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.create.assignOrders')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{isPickup ? t('trips.create.assignOrdersPickupDesc') : t('trips.create.assignOrdersDesc')}</p>
          </div>
          <SelectedOrdersBadge count={selectedCount} total={selectedTotal} />
        </div>

        {isPickup ? (
          <>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  value={pickupSearch}
                  onChange={(e) => setPickupSearch(e.target.value)}
                  placeholder={t('trips.create.searchPickupOrders')}
                  className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
                />
              </div>
              <div className="relative">
                <select
                  value={pickupSupplierId}
                  onChange={(e) => setPickupSupplierId(e.target.value ? Number(e.target.value) : '')}
                  className="pl-3 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary appearance-none"
                >
                  <option value="">{t('trips.create.allSuppliers')}</option>
                  {(pickupGroups ?? []).map((g) => (
                    <option key={g.supplier.id} value={g.supplier.id}>{g.supplier.businessName}</option>
                  ))}
                </select>
              </div>
            </div>
            {pickupLoading ? (
              <div className="space-y-2 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
            ) : (pickupGroups ?? []).length === 0 ? (
              <p className="text-sm text-text-secondary font-body py-4 text-center">{t('trips.create.noPickupOrders')}</p>
            ) : (
              <div className="space-y-4">
                {(pickupGroups ?? []).map((group) => (
                  <div key={group.supplier.id} className="rounded-xl border border-border-default/60 overflow-hidden">
                    <div className="px-3 py-2 bg-bg-section-alt flex items-center gap-2">
                      <Warehouse size={14} className="text-brand-primary" />
                      <p className="text-sm font-bold text-text-primary font-body flex-1">{group.supplier.businessName}</p>
                      <Badge variant="gray">{group.orders.length} {t('trips.create.ordersLabel')}</Badge>
                    </div>
                    <div className="divide-y divide-border-default/60">
                      {group.orders.map((order) => (
                        <label key={order.id} className="flex items-center gap-3 p-3 hover:bg-bg-section-alt/60 cursor-pointer transition-all">
                          <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleOrder(order.id)} className="w-4 h-4 rounded border-border-default text-brand-primary focus:ring-brand-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-primary font-body">{order.customerName ?? '—'}</p>
                            <p className="text-xs text-text-secondary font-body">{order.orderNumber} · {order.itemsCount} {t('common.items')}</p>
                          </div>
                          <span className="text-sm font-extrabold text-text-primary font-display">{order.total > 0 ? formatPrice(order.total) : t('trips.create.tbd')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  value={orderSearch}
                  onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1); }}
                  placeholder={t('trips.create.searchOrders')}
                  className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
                />
              </div>
              <div className="relative">
                <select
                  value={orderStatus}
                  onChange={(e) => { setOrderStatus(e.target.value as OrderStatus | ''); setOrderPage(1); }}
                  className="pl-3 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary appearance-none"
                >
                  <option value="">{t('orders.list.allStatuses')}</option>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{t('orders.status.' + s, s)}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <select
                  value={orderType}
                  onChange={(e) => { setOrderType(e.target.value as OrderType | ''); setOrderPage(1); }}
                  className="pl-3 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary appearance-none"
                >
                  <option value="">{t('orders.list.allTypes')}</option>
                  {ORDER_TYPES.map((ty) => (
                    <option key={ty} value={ty}>{t('orders.list.' + ty, ty)}</option>
                  ))}
                </select>
              </div>
            </div>
            {ordersLoading ? (
              <div className="space-y-2 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
            ) : availableOrders.length === 0 ? (
              <p className="text-sm text-text-secondary font-body py-4 text-center">{t('trips.create.noOrdersMatch')}</p>
            ) : (
              <>
                <div className="space-y-2">
                  {availableOrders.map((order) => (
                    <label key={order.id} className="flex items-center gap-3 p-3 rounded-xl border border-border-default/60 hover:border-brand-primary/20 cursor-pointer transition-all">
                      <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleOrder(order.id)} className="w-4 h-4 rounded border-border-default text-brand-primary focus:ring-brand-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary font-body">{order.customerName}</p>
                        <p className="text-xs text-text-secondary font-body">{order.orderNumber} · {order.itemCount} {t('common.items')} · {order.regionName}</p>
                      </div>
                      <span className="text-xs text-text-tertiary font-body hidden sm:inline">{t('orders.status.' + order.status, order.status)}</span>
                      <span className="text-sm font-extrabold text-text-primary font-display">{order.total > 0 ? formatPrice(order.total) : t('trips.create.tbd')}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <Pagination
                    currentPage={pagination.currentPage}
                    lastPage={pagination.lastPage}
                    total={pagination.total}
                    perPage={15}
                    onPageChange={setOrderPage}
                  />
                </div>
              </>
            )}
          </>
        )}
      </Card>

      {/* Driver Selector */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.create.assignDriver')}</h3>
          {checkingAvailability && (
            <span className="flex items-center gap-1 text-xs text-text-tertiary font-body">
              <Loader2 size={12} className="animate-spin" /> {t('trips.create.checkingAvailability')}
            </span>
          )}
          <Badge variant="gray" size="sm">{t('trips.create.optional')}</Badge>
        </div>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={driverSearch}
              onChange={(e) => setDriverSearch(e.target.value)}
              placeholder={t('trips.create.searchDrivers')}
              className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
            />
          </div>
          <div className="relative">
            <select
              value={driverZoneId}
              onChange={(e) => setDriverZoneId(e.target.value ? Number(e.target.value) : '')}
              className="pl-3 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary appearance-none"
            >
              <option value="">{t('trips.create.allZones')}</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
        </div>

        {driverBusy && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-body">
              <p className="font-bold text-amber-800">{t('trips.create.driverBusy')}</p>
              <p className="text-amber-700 text-xs mt-0.5">
                {availability?.reason === 'driver_double_booked' && availability.existing_trip
                  ? t('trips.create.driverBusyExistingTrip', {
                      tripNumber: availability.existing_trip.trip_number,
                      date: availability.existing_trip.planned_date || '',
                    })
                  : t('trips.create.driverBusyGeneric')}
              </p>
            </div>
          </div>
        )}

        {driversLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
        ) : availableDrivers.length === 0 ? (
          <p className="text-sm text-text-secondary font-body py-4 text-center">{t('trips.create.noDriversMatch')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableDrivers.map((driver) => {
              const busyTrip = driver.bookedTripNumber;
              const statusColor = busyTrip ? 'text-status-error' : driver.isAvailable ? 'text-green-600' : 'text-amber-600';
              return (
                <button
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedDriver === driver.id
                      ? 'border-brand-primary bg-brand-primary-light'
                      : 'border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-text-secondary">
                      {driver.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-text-primary font-body">{driver.name}</p>
                        {selectedDriver === driver.id && <CheckCircle2 size={14} className="text-brand-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-text-secondary font-body flex items-center gap-1 truncate">
                        {driver.regionName && <><MapPin size={10} className="flex-shrink-0" />{driver.regionName}</>}
                        {driver.phone && <><Phone size={10} className="flex-shrink-0 ml-1" />{driver.phone}</>}
                      </p>
                      <p className={`text-xs font-bold ${statusColor}`}>
                        {busyTrip
                          ? t('trips.create.busyTrip', { tripNumber: busyTrip })
                          : driver.isAvailable
                            ? t('trips.create.available')
                            : t('trips.create.onTrip')}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Summary + actions */}
      <div className="p-4 rounded-2xl bg-bg-section-alt border border-border-default/60 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-text-secondary font-body">
          <ShoppingBagCount count={selectedCount} />
        </div>
        <div className="flex-1" />
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Save size={14} />}
          onClick={handleSubmit}
          disabled={driverBusy}
        >
          {t('trips.create.saveTrip')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.TRIPS)}>{t('trips.create.cancel')}</Button>
      </div>
    </div>
  );
}

function ShoppingBagCount({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-1.5">
      <Truck size={14} className="text-brand-primary" />
      <span className="font-bold text-text-primary">{count}</span> {t('trips.stats.orders').toLowerCase()}
    </span>
  );
}
