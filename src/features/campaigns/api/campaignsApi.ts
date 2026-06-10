// ============================================================
// Campaigns API Service
// ============================================================
// PDF Reference: §2.8 (الحملات الموسمية / Seasonal Campaigns)
// Admin manages: campaign creation, product selection, scheduling
// ============================================================

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled';

export interface CampaignProduct {
  id: number;
  productName: string;
  productNameAr: string;
  unit: string;
  regularPrice: number;
  campaignPrice: number;
  quantity: number;
}

export interface Campaign {
  id: number;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  products: CampaignProduct[];
  totalOrders: number;
  totalRevenue: number;
  budget: number;
  spentAmount: number;
  bannerUrl: string | null;
  targetRegions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignsPageData {
  stats: {
    total: number;
    active: number;
    scheduled: number;
    draft: number;
    ended: number;
    totalRevenue: number;
    totalOrders: number;
    totalBudget: number;
  };
  campaigns: Campaign[];
}

// ── Dummy Data ──

const now = new Date();
const today = now.toISOString().split('T')[0];
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const DUMMY_CAMPAIGNS: Campaign[] = [
  {
    id: 1, name: 'Summer Fruits Festival', nameAr: 'مهرجان الفواكه الصيفية',
    description: 'Seasonal fruit campaign featuring fresh strawberries, mangoes, and watermelons at special prices.',
    descriptionAr: 'حملة فواكه موسمية تشمل الفراولة الطازجة والمانجو والبطيخ بأسعار خاصة.',
    status: 'active', startDate: lastWeek, endDate: nextWeek,
    products: [
      { id: 1, productName: 'Fresh Strawberries (500g)', productNameAr: 'فراولة طازجة (500 جم)', unit: 'pack', regularPrice: 22, campaignPrice: 18, quantity: 200 },
      { id: 2, productName: 'Mangoes (1kg)', productNameAr: 'مانجو (1 كجم)', unit: 'kg', regularPrice: 18, campaignPrice: 14, quantity: 150 },
      { id: 3, productName: 'Watermelon (whole)', productNameAr: 'بطيخ كامل', unit: 'piece', regularPrice: 25, campaignPrice: 20, quantity: 100 },
    ],
    totalOrders: 67, totalRevenue: 8900, budget: 15000, spentAmount: 5200,
    bannerUrl: null, targetRegions: ['Riyadh North', 'Jeddah Central', 'Dammam East'],
    createdAt: twoWeeksAgo, updatedAt: lastWeek,
  },
  {
    id: 2, name: 'Ramadan Specials', nameAr: 'عروض رمضان',
    description: 'Special Ramadan bundle with dates, labneh, and traditional sweets.',
    descriptionAr: 'باقة رمضان الخاصة مع التمر واللبنة والحلويات التقليدية.',
    status: 'scheduled', startDate: nextWeek, endDate: new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    products: [
      { id: 4, productName: 'Premium Dates Box', productNameAr: 'علبة تمر فاخرة', unit: 'box', regularPrice: 45, campaignPrice: 38, quantity: 300 },
      { id: 5, productName: 'Labneh Deluxe (1kg)', productNameAr: 'لبنة ديلوكس (1 كجم)', unit: 'tub', regularPrice: 28, campaignPrice: 22, quantity: 200 },
    ],
    totalOrders: 0, totalRevenue: 0, budget: 25000, spentAmount: 0,
    bannerUrl: null, targetRegions: ['Riyadh North', 'Riyadh South', 'Jeddah Central', 'Mecca North'],
    createdAt: today, updatedAt: today,
  },
  {
    id: 3, name: 'Spring Harvest', nameAr: 'حصاد الربيع',
    description: 'Spring seasonal vegetables at farm-fresh prices.',
    descriptionAr: 'خضروات الربيع الموسمية بأسعار المزرعة الطازجة.',
    status: 'ended', startDate: twoWeeksAgo, endDate: lastWeek,
    products: [
      { id: 6, productName: 'Fresh Greens Bundle', productNameAr: 'باقة الخضار الورقية', unit: 'bundle', regularPrice: 15, campaignPrice: 12, quantity: 400 },
    ],
    totalOrders: 123, totalRevenue: 14760, budget: 10000, spentAmount: 9800,
    bannerUrl: null, targetRegions: ['Riyadh North', 'Riyadh South'],
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], updatedAt: twoWeeksAgo,
  },
  {
    id: 4, name: 'Seafood Weekend', nameAr: 'عطلة المأكولات البحرية',
    description: 'Weekend special on fresh seafood — salmon, shrimp, and fish fillets.',
    descriptionAr: 'عرض نهاية الأسبوع على المأكولات البحرية الطازجة.',
    status: 'draft',
    startDate: nextWeek, endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    products: [
      { id: 7, productName: 'Salmon Fillet (400g)', productNameAr: 'فيليه سلمون (400 جم)', unit: 'piece', regularPrice: 55, campaignPrice: 45, quantity: 80 },
      { id: 8, productName: 'Shrimp (500g)', productNameAr: 'جمبري (500 جم)', unit: 'pack', regularPrice: 42, campaignPrice: 35, quantity: 100 },
    ],
    totalOrders: 0, totalRevenue: 0, budget: 8000, spentAmount: 0,
    bannerUrl: null, targetRegions: ['Dammam East'],
    createdAt: today, updatedAt: today,
  },
];

const DUMMY_STATS = {
  total: 4, active: 1, scheduled: 1, draft: 1, ended: 1,
  totalRevenue: 23660, totalOrders: 190, totalBudget: 58000,
};

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const campaignsApi = {
  getPageData: async (): Promise<CampaignsPageData> => {
    await delay();
    return { stats: DUMMY_STATS, campaigns: DUMMY_CAMPAIGNS };
  },

  getCampaign: async (id: number): Promise<Campaign> => {
    await delay(200);
    const campaign = DUMMY_CAMPAIGNS.find((c) => c.id === id);
    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  },

  campaignAction: async (id: number, action: 'activate' | 'end' | 'cancel'): Promise<Campaign> => {
    await delay(400);
    const campaign = DUMMY_CAMPAIGNS.find((c) => c.id === id);
    if (!campaign) throw new Error('Campaign not found');
    const statusMap = { activate: 'active', end: 'ended', cancel: 'cancelled' } as const;
    return { ...campaign, status: statusMap[action], updatedAt: new Date().toISOString() };
  },
};

export type CampaignsApi = typeof campaignsApi;
