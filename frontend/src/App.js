import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import logo from './assets/logo.png';
import logoSquare from './assets/logo-square.png';
import {
  SHOPS,
  getShopName,
  PART_SIDES,
  demoInventory,
  demoSuppliers,
  demoPurchaseOrders,
  demoStockMovements,
  demoSales,
  demoExpenses,
  demoSettings,
  getSupabaseClient,
  loadDashboardData,
  loginAdmin,
  saveAdminSettings,
  uploadSparePartImage,
  saveSparePart,
  deleteSparePart,
  saveSale,
  deleteSale,
  saveExpense,
  deleteExpense,
  saveSupplier,
  deleteSupplier,
  savePurchaseOrder,
  deletePurchaseOrder,
  saveStockMovement,
  updateSparePartStock,
  updateSparePartPrices,
  clearShopData,
} from './supabase';

const categories = ['All', 'Body', 'Electrical', 'Mechanical'];
const INVENTORY_PAGE_SIZE = 12;
const shopThemes = {
  velll: { icon: '🏬', accent: '#2563eb', accent2: '#0ea5e9', soft: '#eaf2ff' },
  bana: { icon: '🏪', accent: '#9333ea', accent2: '#db2777', soft: '#faf0ff' },
};
const getShopTheme = (shopId) => shopThemes[shopId] || { icon: '🏪', accent: '#e4181c', accent2: '#b01118', soft: '#fde3e3' };
const expenseTypes = ['Installation Labour', 'Motorbike Delivery', 'Part Reordering', 'Workshop Rent', 'Utilities'];

const makeToday = () => new Date().toISOString().slice(0, 10);

const emptyStockForm = {
  name: '',
  category: 'Mechanical',
  brand: 'Toyota',
  model: '',
  side: 'N/A',
  supplier: '',
  imageUrl: '',
  stock: 1,
  cost: 0,
  salePrice: 0,
  reorderLevel: 5,
};

const emptySaleForm = {
  itemId: '',
  quantity: 1,
  amount: '',
  date: makeToday(),
};

const emptyExpenseForm = {
  type: 'Installation Labour',
  amount: '',
  note: '',
  date: makeToday(),
};

const emptySupplierForm = {
  name: '',
  contact: '',
  phone: '',
  email: '',
};

const emptyPurchaseForm = {
  supplierId: '',
  itemId: '',
  quantity: 1,
  unitCost: 0,
  orderDate: makeToday(),
  status: 'Pending',
};

const emptyAdminLogin = {
  email: '',
  password: '',
};

const emptyCostForm = {
  itemId: '',
  newCost: 0,
  newSalePrice: 0,
};

const demoDataKey = 'autospares-demo-data-v1';
const selectedShopKey = 'autospares-selected-shop-v1';
const themeKey = 'autospares-theme-v1';

const getSavedTheme = () => {
  try {
    return localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light';
  } catch (error) {
    return 'light';
  }
};

const getSavedShop = () => {
  try {
    const raw = localStorage.getItem(selectedShopKey);
    return raw && SHOPS.some((shop) => shop.id === raw) ? raw : null;
  } catch (error) {
    return null;
  }
};

const getSavedDemoData = () => {
  try {
    const raw = localStorage.getItem(demoDataKey);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const saveDemoData = (bundle) => {
  try {
    localStorage.setItem(demoDataKey, JSON.stringify(bundle));
  } catch (error) {
    console.warn('Unable to save demo data locally:', error.message);
  }
};

const buildDemoBundle = (settingsOverride = null) => ({
  inventory: demoInventory,
  sales: demoSales,
  expenses: demoExpenses,
  suppliers: demoSuppliers,
  purchaseOrders: demoPurchaseOrders,
  stockMovements: demoStockMovements,
  settings: settingsOverride || demoSettings,
});

function App() {
  const [allInventory, setAllInventory] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [allPurchaseOrders, setAllPurchaseOrders] = useState([]);
  const [allStockMovements, setAllStockMovements] = useState([]);
  const [theme, setTheme] = useState(() => getSavedTheme());
  const [selectedShop, setSelectedShop] = useState(() => getSavedShop());
  const [showAdminLoginFromGate, setShowAdminLoginFromGate] = useState(false);
  const [settings, setSettings] = useState({
    businessName: 'AutoSpare Pro',
    currency: 'KES',
    deliveryAllowance: 500,
    installationFee: 1200,
    minimumStockAlert: 5,
  });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminForm, setAdminForm] = useState(settings);
  const [stockForm, setStockForm] = useState(emptyStockForm);
  const [saleForm, setSaleForm] = useState(emptySaleForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [adminLogin, setAdminLogin] = useState(emptyAdminLogin);
  const [editingItemId, setEditingItemId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(true);
  const [adminSection, setAdminSection] = useState('stock');
  const [supplierQuery, setSupplierQuery] = useState('');
  const [orderQuery, setOrderQuery] = useState('');
  const [saleQuery, setSaleQuery] = useState('');
  const [expenseQuery, setExpenseQuery] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [costForm, setCostForm] = useState(emptyCostForm);
  const [costQuery, setCostQuery] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const applyDataBundle = (bundle) => {
    const nextSettings = {
      ...demoSettings,
      ...(bundle?.settings || {}),
    };

    const nextInventory = Array.isArray(bundle?.inventory) ? bundle.inventory : [];
    const nextSales = Array.isArray(bundle?.sales) ? bundle.sales : [];
    const nextExpenses = Array.isArray(bundle?.expenses) ? bundle.expenses : [];
    const nextSuppliers = Array.isArray(bundle?.suppliers) ? bundle.suppliers : [];
    const nextPurchaseOrders = Array.isArray(bundle?.purchaseOrders) ? bundle.purchaseOrders : [];
    const nextStockMovements = Array.isArray(bundle?.stockMovements) ? bundle.stockMovements : [];

    setAllInventory(nextInventory);
    setAllSales(nextSales);
    setAllExpenses(nextExpenses);
    setAllSuppliers(nextSuppliers);
    setAllPurchaseOrders(nextPurchaseOrders);
    setAllStockMovements(nextStockMovements);
    setSettings(nextSettings);
    setAdminForm(nextSettings);
    saveDemoData({
      inventory: nextInventory,
      sales: nextSales,
      expenses: nextExpenses,
      suppliers: nextSuppliers,
      purchaseOrders: nextPurchaseOrders,
      stockMovements: nextStockMovements,
      settings: nextSettings,
    });
  };

  const inventory = useMemo(
    () => allInventory.filter((item) => item.shop === selectedShop),
    [allInventory, selectedShop]
  );
  const sales = useMemo(
    () => allSales.filter((sale) => sale.shop === selectedShop),
    [allSales, selectedShop]
  );
  const expenses = useMemo(
    () => allExpenses.filter((expense) => expense.shop === selectedShop),
    [allExpenses, selectedShop]
  );
  const suppliers = useMemo(
    () => allSuppliers.filter((supplier) => supplier.shop === selectedShop),
    [allSuppliers, selectedShop]
  );
  const purchaseOrders = useMemo(
    () => allPurchaseOrders.filter((order) => order.shop === selectedShop),
    [allPurchaseOrders, selectedShop]
  );
  const stockMovements = useMemo(
    () => allStockMovements.filter((movement) => movement.shop === selectedShop),
    [allStockMovements, selectedShop]
  );

  const handleSelectShop = (shopId) => {
    setSelectedShop(shopId);
    try {
      localStorage.setItem(selectedShopKey, shopId);
    } catch (error) {
      console.warn('Unable to remember selected shop:', error.message);
    }
  };

  const handleSwitchShop = () => {
    setSelectedShop(null);
    try {
      localStorage.removeItem(selectedShopKey);
    } catch (error) {
      console.warn('Unable to clear remembered shop:', error.message);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(themeKey, theme);
    } catch (error) {
      console.warn('Unable to save theme preference:', error.message);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const [printScope, setPrintScope] = useState('financial');

  const handlePrintFinancialReport = () => {
    setPrintScope('financial');
    window.print();
  };

  const handlePrintProfitLoss = () => {
    setPrintScope('profit-loss');
    window.print();
  };

  const [saleToPrint, setSaleToPrint] = useState(null);

  const handlePrintSaleProfitLoss = (sale) => {
    setSaleToPrint(sale);
    setPrintScope('sale-profit-loss');
    window.print();
  };

  const themeToggleButton = (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );

  useEffect(() => {
    const fetchData = async () => {
      const savedDemoBundle = getSavedDemoData();
      const result = await loadDashboardData();
      const normalizedSettings = result.data.settings || settings;
      const activeBundle = result.enabled ? result.data : (savedDemoBundle || result.data);

      applyDataBundle(activeBundle);
      setSupabaseEnabled(result.enabled);

      const supabase = getSupabaseClient();
      if (supabase && supabase.auth && supabase.auth.getUser) {
        try {
          const { data, error } = await supabase.auth.getUser();
          if (!error && data?.user) {
            const allowedAdmin = (normalizedSettings.adminEmail || normalizedSettings.admin_email || '').trim().toLowerCase();
            const currentEmail = (data.user.email || '').trim().toLowerCase();
            setAdminAuthenticated(Boolean(allowedAdmin) && currentEmail === allowedAdmin);
          }
        } catch (error) {
          console.warn('Unable to check admin auth state:', error.message);
        }
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInventory = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const byCategory = selectedCategory === 'All'
      ? inventory
      : inventory.filter((item) => item.category === selectedCategory);

    if (!normalizedSearch) return byCategory;

    return byCategory.filter((item) => {
      const haystack = [item.name, item.brand, item.model, item.category, item.supplier].join(' ').toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [inventory, searchTerm, selectedCategory]);

  const inventoryTotalPages = Math.max(1, Math.ceil(filteredInventory.length / INVENTORY_PAGE_SIZE));

  useEffect(() => {
    setInventoryPage(1);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    if (inventoryPage > inventoryTotalPages) {
      setInventoryPage(inventoryTotalPages);
    }
  }, [inventoryPage, inventoryTotalPages]);

  const paginatedInventory = useMemo(() => {
    if (isPrinting) return filteredInventory;
    const start = (inventoryPage - 1) * INVENTORY_PAGE_SIZE;
    return filteredInventory.slice(start, start + INVENTORY_PAGE_SIZE);
  }, [filteredInventory, inventoryPage, isPrinting]);

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const totalCostOfGoodsSold = sales.reduce((sum, sale) => sum + (Number(sale.cost || 0) * Number(sale.quantity || 1)), 0);
  const grossProfit = totalSales - totalCostOfGoodsSold;

  const profitAndLoss = grossProfit - totalExpenses;
  const lowStockItems = inventory.filter((item) => Number(item.stock) <= Number(item.reorderLevel || settings.minimumStockAlert));

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!supplierQuery.trim()) return true;
    const haystack = [supplier.name, supplier.contact, supplier.phone, supplier.email].join(' ').toLowerCase();
    return haystack.includes(supplierQuery.toLowerCase());
  });

  const filteredPurchaseOrders = purchaseOrders.filter((order) => {
    if (!orderQuery.trim()) return true;
    const haystack = [order.itemName, order.supplierName, order.status].join(' ').toLowerCase();
    return haystack.includes(orderQuery.toLowerCase());
  });

  const filteredSales = sales.filter((sale) => {
    if (!saleQuery.trim()) return true;
    const haystack = [sale.item, sale.date].join(' ').toLowerCase();
    return haystack.includes(saleQuery.toLowerCase());
  });

  const filteredExpenses = expenses.filter((expense) => {
    if (!expenseQuery.trim()) return true;
    const haystack = [expense.type, expense.note, expense.date].join(' ').toLowerCase();
    return haystack.includes(expenseQuery.toLowerCase());
  });

  const handleAdjustCost = async (event) => {
    event.preventDefault();
    if (!costForm.itemId) return;

    const item = inventory.find((entry) => String(entry.id) === String(costForm.itemId));
    if (!item) return;

    const newCost = Number(costForm.newCost) || 0;
    const newSalePrice = Number(costForm.newSalePrice) || item.salePrice;

    if (supabaseEnabled) {
      const res = await updateSparePartPrices(costForm.itemId, newCost, newSalePrice);
      if (!res.success) {
        setStatusMessage(`Error updating prices in Supabase: ${res.error}`);
        return;
      }
      await saveStockMovement({
        shop: selectedShop,
        type: 'Price Adjustment',
        itemName: `${item.brand} ${item.name}`,
        quantity: 0,
        date: makeToday(),
        note: `Cost: ${item.cost} → ${newCost}`,
      });
    }

    setAllInventory((previous) =>
      previous.map((entry) =>
        String(entry.id) === String(costForm.itemId) ? { ...entry, cost: newCost, salePrice: newSalePrice } : entry
      )
    );

    setAllStockMovements((previous) => [
      {
        id: Date.now(),
        shop: selectedShop,
        type: 'Price Adjustment',
        itemName: `${item.brand} ${item.name}`,
        quantity: 0,
        date: makeToday(),
        note: `Cost: ${item.cost} → ${newCost}`,
      },
      ...previous,
    ]);

    setStatusMessage('Cost price adjusted successfully.');
    setCostForm(emptyCostForm);
  };

  const filteredInventoryForCost = inventory.filter((item) => {
    if (!costQuery.trim()) return true;
    const haystack = [item.name, item.brand, item.model].join(' ').toLowerCase();
    return haystack.includes(costQuery.toLowerCase());
  });

  const handleAdminSubmit = async (event) => {
    event.preventDefault();
    const result = await saveAdminSettings(adminForm);

    setSettings(adminForm);
    setStatusMessage(
      result.success
        ? 'Settings saved successfully.'
        : 'Demo mode active. Add Supabase environment variables to store admin settings.'
    );
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();

    const email = (adminLogin.email || '').trim();
    const password = adminLogin.password || '';

    if (!email || !password) {
      setStatusMessage('Enter the admin email and password.');
      return;
    }

    const allowedAdmin = (settings.adminEmail || settings.admin_email || '').trim().toLowerCase();
    const normalizedEmail = email.toLowerCase();

    if (allowedAdmin && normalizedEmail !== allowedAdmin) {
      setStatusMessage(`Only ${allowedAdmin} can access the admin section.`);
      return;
    }

    const result = await loginAdmin(email, password);

    if (result.success) {
      setAdminAuthenticated(true);
      setShowAdminLoginFromGate(false);
      setStatusMessage(`Admin access granted (${result.email}).`);
    } else {
      setAdminAuthenticated(false);
      setStatusMessage(`Login failed: ${result.error || 'Invalid password or email.'}`);
    }
  };

  const persistAllData = (bundle) => {
    setAllInventory(bundle.inventory);
    setAllSales(bundle.sales);
    setAllExpenses(bundle.expenses);
    setAllSuppliers(bundle.suppliers);
    setAllPurchaseOrders(bundle.purchaseOrders);
    setAllStockMovements(bundle.stockMovements);
    saveDemoData({ ...bundle, settings });
  };

  const handleLoadDemoData = () => {
    const shopDemoBundle = buildDemoBundle(settings);
    const belongsToOtherShop = (record) => record.shop !== selectedShop;
    const belongsToThisShop = (record) => record.shop === selectedShop;

    persistAllData({
      inventory: [...allInventory.filter(belongsToOtherShop), ...shopDemoBundle.inventory.filter(belongsToThisShop)],
      sales: [...allSales.filter(belongsToOtherShop), ...shopDemoBundle.sales.filter(belongsToThisShop)],
      expenses: [...allExpenses.filter(belongsToOtherShop), ...shopDemoBundle.expenses.filter(belongsToThisShop)],
      suppliers: [...allSuppliers.filter(belongsToOtherShop), ...shopDemoBundle.suppliers.filter(belongsToThisShop)],
      purchaseOrders: [...allPurchaseOrders.filter(belongsToOtherShop), ...shopDemoBundle.purchaseOrders.filter(belongsToThisShop)],
      stockMovements: [...allStockMovements.filter(belongsToOtherShop), ...shopDemoBundle.stockMovements.filter(belongsToThisShop)],
    });
    setStatusMessage(`Demo data restored for ${getShopName(selectedShop)}.`);
  };

  const handleClearAllData = async () => {
    const shouldClear = window.confirm(`Permanently delete all data for ${getShopName(selectedShop)}? The other shop's data is kept. This cannot be undone.`);
    if (!shouldClear) return;

    if (supabaseEnabled) {
      setStatusMessage(`Clearing ${getShopName(selectedShop)} data from the database...`);
      const res = await clearShopData(selectedShop);
      if (!res.success) {
        setStatusMessage(`Error clearing data in Supabase: ${res.error}`);
        return;
      }
    }

    const belongsToOtherShop = (record) => record.shop !== selectedShop;

    persistAllData({
      inventory: allInventory.filter(belongsToOtherShop),
      sales: allSales.filter(belongsToOtherShop),
      expenses: allExpenses.filter(belongsToOtherShop),
      suppliers: allSuppliers.filter(belongsToOtherShop),
      purchaseOrders: allPurchaseOrders.filter(belongsToOtherShop),
      stockMovements: allStockMovements.filter(belongsToOtherShop),
    });
    setStatusMessage(`All data cleared for ${getShopName(selectedShop)}.`);
  };

  const resizeImageFile = (file, maxWidth = 1000, maxHeight = 1000, quality = 0.85) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        resolve({ blob: file, dataUrl: null });
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ blob: file, dataUrl: canvas.toDataURL('image/jpeg', quality) });
              return;
            }
            const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve({ blob: resizedFile, dataUrl: canvas.toDataURL('image/jpeg', quality) });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve({ blob: file, dataUrl: null });
      img.src = url;
    });
  };

  const processImageFile = async (file) => {
    if (!file) return;

    setUploadingImage(true);
    setStatusMessage('⚡ Resizing & compressing image...');

    const { blob: resizedFile, dataUrl } = await resizeImageFile(file, 1000, 1000, 0.85);

    if (dataUrl) {
      setStockForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    }

    setStatusMessage('Uploading resized image to Supabase...');
    const result = await uploadSparePartImage(resizedFile || file, editingItemId);

    if (result.success && result.url) {
      setStockForm((prev) => ({ ...prev, imageUrl: result.url }));
      setStatusMessage('✓ Resized image uploaded & attached successfully.');
    } else if (dataUrl) {
      setStockForm((prev) => ({ ...prev, imageUrl: dataUrl }));
      setStatusMessage('✓ Resized image attached.');
    } else {
      setStatusMessage('Error uploading image.');
    }
    setUploadingImage(false);
  };

  const handleAutoImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    await processImageFile(file);
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  };

  const handleOpenCamera = async () => {
    setCameraError('');
    setCapturedPhoto(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported on this device or browser.');
      setShowCamera(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setShowCamera(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch (error) {
      setCameraError('Could not access the camera. Check permissions and try again.');
      setShowCamera(true);
    }
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setShowCamera(false);
    setCapturedPhoto(null);
    setCameraError('');
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.92));
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
  };

  const handleUsePhoto = async () => {
    if (!capturedPhoto) return;

    const response = await fetch(capturedPhoto);
    const blob = await response.blob();
    const file = new File([blob], `spare-part-${Date.now()}.jpg`, { type: 'image/jpeg' });

    stopCameraStream();
    setShowCamera(false);
    setCapturedPhoto(null);
    await processImageFile(file);
  };

  const handleAddStock = async (event) => {
    event.preventDefault();

    const imageUrlValue = stockForm.imageUrl?.trim() || '';
    const submittedItem = {
      shop: selectedShop,
      name: stockForm.name.trim(),
      category: stockForm.category,
      brand: stockForm.brand.trim() || 'General',
      model: stockForm.model.trim(),
      side: stockForm.side || 'N/A',
      supplier: stockForm.supplier.trim(),
      imageUrl: imageUrlValue,
      stock: Number(stockForm.stock) || 0,
      cost: Number(stockForm.cost) || 0,
      salePrice: Number(stockForm.salePrice) || 0,
      reorderLevel: Number(stockForm.reorderLevel) || 0,
    };

    if (!submittedItem.name) return;

    let savedItem = { ...submittedItem, id: editingItemId || Date.now() };

    if (supabaseEnabled) {
      const res = await saveSparePart({ id: editingItemId, ...submittedItem });
      if (res.success && res.data) {
        savedItem = res.data;
      } else if (!res.success) {
        setStatusMessage(`Error saving spare part: ${res.error}`);
        return;
      }

      await saveStockMovement({
        shop: selectedShop,
        type: 'Stock In',
        itemName: `${submittedItem.brand} ${submittedItem.name}`,
        quantity: Number(submittedItem.stock),
        date: makeToday(),
        note: editingItemId ? 'Inventory adjusted in admin panel' : 'New stock entry added',
      });
    }

    if (editingItemId) {
      setAllInventory((previous) =>
        previous.map((item) => (String(item.id) === String(editingItemId) ? savedItem : item))
      );
      setStatusMessage('Spare part updated successfully.');
    } else {
      setAllInventory((previous) => [savedItem, ...previous]);
      setStatusMessage('Spare part added successfully.');
    }

    setAllStockMovements((previous) => [
      {
        id: Date.now(),
        shop: selectedShop,
        type: 'Stock In',
        itemName: `${submittedItem.brand} ${submittedItem.name}`,
        quantity: Number(submittedItem.stock),
        date: makeToday(),
        note: editingItemId ? 'Inventory adjusted in admin panel' : 'New stock entry added',
      },
      ...previous,
    ]);

    setStockForm(emptyStockForm);
    setEditingItemId(null);
    setActiveTab('inventory');
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setStockForm({
      name: item.name,
      category: item.category,
      brand: item.brand,
      model: item.model || '',
      side: item.side || 'N/A',
      supplier: item.supplier || '',
      imageUrl: item.imageUrl || '',
      stock: Number(item.stock) || 0,
      cost: Number(item.cost) || 0,
      salePrice: Number(item.salePrice) || 0,
      reorderLevel: Number(item.reorderLevel) || 0,
    });
    setStatusMessage('Editing spare part.');
    setActiveTab('admin');
  };

  const handleDeleteItem = async (itemId) => {
    if (supabaseEnabled) {
      const res = await deleteSparePart(itemId);
      if (!res.success) {
        setStatusMessage(`Error deleting spare part: ${res.error}`);
        return;
      }
    }
    setAllInventory((previous) => previous.filter((item) => String(item.id) !== String(itemId)));
    if (String(editingItemId) === String(itemId)) {
      setEditingItemId(null);
      setStockForm(emptyStockForm);
    }
    setStatusMessage('Spare part deleted successfully.');
  };

  const findItemBySaleLabel = (label) =>
    inventory.find((item) => `${item.brand} ${item.name}` === label) ||
    inventory.find((item) => item.name === label);

  const handleAddSale = async (event) => {
    event.preventDefault();
    const chosenItem = inventory.find((item) => String(item.id) === String(saleForm.itemId));
    if (!chosenItem) return;

    const quantity = Number(saleForm.quantity) || 1;
    const amount = Number(saleForm.amount) || Number(chosenItem.salePrice || 0);
    const unitCost = Number(chosenItem.cost || 0);
    const saleItemName = `${chosenItem.brand} ${chosenItem.name}`;

    const originalSale = editingSaleId ? sales.find((sale) => String(sale.id) === String(editingSaleId)) : null;
    const originalQuantity = originalSale ? (Number(originalSale.quantity) || 1) : 0;
    const originalItem = originalSale ? findItemBySaleLabel(originalSale.item) : null;
    const itemChanged = Boolean(originalItem) && String(originalItem.id) !== String(chosenItem.id);

    let savedSale = {
      id: editingSaleId || Date.now(),
      shop: selectedShop,
      item: saleItemName,
      amount,
      quantity,
      cost: unitCost,
      date: saleForm.date,
    };

    if (supabaseEnabled) {
      const res = await saveSale({ id: editingSaleId, shop: selectedShop, item: saleItemName, amount, quantity, cost: unitCost, date: saleForm.date });
      if (res.success && res.data) {
        savedSale = res.data;
      } else if (!res.success) {
        setStatusMessage(`Error saving sale: ${res.error}`);
        return;
      }

      if (!editingSaleId) {
        const newStock = Math.max(0, Number(chosenItem.stock) - quantity);
        await updateSparePartStock(chosenItem.id, newStock);
        await saveStockMovement({
          shop: selectedShop,
          type: 'Sale',
          itemName: saleItemName,
          quantity: -quantity,
          date: saleForm.date,
          note: 'Customer sale recorded',
        });
      } else if (originalSale) {
        if (itemChanged) {
          if (originalItem) {
            await updateSparePartStock(originalItem.id, Number(originalItem.stock) + originalQuantity);
            await saveStockMovement({
              shop: selectedShop,
              type: 'Stock Adjustment',
              itemName: `${originalItem.brand} ${originalItem.name}`,
              quantity: originalQuantity,
              date: saleForm.date,
              note: 'Sale edited - reassigned to a different part, stock restored',
            });
          }
          await updateSparePartStock(chosenItem.id, Math.max(0, Number(chosenItem.stock) - quantity));
          await saveStockMovement({
            shop: selectedShop,
            type: 'Sale',
            itemName: saleItemName,
            quantity: -quantity,
            date: saleForm.date,
            note: 'Sale edited - reassigned to this part',
          });
        } else {
          const stockDelta = originalQuantity - quantity;
          if (stockDelta !== 0) {
            await updateSparePartStock(chosenItem.id, Math.max(0, Number(chosenItem.stock) + stockDelta));
            await saveStockMovement({
              shop: selectedShop,
              type: 'Stock Adjustment',
              itemName: saleItemName,
              quantity: stockDelta,
              date: saleForm.date,
              note: 'Sale edited - stock reconciled',
            });
          }
        }
      }
    }

    if (editingSaleId) {
      setAllSales((previous) => previous.map((sale) =>
        String(sale.id) === String(editingSaleId) ? savedSale : sale
      ));

      if (originalSale) {
        setAllInventory((previous) => previous.map((item) => {
          if (itemChanged && originalItem && String(item.id) === String(originalItem.id)) {
            return { ...item, stock: Number(item.stock) + originalQuantity };
          }
          if (String(item.id) === String(chosenItem.id)) {
            const stockDelta = itemChanged ? -quantity : (originalQuantity - quantity);
            return { ...item, stock: Math.max(0, Number(item.stock) + stockDelta) };
          }
          return item;
        }));

        const movements = [];
        if (itemChanged) {
          if (originalItem) {
            movements.push({
              id: Date.now(),
              shop: selectedShop,
              type: 'Stock Adjustment',
              itemName: `${originalItem.brand} ${originalItem.name}`,
              quantity: originalQuantity,
              date: saleForm.date,
              note: 'Sale edited - reassigned to a different part, stock restored',
            });
          }
          movements.push({
            id: Date.now() + 1,
            shop: selectedShop,
            type: 'Sale',
            itemName: saleItemName,
            quantity: -quantity,
            date: saleForm.date,
            note: 'Sale edited - reassigned to this part',
          });
        } else {
          const stockDelta = originalQuantity - quantity;
          if (stockDelta !== 0) {
            movements.push({
              id: Date.now(),
              shop: selectedShop,
              type: 'Stock Adjustment',
              itemName: saleItemName,
              quantity: stockDelta,
              date: saleForm.date,
              note: 'Sale edited - stock reconciled',
            });
          }
        }
        if (movements.length) {
          setAllStockMovements((previous) => [...movements, ...previous]);
        }
      }

      setStatusMessage('Sale updated successfully.');
    } else {
      setAllSales((previous) => [savedSale, ...previous]);

      setAllInventory((previous) =>
        previous.map((item) =>
          String(item.id) === String(chosenItem.id)
            ? { ...item, stock: Math.max(0, Number(item.stock) - quantity) }
            : item
        )
      );

      setAllStockMovements((previous) => [
        {
          id: Date.now(),
          shop: selectedShop,
          type: 'Sale',
          itemName: saleItemName,
          quantity: -quantity,
          date: saleForm.date,
          note: 'Customer sale recorded',
        },
        ...previous,
      ]);

      setStatusMessage('Sale recorded successfully.');
    }

    setSaleForm({
      ...emptySaleForm,
      itemId: chosenItem.id,
    });
    setEditingSaleId(null);
    setActiveTab('dashboard');
  };

  const handleAddExpense = async (event) => {
    event.preventDefault();
    const amount = Number(expenseForm.amount) || 0;
    if (!amount || amount <= 0) {
      setStatusMessage('⚠️ Please enter an expense amount greater than 0.');
      return;
    }

    const expenseDate = expenseForm.date || makeToday();

    let savedExpense = {
      id: editingExpenseId || Date.now(),
      shop: selectedShop,
      type: expenseForm.type || 'General Expense',
      amount,
      note: expenseForm.note || 'Manual expense entry',
      date: expenseDate,
    };

    if (supabaseEnabled) {
      const res = await saveExpense({
        id: editingExpenseId,
        shop: selectedShop,
        type: expenseForm.type || 'General Expense',
        amount,
        note: expenseForm.note || 'Manual expense entry',
        date: expenseDate,
      });
      if (res.success && res.data) {
        savedExpense = res.data;
      } else if (!res.success) {
        setStatusMessage(`Error saving expense: ${res.error}`);
        return;
      }
    }

    if (editingExpenseId) {
      setAllExpenses((previous) => previous.map((expense) =>
        String(expense.id) === String(editingExpenseId) ? savedExpense : expense
      ));
      setStatusMessage('✓ Expense updated successfully.');
    } else {
      setAllExpenses((previous) => [savedExpense, ...previous]);
      setStatusMessage('✓ Expense recorded successfully.');
    }

    setExpenseForm({ ...emptyExpenseForm, date: makeToday() });
    setEditingExpenseId(null);
  };

  const handleSupplierSubmit = async (event) => {
    event.preventDefault();
    if (!supplierForm.name.trim()) return;

    let savedSupplier = { ...supplierForm, id: editingSupplierId || Date.now(), shop: selectedShop };

    if (supabaseEnabled) {
      const res = await saveSupplier({ id: editingSupplierId, ...supplierForm, shop: selectedShop });
      if (res.success && res.data) {
        savedSupplier = res.data;
      } else if (!res.success) {
        setStatusMessage(`Error saving supplier: ${res.error}`);
        return;
      }
    }

    if (editingSupplierId) {
      setAllSuppliers((previous) => previous.map((supplier) =>
        String(supplier.id) === String(editingSupplierId) ? savedSupplier : supplier
      ));
      setStatusMessage('Supplier updated successfully.');
    } else {
      setAllSuppliers((previous) => [savedSupplier, ...previous]);
      setStatusMessage('Supplier added successfully.');
    }

    setSupplierForm(emptySupplierForm);
    setEditingSupplierId(null);
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (supabaseEnabled) {
      const res = await deleteSupplier(supplierId);
      if (!res.success) {
        setStatusMessage(`Error deleting supplier: ${res.error}`);
        return;
      }
    }
    setAllSuppliers((previous) => previous.filter((supplier) => String(supplier.id) !== String(supplierId)));
    setStatusMessage('Supplier deleted successfully.');
  };

  const handlePurchaseOrderSubmit = async (event) => {
    event.preventDefault();
    if (!purchaseForm.itemId || !purchaseForm.supplierId) return;

    const item = inventory.find((entry) => String(entry.id) === String(purchaseForm.itemId));
    const supplier = suppliers.find((entry) => String(entry.id) === String(purchaseForm.supplierId));

    const targetOrder = {
      shop: selectedShop,
      supplierId: purchaseForm.supplierId,
      supplierName: supplier ? supplier.name : 'Unknown supplier',
      itemId: purchaseForm.itemId,
      itemName: item ? item.name : 'Unknown item',
      quantity: Number(purchaseForm.quantity) || 0,
      unitCost: Number(purchaseForm.unitCost) || 0,
      orderDate: purchaseForm.orderDate,
      status: purchaseForm.status,
    };

    let savedOrder = { ...targetOrder, id: editingOrderId || Date.now() };

    if (supabaseEnabled) {
      const res = await savePurchaseOrder({ id: editingOrderId, ...targetOrder });
      if (res.success && res.data) {
        savedOrder = res.data;
      } else if (!res.success) {
        setStatusMessage(`Error saving purchase order: ${res.error}`);
        return;
      }

      if (purchaseForm.status === 'Received' && !editingOrderId && item) {
        const newStock = Number(item.stock) + Number(purchaseForm.quantity || 0);
        await updateSparePartStock(item.id, newStock);
        await saveStockMovement({
          shop: selectedShop,
          type: 'Stock In',
          itemName: `${item.brand} ${item.name}`,
          quantity: Number(purchaseForm.quantity) || 0,
          date: purchaseForm.orderDate,
          note: 'Purchase order received',
        });
      }
    }

    setAllPurchaseOrders((previous) => {
      if (editingOrderId) {
        return previous.map((order) => String(order.id) === String(editingOrderId) ? savedOrder : order);
      }
      return [savedOrder, ...previous];
    });

    if (purchaseForm.status === 'Received' && !editingOrderId && item) {
      setAllInventory((previous) => previous.map((entry) =>
        String(entry.id) === String(purchaseForm.itemId)
          ? { ...entry, stock: Number(entry.stock) + Number(purchaseForm.quantity || 0) }
          : entry
      ));

      setAllStockMovements((previous) => [{
        id: Date.now(),
        shop: selectedShop,
        type: 'Stock In',
        itemName: `${item.brand} ${item.name}`,
        quantity: Number(purchaseForm.quantity) || 0,
        date: purchaseForm.orderDate,
        note: 'Purchase order received',
      }, ...previous]);
    }

    setStatusMessage(editingOrderId ? 'Purchase order updated.' : 'Purchase order created.');
    setPurchaseForm(emptyPurchaseForm);
    setEditingOrderId(null);
  };

  const handleDeleteOrder = async (orderId) => {
    if (supabaseEnabled) {
      const res = await deletePurchaseOrder(orderId);
      if (!res.success) {
        setStatusMessage(`Error deleting purchase order: ${res.error}`);
        return;
      }
    }
    setAllPurchaseOrders((previous) => previous.filter((order) => String(order.id) !== String(orderId)));
    setStatusMessage('Purchase order deleted successfully.');
  };

  const handleDeleteSale = async (saleId) => {
    if (supabaseEnabled) {
      const res = await deleteSale(saleId);
      if (!res.success) {
        setStatusMessage(`Error deleting sale: ${res.error}`);
        return;
      }
    }
    setAllSales((previous) => previous.filter((sale) => String(sale.id) !== String(saleId)));
    setStatusMessage('Sale deleted successfully.');
  };

  const handleDeleteExpense = async (expenseId) => {
    if (supabaseEnabled) {
      const res = await deleteExpense(expenseId);
      if (!res.success) {
        setStatusMessage(`Error deleting expense: ${res.error}`);
        return;
      }
    }
    setAllExpenses((previous) => previous.filter((expense) => String(expense.id) !== String(expenseId)));
    setStatusMessage('Expense deleted successfully.');
  };

  const dashboardCards = adminAuthenticated
    ? [
        { label: 'Total Income', value: `KES ${totalSales.toLocaleString()}` },
        { label: 'Cost of Goods Sold', value: `KES ${totalCostOfGoodsSold.toLocaleString()}` },
        { label: 'Liabilities', value: `KES ${totalExpenses.toLocaleString()}` },
        { label: 'Stock Units', value: inventory.reduce((sum, item) => sum + Number(item.stock || 0), 0).toLocaleString() },
        { label: 'Profit / Loss', value: `KES ${profitAndLoss.toLocaleString()}` },
      ]
    : [
        { label: 'Spare Parts Catalog', value: inventory.length.toLocaleString() },
        { label: 'Available Stock Units', value: inventory.reduce((sum, item) => sum + Number(item.stock || 0), 0).toLocaleString() },
      ];

  const adminModuleStats = [
    { label: 'Parts', value: inventory.length },
    { label: 'Suppliers', value: suppliers.length },
    { label: 'Orders', value: purchaseOrders.length },
    { label: 'Sales', value: sales.length },
    { label: 'Expenses', value: expenses.length },
  ];

  const handleAdminLogout = () => {
    setAdminAuthenticated(false);
    setShowAdminLoginFromGate(false);
    handleSwitchShop();
    setStatusMessage('Logged out of Admin mode.');
  };

  if (adminAuthenticated && !selectedShop) {
    return (
      <div className="shop-gate admin-mode">
        {themeToggleButton}
        <div className="shop-gate-card admin-mode">
          <img src={logo} alt={settings.businessName} className="shop-gate-logo admin-mode" />
          <p className="eyebrow">Admin Console</p>
          <h2>Select a shop to manage</h2>
          <p className="shop-gate-subtitle">
            Choose which shop's inventory, sales, and reports you want to work with. You can switch shops anytime from the sidebar.
          </p>
          <div className="shop-options">
            {SHOPS.map((shop) => {
              const theme = getShopTheme(shop.id);
              return (
                <button
                  key={shop.id}
                  type="button"
                  className="shop-option-btn"
                  style={{ '--shop-accent': theme.accent, '--shop-accent-2': theme.accent2, '--shop-soft': theme.soft }}
                  onClick={() => handleSelectShop(shop.id)}
                >
                  <span className="shop-option-icon">{theme.icon}</span>
                  <span className="shop-option-text">
                    <strong>{shop.name}</strong>
                    <small>Manage inventory, sales &amp; reports</small>
                  </span>
                  <span className="shop-option-arrow">→</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="ghost-btn" onClick={handleAdminLogout}>Logout</button>
        </div>
      </div>
    );
  }

  if (!adminAuthenticated && !selectedShop) {
    return (
      <div className="shop-gate">
        {themeToggleButton}
        <div className="shop-gate-card">
          {!showAdminLoginFromGate ? (
            <>
              <img src={logo} alt={settings.businessName} className="shop-gate-logo" />
              <p className="eyebrow">Welcome to</p>
              <h2>{settings.businessName}</h2>
              <p className="shop-gate-subtitle">Select a shop to browse available spare parts and live stock.</p>
              <div className="shop-options">
                {SHOPS.map((shop) => {
                  const theme = getShopTheme(shop.id);
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      className="shop-option-btn"
                      style={{ '--shop-accent': theme.accent, '--shop-accent-2': theme.accent2, '--shop-soft': theme.soft }}
                      onClick={() => handleSelectShop(shop.id)}
                    >
                      <span className="shop-option-icon">{theme.icon}</span>
                      <span className="shop-option-text">
                        <strong>{shop.name}</strong>
                        <small>Browse available stock</small>
                      </span>
                      <span className="shop-option-arrow">→</span>
                    </button>
                  );
                })}
              </div>
              <div className="shop-gate-divider"><span>or</span></div>
              <button type="button" className="ghost-btn shop-gate-admin-link" onClick={() => setShowAdminLoginFromGate(true)}>
                🔒 Admin Login
              </button>
            </>
          ) : (
            <form className="admin-login" onSubmit={handleAdminLogin}>
              <img src={logo} alt={settings.businessName} className="shop-gate-logo" />
              <h3>Admin Access</h3>
              <label>
                Email
                <input
                  type="email"
                  value={adminLogin.email}
                  onChange={(event) => setAdminLogin({ ...adminLogin, email: event.target.value })}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={adminLogin.password}
                  onChange={(event) => setAdminLogin({ ...adminLogin, password: event.target.value })}
                />
              </label>
              <div className="button-row">
                <button type="submit" className="primary-btn">Login</button>
                <button type="button" className="ghost-btn" onClick={() => setShowAdminLoginFromGate(false)}>Back</button>
              </div>
              {statusMessage && <p className="status-message">{statusMessage}</p>}
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {themeToggleButton}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src={logoSquare} alt={settings.businessName} className="brand-mark" />
            <div>
              <p className="eyebrow">AutoSpare Pro</p>
              <h1>{settings.businessName}</h1>
            </div>
          </div>

          <div className="shop-switcher">
            <div className="shop-switcher-label">
              <small>Current shop</small>
              <strong>{getShopTheme(selectedShop).icon} {getShopName(selectedShop)}</strong>
            </div>
            <button type="button" className="ghost-btn small" onClick={handleSwitchShop}>Switch shop</button>
          </div>

          <nav className="nav">
            <p className="nav-section-label">Overview</p>
            <button className={activeTab === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('dashboard')}>
              📊 Dashboard
            </button>
            <button className={activeTab === 'inventory' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('inventory')}>
              📦 Inventory Catalog
            </button>
            <button className={activeTab === 'admin' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('admin')}>
              {adminAuthenticated ? '⚙️ Admin Panel' : '🔒 Admin Login'}
            </button>
          </nav>

          <div className="sidebar-summary">
            {adminAuthenticated && (
              <div className="sidebar-summary-card">
                <small>Total Stock Value</small>
                <strong>KES {inventory.reduce((sum, item) => sum + (Number(item.stock || 0) * Number(item.cost || 0)), 0).toLocaleString()}</strong>
              </div>
            )}
            <div className="sidebar-summary-card">
              <small>Low Stock Alerts</small>
              <strong>{lowStockItems.length}</strong>
            </div>
          </div>
        </div>

        <div className="status-chip">
          <span className={`dot ${supabaseEnabled ? 'online' : 'offline'}`} />
          {supabaseEnabled ? 'Supabase connected' : 'Demo mode'}
        </div>
      </aside>

      <main className="main-panel">
        {activeTab === 'dashboard' && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Overview</p>
                <h2>Autospares Stock Dashboard</h2>
              </div>
              <div className="topbar-actions">
                {adminAuthenticated ? (
                  <>
                    <button type="button" className="pill pill-btn print-btn" onClick={handlePrintProfitLoss}>
                      🖨️ Profit and Loss
                    </button>
                    <button type="button" className="primary-btn small print-btn" onClick={handlePrintFinancialReport}>
                      🖨️ Print Financial Report
                    </button>
                    <button type="button" className="ghost-btn small" onClick={handleAdminLogout}>
                      Logout Admin
                    </button>
                  </>
                ) : (
                  <>
                    <span className="pill">Public Catalog Mode</span>
                    <button type="button" className="primary-btn small" onClick={() => setActiveTab('admin')}>
                      🔒 Admin Login
                    </button>
                  </>
                )}
              </div>
            </header>

            {adminAuthenticated && (
              <section className={`pl-statement ${printScope === 'profit-loss' ? 'pl-statement-active' : ''}`}>
                <h3>{settings.businessName} — Profit &amp; Loss Statement</h3>
                <p className="pl-statement-date">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

                <p className="pl-section-label">Sales Breakdown</p>
                {sales.length > 0 ? (
                  <table className="pl-table pl-line-items">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Item</th>
                        <th className="pl-num">Qty</th>
                        <th className="pl-num">Amount</th>
                        <th className="pl-num">Cost</th>
                        <th className="pl-num">Profit / Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => {
                        const qty = Number(sale.quantity) || 1;
                        const cost = Number(sale.cost || 0) * qty;
                        const amount = Number(sale.amount || 0);
                        const saleProfit = amount - cost;
                        return (
                          <tr key={sale.id}>
                            <td>{sale.date}</td>
                            <td>{sale.item}</td>
                            <td className="pl-num">{qty}</td>
                            <td className="pl-num">KES {amount.toLocaleString()}</td>
                            <td className="pl-num">KES {cost.toLocaleString()}</td>
                            <td className={`pl-num ${saleProfit < 0 ? 'pl-negative' : ''}`}>
                              KES {saleProfit.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="pl-statement-date">No sales recorded yet.</p>
                )}

                <p className="pl-section-label">Summary</p>
                <table className="pl-table">
                  <tbody>
                    <tr>
                      <td>Total Income</td>
                      <td>KES {totalSales.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Cost of Goods Sold</td>
                      <td>KES {totalCostOfGoodsSold.toLocaleString()}</td>
                    </tr>
                    <tr className="pl-subtotal">
                      <td>Gross Profit</td>
                      <td>KES {grossProfit.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Total Expenses / Liabilities</td>
                      <td>KES {totalExpenses.toLocaleString()}</td>
                    </tr>
                    <tr className="pl-total">
                      <td>Net {profitAndLoss >= 0 ? 'Profit' : 'Loss'}</td>
                      <td>KES {Math.abs(profitAndLoss).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            <div className={printScope === 'profit-loss' ? 'print-hide' : ''}>
              <section className="stats-grid">
                {dashboardCards.map((card) => (
                  <article key={card.label} className="stat-card">
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                  </article>
                ))}
              </section>

              {adminAuthenticated ? (
                <section className="content-grid">
                  <div className="panel">
                    <h3>Sales Summary</h3>
                    <ul className="list">
                      {sales.map((sale) => (
                        <li key={sale.id}>
                          <span>{sale.item}</span>
                          <strong>KES {Number(sale.amount).toLocaleString()}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="panel">
                    <h3>Liabilities / Expenses</h3>
                    <ul className="list">
                      {expenses.map((expense) => (
                        <li key={expense.id}>
                          <span>{expense.type}</span>
                          <strong>KES {Number(expense.amount).toLocaleString()}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ) : (
                <section className="content-grid">
                  <div className="panel" style={{ gridColumn: '1 / -1' }}>
                    <h3>Welcome to {settings.businessName}</h3>
                    <p style={{ color: '#64748b' }}>
                      Browse our full inventory of quality vehicle spare parts. Select a category below or search by part name, brand, or model to check live prices and stock availability.
                    </p>
                  </div>
                </section>
              )}
            </div>
          </>
        )}

        {activeTab === 'inventory' && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Stock</p>
                <h2>Spare Part Inventory</h2>
              </div>
              <div className="topbar-actions">
                {adminAuthenticated && (
                  <button type="button" className="primary-btn small print-btn" onClick={() => window.print()}>
                    🖨️ Print Inventory Report
                  </button>
                )}
              </div>
            </header>

            <div className="toolbar">
              {categories.map((category) => (
                <button
                  key={category}
                  className={selectedCategory === category ? 'chip active' : 'chip'}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="search-box">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by brand, model, or part name"
              />
            </div>

            <section className="inventory-grid">
              {filteredInventory.length > 0 ? paginatedInventory.map((item) => {
                const isLow = Number(item.stock) <= Number(item.reorderLevel || settings.minimumStockAlert);
                const hasImage = item.imageUrl && item.imageUrl.trim().length > 0;
                const fallbackImage = 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=900&q=80';
                return (
                  <article 
                    key={item.id} 
                    className={`inventory-card ${isLow ? 'warning' : ''}`}
                    title={hasImage ? `Image URL: ${item.imageUrl}` : 'No custom image URL stored'}
                  >
                    <div 
                      className="part-image-container"
                      onClick={() => setZoomedImage({ url: hasImage ? item.imageUrl : fallbackImage, title: `${item.brand} ${item.name}` })}
                      style={{ cursor: 'zoom-in' }}
                      title="Click to expand & view full-size image"
                    >
                      <img
                        src={hasImage ? item.imageUrl : fallbackImage}
                        alt={item.name}
                        className="part-image"
                        onError={(e) => {
                          e.target.src = fallbackImage;
                        }}
                      />
                      {hasImage && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: '#6b9e5f',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                        }}>
                          ✓ Custom
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                      }}>
                        🔍 Zoom
                      </div>
                    </div>
                    <div className="card-head">
                      <span>{item.category}</span>
                      <span className="brand">{item.brand}</span>
                    </div>
                    <h3>
                      {item.name}
                      {item.side && item.side !== 'N/A' && (
                        <span className={`side-badge side-${item.side.toLowerCase()}`}>{item.side}</span>
                      )}
                    </h3>
                    <p>{item.model}</p>
                    <div className="supplier-line">Supplier: {item.supplier || 'N/A'}</div>
                    <div className="metrics" style={{ gridTemplateColumns: adminAuthenticated ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))' }}>
                      <div>
                        <small>Stock</small>
                        <strong>{item.stock}</strong>
                      </div>
                      {adminAuthenticated && (
                        <div>
                          <small>Cost</small>
                          <strong>KES {Number(item.cost).toLocaleString()}</strong>
                        </div>
                      )}
                      <div>
                        <small>Selling Price</small>
                        <strong>KES {Number(item.salePrice).toLocaleString()}</strong>
                      </div>
                    </div>
                    <div className="reorder-note">
                      {isLow ? 'Low stock - reorder required' : 'Stock level healthy'}
                    </div>
                    {adminAuthenticated && (
                      <div className="mini-actions" style={{ marginTop: '10px' }}>
                        <button type="button" className="ghost-btn small" onClick={() => handleEditItem(item)}>Edit</button>
                        <button type="button" className="danger-btn small" onClick={() => handleDeleteItem(item.id)}>Delete</button>
                      </div>
                    )}
                  </article>
                );
              }) : <p className="empty-state">No parts match your search.</p>}
            </section>

            {filteredInventory.length > INVENTORY_PAGE_SIZE && (
              <nav className="pagination" aria-label="Inventory pages">
                <button
                  type="button"
                  className="ghost-btn small"
                  onClick={() => setInventoryPage((page) => Math.max(1, page - 1))}
                  disabled={inventoryPage === 1}
                >
                  ← Prev
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: inventoryTotalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={page === inventoryPage ? 'pagination-page active' : 'pagination-page'}
                      onClick={() => setInventoryPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="ghost-btn small"
                  onClick={() => setInventoryPage((page) => Math.min(inventoryTotalPages, page + 1))}
                  disabled={inventoryPage === inventoryTotalPages}
                >
                  Next →
                </button>
                <span className="pagination-summary">
                  Showing {(inventoryPage - 1) * INVENTORY_PAGE_SIZE + 1}
                  –{Math.min(inventoryPage * INVENTORY_PAGE_SIZE, filteredInventory.length)} of {filteredInventory.length} parts
                </span>
              </nav>
            )}
          </>
        )}

        {activeTab === 'admin' && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Configuration</p>
                <h2>Admin Panel</h2>
              </div>
            </header>

            {!adminAuthenticated ? (
              <form className="admin-login" onSubmit={handleAdminLogin}>
                <h3>Admin Access</h3>
                <label>
                  Email
                  <input
                    type="email"
                    value={adminLogin.email}
                    onChange={(event) => setAdminLogin({ ...adminLogin, email: event.target.value })}
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={adminLogin.password}
                    onChange={(event) => setAdminLogin({ ...adminLogin, password: event.target.value })}
                  />
                </label>
                <button type="submit" className="primary-btn">Login</button>
                {statusMessage && <p className="status-message">{statusMessage}</p>}
              </form>
            ) : (
              <>
              <div className={printScope === 'sale-profit-loss' ? 'print-hide' : ''}>
              <section className="admin-layout">
                <div className="admin-module-nav" aria-label="Admin modules">
                  {[
                    { key: 'stock', icon: '🧩', label: 'Add Spare Part' },
                    { key: 'cost', icon: '💵', label: 'Adjust Cost Price' },
                    { key: 'supplier', icon: '🏢', label: 'Add Supplier' },
                    { key: 'order', icon: '📦', label: 'Add Purchase Order' },
                    { key: 'sale', icon: '💰', label: 'Add Sale' },
                    { key: 'expense', icon: '🧾', label: 'Add Expense' },
                    { key: 'data', icon: '🗂️', label: 'Data' },
                    { key: 'settings', icon: '⚙️', label: 'Settings' },
                  ].map((module) => (
                    <button
                      key={module.key}
                      type="button"
                      className={adminSection === module.key ? 'module-btn active' : 'module-btn'}
                      onClick={() => setAdminSection(module.key)}
                    >
                      <span className="module-icon">{module.icon}</span>
                      {module.label}
                    </button>
                  ))}
                </div>

                <div className="admin-summary-row">
                  {adminModuleStats.map((item) => (
                    <div key={item.label} className="admin-summary-card">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>

                {adminSection === 'stock' && (
                  <>
                    <form className="entry-form" onSubmit={handleAddStock}>
                      <h3>{editingItemId ? 'Edit Spare Part' : 'Add Spare Part'}</h3>
                      <label>
                        Spare part name
                        <input
                          value={stockForm.name}
                          onChange={(event) => setStockForm({ ...stockForm, name: event.target.value })}
                        />
                      </label>
                      <label>
                        Category
                        <select
                          value={stockForm.category}
                          onChange={(event) => setStockForm({ ...stockForm, category: event.target.value })}
                        >
                          {categories.filter((item) => item !== 'All').map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Brand
                        <input
                          value={stockForm.brand}
                          onChange={(event) => setStockForm({ ...stockForm, brand: event.target.value })}
                        />
                      </label>
                      <label>
                        Model
                        <input
                          value={stockForm.model}
                          onChange={(event) => setStockForm({ ...stockForm, model: event.target.value })}
                        />
                      </label>
                      <label>
                        Side (for parts like mirrors, headlights, doors)
                        <select
                          value={stockForm.side}
                          onChange={(event) => setStockForm({ ...stockForm, side: event.target.value })}
                        >
                          {PART_SIDES.map((side) => (
                            <option key={side} value={side}>{side}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Supplier
                        <input
                          value={stockForm.supplier}
                          onChange={(event) => setStockForm({ ...stockForm, supplier: event.target.value })}
                        />
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', margin: '12px 0' }}>
                        <div className="file-upload-box" style={{
                          background: '#f8fafc',
                          border: '2px dashed #cbd5e1',
                          borderRadius: '12px',
                          padding: '16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}>
                          <label style={{ cursor: 'pointer', display: 'block' }}>
                            <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>📷</div>
                            <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>
                              Choose from gallery
                            </strong>
                            <small style={{ display: 'block', color: '#64748b', marginTop: '2px' }}>
                              Uploads & attaches automatically
                            </small>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAutoImageUpload}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenCamera}
                          className="file-upload-box"
                          style={{
                            background: '#eef1f6',
                            border: '2px dashed #334155',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            font: 'inherit',
                          }}
                        >
                          <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>📸</div>
                          <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>
                            Take a photo
                          </strong>
                          <small style={{ display: 'block', color: '#64748b', marginTop: '2px' }}>
                            Use your camera live
                          </small>
                        </button>
                      </div>

                      {uploadingImage && (
                        <div style={{ color: '#0284c7', fontWeight: 'bold', margin: '8px 0', fontSize: '0.85rem', textAlign: 'center' }}>
                          ⏳ Uploading image from device...
                        </div>
                      )}

                      {stockForm.imageUrl && (
                        <div className="image-preview-wrapper" style={{ margin: '10px 0', textAlign: 'center' }}>
                          <span className="image-preview-label">Image attached</span>
                          <img 
                            src={stockForm.imageUrl} 
                            alt="Preview" 
                            className="image-preview"
                            style={{ maxHeight: '160px', width: 'auto', borderRadius: '8px', objectFit: 'cover', display: 'block', margin: '8px auto 0' }}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5ddd5" width="200" height="200"/%3E%3Ctext x="50%" y="50%" font-size="16" fill="%236b7280" text-anchor="middle" dy=".3em"%3EImage failed to load%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      )}

                      <details style={{ margin: '8px 0', color: '#64748b', fontSize: '0.8rem' }}>
                        <summary style={{ cursor: 'pointer' }}>Advanced: Paste Image URL directly</summary>
                        <input
                          value={stockForm.imageUrl}
                          onChange={(event) => setStockForm({ ...stockForm, imageUrl: event.target.value })}
                          placeholder="https://example.com/image.jpg"
                          style={{ marginTop: '6px', width: '100%' }}
                        />
                      </details>
                      <div className="double-field">
                        <label>
                          Quantity
                          <input
                            type="number"
                            min="1"
                            value={stockForm.stock}
                            onChange={(event) => setStockForm({ ...stockForm, stock: Number(event.target.value) || 0 })}
                          />
                        </label>
                        <label>
                          Reorder level
                          <input
                            type="number"
                            min="0"
                            value={stockForm.reorderLevel}
                            onChange={(event) => setStockForm({ ...stockForm, reorderLevel: Number(event.target.value) || 0 })}
                          />
                        </label>
                      </div>
                      <div className="double-field">
                        <label>
                          Cost price
                          <input
                            type="number"
                            min="0"
                            value={stockForm.cost}
                            onChange={(event) => setStockForm({ ...stockForm, cost: Number(event.target.value) || 0 })}
                          />
                        </label>
                        <label>
                          Sale price
                          <input
                            type="number"
                            min="0"
                            value={stockForm.salePrice}
                            onChange={(event) => setStockForm({ ...stockForm, salePrice: Number(event.target.value) || 0 })}
                          />
                        </label>
                      </div>

                      <div style={{
                        background: stockForm.imageUrl?.trim() ? '#eef1f6' : '#fee2e2',
                        border: `1px solid ${stockForm.imageUrl?.trim() ? '#334155' : '#dc2626'}`,
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '12px',
                        fontSize: '0.9rem',
                      }}>
                        {stockForm.imageUrl?.trim() ? (
                          <>
                            <strong style={{ color: '#334155' }}>✓ Image URL ready</strong>
                            <small style={{ display: 'block', color: '#6b7280', marginTop: '4px' }}>
                              {stockForm.imageUrl.substring(0, 60)}...
                            </small>
                          </>
                        ) : (
                          <>
                            <strong style={{ color: '#991b1b' }}>⚠️ No image URL</strong>
                            <small style={{ display: 'block', color: '#6b7280', marginTop: '4px' }}>
                              Image URL field is empty. You'll be warned before saving.
                            </small>
                          </>
                        )}
                      </div>

                      <div className="button-row">
                        <button type="submit" className="primary-btn">
                          {editingItemId ? 'Save changes' : 'Add spare part'}
                        </button>
                        {editingItemId && (
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => {
                              setEditingItemId(null);
                              setStockForm(emptyStockForm);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    <div className="panel inventory-manager">
                      <h3>Stock Movement History</h3>
                      <ul className="list compact-list">
                        {stockMovements.map((movement) => (
                          <li key={movement.id}>
                            <span>{movement.itemName} • {movement.type}</span>
                            <strong>{movement.quantity}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {adminSection === 'cost' && (
                  <div className="panel inventory-manager">
                    <h3>Adjust Cost Price</h3>
                    <form className="mini-form" onSubmit={handleAdjustCost}>
                      <label>
                        Select spare part
                        <select
                          value={costForm.itemId}
                          onChange={(event) => {
                            const selectedItem = inventory.find((i) => String(i.id) === event.target.value);
                            setCostForm({
                              itemId: event.target.value,
                              newCost: selectedItem?.cost || 0,
                              newSalePrice: selectedItem?.salePrice || 0,
                            });
                          }}
                        >
                          <option value="">Select part</option>
                          {inventory.map((item) => (
                            <option key={item.id} value={item.id}>{item.brand} {item.name}{item.side && item.side !== 'N/A' ? ` (${item.side})` : ''}</option>
                          ))}
                        </select>
                      </label>
                      <div className="double-field">
                        <label>
                          New cost price
                          <input
                            type="number"
                            min="0"
                            value={costForm.newCost}
                            onChange={(event) => setCostForm({ ...costForm, newCost: Number(event.target.value) || 0 })}
                          />
                        </label>
                        <label>
                          New sale price
                          <input
                            type="number"
                            min="0"
                            value={costForm.newSalePrice}
                            onChange={(event) => setCostForm({ ...costForm, newSalePrice: Number(event.target.value) || 0 })}
                          />
                        </label>
                      </div>
                      <button type="submit" className="primary-btn">Adjust prices</button>
                    </form>

                    <div className="search-box small-search">
                      <input
                        type="text"
                        value={costQuery}
                        onChange={(event) => setCostQuery(event.target.value)}
                        placeholder="Search parts"
                      />
                    </div>

                    <ul className="list compact-list manager-list">
                      {filteredInventoryForCost.map((item) => (
                        <li key={item.id}>
                          <div>
                            <span>{item.brand} {item.name}{item.side && item.side !== 'N/A' ? ` (${item.side})` : ''}</span>
                            <small>{item.category}</small>
                          </div>
                          <div className="mini-actions">
                            <div className="price-display">
                              <span>Cost: KES {Number(item.cost).toLocaleString()}</span>
                              <span>Sale: KES {Number(item.salePrice).toLocaleString()}</span>
                            </div>
                            <button
                              type="button"
                              className="ghost-btn small"
                              onClick={() => {
                                setCostForm({
                                  itemId: item.id,
                                  newCost: item.cost,
                                  newSalePrice: item.salePrice,
                                });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="danger-btn small"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {adminSection === 'supplier' && (
                  <div className="panel inventory-manager">
                    <h3>{editingSupplierId ? 'Edit Supplier' : 'Add Supplier'}</h3>
                    <form className="mini-form" onSubmit={handleSupplierSubmit}>
                      <label>
                        Supplier name
                        <input
                          value={supplierForm.name}
                          onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })}
                        />
                      </label>
                      <label>
                        Contact person
                        <input
                          value={supplierForm.contact}
                          onChange={(event) => setSupplierForm({ ...supplierForm, contact: event.target.value })}
                        />
                      </label>
                      <label>
                        Phone
                        <input
                          value={supplierForm.phone}
                          onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })}
                        />
                      </label>
                      <label>
                        Email
                        <input
                          value={supplierForm.email}
                          onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })}
                        />
                      </label>
                      <div className="button-row">
                        <button type="submit" className="primary-btn">{editingSupplierId ? 'Save supplier' : 'Add supplier'}</button>
                        {editingSupplierId && (
                          <button type="button" className="ghost-btn" onClick={() => { setEditingSupplierId(null); setSupplierForm(emptySupplierForm); }}>Cancel</button>
                        )}
                      </div>
                    </form>

                    <div className="search-box small-search">
                      <input
                        type="text"
                        value={supplierQuery}
                        onChange={(event) => setSupplierQuery(event.target.value)}
                        placeholder="Search suppliers"
                      />
                    </div>

                    <ul className="list compact-list manager-list">
                      {filteredSuppliers.map((supplier) => (
                        <li key={supplier.id}>
                          <div>
                            <span>{supplier.name}</span>
                            <small>{supplier.phone || supplier.email || 'No phone'}</small>
                          </div>
                          <div className="mini-actions">
                            <button type="button" className="ghost-btn small" onClick={() => { setEditingSupplierId(supplier.id); setSupplierForm(supplier); }}>Edit</button>
                            <button type="button" className="danger-btn small" onClick={() => handleDeleteSupplier(supplier.id)}>Delete</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {adminSection === 'order' && (
                  <div className="panel inventory-manager">
                    <h3>{editingOrderId ? 'Edit Purchase Order' : 'Add Purchase Order'}</h3>
                    <form className="mini-form" onSubmit={handlePurchaseOrderSubmit}>
                      <label>
                        Supplier
                        <select
                          value={purchaseForm.supplierId}
                          onChange={(event) => setPurchaseForm({ ...purchaseForm, supplierId: event.target.value })}
                        >
                          <option value="">Select supplier</option>
                          {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Part
                        <select
                          value={purchaseForm.itemId}
                          onChange={(event) => setPurchaseForm({ ...purchaseForm, itemId: event.target.value })}
                        >
                          <option value="">Select part</option>
                          {inventory.map((item) => (
                            <option key={item.id} value={item.id}>{item.brand} {item.name}{item.side && item.side !== 'N/A' ? ` (${item.side})` : ''}</option>
                          ))}
                        </select>
                      </label>
                      <div className="double-field">
                        <label>
                          Quantity
                          <input
                            type="number"
                            min="1"
                            value={purchaseForm.quantity}
                            onChange={(event) => setPurchaseForm({ ...purchaseForm, quantity: Number(event.target.value) || 1 })}
                          />
                        </label>
                        <label>
                          Unit cost
                          <input
                            type="number"
                            min="0"
                            value={purchaseForm.unitCost}
                            onChange={(event) => setPurchaseForm({ ...purchaseForm, unitCost: Number(event.target.value) || 0 })}
                          />
                        </label>
                      </div>
                      <label>
                        Order date
                        <input
                          type="date"
                          value={purchaseForm.orderDate}
                          onChange={(event) => setPurchaseForm({ ...purchaseForm, orderDate: event.target.value })}
                        />
                      </label>
                      <label>
                        Status
                        <select
                          value={purchaseForm.status}
                          onChange={(event) => setPurchaseForm({ ...purchaseForm, status: event.target.value })}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Received">Received</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </label>
                      <div className="button-row">
                        <button type="submit" className="primary-btn">{editingOrderId ? 'Save order' : 'Create purchase order'}</button>
                        {editingOrderId && (
                          <button type="button" className="ghost-btn" onClick={() => { setEditingOrderId(null); setPurchaseForm(emptyPurchaseForm); }}>Cancel</button>
                        )}
                      </div>
                    </form>

                    <div className="search-box small-search">
                      <input
                        type="text"
                        value={orderQuery}
                        onChange={(event) => setOrderQuery(event.target.value)}
                        placeholder="Search orders"
                      />
                    </div>

                    <ul className="list compact-list manager-list">
                      {filteredPurchaseOrders.map((order) => (
                        <li key={order.id}>
                          <div>
                            <span>{order.itemName}</span>
                            <small>{order.supplierName} • {order.status}</small>
                          </div>
                          <div className="mini-actions">
                            <button type="button" className="ghost-btn small" onClick={() => { setEditingOrderId(order.id); setPurchaseForm({ ...order, supplierId: order.supplierId, itemId: order.itemId }); }}>Edit</button>
                            <button type="button" className="danger-btn small" onClick={() => handleDeleteOrder(order.id)}>Delete</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {adminSection === 'sale' && (
                  <>
                    <form className="entry-form" onSubmit={handleAddSale}>
                      <h3>{editingSaleId ? 'Edit Sale' : 'Add Sale'}</h3>
                      <label>
                        Spare part
                        <select
                          value={saleForm.itemId}
                          onChange={(event) => setSaleForm({ ...saleForm, itemId: event.target.value })}
                        >
                          <option value="">Select spare part</option>
                          {inventory.map((item) => (
                            <option key={item.id} value={item.id}>{item.brand} {item.name}{item.side && item.side !== 'N/A' ? ` (${item.side})` : ''}</option>
                          ))}
                        </select>
                      </label>
                      <div className="double-field">
                        <label>
                          Quantity
                          <input
                            type="number"
                            min="1"
                            value={saleForm.quantity}
                            onChange={(event) => setSaleForm({ ...saleForm, quantity: Number(event.target.value) || 1 })}
                          />
                        </label>
                        <label>
                          Sale amount
                          <input
                            type="number"
                            min="0"
                            value={saleForm.amount}
                            onChange={(event) => setSaleForm({ ...saleForm, amount: Number(event.target.value) || '' })}
                          />
                        </label>
                      </div>
                      <label>
                        Sale date
                        <input
                          type="date"
                          value={saleForm.date}
                          onChange={(event) => setSaleForm({ ...saleForm, date: event.target.value })}
                        />
                      </label>
                      <div className="button-row">
                        <button type="submit" className="primary-btn">{editingSaleId ? 'Save sale' : 'Record sale'}</button>
                        {editingSaleId && (
                          <button type="button" className="ghost-btn" onClick={() => { setEditingSaleId(null); setSaleForm(emptySaleForm); }}>Cancel</button>
                        )}
                      </div>
                    </form>

                    <div className="panel inventory-manager">
                      <h3>Recent Sales</h3>
                      <div className="search-box small-search">
                        <input
                          type="text"
                          value={saleQuery}
                          onChange={(event) => setSaleQuery(event.target.value)}
                          placeholder="Search sales"
                        />
                      </div>
                      <ul className="list compact-list manager-list">
                        {filteredSales.map((sale) => (
                          <li key={sale.id}>
                            <div>
                              <span>{sale.item}</span>
                              <small>{sale.date}</small>
                            </div>
                            <div className="mini-actions">
                              <strong>KES {Number(sale.amount).toLocaleString()}</strong>
                              <button type="button" className="ghost-btn small" onClick={() => handlePrintSaleProfitLoss(sale)}>🖨️ P&amp;L</button>
                              <button type="button" className="ghost-btn small" onClick={() => { setEditingSaleId(sale.id); setSaleForm({ itemId: inventory.find((item) => item.name === sale.item.split(' ').slice(1).join(' ') || item.name === sale.item)?.id || '', quantity: Number(sale.quantity) || 1, amount: sale.amount, date: sale.date }); }}>Edit</button>
                              <button type="button" className="danger-btn small" onClick={() => handleDeleteSale(sale.id)}>Delete</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {adminSection === 'expense' && (
                  <>
                    <form className="entry-form" onSubmit={handleAddExpense}>
                      <h3>{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h3>
                      <label>
                        Expense type
                        <select
                          value={expenseForm.type}
                          onChange={(event) => setExpenseForm({ ...expenseForm, type: event.target.value })}
                        >
                          {expenseTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Amount
                        <input
                          type="number"
                          min="0"
                          value={expenseForm.amount}
                          onChange={(event) => setExpenseForm({ ...expenseForm, amount: Number(event.target.value) || '' })}
                        />
                      </label>
                      <label>
                        Note
                        <input
                          value={expenseForm.note}
                          onChange={(event) => setExpenseForm({ ...expenseForm, note: event.target.value })}
                        />
                      </label>
                      <label>
                        Date
                        <input
                          type="date"
                          value={expenseForm.date}
                          onChange={(event) => setExpenseForm({ ...expenseForm, date: event.target.value })}
                        />
                      </label>
                      <div className="button-row">
                        <button type="submit" className="primary-btn">{editingExpenseId ? 'Save expense' : 'Record expense'}</button>
                        {editingExpenseId && (
                          <button type="button" className="ghost-btn" onClick={() => { setEditingExpenseId(null); setExpenseForm(emptyExpenseForm); }}>Cancel</button>
                        )}
                      </div>
                      {statusMessage && <p className="status-message">{statusMessage}</p>}
                    </form>

                    <div className="panel inventory-manager">
                      <h3>Recent Expenses</h3>
                      <div className="search-box small-search">
                        <input
                          type="text"
                          value={expenseQuery}
                          onChange={(event) => setExpenseQuery(event.target.value)}
                          placeholder="Search expenses"
                        />
                      </div>
                      <ul className="list compact-list manager-list">
                        {filteredExpenses.map((expense) => (
                          <li key={expense.id}>
                            <div>
                              <span>{expense.type}</span>
                              <small>{expense.note || 'Manual entry'}</small>
                            </div>
                            <div className="mini-actions">
                              <strong>KES {Number(expense.amount).toLocaleString()}</strong>
                              <button type="button" className="ghost-btn small" onClick={() => { setEditingExpenseId(expense.id); setExpenseForm({ type: expense.type, amount: expense.amount, note: expense.note, date: expense.date || makeToday() }); }}>Edit</button>
                              <button type="button" className="danger-btn small" onClick={() => handleDeleteExpense(expense.id)}>Delete</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {adminSection === 'data' && (
                  <div className="panel inventory-manager">
                    <h3>Demo Data Controls</h3>
                    <p className="status-message">
                      Use these buttons to wipe everything and start fresh, or reload the default starter stock list.
                    </p>
                    <div className="button-row">
                      <button type="button" className="danger-btn" onClick={handleClearAllData}>Clear all data</button>
                      <button type="button" className="primary-btn" onClick={handleLoadDemoData}>Load demo data</button>
                    </div>
                  </div>
                )}

                {adminSection === 'settings' && (
                  <form className="admin-form" onSubmit={handleAdminSubmit}>
                    <h3>Required Settings</h3>
                    <label>
                      Business name
                      <input
                        value={adminForm.businessName || ''}
                        onChange={(event) => setAdminForm({ ...adminForm, businessName: event.target.value })}
                      />
                    </label>

                    <label>
                      Currency
                      <input
                        value={adminForm.currency || ''}
                        onChange={(event) => setAdminForm({ ...adminForm, currency: event.target.value })}
                      />
                    </label>

                    <label>
                      Delivery allowance
                      <input
                        type="number"
                        value={adminForm.deliveryAllowance || 0}
                        onChange={(event) => setAdminForm({ ...adminForm, deliveryAllowance: Number(event.target.value) })}
                      />
                    </label>

                    <label>
                      Installation fee
                      <input
                        type="number"
                        value={adminForm.installationFee || 0}
                        onChange={(event) => setAdminForm({ ...adminForm, installationFee: Number(event.target.value) })}
                      />
                    </label>

                    <label>
                      Minimum stock alert
                      <input
                        type="number"
                        value={adminForm.minimumStockAlert || 0}
                        onChange={(event) => setAdminForm({ ...adminForm, minimumStockAlert: Number(event.target.value) })}
                      />
                    </label>

                    <label>
                      Allowed admin email
                      <input
                        type="email"
                        value={adminForm.adminEmail || ''}
                        onChange={(event) => setAdminForm({ ...adminForm, adminEmail: event.target.value })}
                      />
                    </label>

                    <label>
                      Supabase storage bucket
                      <input
                        value={adminForm.storageBucket || adminForm.firebaseBucket || ''}
                        onChange={(event) => setAdminForm({ ...adminForm, storageBucket: event.target.value, firebaseBucket: event.target.value })}
                      />
                    </label>

                    <button type="submit" className="primary-btn">Save settings</button>
                    {statusMessage && <p className="status-message">{statusMessage}</p>}
                  </form>
                )}
              </section>
              </div>

              {saleToPrint && (
                <section className={`pl-statement ${printScope === 'sale-profit-loss' ? 'pl-statement-active' : ''}`}>
                  <h3>{settings.businessName} — Sale Profit &amp; Loss</h3>
                  <p className="pl-statement-date">{saleToPrint.item} · {saleToPrint.date}</p>
                  <table className="pl-table">
                    <tbody>
                      <tr>
                        <td>Item</td>
                        <td>{saleToPrint.item}</td>
                      </tr>
                      <tr>
                        <td>Quantity sold</td>
                        <td>{Number(saleToPrint.quantity) || 1}</td>
                      </tr>
                      <tr>
                        <td>Sale Amount</td>
                        <td>KES {Number(saleToPrint.amount).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Cost of Goods Sold ({Number(saleToPrint.quantity) || 1} × KES {Number(saleToPrint.cost || 0).toLocaleString()})</td>
                        <td>KES {(Number(saleToPrint.cost || 0) * (Number(saleToPrint.quantity) || 1)).toLocaleString()}</td>
                      </tr>
                      {(() => {
                        const saleProfit = Number(saleToPrint.amount || 0) - (Number(saleToPrint.cost || 0) * (Number(saleToPrint.quantity) || 1));
                        return (
                          <tr className="pl-total">
                            <td>Net {saleProfit >= 0 ? 'Profit' : 'Loss'}</td>
                            <td>KES {Math.abs(saleProfit).toLocaleString()}</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </section>
              )}
              </>
            )}
          </>
        )}
      </main>

      {showCamera && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '520px',
            background: '#111827',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              color: 'white',
            }}>
              <strong>📸 Take a photo</strong>
              <button
                type="button"
                onClick={handleCloseCamera}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </button>
            </div>

            {cameraError ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#fecaca' }}>
                {cameraError}
              </div>
            ) : (
              <div style={{ position: 'relative', background: 'black', aspectRatio: '4 / 3' }}>
                {capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Captured spare part"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', padding: '16px 18px', justifyContent: 'center' }}>
              {cameraError ? (
                <button type="button" className="ghost-btn" onClick={handleCloseCamera}>Close</button>
              ) : capturedPhoto ? (
                <>
                  <button type="button" className="ghost-btn" onClick={handleRetakePhoto}>Retake</button>
                  <button type="button" className="primary-btn" onClick={handleUsePhoto}>Use this photo</button>
                </>
              ) : (
                <button type="button" className="primary-btn" onClick={handleCapturePhoto}>
                  ⚪ Capture
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div 
          className="image-lightbox-overlay"
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img 
              src={zoomedImage.url} 
              alt={zoomedImage.title}
              style={{
                maxWidth: '100%',
                maxHeight: '82vh',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                objectFit: 'contain',
                background: 'white',
              }}
            />
            <div style={{
              marginTop: '12px',
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.1rem',
            }}>
              {zoomedImage.title}
            </div>
            <button 
              type="button" 
              onClick={() => setZoomedImage(null)}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
