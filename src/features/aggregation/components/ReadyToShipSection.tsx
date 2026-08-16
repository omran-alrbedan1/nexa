import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { OrderParts } from './OrderParts';
import { useAssignToTrip } from '../hooks/useAggregation';
import { tripsApi } from '@/features/trips/api/tripsApi';
import { ROUTES } from '@/routes/routes';
import type { ReadyToShipItem, ShipmentStatus, OrderGroup, OrderPart } from '../api/aggregationApi';

const STATUS_COLORS: Record<ShipmentStatus, 'yellow' | 'blue' | 'purple' | 'green'> = {
  pending_trip: 'yellow',
  assigned_to_trip: 'blue',
  loaded: 'purple',
  shipped: 'green',
};

const PART_STATUS_LABELS: Record<string, string> = {
  READY_TO_SHIP: 'warehouse.readyToShip.pendingTrip',
  IN_AGGREGATION: 'warehouse.parts.statusInAggregation',
  IN_SUPPLY: 'warehouse.parts.statusInSupply',
  READY_TO_DELIVER: 'warehouse.parts.statusReadyToDeliver',
  OUT_FOR_DELIVERY: 'warehouse.parts.statusOutForDelivery',
  DELIVERED: 'warehouse.parts.statusDelivered',
  CANCELLED: 'warehouse.parts.statusCancelled',
};

interface ShipGroup {
  group: OrderGroup;
  items: ReadyToShipItem[];
}

interface ReadyToShipSectionProps {
  items: ReadyToShipItem[];
  isLoading: boolean;
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
  onPageChange: (page: number) => void;
}

export function ReadyToShipSection({ items, isLoading, meta, onPageChange }: ReadyToShipSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const STATUS_LABELS: Record<ShipmentStatus, string> = {
    pending_trip: t('warehouse.readyToShip.pendingTrip'),
    assigned_to_trip: t('warehouse.readyToShip.assigned'),
    loaded: t('warehouse.readyToShip.loaded'),
    shipped: t('warehouse.readyToShip.shipped'),
  };
  const [search, setSearch] = useState('');
  const [assignModal, setAssignModal] = useState<{ open: boolean; item: ReadyToShipItem | null }>({ open: false, item: null });
  const [selectedTrip, setSelectedTrip] = useState<number | ''>('');
  const assignToTrip = useAssignToTrip();

  const { data: availableTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['ready-to-ship', 'available-trips'],
    queryFn: () => tripsApi.getPageData().then((d) =>
      d.trips.filter((t) => t.status === 'scheduled' || t.status === 'assigned')
    ),
    staleTime: 30_000,
  });

  const { groups, singles } = useMemo(() => {
    const gs: ShipGroup[] = [];
    const ss: ReadyToShipItem[] = [];
    for (const item of items) {
      const grp = item.group;
      if (grp) {
        const existing = gs.find((g) => g.group.id === grp.id);
        if (existing) existing.items.push(item);
        else gs.push({ group: grp, items: [item] });
      } else {
        ss.push(item);
      }
    }
    return { groups: gs, singles: ss };
  }, [items]);

  const pendingCount = items.filter((i) => i.status === 'pending_trip').length;
  const totalWeight = items.reduce((sum, i) => sum + i.totalWeight, 0);

  const matchesSearch = (q: string, parts: { orderNumber: string; customerName: string; regionName: string }[]) =>
    parts.some((p) => p.orderNumber.toLowerCase().includes(q) || p.customerName.toLowerCase().includes(q) || p.regionName.toLowerCase().includes(q));

  const filteredGroups = groups.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return matchesSearch(q, g.items) || g.group.orders.some((o) => o.orderNumber.toLowerCase().includes(q));
  });
  const filteredSingles = singles.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.orderNumber.toLowerCase().includes(q) || item.customerName.toLowerCase().includes(q) || item.regionName.toLowerCase().includes(q);
  });
  const filteredCount = filteredGroups.length + filteredSingles.length;

  const handleAssign = () => {
    if (!assignModal.item || !selectedTrip) return;
    const trip = availableTrips.find((t) => t.id === selectedTrip);
    if (!trip) return;
    assignToTrip.mutate(
      { itemId: assignModal.item.id, tripId: trip.id, tripName: trip.tripNumber || trip.regionName },
      { onSuccess: () => setAssignModal({ open: false, item: null }) }
    );
    setSelectedTrip('');
  };

  const openAssignModal = (item: ReadyToShipItem) => {
    setAssignModal({ open: true, item });
    setSelectedTrip('');
  };

  const partLabel = (part: OrderPart) => t(PART_STATUS_LABELS[part.status] || part.status);

  const renderGroupCard = (g: ShipGroup) => {
    const allReady = g.group.total > 0 && g.group.done === g.group.total;
    const weight = g.items.reduce((s, i) => s + i.totalWeight, 0);
    const itemCount = g.items.reduce((s, i) => s + i.itemCount, 0);
    const numbers = g.items.map((i) => i.orderNumber).join(' / ');

    return (
      <div
        key={g.group.id}
        className="flex flex-col p-4 rounded-lg border border-purple-200 bg-purple-50/30 hover:bg-purple-50/60 transition-colors"
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(ROUTES.ORDER_DETAIL(g.group.id))}
                className="text-sm font-medium text-gray-900 hover:text-purple-700 transition-colors"
              >
                {g.items[0]?.customerName}
              </button>
              <span className="text-xs text-gray-400">{numbers}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{g.items[0]?.items}</p>
          </div>
        </div>

        <OrderParts
          members={g.group.orders}
          progressLabel={t('warehouse.parts.ready', { done: g.group.done, total: g.group.total })}
          renderMember={(part) => <span className="text-gray-500 font-medium">{partLabel(part)}</span>}
        />

        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
          <span>{t('warehouse.readyToShip.itemsCount', { count: itemCount })} · {t('warehouse.readyToShip.weight', { weight: weight.toFixed(1) })}</span>
          <span>{g.items[0]?.regionName}</span>
        </div>

        {allReady ? (
          <Button variant="primary" size="sm" className="w-full mt-2" onClick={() => g.items[0] && openAssignModal(g.items[0])}>
            {t('warehouse.parts.assignAll', { count: g.group.total })}
          </Button>
        ) : (
          <Button variant="primary" size="sm" className="w-full mt-2 !bg-gray-200 !text-gray-400 cursor-not-allowed" disabled>
            {t('warehouse.parts.assignAll', { count: g.group.total })}
          </Button>
        )}
        {!allReady && (
          <p className="text-[11px] text-amber-600 mt-1 text-center font-medium">
            {t('warehouse.parts.waitForParts', { done: g.group.done, total: g.group.total })}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <Card padding="md">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{t('warehouse.readyToShip.title')}</h3>
              <p className="text-xs text-gray-500">
                {t('warehouse.readyToShip.awaitingTrip', { count: pendingCount })} · {t('warehouse.readyToShip.totalWeight', { weight: totalWeight.toFixed(1) })}
              </p>
            </div>
          </div>
        </CardHeader>

        {items.length > 0 && (
          <div className="mb-4 max-w-xs">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('warehouse.readyToShip.searchPlaceholder')}
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        ) : filteredCount === 0 ? (
          <EmptyState
            title={search ? t('warehouse.readyToShip.noMatchingOrders') : t('warehouse.readyToShip.nothingToShip')}
            description={search ? t('warehouse.readyToShip.tryDifferentSearch') : t('warehouse.readyToShip.allAssigned')}
            icon={
              <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredGroups.map(renderGroupCard)}
            {filteredSingles.map((item) => (
              <div
                key={item.id}
                className="flex flex-col p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{item.customerName}</span>
                      <span className="text-xs text-gray-400">{item.orderNumber}</span>
                    </div>
                    {item.parentOrderId && (
                      <button
                        onClick={() => navigate(ROUTES.ORDER_DETAIL(item.parentOrderId!))}
                        className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-left"
                      >
                        <span>
                          {t('orders.multiSupplier.partOf')} {item.parentOrderNumber ? `(${item.parentOrderNumber})` : ''}
                        </span>
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">{item.items}</p>
                  </div>
                  <StatusBadge
                    status={STATUS_LABELS[item.status]}
                    color={STATUS_COLORS[item.status]}
                    dot
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>{t('warehouse.readyToShip.itemsCount', { count: item.itemCount })} · {t('warehouse.readyToShip.weight', { weight: item.totalWeight })}</span>
                  <span>{item.regionName}</span>
                </div>

                {item.status === 'pending_trip' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => openAssignModal(item)}
                  >
                    {t('warehouse.readyToShip.assignToTrip')}
                  </Button>
                )}
                {item.status === 'assigned_to_trip' && item.tripName && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-blue-600">🚚 {item.tripName}</span>
                  </div>
                )}
                {item.status === 'loaded' && item.tripName && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-purple-600">📦 Loaded on {item.tripName}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={meta.currentPage}
          lastPage={meta.lastPage}
          total={meta.total}
          perPage={15}
          onPageChange={onPageChange}
        />
      </Card>

      <Modal
        open={assignModal.open}
        onClose={() => setAssignModal({ open: false, item: null })}
        title={t('warehouse.readyToShip.assignModalTitle')}
        size="sm"
      >
        {assignModal.item && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-900">{assignModal.item.customerName}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {assignModal.item.group
                  ? assignModal.item.group.orders.map((o) => o.orderNumber).join(' / ')
                  : assignModal.item.orderNumber}
              </p>
              {assignModal.item.group && (
                <p className="text-purple-700 text-xs mt-0.5">
                  {t('warehouse.parts.ready', { done: assignModal.item.group.done, total: assignModal.item.group.total })}
                </p>
              )}
              <p className="text-gray-500 text-xs">{assignModal.item.items}</p>
              <p className="text-gray-500 text-xs mt-1">{assignModal.item.regionName} · {assignModal.item.totalWeight} kg</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('warehouse.readyToShip.selectTrip')}</label>
              <select
                value={selectedTrip}
                onChange={(e) => setSelectedTrip(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>{t('warehouse.readyToShip.chooseTrip')}</option>
                {tripsLoading ? (
                  <option value="" disabled>{t('warehouse.readyToShip.loadingTrips')}</option>
                ) : availableTrips.length === 0 ? (
                  <option value="" disabled>{t('warehouse.readyToShip.noTrips')}</option>
                ) : (
                  availableTrips.filter((t) => !assignModal.item?.regionName || t.regionName === assignModal.item?.regionName).map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.tripNumber || `Trip #${trip.id}`} — {trip.regionName} ({trip.orderCount} orders)
                    </option>
                  ))
                )}
                {availableTrips.filter((t) => assignModal.item?.regionName && t.regionName !== assignModal.item?.regionName).length > 0 && (
                  <>
                    <option value="" disabled>───</option>
                    {availableTrips.filter((t) => assignModal.item?.regionName && t.regionName !== assignModal.item?.regionName).map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.tripNumber || `Trip #${trip.id}`} — {trip.regionName} ({t('warehouse.readyToShip.differentRegion')})
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setAssignModal({ open: false, item: null })}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                disabled={!selectedTrip}
                isLoading={assignToTrip.isPending}
                onClick={handleAssign}
              >
                {t('warehouse.readyToShip.assignToTrip')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}