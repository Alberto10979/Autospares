import { createClient } from '@supabase/supabase-js';
export const demoInventory = [
  {
    id: 1,
    name: 'Toyota Corolla Engine Gasket Set',
    category: 'Engine Parts',
    brand: 'Toyota',
    model: 'Corolla',
    supplier: 'Motorline Kenya',
    imageUrl: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80',
    stock: 18,
    cost: 980,
    salePrice: 1680,
    reorderLevel: 6,
  },
  {
    id: 2,
    name: 'Mazda 323 Timing Belt Kit',
    category: 'Engine Parts',
    brand: 'Mazda',
    model: '323',
    supplier: 'AutoDrive Suppliers',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    stock: 5,
    cost: 1200,
    salePrice: 2100,
    reorderLevel: 7,
  },
  {
    id: 3,
    name: 'Honda Civic Brake Pad Set',
    category: 'Brake System',
    brand: 'Honda',
    model: 'Civic',
    supplier: 'BrakeMax',
    imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
    stock: 10,
    cost: 740,
    salePrice: 1400,
    reorderLevel: 5,
  },
  {
    id: 4,
    name: 'Nissan Sentra Starter Motor',
    category: 'Electrical',
    brand: 'Nissan',
    model: 'Sentra',
    supplier: 'Powerline Motors',
    imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    stock: 3,
    cost: 2300,
    salePrice: 4200,
    reorderLevel: 4,
  },
  {
    id: 5,
    name: 'Ford Ranger Suspension Kit',
    category: 'Suspension',
    brand: 'Ford',
    model: 'Ranger',
    supplier: 'RidePro',
    imageUrl: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80',
    stock: 8,
    cost: 1900,
    salePrice: 3200,
    reorderLevel: 5,
  },
  {
    id: 6,
    name: 'Volkswagen Polo Clutch Kit',
    category: 'Transmission',
    brand: 'Volkswagen',
    model: 'Polo',
    supplier: 'DriveCore',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80',
    stock: 12,
    cost: 1650,
    salePrice: 2900,
    reorderLevel: 6,
  },
];

export const demoSuppliers = [
  { id: 1, name: 'Motorline Kenya', contact: 'Jane', phone: '+254700111222', email: 'sales@motorline.co.ke' },
  { id: 2, name: 'AutoDrive Suppliers', contact: 'Alex', phone: '+254712222333', email: 'orders@autodrive.co.ke' },
  { id: 3, name: 'Powerline Motors', contact: 'Mary', phone: '+254723333444', email: 'support@powerline.co.ke' },
];

export const demoPurchaseOrders = [
  { id: 1, supplierId: 1, supplierName: 'Motorline Kenya', itemId: 1, itemName: 'Toyota Corolla Engine Gasket Set', quantity: 8, unitCost: 900, orderDate: '2026-08-01', status: 'Received' },
  { id: 2, supplierId: 2, supplierName: 'AutoDrive Suppliers', itemId: 2, itemName: 'Mazda 323 Timing Belt Kit', quantity: 5, unitCost: 1180, orderDate: '2026-08-04', status: 'Pending' },
];

export const demoStockMovements = [
  { id: 1, type: 'Stock In', itemName: 'Toyota Corolla Engine Gasket Set', quantity: 8, date: '2026-08-01', note: 'Purchase order received' },
  { id: 2, type: 'Sale', itemName: 'Honda Civic Brake Pad Set', quantity: -2, date: '2026-08-06', note: 'Customer sale' },
  { id: 3, type: 'Stock Adjustment', itemName: 'Ford Ranger Suspension Kit', quantity: -1, date: '2026-08-10', note: 'Returned item' },
];

export const demoSales = [
  { id: 1, item: 'Toyota Corolla Engine Gasket Set', amount: 1680, date: '2026-08-06' },
  { id: 2, item: 'Honda Civic Brake Pad Set', amount: 1400, date: '2026-08-08' },
  { id: 3, item: 'Ford Ranger Suspension Kit', amount: 3200, date: '2026-08-10' },
  { id: 4, item: 'Mazda 323 Timing Belt Kit', amount: 2100, date: '2026-08-11' },
];

export const demoExpenses = [
  { id: 1, type: 'Installation Labour', amount: 950, note: 'Toyota gasket installation' },
  { id: 2, type: 'Motorbike Delivery', amount: 420, note: 'Customer delivery to Kijabe' },
  { id: 3, type: 'Part Reordering', amount: 680, note: 'Brake pad restocking' },
];

export const demoSettings = {
  businessName: 'AutoSpare Pro',
  currency: 'KES',
  deliveryAllowance: 500,
  installationFee: 1200,
  minimumStockAlert: 5,
  adminEmail: '',
  storageBucket: '',
};

const normalizeSettings = (record = {}) => ({
  businessName: record.business_name ?? record.businessName ?? 'AutoSpare Pro',
  currency: record.currency ?? 'KES',
  deliveryAllowance: Number(record.delivery_allowance ?? record.deliveryAllowance ?? 500),
  installationFee: Number(record.installation_fee ?? record.installationFee ?? 1200),
  minimumStockAlert: Number(record.minimum_stock_alert ?? record.minimumStockAlert ?? 5),
  adminEmail: record.admin_email ?? record.adminEmail ?? '',
  storageBucket: record.storage_bucket ?? record.storageBucket ?? record.firebase_bucket ?? record.firebaseBucket ?? '',
});

const normalizeSparePart = (record = {}) => ({
  ...record,
  id: record.id,
  name: record.name ?? '',
  category: record.category ?? 'Engine Parts',
  brand: record.brand ?? 'General',
  model: record.model ?? '',
  supplier: record.supplier ?? '',
  imageUrl: record.image_url ?? record.imageUrl ?? '',
  imageBucket: record.image_bucket ?? record.imageBucket ?? '',
  stock: Number(record.stock ?? 0),
  cost: Number(record.cost ?? 0),
  salePrice: Number(record.sale_price ?? record.salePrice ?? 0),
  reorderLevel: Number(record.reorder_level ?? record.reorderLevel ?? 0),
});



export const getSupabaseClient = () => {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('❌ Supabase environment variables are missing.');
    console.error('URL:', url);
    console.error('Anon key exists:', !!anonKey);
    return null;
  }

  return createClient(url, anonKey);
};
export async function loginAdmin(email, password) {
  const supabase = getSupabaseClient();

  if (!supabase || !supabase.auth || !supabase.auth.signInWithPassword) {
    return { success: true, email: email || '', mode: 'demo' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    return { success: true, email: data.user.email, mode: 'supabase' };
  } catch (error) {
    console.warn('Admin login failed:', error.message);
    return { success: false, error: error.message, mode: 'supabase' };
  }
}

export async function uploadSparePartImage(file, partId) {
  if (!file) return { success: false, error: 'No image selected.' };

  const supabase = getSupabaseClient();
  const bucketName = (process.env.REACT_APP_SUPABASE_STORAGE_BUCKET || '').trim();

  if (!supabase || !supabase.storage || !bucketName) {
    return { success: false, error: 'Supabase Storage not configured.' };
  }

  try {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from(bucketName).upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    const publicUrl = data?.publicUrl || '';

    // ✅ Save URL directly into the database
    if (partId) {
      await supabase.from('spares').update({ image_url: publicUrl }).eq('id', partId);
    }

    return { success: true, url: publicUrl };
  } catch (error) {
    return { success: false, error: error.message || 'Image upload failed.' };
  }
}

export async function loadDashboardData() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      data: {
        inventory: demoInventory,
        sales: demoSales,
        expenses: demoExpenses,
        suppliers: demoSuppliers,
        purchaseOrders: demoPurchaseOrders,
        stockMovements: demoStockMovements,
        settings: demoSettings,
      },
      enabled: false,
    };
  }

  try {
    const [inventoryRes, salesRes, expensesRes, suppliersRes, purchaseOrdersRes, stockMovementsRes, settingsRes] = await Promise.all([
      supabase.from('spares').select('*'),
      supabase.from('sales').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('suppliers').select('*'),
      supabase.from('purchase_orders').select('*'),
      supabase.from('stock_movements').select('*'),
      supabase.from('settings').select('*').maybeSingle(),
    ]);

    if (inventoryRes.error) throw inventoryRes.error;
    if (salesRes.error) throw salesRes.error;
    if (expensesRes.error) throw expensesRes.error;
    if (suppliersRes.error) throw suppliersRes.error;
    if (purchaseOrdersRes.error) throw purchaseOrdersRes.error;
    if (stockMovementsRes.error) throw stockMovementsRes.error;
    if (settingsRes.error && settingsRes.error.code !== 'PGRST116') throw settingsRes.error;

    return {
      data: {
        inventory: inventoryRes.data?.length ? inventoryRes.data.map(normalizeSparePart) : demoInventory,
        sales: salesRes.data?.length ? salesRes.data : demoSales,
        expenses: expensesRes.data?.length ? expensesRes.data : demoExpenses,
        suppliers: suppliersRes.data?.length ? suppliersRes.data : demoSuppliers,
        purchaseOrders: purchaseOrdersRes.data?.length ? purchaseOrdersRes.data : demoPurchaseOrders,
        stockMovements: stockMovementsRes.data?.length ? stockMovementsRes.data : demoStockMovements,
        settings: normalizeSettings(settingsRes.data || demoSettings),
      },
      enabled: true,
    };
  } catch (error) {
    console.warn('Supabase fallback activated:', error.message);
    return {
      data: {
        inventory: demoInventory,
        sales: demoSales,
        expenses: demoExpenses,
        suppliers: demoSuppliers,
        purchaseOrders: demoPurchaseOrders,
        stockMovements: demoStockMovements,
        settings: demoSettings,
      },
      enabled: false,
    };
  }
}

export async function saveAdminSettings(settings) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { success: true, mode: 'demo' };
  }

  try {
    const payload = {
      id: 1,
      business_name: settings.businessName ?? 'AutoSpare Pro',
      currency: settings.currency ?? 'KES',
      delivery_allowance: Number(settings.deliveryAllowance ?? 0),
      installation_fee: Number(settings.installationFee ?? 0),
      minimum_stock_alert: Number(settings.minimumStockAlert ?? 0),
      admin_email: (settings.adminEmail ?? '').trim(),
      storage_bucket: (settings.storageBucket ?? settings.firebaseBucket ?? '').trim(),
    };

    const { error } = await supabase.from('settings').upsert(payload);

    if (error) throw error;

    return { success: true, mode: 'supabase' };
  } catch (error) {
    console.warn('Unable to save settings to Supabase:', error.message);
    return { success: false, mode: 'fallback' };
  }
}
