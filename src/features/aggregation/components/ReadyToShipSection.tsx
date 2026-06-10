import { useState } from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAssignToTrip } from '../hooks/useAggregation';
import type { ReadyToShipItem, ShipmentStatus } from '../api/aggregationApi';

const STATUS_COLORS: Record<ShipmentStatus, 'yellow' | 'blue' | 'purple' | 'green'> = {
  pending_trip: 'yellow',
  assigned_to_trip: 'blue',
  loaded: 'purple',
  shipped: 'green',
};

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending_trip: 'Pending Trip',
  assigned_to_trip: 'Assigned',
  loaded: 'Loaded',
  shipped: 'Shipped',
};

const DUMMY_AVAILABLE_TRIPS = [
  { id: 201, name: 'Riyadh North Morning', region: 'Riyadh North' },
  { id: 202, name: 'Riyadh South Afternoon', region: 'Riyadh South' },
  { id: 203, name: 'Jeddah Central Express', region: 'Jeddah Central' },
  { id: 204, name: 'Dammam East Route', region: 'Dammam East' },
  { id: 205, name: 'Mecca North Run', region: 'Mecca North' },
];

interface ReadyToShipSectionProps {
  items: ReadyToShipItem[];
  isLoading: boolean;
}

export function ReadyToShipSection({ items, isLoading }: ReadyToShipSectionProps) {
  const [search, setSearch] = useState('');
  const [assignModal, setAssignModal] = useState<{ open: boolean; item: ReadyToShipItem | null }>({ open: false, item: null });
  const [selectedTrip, setSelectedTrip] = useState<number | ''>('');
  const assignToTrip = useAssignToTrip();

  const pendingCount = items.filter((i) => i.status === 'pending_trip').length;
  const totalWeight = items.reduce((sum, i) => sum + i.totalWeight, 0);

  const filtered = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.orderNumber.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.regionName.toLowerCase().includes(q)
    );
  });

  const handleAssign = () => {
    if (!assignModal.item || !selectedTrip) return;
    const trip = DUMMY_AVAILABLE_TRIPS.find((t) => t.id === selectedTrip);
    if (!trip) return;
    assignToTrip.mutate(
      { itemId: assignModal.item.id, tripId: trip.id, tripName: trip.name },
      { onSuccess: () => setAssignModal({ open: false, item: null }) }
    );
    setSelectedTrip('');
  };

  const openAssignModal = (item: ReadyToShipItem) => {
    setAssignModal({ open: true, item });
    setSelectedTrip('');
  };

  return (
    <>
      <Card padding="md">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Ready to Ship</h3>
              <p className="text-xs text-gray-500">
                {pendingCount} awaiting trip · {totalWeight.toFixed(1)} kg total
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Search */}
        {items.length > 0 && (
          <div className="mb-4 max-w-xs">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search orders..."
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No matching orders' : 'Nothing ready to ship'}
            description={search ? 'Try a different search' : 'All packed orders have been assigned to trips'}
            icon={
              <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((item) => (
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
                    <p className="text-xs text-gray-500 mt-0.5">{item.items}</p>
                  </div>
                  <StatusBadge
                    status={STATUS_LABELS[item.status]}
                    color={STATUS_COLORS[item.status]}
                    dot
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>{item.itemCount} items · {item.totalWeight} kg</span>
                  <span>{item.regionName}</span>
                </div>

                {item.status === 'pending_trip' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => openAssignModal(item)}
                  >
                    Assign to Trip
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
      </Card>

      {/* Assign to Trip Modal */}
      <Modal
        open={assignModal.open}
        onClose={() => setAssignModal({ open: false, item: null })}
        title="Assign to Trip"
        size="sm"
      >
        {assignModal.item && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-900">{assignModal.item.customerName}</p>
              <p className="text-gray-500 text-xs mt-0.5">{assignModal.item.orderNumber}</p>
              <p className="text-gray-500 text-xs">{assignModal.item.items}</p>
              <p className="text-gray-500 text-xs mt-1">{assignModal.item.regionName} · {assignModal.item.totalWeight} kg</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Trip</label>
              <select
                value={selectedTrip}
                onChange={(e) => setSelectedTrip(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Choose a trip...</option>
                {DUMMY_AVAILABLE_TRIPS.filter((t) => t.region === assignModal.item?.regionName).map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name}
                  </option>
                ))}
                <option value="" disabled>───</option>
                {DUMMY_AVAILABLE_TRIPS.filter((t) => t.region !== assignModal.item?.regionName).map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name} (different region)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setAssignModal({ open: false, item: null })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!selectedTrip}
                isLoading={assignToTrip.isPending}
                onClick={handleAssign}
              >
                Assign
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
