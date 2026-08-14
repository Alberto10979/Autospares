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

export const normalizeSettings = (record = {}) => ({
  businessName: record.business_name ?? record.businessName ?? 'AutoSpare Pro',
  currency: record.currency ?? 'KES',
  deliveryAllowance: Number(record.delivery_allowance ?? record.deliveryAllowance ?? 500),
  installationFee: Number(record.installation_fee ?? record.installationFee ?? 1200),
  minimumStockAlert: Number(record.minimum_stock_alert ?? record.minimumStockAlert ?? 5),
  adminEmail: record.admin_email ?? record.adminEmail ?? '',
  storageBucket: record.storage_bucket ?? record.storageBucket ?? record.firebase_bucket ?? record.firebaseBucket ?? '',
});

export const normalizeSparePart = (record = {}) => ({
  id: record.id,
  name: record.name ?? '',
  category: record.category ?? 'Engine Parts',
  brand: record.brand ?? 'General',
  model: record.model ?? '',
  supplier: record.supplier ?? '',
  imageUrl: record.image_url ?? record.imageUrl ?? '',
  imageBucket: record.storage_bucket ?? record.image_bucket ?? record.imageUrl ?? '',
  stock: Number(record.stock ?? 0),
  cost: Number(record.cost ?? 0),
  salePrice: Number(record.sale_price ?? record.salePrice ?? 0),
  reorderLevel: Number(record.reorder_level ?? record.reorderLevel ?? 0),
});

export const normalizeSale = (record = {}) => ({
  id: record.id,
  item: record.item ?? '',
  amount: Number(record.amount ?? 0),
  date: record.date ?? '',
});

export const normalizeExpense = (record = {}) => ({
  id: record.id,
  type: record.type ?? '',
  amount: Number(record.amount ?? 0),
  note: record.note ?? '',
  date: record.date ?? '',
});

export const normalizeSupplier = (record = {}) => ({
  id: record.id,
  name: record.name ?? '',
  contact: record.contact ?? '',
  phone: record.phone ?? '',
  email: record.email ?? '',
});

export const normalizePurchaseOrder = (record = {}) => ({
  id: record.id,
  supplierId: record.supplier_id ?? record.supplierId ?? null,
  supplierName: record.supplier_name ?? record.supplierName ?? '',
  itemId: record.item_id ?? record.itemId ?? null,
  itemName: record.item_name ?? record.itemName ?? '',
  quantity: Number(record.quantity ?? 1),
  unitCost: Number(record.unit_cost ?? record.unitCost ?? 0),
  orderDate: record.order_date ?? record.orderDate ?? '',
  status: record.status ?? 'Pending',
});

export const normalizeStockMovement = (record = {}) => ({
  id: record.id,
  type: record.type ?? '',
  itemName: record.item_name ?? record.itemName ?? '',
  quantity: Number(record.quantity ?? 0),
  date: record.date ?? '',
  note: record.note ?? '',
});

export const getSupabaseClient = () => {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('❌ Supabase environment variables are missing.');
    return null;
  }

  return createClient(url, anonKey);
};

export async function loginAdmin(email, password) {
  const supabase = getSupabaseClient();

  if (!supabase || !supabase.auth) {
    return { success: false, error: 'Supabase client unavailable.', mode: 'demo' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: (email || '').trim(),
      password: password || '',
    });
    if (error) throw error;
    return { success: true, email: data.user?.email || email, mode: 'supabase' };
  } catch (error) {
    console.warn('Supabase Auth login failed:', error.message);
    return { success: false, error: error.message, mode: 'supabase' };
  }
}

export async function uploadSparePartImage(file, partId) {
  if (!file) return { success: false, error: 'No image selected.' };

  const supabase = getSupabaseClient();
  const bucketName = (process.env.REACT_APP_SUPABASE_STORAGE_BUCKET || 'spares').trim();

  if (!supabase || !supabase.storage || !bucketName) {
    return { success: false, error: 'Supabase Storage not configured.' };
  }

  try {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from(bucketName).upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    const publicUrl = data?.publicUrl || '';

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
      supabase.from('spares').select('*').order('id', { ascending: false }),
      supabase.from('sales').select('*').order('id', { ascending: false }),
      supabase.from('expenses').select('*').order('id', { ascending: false }),
      supabase.from('suppliers').select('*').order('id', { ascending: false }),
      supabase.from('purchase_orders').select('*').order('id', { ascending: false }),
      supabase.from('stock_movements').select('*').order('id', { ascending: false }),
      supabase.from('settings').select('*').maybeSingle(),
    ]);

    if (inventoryRes.error) console.warn('Supabase spares table warning:', inventoryRes.error.message);
    if (salesRes.error) console.warn('Supabase sales table warning:', salesRes.error.message);
    if (expensesRes.error) console.warn('Supabase expenses table warning:', expensesRes.error.message);
    if (suppliersRes.error) console.warn('Supabase suppliers table warning:', suppliersRes.error.message);
    if (purchaseOrdersRes.error) console.warn('Supabase purchase_orders table warning:', purchaseOrdersRes.error.message);
    if (stockMovementsRes.error) console.warn('Supabase stock_movements table warning:', stockMovementsRes.error.message);

    return {
      data: {
        inventory: inventoryRes.data ? inventoryRes.data.map(normalizeSparePart) : [],
        sales: salesRes.data ? salesRes.data.map(normalizeSale) : [],
        expenses: expensesRes.data ? expensesRes.data.map(normalizeExpense) : [],
        suppliers: suppliersRes.data ? suppliersRes.data.map(normalizeSupplier) : [],
        purchaseOrders: purchaseOrdersRes.data ? purchaseOrdersRes.data.map(normalizePurchaseOrder) : [],
        stockMovements: stockMovementsRes.data ? stockMovementsRes.data.map(normalizeStockMovement) : [],
        settings: normalizeSettings(settingsRes.data || demoSettings),
      },
      enabled: true,
    };
  } catch (error) {
    console.warn('Supabase data load error:', error.message);
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
      enabled: true,
      error: error.message,
    };
  }
}

export async function saveAdminSettings(settings) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: true, mode: 'demo' };

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
    return { success: false, error: error.message, mode: 'fallback' };
  }
}

// ----------------------------------------------------
// CRUD Operations for Production Supabase Backend
// ----------------------------------------------------

export async function saveSparePart(item) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  const payload = {
    name: item.name,
    category: item.category,
    brand: item.brand || 'General',
    model: item.model || '',
    supplier: item.supplier || '',
    image_url: item.imageUrl || '',
    stock: Number(item.stock || 0),
    cost: Number(item.cost || 0),
    sale_price: Number(item.salePrice || 0),
    reorder_level: Number(item.reorderLevel || 0),
  };

  try {
    let result;
    // Check if ID is a valid DB primary key (numeric) or a temporary Date.now() ID
    if (item.id && typeof item.id === 'number' && item.id < 10000000000) {
      result = await supabase.from('spares').update(payload).eq('id', item.id).select().single();
    } else {
      result = await supabase.from('spares').insert([payload]).select().single();
    }

    if (result.error) throw result.error;
    return { success: true, data: normalizeSparePart(result.data) };
  } catch (error) {
    console.error('Error saving spare part to Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSparePart(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  try {
    const { error } = await supabase.from('spares').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting spare part from Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function saveSale(sale) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  const payload = {
    item: sale.item,
    amount: Number(sale.amount || 0),
    date: sale.date,
  };

  try {
    let result;
    if (sale.id && typeof sale.id === 'number' && sale.id < 10000000000) {
      result = await supabase.from('sales').update(payload).eq('id', sale.id).select().single();
    } else {
      result = await supabase.from('sales').insert([payload]).select().single();
    }

    if (result.error && (result.error.message?.includes('date') || result.error.code === 'PGRST204')) {
      const fallbackPayload = { item: sale.item, amount: Number(sale.amount || 0) };
      if (sale.id && typeof sale.id === 'number' && sale.id < 10000000000) {
        result = await supabase.from('sales').update(fallbackPayload).eq('id', sale.id).select().single();
      } else {
        result = await supabase.from('sales').insert([fallbackPayload]).select().single();
      }
    }

    if (result.error) throw result.error;
    return { success: true, data: normalizeSale(result.data) };
  } catch (error) {
    console.error('Error saving sale to Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSale(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  try {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting sale from Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function saveExpense(expense) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  const payload = {
    type: expense.type,
    amount: Number(expense.amount || 0),
    note: expense.note || '',
    date: expense.date,
  };

  try {
    let result;
    if (expense.id && typeof expense.id === 'number' && expense.id < 10000000000) {
      result = await supabase.from('expenses').update(payload).eq('id', expense.id).select().single();
    } else {
      result = await supabase.from('expenses').insert([payload]).select().single();
    }

    if (result.error && (result.error.message?.includes('date') || result.error.code === 'PGRST204')) {
      const fallbackPayload = {
        type: expense.type,
        amount: Number(expense.amount || 0),
        note: expense.note || '',
      };
      if (expense.id && typeof expense.id === 'number' && expense.id < 10000000000) {
        result = await supabase.from('expenses').update(fallbackPayload).eq('id', expense.id).select().single();
      } else {
        result = await supabase.from('expenses').insert([fallbackPayload]).select().single();
      }
    }

    if (result.error) throw result.error;
    return { success: true, data: normalizeExpense(result.data) };
  } catch (error) {
    console.error('Error saving expense to Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteExpense(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting expense from Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function saveSupplier(supplier) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  const payload = {
    name: supplier.name,
    contact: supplier.contact || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
  };

  try {
    let result;
    if (supplier.id && typeof supplier.id === 'number' && supplier.id < 10000000000) {
      result = await supabase.from('suppliers').update(payload).eq('id', supplier.id).select().single();
    } else {
      result = await supabase.from('suppliers').insert([payload]).select().single();
    }

    if (result.error) throw result.error;
    return { success: true, data: normalizeSupplier(result.data) };
  } catch (error) {
    console.error('Error saving supplier to Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSupplier(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  try {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting supplier from Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function savePurchaseOrder(order) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  const payload = {
    supplier_id: order.supplierId ? Number(order.supplierId) : null,
    supplier_name: order.supplierName || '',
    item_id: order.itemId ? Number(order.itemId) : null,
    item_name: order.itemName || '',
    quantity: Number(order.quantity || 1),
    unit_cost: Number(order.unitCost || 0),
    order_date: order.orderDate,
    status: order.status || 'Pending',
  };

  try {
    let result;
    if (order.id && typeof order.id === 'number' && order.id < 10000000000) {
      result = await supabase.from('purchase_orders').update(payload).eq('id', order.id).select().single();
    } else {
      result = await supabase.from('purchase_orders').insert([payload]).select().single();
    }

    if (result.error) throw result.error;
    return { success: true, data: normalizePurchaseOrder(result.data) };
  } catch (error) {
    console.error('Error saving purchase order to Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePurchaseOrder(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  try {
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting purchase order from Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function saveStockMovement(movement) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  const payload = {
    type: movement.type,
    item_name: movement.itemName,
    quantity: Number(movement.quantity || 0),
    date: movement.date,
    note: movement.note || '',
  };

  try {
    const { data, error } = await supabase.from('stock_movements').insert([payload]).select().single();
    if (error) throw error;
    return { success: true, data: normalizeStockMovement(data) };
  } catch (error) {
    console.error('Error saving stock movement to Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSparePartStock(id, newStock) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  try {
    const { data, error } = await supabase
      .from('spares')
      .update({ stock: Math.max(0, Number(newStock)) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: normalizeSparePart(data) };
  } catch (error) {
    console.error('Error updating spare part stock in Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSparePartPrices(id, cost, salePrice) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'demo' };

  try {
    const { data, error } = await supabase
      .from('spares')
      .update({ cost: Number(cost), sale_price: Number(salePrice) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: normalizeSparePart(data) };
  } catch (error) {
    console.error('Error updating spare part prices in Supabase:', error);
    return { success: false, error: error.message };
  }
}
