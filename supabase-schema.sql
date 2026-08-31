-- ===================================================
-- AutoSpare Pro - Complete Supabase Database Schema
-- ===================================================

-- 0. Shops
CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO shops (id, name) VALUES
  ('velll', 'Velll Shop'),
  ('bana', 'Bana Shop')
ON CONFLICT (id) DO NOTHING;

-- 1. Spares (Inventory Parts)
CREATE TABLE IF NOT EXISTS spares (
  id BIGSERIAL PRIMARY KEY,
  shop TEXT NOT NULL DEFAULT 'velll' REFERENCES shops(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,
  side TEXT NOT NULL DEFAULT 'N/A',
  supplier TEXT,
  image_url TEXT,
  storage_bucket TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE spares ADD COLUMN IF NOT EXISTS shop TEXT NOT NULL DEFAULT 'velll';
ALTER TABLE spares ADD COLUMN IF NOT EXISTS side TEXT NOT NULL DEFAULT 'N/A';

-- 2. Sales
CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  shop TEXT NOT NULL DEFAULT 'velll' REFERENCES shops(id),
  item TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shop TEXT NOT NULL DEFAULT 'velll';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cost NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 3. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  shop TEXT NOT NULL DEFAULT 'velll' REFERENCES shops(id),
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  note TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS shop TEXT NOT NULL DEFAULT 'velll';

-- 4. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  shop TEXT NOT NULL DEFAULT 'velll' REFERENCES shops(id),
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS shop TEXT NOT NULL DEFAULT 'velll';

-- 5. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  shop TEXT NOT NULL DEFAULT 'velll' REFERENCES shops(id),
  supplier_id BIGINT,
  supplier_name TEXT,
  item_id BIGINT,
  item_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  order_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS shop TEXT NOT NULL DEFAULT 'velll';

-- 6. Stock Movements Log
CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  shop TEXT NOT NULL DEFAULT 'velll' REFERENCES shops(id),
  type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS shop TEXT NOT NULL DEFAULT 'velll';

-- 7. Application Settings
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  business_name TEXT NOT NULL DEFAULT 'AutoSpare Pro',
  currency TEXT NOT NULL DEFAULT 'KES',
  delivery_allowance NUMERIC(12,2) NOT NULL DEFAULT 500,
  installation_fee NUMERIC(12,2) NOT NULL DEFAULT 1200,
  minimum_stock_alert INTEGER NOT NULL DEFAULT 5,
  admin_email TEXT,
  storage_bucket TEXT DEFAULT 'spares'
);

-- Initial Settings record
INSERT INTO settings (id, business_name, currency, delivery_allowance, installation_fee, minimum_stock_alert, admin_email, storage_bucket)
VALUES (1, 'AutoSpare Pro', 'KES', 500, 1200, 5, NULL, 'spares')
ON CONFLICT (id) DO NOTHING;

-- Views
CREATE OR REPLACE VIEW stock_alerts AS
SELECT *
FROM spares
WHERE stock <= reorder_level;

-- Disable Row Level Security on all tables for anon API access
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE spares DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Permissive policies for anon access (in case RLS is re-enabled by default in Supabase)
DROP POLICY IF EXISTS "Allow public access on shops" ON shops;
CREATE POLICY "Allow public access on shops" ON shops FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on spares" ON spares;
CREATE POLICY "Allow public access on spares" ON spares FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on sales" ON sales;
CREATE POLICY "Allow public access on sales" ON sales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on expenses" ON expenses;
CREATE POLICY "Allow public access on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on suppliers" ON suppliers;
CREATE POLICY "Allow public access on suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on purchase_orders" ON purchase_orders;
CREATE POLICY "Allow public access on purchase_orders" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on stock_movements" ON stock_movements;
CREATE POLICY "Allow public access on stock_movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on settings" ON settings;
CREATE POLICY "Allow public access on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
