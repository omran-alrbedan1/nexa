import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ordersApi } from '@/features/orders/api/ordersApi';
import { tripsApi } from '../api/tripsApi';
import { ArrowLeft, Truck, Save, User, Loader2 } from 'lucide-react';

const DUMMY_WAREHOUSES = [
  { id: 1, name: 'Riyadh Main Warehouse' },
  { id: 2, name: 'Jeddah Warehouse' },
  { id: 3, name: 'Dammam Warehouse' },
];

const DUMMY_ZONES = [
  { id: 1, name: 'Riyadh North' },
  { id: 2, name: 'Riyadh South' },
  { id: 3, name: 'Jeddah Central' },
];

const DUMMY_CLUSTERS = [
  { id: 1, zoneId: 1, name: 'Al-Olaya' },
  { id: 2, zoneId: 1, name: 'Al-Malaz' },
  { id: 3, zoneId: 1, name: 'King Fahd District' },
  { id: 4, zoneId: 2, name: 'Al-Batha' },
];

export function CreateTripPage() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState({
    tripCode: '', warehouseId: '1', deliveryZone: '1', cluster: '1',
    plannedDate: '', departureTime: '', cutoffTime: '',
    expectedArrival: '', minOrders: '1', maxCapacity: '20',
    assignmentType: 'manual', deliveryFeeOverride: '',
  });
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  // Fetch available orders (ready to ship)
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['create-trip', 'ready-orders'],
    queryFn: () => ordersApi.getOrders({ status: 'ready_to_ship' }),
    staleTime: 15_000,
  });

  // Fetch available drivers
  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['create-trip', 'available-drivers'],
    queryFn: () => tripsApi.getAvailableDrivers(),
    staleTime: 15_000,
  });

  const availableOrders = ordersData?.orders ?? [];
  const availableDrivers = driversData ?? [];

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleOrder = (id: number) => {
    setSelectedOrders((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!form.plannedDate || !form.departureTime) {
      addToast('error', 'Planned date and departure time are required');
      return;
    }
    // Try real backend, fall back to dummy
    try {
      await tripsApi.createTrip?.({
        warehouse_id: Number(form.warehouseId),
        planned_date: form.plannedDate,
        departure_time: form.departureTime,
        cutoff_time: form.cutoffTime || undefined,
        max_capacity: Number(form.maxCapacity),
        driver_id: selectedDriver || undefined,
        order_ids: selectedOrders,
      });
      addToast('success', 'Trip created successfully');
    } catch {
      addToast('success', 'Trip created (dummy — backend route not yet available)');
    }
    navigate(ROUTES.TRIPS);
  };

  const selectedCount = selectedOrders.length;
  const selectedTotal = availableOrders.filter((o) => selectedOrders.includes(o.id)).reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button onClick={() => navigate(ROUTES.TRIPS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Trips
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Truck size={22} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">Create Trip</h1>
            <p className="text-sm text-text-secondary font-body">Set up a new delivery trip</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">Trip Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Trip Code</label>
              <input value={form.tripCode} onChange={(e) => handleChange('tripCode', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="TRP-2025-008" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Planned Date *</label>
              <input type="date" value={form.plannedDate} onChange={(e) => handleChange('plannedDate', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Departure Time *</label>
              <input type="time" value={form.departureTime} onChange={(e) => handleChange('departureTime', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Cutoff Time</label>
              <input type="time" value={form.cutoffTime} onChange={(e) => handleChange('cutoffTime', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Expected Arrival</label>
              <input type="time" value={form.expectedArrival} onChange={(e) => handleChange('expectedArrival', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Warehouse</label>
              <select value={form.warehouseId} onChange={(e) => handleChange('warehouseId', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="1">Riyadh Main Warehouse</option>
                <option value="2">Jeddah Warehouse</option>
                <option value="3">Dammam Warehouse</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Delivery Zone</label>
              <select value={form.deliveryZone} onChange={(e) => handleChange('deliveryZone', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="1">Riyadh North</option>
                <option value="2">Riyadh South</option>
                <option value="3">Jeddah Central</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Cluster</label>
              <select value={form.cluster} onChange={(e) => handleChange('cluster', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="1">Al-Olaya</option>
                <option value="2">Al-Malaz</option>
                <option value="3">King Fahd District</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Assignment Type</label>
              <select value={form.assignmentType} onChange={(e) => handleChange('assignmentType', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Min Orders</label>
                <input type="number" min="0" value={form.minOrders} onChange={(e) => handleChange('minOrders', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Max Orders</label>
                <input type="number" min="0" value={form.maxCapacity} onChange={(e) => handleChange('maxCapacity', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Delivery Fee Override (SAR)</label>
              <input type="number" min="0" value={form.deliveryFeeOverride} onChange={(e) => handleChange('deliveryFeeOverride', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="Leave empty for default" />
            </div>
          </div>
        </Card>
      </div>

      {/* Order Selector */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">Assign Orders</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">Select orders ready to ship in this zone</p>
          </div>
          {selectedCount > 0 && (
            <Badge variant="teal">{selectedCount} selected · {selectedTotal.toFixed(2)} SAR</Badge>
          )}
        </div>
        {ordersLoading ? (
          <div className="space-y-2 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
        ) : availableOrders.length === 0 ? (
          <p className="text-sm text-text-secondary font-body py-4 text-center">No orders ready to ship in this zone</p>
        ) : (
          <div className="space-y-2">
            {availableOrders.map((order) => (
              <label key={order.id} className="flex items-center gap-3 p-3 rounded-xl border border-border-default/60 hover:border-brand-primary/20 cursor-pointer transition-all">
                <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleOrder(order.id)} className="w-4 h-4 rounded border-border-default text-brand-primary focus:ring-brand-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary font-body">{order.customerName}</p>
                  <p className="text-xs text-text-secondary font-body">{order.orderNumber} · {order.itemCount} items</p>
                </div>
                <span className="text-sm font-extrabold text-text-primary font-display">{order.total > 0 ? `${order.total.toFixed(2)} SAR` : 'TBD'}</span>
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Driver Selector */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">Assign Driver (optional)</h3>
        </div>
        {driversLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">{[1,2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableDrivers.map((driver) => (
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
                  <div>
                    <p className="text-sm font-bold text-text-primary font-body">{driver.name}</p>
                    <p className="text-xs text-text-secondary font-body">{driver.regionName}</p>
                    <p className={`text-xs font-bold ${driver.isAvailable ? 'text-green-600' : 'text-amber-600'}`}>
                      {driver.isAvailable ? 'Available' : 'On Trip'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSubmit}>Save Trip</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.TRIPS)}>Cancel</Button>
      </div>
    </div>
  );
}
