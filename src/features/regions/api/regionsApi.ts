// ============================================================
// Regions API Service
// ============================================================
// PDF Reference: §10 (المناطق وأوقات التوصيل), §2.2.8 (Best Areas)
// Admin manages: delivery regions, time slots, pricing, clustering
// ============================================================

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface TimeSlot {
  id: number;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  isActive: boolean;
}

export interface Region {
  id: number;
  name: string;
  nameAr: string;
  deliveryFee: number;
  minimumOrder: number;
  freeDeliveryThreshold: number | null;
  isActive: boolean;
  clusters: Cluster[];
  timeSlots: TimeSlot[];
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cluster {
  id: number;
  name: string;
  nameAr: string;
  regionId: number;
  isActive: boolean;
}

export interface RegionsPageData {
  stats: {
    totalRegions: number;
    activeRegions: number;
    totalClusters: number;
    totalOrders: number;
    totalRevenue: number;
    avgDeliveryFee: number;
  };
  regions: Region[];
}

// ── Dummy Data ──

const now = new Date();

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 1, dayOfWeek: 0, dayName: 'Sunday', startTime: '08:00', endTime: '12:00', maxOrders: 20, isActive: true },
  { id: 2, dayOfWeek: 0, dayName: 'Sunday', startTime: '14:00', endTime: '18:00', maxOrders: 15, isActive: true },
  { id: 3, dayOfWeek: 1, dayName: 'Monday', startTime: '08:00', endTime: '12:00', maxOrders: 20, isActive: true },
  { id: 4, dayOfWeek: 1, dayName: 'Monday', startTime: '14:00', endTime: '18:00', maxOrders: 15, isActive: true },
  { id: 5, dayOfWeek: 2, dayName: 'Tuesday', startTime: '08:00', endTime: '12:00', maxOrders: 20, isActive: true },
  { id: 6, dayOfWeek: 2, dayName: 'Tuesday', startTime: '14:00', endTime: '18:00', maxOrders: 15, isActive: true },
  { id: 7, dayOfWeek: 3, dayName: 'Wednesday', startTime: '08:00', endTime: '12:00', maxOrders: 20, isActive: true },
  { id: 8, dayOfWeek: 3, dayName: 'Wednesday', startTime: '14:00', endTime: '18:00', maxOrders: 15, isActive: true },
  { id: 9, dayOfWeek: 4, dayName: 'Thursday', startTime: '08:00', endTime: '12:00', maxOrders: 25, isActive: true },
  { id: 10, dayOfWeek: 4, dayName: 'Thursday', startTime: '14:00', endTime: '18:00', maxOrders: 20, isActive: true },
];

const DUMMY_REGIONS: Region[] = [
  {
    id: 1, name: 'Riyadh North', nameAr: 'شمال الرياض', deliveryFee: 15, minimumOrder: 50,
    freeDeliveryThreshold: 200, isActive: true,
    clusters: [
      { id: 1, name: 'Al-Olaya', nameAr: 'العليا', regionId: 1, isActive: true },
      { id: 2, name: 'Al-Malaz', nameAr: 'الملز', regionId: 1, isActive: true },
      { id: 3, name: 'King Fahd District', nameAr: 'حي الملك فهد', regionId: 1, isActive: true },
    ],
    timeSlots: DEFAULT_TIME_SLOTS, totalOrders: 98, totalRevenue: 48500,
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 2, name: 'Riyadh South', nameAr: 'جنوب الرياض', deliveryFee: 12, minimumOrder: 50,
    freeDeliveryThreshold: 150, isActive: true,
    clusters: [
      { id: 4, name: 'Al-Batha', nameAr: 'البطحاء', regionId: 2, isActive: true },
      { id: 5, name: 'Al-Shifa', nameAr: 'الشفاء', regionId: 2, isActive: true },
    ],
    timeSlots: DEFAULT_TIME_SLOTS, totalOrders: 38, totalRevenue: 18200,
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 3, name: 'Jeddah Central', nameAr: 'وسط جدة', deliveryFee: 18, minimumOrder: 75,
    freeDeliveryThreshold: 250, isActive: true,
    clusters: [
      { id: 6, name: 'Al-Salamah', nameAr: 'السلامة', regionId: 3, isActive: true },
      { id: 7, name: 'Al-Mohammadiya', nameAr: 'المحمدية', regionId: 3, isActive: true },
    ],
    timeSlots: DEFAULT_TIME_SLOTS.map((ts) => ({ ...ts, id: ts.id + 20 })),
    totalOrders: 76, totalRevenue: 37200,
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 4, name: 'Dammam East', nameAr: 'شرق الدمام', deliveryFee: 10, minimumOrder: 40,
    freeDeliveryThreshold: 120, isActive: true,
    clusters: [
      { id: 8, name: 'Al-Dammam Downtown', nameAr: 'وسط الدمام', regionId: 4, isActive: true },
      { id: 9, name: 'Al-Aziziyah', nameAr: 'العزيزية', regionId: 4, isActive: false },
    ],
    timeSlots: DEFAULT_TIME_SLOTS.map((ts) => ({ ...ts, id: ts.id + 40 })),
    totalOrders: 54, totalRevenue: 28100,
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 5, name: 'Mecca North', nameAr: 'شمال مكة', deliveryFee: 20, minimumOrder: 80,
    freeDeliveryThreshold: 300, isActive: false,
    clusters: [
      { id: 10, name: 'Al-Aziziyah', nameAr: 'العزيزية', regionId: 5, isActive: true },
    ],
    timeSlots: DEFAULT_TIME_SLOTS.map((ts) => ({ ...ts, id: ts.id + 60 })),
    totalOrders: 42, totalRevenue: 19500,
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
];

const DUMMY_STATS = {
  totalRegions: 5, activeRegions: 4, totalClusters: 10,
  totalOrders: 308, totalRevenue: 151500, avgDeliveryFee: 15,
};

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const regionsApi = {
  getPageData: async (): Promise<RegionsPageData> => {
    await delay();
    return { stats: DUMMY_STATS, regions: DUMMY_REGIONS };
  },

  getRegion: async (id: number): Promise<Region> => {
    await delay(200);
    const region = DUMMY_REGIONS.find((r) => r.id === id);
    if (!region) throw new Error('Region not found');
    return region;
  },

  toggleActive: async (id: number): Promise<Region> => {
    await delay(300);
    const region = DUMMY_REGIONS.find((r) => r.id === id);
    if (!region) throw new Error('Region not found');
    return { ...region, isActive: !region.isActive, updatedAt: new Date().toISOString() };
  },

  updateDeliveryFee: async (id: number, deliveryFee: number): Promise<Region> => {
    await delay(300);
    const region = DUMMY_REGIONS.find((r) => r.id === id);
    if (!region) throw new Error('Region not found');
    return { ...region, deliveryFee, updatedAt: new Date().toISOString() };
  },
};

export type RegionsApi = typeof regionsApi;
