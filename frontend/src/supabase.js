import { createClient } from '@supabase/supabase-js';

export const SHOPS = [
  { id: 'velll', name: 'Velll Shop' },
  { id: 'bana', name: 'Bana Shop' },
];

export const DEFAULT_SHOP_ID = SHOPS[0].id;

export const getShopName = (shopId) => SHOPS.find((shop) => shop.id === shopId)?.name || shopId;

export const PART_SIDES = ['N/A', 'Left', 'Right'];

export const defaultSettings = {
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
  shop: record.shop ?? DEFAULT_SHOP_ID,
  name: record.name ?? '',
  category: record.category ?? 'Mechanical',
  brand: record.brand ?? 'General',
  model: record.model ?? '',
  side: record.side ?? 'N/A',
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
  shop: record.shop ?? DEFAULT_SHOP_ID,
  item: record.item ?? '',
  amount: Number(record.amount ?? 0),
  quantity: Number(record.quantity ?? 1),
  cost: Number(record.cost ?? 0),
  date: record.date ?? '',
});

export const normalizeExpense = (record = {}) => ({
  id: record.id,
  shop: record.shop ?? DEFAULT_SHOP_ID,
  type: record.type ?? '',
  amount: Number(record.amount ?? 0),
  note: record.note ?? '',
  date: record.date ?? '',
});

export const normalizeSupplier = (record = {}) => ({
  id: record.id,
  shop: record.shop ?? DEFAULT_SHOP_ID,
  name: record.name ?? '',
  contact: record.contact ?? '',
  phone: record.phone ?? '',
  email: record.email ?? '',
});

export const normalizePurchaseOrder = (record = {}) => ({
  id: record.id,
  shop: record.shop ?? DEFAULT_SHOP_ID,
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
  shop: record.shop ?? DEFAULT_SHOP_ID,
  type: record.type ?? '',
  itemName: record.item_name ?? record.itemName ?? '',
  quantity: Number(record.quantity ?? 0),
  date: record.date ?? '',
  note: record.note ?? '',
});

let cachedClient = null;

export const getSupabaseClient = () => {
  if (cachedClient) return cachedClient;
  const url = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('❌ Supabase environment variables are missing.');
    return null;
  }

  cachedClient = createClient(url, anonKey);
  return cachedClient;
};

export async function loginAdmin(email, password) {
  const supabase = getSupabaseClient();

  if (!supabase || !supabase.auth) {
    return { success: false, error: 'Supabase client unavailable.', mode: 'offline' };
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
    const { error } = await supabase.storage.from(bucketName).upload(fileName, file, { cacheControl: '31536000' });

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

// ----------------------------------------------------
// Fast loading helpers
// ----------------------------------------------------

// image_url is NOT in the list query: if any row holds a big inline (base64) image,
// reading it makes the query slow enough to hit Supabase's statement timeout.
// Images are fetched separately, only for the parts on screen.
export const SPARE_LIGHT_COLUMNS =
  'id,shop,name,category,brand,model,side,supplier,stock,cost,sale_price,reorder_level';

const CHUNK = 500; // small chunks keep every request well under the timeout
const PARALLEL = 4; // chunks requested at the same time

// Downloads a whole table in small chunks, several at a time, without a slow COUNT.
async function fetchAllRows(table, columns = '*') {
  const supabase = getSupabaseClient();
  const rows = [];
  let batchStart = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const jobs = [];
    for (let i = 0; i < PARALLEL; i += 1) {
      const from = batchStart + i * CHUNK;
      jobs.push(
        supabase.from(table).select(columns).order('id', { ascending: false }).range(from, from + CHUNK - 1)
      );
    }
    const results = await Promise.all(jobs);
    let lastWasFull = true;
    for (const res of results) {
      if (res.error) throw res.error;
      const data = res.data || [];
      rows.push(...data);
      lastWasFull = data.length === CHUNK;
      if (!lastWasFull) break;
    }
    if (!lastWasFull) break;
    batchStart += PARALLEL * CHUNK;
  }
  return rows;
}

// Step 1: spare parts WITHOUT images - small and fast, shown first.
export async function loadSparesLight() {
  if (!getSupabaseClient()) return { error: 'Supabase environment variables are missing.', inventory: [] };
  try {
    const rows = await fetchAllRows('spares', SPARE_LIGHT_COLUMNS);
    return { inventory: rows.map(normalizeSparePart) };
  } catch (error) {
    console.warn('Supabase spares load error:', error.message);
    return { error: error.message, inventory: [] };
  }
}

// Step 2: images for just the parts on screen. Returns { [id]: imageUrl }.
export async function loadSpareImages(ids = []) {
  const supabase = getSupabaseClient();
  if (!supabase || !ids.length) return {};
  try {
    const { data, error } = await supabase.from('spares').select('id,image_url').in('id', ids);
    if (error) throw error;
    const map = {};
    (data || []).forEach((row) => {
      map[row.id] = row.image_url || '';
    });
    return map;
  } catch (error) {
    console.warn('Supabase image load error:', error.message);
    return null;
  }
}

// Step 3: everything else (sales, expenses, ...), loaded in the background.
export async function loadSecondaryData() {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Supabase environment variables are missing.' };

  try {
    const [sales, expenses, suppliers, purchaseOrders, stockMovements, settingsRes] = await Promise.all([
      fetchAllRows('sales'),
      fetchAllRows('expenses'),
      fetchAllRows('suppliers'),
      fetchAllRows('purchase_orders'),
      fetchAllRows('stock_movements'),
      supabase.from('settings').select('*').maybeSingle(),
    ]);

    return {
      sales: sales.map(normalizeSale),
      expenses: expenses.map(normalizeExpense),
      suppliers: suppliers.map(normalizeSupplier),
      purchaseOrders: purchaseOrders.map(normalizePurchaseOrder),
      stockMovements: stockMovements.map(normalizeStockMovement),
      settings: normalizeSettings(settingsRes.data || defaultSettings),
    };
  } catch (error) {
    console.warn('Supabase data load error:', error.message);
    return { error: error.message };
  }
}

export async function saveAdminSettings(settings) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase is not configured.', mode: 'offline' };

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
  if (!supabase) return { success: false, mode: 'offline' };

  const payload = {
    shop: item.shop || DEFAULT_SHOP_ID,
    name: item.name,
    category: item.category,
    brand: item.brand || 'General',
    model: item.model || '',
    side: item.side || 'N/A',
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
  if (!supabase) return { success: false, mode: 'offline' };

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
  if (!supabase) return { success: false, mode: 'offline' };

  const payload = {
    shop: sale.shop || DEFAULT_SHOP_ID,
    item: sale.item,
    amount: Number(sale.amount || 0),
    quantity: Number(sale.quantity || 1),
    cost: Number(sale.cost || 0),
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
      const fallbackPayload = { shop: sale.shop || DEFAULT_SHOP_ID, item: sale.item, amount: Number(sale.amount || 0) };
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
  if (!supabase) return { success: false, mode: 'offline' };

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
  if (!supabase) return { success: false, mode: 'offline' };

  const payload = {
    shop: expense.shop || DEFAULT_SHOP_ID,
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
        shop: expense.shop || DEFAULT_SHOP_ID,
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
  if (!supabase) return { success: false, mode: 'offline' };

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
  if (!supabase) return { success: false, mode: 'offline' };

  const payload = {
    shop: supplier.shop || DEFAULT_SHOP_ID,
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
  if (!supabase) return { success: false, mode: 'offline' };

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
  if (!supabase) return { success: false, mode: 'offline' };

  const payload = {
    shop: order.shop || DEFAULT_SHOP_ID,
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
  if (!supabase) return { success: false, mode: 'offline' };

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
  if (!supabase) return { success: false, mode: 'offline' };

  const payload = {
    shop: movement.shop || DEFAULT_SHOP_ID,
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
  if (!supabase) return { success: false, mode: 'offline' };

  try {
    const { data, error } = await supabase
      .from('spares')
      .update({ stock: Math.max(0, Number(newStock)) })
      .eq('id', id)
      .select(SPARE_LIGHT_COLUMNS)
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
  if (!supabase) return { success: false, mode: 'offline' };

  try {
    const { data, error } = await supabase
      .from('spares')
      .update({ cost: Number(cost), sale_price: Number(salePrice) })
      .eq('id', id)
      .select(SPARE_LIGHT_COLUMNS)
      .single();

    if (error) throw error;
    return { success: true, data: normalizeSparePart(data) };
  } catch (error) {
    console.error('Error updating spare part prices in Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function clearShopData(shopId) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, mode: 'offline' };

  const tables = ['stock_movements', 'purchase_orders', 'sales', 'expenses', 'suppliers', 'spares'];

  try {
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('shop', shopId);
      if (error) throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Error clearing shop data in Supabase:', error);
    return { success: false, error: error.message };
  }
}