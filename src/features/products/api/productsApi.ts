export interface ProductData {
  id: number;
  name: string;
  nameAr: string;
  description: string;
  price: number;
  unit: string;
  imageUrl: string | null;
  categoryId: number;
  categoryName: string;
  isAvailable: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
}

export interface CategoryData {
  id: number;
  name: string;
  nameAr: string;
  productCount: number;
}

// ── Dummy categories ──

const DUMMY_CATEGORIES: CategoryData[] = [
  { id: 1, name: 'Fruits & Vegetables', nameAr: 'الفواكه والخضروات', productCount: 18 },
  { id: 2, name: 'Dairy & Eggs', nameAr: 'الألبان والبيض', productCount: 12 },
  { id: 3, name: 'Meat & Poultry', nameAr: 'اللحوم والدواجن', productCount: 10 },
  { id: 4, name: 'Bakery & Grains', nameAr: 'المخابز والحبوب', productCount: 8 },
  { id: 5, name: 'Beverages', nameAr: 'المشروبات', productCount: 14 },
  { id: 6, name: 'Household Essentials', nameAr: 'مستلزمات المنزل', productCount: 9 },
  { id: 7, name: 'Organic & Premium', nameAr: 'عضوي وفاخر', productCount: 6 },
];

// ── Dummy products ──

const DUMMY_PRODUCTS: ProductData[] = [
  { id: 1, name: 'Fresh Organic Bananas', nameAr: 'موز عضوي طازج', description: 'Sweet and ripe organic bananas, sourced from sustainable farms. Perfect for smoothies or a healthy snack.', price: 8.50, unit: 'kg', imageUrl: null, categoryId: 1, categoryName: 'Fruits & Vegetables', isAvailable: true, stockQuantity: 50, rating: 4.5, reviewCount: 128 },
  { id: 2, name: 'Red Delicious Apples', nameAr: 'تفاح أحمر لذيذ', description: 'Crisp and juicy red apples. Ideal for eating fresh or baking into pies and desserts.', price: 12.00, unit: 'kg', imageUrl: null, categoryId: 1, categoryName: 'Fruits & Vegetables', isAvailable: true, stockQuantity: 40, rating: 4.3, reviewCount: 95 },
  { id: 3, name: 'Fresh Whole Milk 2L', nameAr: 'حليب طازج كامل الدسم 2 لتر', description: 'Fresh whole milk from locally sourced cows. Pasteurized and homogenized for the freshest taste.', price: 9.50, unit: 'bottle', imageUrl: null, categoryId: 2, categoryName: 'Dairy & Eggs', isAvailable: true, stockQuantity: 30, rating: 4.7, reviewCount: 210 },
  { id: 4, name: 'Free-Range Eggs (12 pack)', nameAr: 'بيض بلدي 12 حبة', description: 'Farm-fresh free-range eggs from cage-free hens. Rich in flavor and high in protein.', price: 14.00, unit: 'pack', imageUrl: null, categoryId: 2, categoryName: 'Dairy & Eggs', isAvailable: true, stockQuantity: 25, rating: 4.6, reviewCount: 178 },
  { id: 5, name: 'Premium Chicken Breast 1kg', nameAr: 'صدر دجاج فاخر 1 كغ', description: 'Boneless, skinless chicken breast. Antibiotic-free and hormone-free. Perfect for grilling or baking.', price: 28.00, unit: 'kg', imageUrl: null, categoryId: 3, categoryName: 'Meat & Poultry', isAvailable: true, stockQuantity: 20, rating: 4.4, reviewCount: 87 },
  { id: 6, name: 'Ground Beef 500g', nameAr: 'لحم بقري مفروم 500 غ', description: 'Fresh ground beef with 20% fat content. Perfect for burgers, meatballs, and sauces.', price: 22.00, unit: 'pack', imageUrl: null, categoryId: 3, categoryName: 'Meat & Poultry', isAvailable: true, stockQuantity: 15, rating: 4.2, reviewCount: 63 },
  { id: 7, name: 'Whole Wheat Bread', nameAr: 'خبز قمح كامل', description: 'Freshly baked whole wheat bread. No artificial preservatives. Baked daily at our partner bakery.', price: 5.00, unit: 'loaf', imageUrl: null, categoryId: 4, categoryName: 'Bakery & Grains', isAvailable: true, stockQuantity: 35, rating: 4.8, reviewCount: 245 },
  { id: 8, name: 'Basmati Rice 5kg', nameAr: 'أرز بسمتي 5 كغ', description: 'Premium long-grain Basmati rice. Aromatic and fluffy when cooked. Ideal for biryani and pilaf.', price: 32.00, unit: 'bag', imageUrl: null, categoryId: 4, categoryName: 'Bakery & Grains', isAvailable: true, stockQuantity: 18, rating: 4.6, reviewCount: 156 },
  { id: 9, name: 'Natural Orange Juice 1L', nameAr: 'عصير برتقال طبيعي 1 لتر', description: 'Freshly squeezed orange juice with no added sugar. Pasteurized for freshness.', price: 11.00, unit: 'bottle', imageUrl: null, categoryId: 5, categoryName: 'Beverages', isAvailable: true, stockQuantity: 22, rating: 4.5, reviewCount: 134 },
  { id: 10, name: 'Mineral Sparkling Water 6x330ml', nameAr: 'مياه غازية معدنية 6×330 مل', description: 'Natural sparkling mineral water. Sourced from natural springs. Perfect for any occasion.', price: 10.00, unit: 'pack', imageUrl: null, categoryId: 5, categoryName: 'Beverages', isAvailable: true, stockQuantity: 40, rating: 4.1, reviewCount: 72 },
  { id: 11, name: 'Multi-Purpose Cleaner 500ml', nameAr: 'منظف متعدد الاستخدامات 500 مل', description: 'Effective multi-purpose cleaner. Safe on all surfaces. Fresh lemon scent.', price: 7.50, unit: 'bottle', imageUrl: null, categoryId: 6, categoryName: 'Household Essentials', isAvailable: true, stockQuantity: 28, rating: 4.3, reviewCount: 91 },
  { id: 12, name: 'Organic Honey 500g', nameAr: 'عسل عضوي 500 غ', description: 'Pure organic wildflower honey. Unfiltered and unpasteurized. Rich in natural enzymes.', price: 45.00, unit: 'jar', imageUrl: null, categoryId: 7, categoryName: 'Organic & Premium', isAvailable: true, stockQuantity: 10, rating: 4.9, reviewCount: 312 },
  { id: 13, name: 'Fresh Strawberries 400g', nameAr: 'فراولة طازجة 400 غ', description: 'Sweet and vibrant red strawberries. Perfect for desserts, smoothies or fresh eating.', price: 15.00, unit: 'box', imageUrl: null, categoryId: 1, categoryName: 'Fruits & Vegetables', isAvailable: true, stockQuantity: 20, rating: 4.4, reviewCount: 78 },
  { id: 14, name: 'Greek Yogurt 500g', nameAr: 'زبادي يوناني 500 غ', description: 'Thick and creamy Greek yogurt. High in protein. Perfect with honey and nuts.', price: 13.00, unit: 'tub', imageUrl: null, categoryId: 2, categoryName: 'Dairy & Eggs', isAvailable: true, stockQuantity: 16, rating: 4.7, reviewCount: 189 },
  { id: 15, name: 'Fresh Salmon Fillet 300g', nameAr: 'فيليه سلمون طازج 300 غ', description: 'Atlantic salmon fillet. Rich in omega-3. Skin-on, boneless. Perfect for grilling or pan-searing.', price: 38.00, unit: 'piece', imageUrl: null, categoryId: 3, categoryName: 'Meat & Poultry', isAvailable: true, stockQuantity: 8, rating: 4.8, reviewCount: 67 },
  { id: 16, name: 'Sparkling Apple Juice 750ml', nameAr: 'عصير تفاح فوار 750 مل', description: 'Non-alcoholic sparkling apple cider. Made from fresh pressed apples. Great for celebrations.', price: 9.00, unit: 'bottle', imageUrl: null, categoryId: 5, categoryName: 'Beverages', isAvailable: true, stockQuantity: 14, rating: 4.2, reviewCount: 45 },
];

// ── Simulated async ──

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const productsApi = {
  list: async (params?: { categoryId?: number; search?: string }): Promise<ProductData[]> => {
    await delay();
    let filtered = [...DUMMY_PRODUCTS];
    if (params?.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === params.categoryId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameAr.includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  },

  getById: async (id: number): Promise<ProductData | null> => {
    await delay(200);
    return DUMMY_PRODUCTS.find((p) => p.id === id) ?? null;
  },

  getCategories: async (): Promise<CategoryData[]> => {
    await delay(150);
    return DUMMY_CATEGORIES;
  },
};
