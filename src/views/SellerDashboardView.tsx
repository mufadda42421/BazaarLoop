import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { api } from '../services/api';
import { SafeImage } from '../components/SafeImage';
import {
  Package,
  PlusCircle,
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
  Edit,
  Trash2,
  Copy,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Ban,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Truck
} from 'lucide-react';
import { BizManagerPortal } from '../components/BizManagerPortal';

interface SellerDashboardViewProps {
  onNavigate: (view: string, param?: string) => void;
  initialSection?: string;
}

const LOW_STOCK_STORAGE_KEY = 'bazaarloop_seller_low_stock_threshold';

export const SellerDashboardView: React.FC<SellerDashboardViewProps> = ({ onNavigate, initialSection }) => {
  const { user } = useAuth();

  const [section, setSection] = useState<'inventory' | 'bizmanager'>(
    initialSection === 'bizmanager' ? 'bizmanager' : 'inventory'
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'active' | 'low_stock' | 'out_of_stock' | 'paused' | 'draft'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // User-defined Low Stock Threshold (default 5)
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(LOW_STOCK_STORAGE_KEY);
      return stored ? Math.max(1, parseInt(stored, 10) || 5) : 5;
    } catch {
      return 5;
    }
  });
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  const handleUpdateThreshold = (val: number) => {
    const clean = Math.max(1, Math.min(100, val || 5));
    setLowStockThreshold(clean);
    try {
      localStorage.setItem(LOW_STOCK_STORAGE_KEY, String(clean));
    } catch {}
  };

  useEffect(() => {
    if (initialSection === 'bizmanager') {
      setSection('bizmanager');
    }
  }, [initialSection]);

  // Restock modal state
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [newStockQty, setNewStockQty] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSellerListings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.getProducts({ sellerId: user.id, status: 'all' });
      setProducts(res.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerListings();
  }, [user]);

  // Derived real stats
  const totalViews = products.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
  const totalSaves = products.reduce((sum, p) => sum + (p.savesCount || 0), 0);
  const totalInquiries = products.reduce((sum, p) => sum + (p.inquiriesCount || 0), 0);
  const outOfStockCount = products.filter(p => p.quantity === 0 || p.status === 'out_of_stock').length;
  const lowStockCount = products.filter(
    p => p.status === 'active' && p.quantity > 0 && p.quantity <= lowStockThreshold
  ).length;

  const filteredProducts = products.filter(p => {
    if (tab === 'all') return true;
    if (tab === 'out_of_stock') return p.quantity === 0 || p.status === 'out_of_stock';
    if (tab === 'low_stock') return p.status === 'active' && p.quantity > 0 && p.quantity <= lowStockThreshold;
    return p.status === tab;
  });

  const handleOpenRestock = (p: Product) => {
    setRestockProduct(p);
    setNewStockQty(String(p.quantity || 10));
    setNewPrice(String(p.price));
  };

  const handleSaveRestock = async () => {
    if (!restockProduct) return;
    setIsUpdating(true);
    try {
      const updatedQty = Math.max(0, parseInt(newStockQty, 10) || 0);
      const updatedPrice = Number(newPrice) || restockProduct.price;

      await api.updateProduct(restockProduct.id, {
        quantity: updatedQty,
        price: updatedPrice,
        status: updatedQty > 0 ? 'active' : 'out_of_stock'
      });

      // Optimistic update in list
      setProducts(prev =>
        prev.map(item =>
          item.id === restockProduct.id
            ? {
                ...item,
                quantity: updatedQty,
                price: updatedPrice,
                status: updatedQty > 0 ? 'active' : 'out_of_stock'
              }
            : item
        )
      );

      setRestockProduct(null);
      fetchSellerListings();
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStatus = async (p: Product, newStatus: 'active' | 'paused') => {
    try {
      setActionLoadingId(p.id);
      await api.updateProduct(p.id, { status: newStatus });
      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, status: newStatus } : item));
      fetchSellerListings();
    } catch (err: any) {
      alert(err.message || 'Failed to change product status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle Out-Of-Stock directly
  const handleToggleOutOfStock = async (p: Product) => {
    const isCurrentlyOOS = p.quantity === 0 || p.status === 'out_of_stock';
    const nextStatus = isCurrentlyOOS ? 'active' : 'out_of_stock';
    const nextQuantity = isCurrentlyOOS ? (p.initialQuantity || 10) : 0;

    try {
      setActionLoadingId(p.id);
      await api.updateProduct(p.id, {
        status: nextStatus,
        quantity: nextQuantity
      });

      setProducts(prev =>
        prev.map(item =>
          item.id === p.id
            ? { ...item, status: nextStatus, quantity: nextQuantity }
            : item
        )
      );
      fetchSellerListings();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle out of stock status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteListing = async (productId: string) => {
    if (!confirm('Are you sure you want to permanently delete this product listing? This action cannot be undone.')) return;
    try {
      setActionLoadingId(productId);
      await api.deleteProduct(productId);
      // Immediate optimistic removal
      setProducts(prev => prev.filter(p => p.id !== productId));
      fetchSellerListings();
    } catch (err: any) {
      console.error('Delete product error:', err);
      alert(err.message || 'Failed to delete product. Please make sure you are signed in.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDuplicateToDraft = async (p: Product) => {
    try {
      await api.createProduct({
        title: `${p.title} (Draft Copy)`,
        brand: p.brand || 'Brand Store',
        description: p.description,
        price: p.price,
        currency: p.currency,
        category: p.category,
        subcategory: p.subcategory,
        condition: 'new',
        quantity: p.quantity,
        images: p.images,
        location: p.location,
        deliveryOptions: p.deliveryOptions,
        whatsappContactEnabled: p.whatsappContactEnabled,
        status: 'draft'
      });
      fetchSellerListings();
      alert('Product duplicated into a new draft!');
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate product');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24">
      {/* Dashboard Top Header */}
      <section className="bg-white border-b border-slate-200/60 pt-6 pb-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-200/80 shadow-xs overflow-hidden flex items-center justify-center flex-shrink-0">
              <img
                src="/assets/aistudio/Bazaar-Loop_Shopping_Bag_Logo_6ec1025c.png"
                alt="BazaarLoop"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-['Space_Grotesk']">
                  Brand Merchant Operations
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Verified Storefront
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk'] mt-0.5">
                {section === 'bizmanager' ? 'BizManager Financial Suite' : 'Storefront Inventory & Warehouse'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {section === 'bizmanager'
                  ? 'Native financial operations, automatic order flow sync, invoice builder & Islamic duties calculation.'
                  : 'Manage your brand catalog, restock quantities with 1 click, track customer inquiries, and optimize listings.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('create-listing')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Launch New Product</span>
            </button>
          </div>
        </div>

        {/* Primary Studio Section Switcher */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <button
            type="button"
            onClick={() => setSection('inventory')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              section === 'inventory'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Storefront Inventory ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('bizmanager')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              section === 'bizmanager'
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-md shadow-indigo-300'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>BizManager</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-mono font-bold">
              Auto Cash Flow
            </span>
          </button>
        </div>

        {/* Real Live Metrics (shown in Inventory section) */}
        {section === 'inventory' && (
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Catalog Products</span>
                <Package className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-['Space_Grotesk']">
                {products.length}
              </div>
              <span className="text-[11px] text-slate-400">Total in catalog</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Catalog Views</span>
                <Eye className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-['Space_Grotesk']">
                {totalViews}
              </div>
              <span className="text-[11px] text-slate-400">Total item visits</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Customer Wishlists</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-['Space_Grotesk']">
                {totalSaves}
              </div>
              <span className="text-[11px] text-slate-400">Saved by buyers</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Customer Inquiries</span>
                <MessageSquare className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-['Space_Grotesk']">
                {totalInquiries}
              </div>
              <span className="text-[11px] text-slate-400">Direct inquiries</span>
            </div>
          </div>
        )}
      </section>

      {/* Main Section Content: BizManager OR Inventory */}
      {section === 'bizmanager' ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <BizManagerPortal onNavigate={onNavigate} />
        </main>
      ) : (
        /* Main Inventory Management Table */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-4">
        {/* Status Tabs & Low Stock Threshold Controls */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'All Products', count: products.length },
              { id: 'active', label: 'Active', count: products.filter(p => p.status === 'active' && p.quantity > 0).length },
              { id: 'low_stock', label: 'Low Stock Alert', count: lowStockCount, isAlert: lowStockCount > 0 },
              { id: 'out_of_stock', label: 'Out of Stock', count: outOfStockCount },
              { id: 'paused', label: 'Paused', count: products.filter(p => p.status === 'paused').length },
              { id: 'draft', label: 'Drafts', count: products.filter(p => p.status === 'draft').length }
            ].map(t => {
              const isSelected = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? t.isAlert
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-slate-900 text-white shadow-sm'
                      : t.isAlert
                      ? 'bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {t.id === 'low_stock' && <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{t.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : t.isAlert
                      ? 'bg-amber-200 text-amber-900 font-bold'
                      : 'bg-slate-200/60 text-slate-600'
                  }`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* User-defined Low Stock Threshold Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThresholdConfig(!showThresholdConfig)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
              title="Set Low Stock Warning Threshold"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>Threshold: ≤ {lowStockThreshold} units</span>
            </button>
          </div>
        </div>

        {/* Expandable Low Stock Threshold Controller */}
        {showThresholdConfig && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <strong className="text-xs font-bold block text-amber-950">
                  Custom Low Stock Warning Threshold
                </strong>
                <p className="text-[11px] text-amber-800">
                  Highlight products with low warehouse inventory so you can restock or mark out of stock before buyers order.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-amber-900">Warn when stock falls to or below:</span>
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-amber-300 shadow-xs">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={lowStockThreshold}
                  onChange={e => handleUpdateThreshold(parseInt(e.target.value, 10) || 1)}
                  className="w-14 text-center text-xs font-bold text-slate-900 focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500">units</span>
              </div>
              <button
                onClick={() => setShowThresholdConfig(false)}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Listings List */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading catalog items...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
            <h3 className="text-base font-bold text-slate-900">
              No products found in this tab
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              {tab === 'all'
                ? "You haven't launched any brand products yet. Publish your first item to start receiving customer orders!"
                : tab === 'low_stock'
                ? `All your active listings have healthy inventory levels above ${lowStockThreshold} units.`
                : `There are currently no items under the ${tab.replace('_', ' ')} status.`}
            </p>
            <button
              onClick={() => onNavigate('create-listing')}
              className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 cursor-pointer"
            >
              Launch your first product
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredProducts.map(p => {
              const isOOS = p.quantity === 0 || p.status === 'out_of_stock';
              const isLowStock = !isOOS && p.status === 'active' && p.quantity <= lowStockThreshold;
              const isBusy = actionLoadingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isOOS
                      ? 'border-rose-200 bg-rose-50/20'
                      : isLowStock
                      ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/30'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 flex items-center justify-center relative">
                      <SafeImage
                        src={p.images?.[0]}
                        alt={p.title}
                        className={`w-full h-full object-cover ${isOOS ? 'grayscale opacity-75' : ''}`}
                        fallback={<Package className="w-6 h-6 text-slate-400" />}
                      />
                      {isLowStock && (
                        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white" title="Low stock alert" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[220px] sm:max-w-md">{p.title}</span>
                        {p.status === 'active' && !isOOS && !isLowStock && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Active & In Stock
                          </span>
                        )}
                        {isLowStock && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-2xs animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Low Stock Warning ({p.quantity} left ≤ {lowStockThreshold})
                          </span>
                        )}
                        {isOOS && (
                          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                            <Ban className="w-3 h-3 text-rose-600" />
                            Out of Stock
                          </span>
                        )}
                        {p.status === 'paused' && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Paused
                          </span>
                        )}
                        {p.status === 'draft' && (
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Draft
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="font-extrabold text-slate-900">
                          {p.currency} {p.price.toLocaleString()}
                        </span>
                        <span>•</span>
                        <span className={isOOS ? 'text-rose-600 font-extrabold' : isLowStock ? 'text-amber-700 font-bold bg-amber-100/60 px-1.5 py-0.5 rounded' : 'text-slate-700 font-semibold'}>
                          Stock: {p.quantity} units {isLowStock ? `(Critical ≤ ${lowStockThreshold})` : ''}
                        </span>
                        <span>•</span>
                        <span>{p.brand || p.category}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                        <span>{p.viewsCount || 0} views</span>
                        <span>{p.savesCount || 0} saves</span>
                        <span>{p.inquiriesCount || 0} inquiries</span>
                        <span>WhatsApp Concierge: {p.whatsappContactEnabled ? 'Enabled' : 'Off'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Quick Out-Of-Stock Toggle Button */}
                    <button
                      onClick={() => handleToggleOutOfStock(p)}
                      disabled={isBusy}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                        isOOS
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      }`}
                      title={isOOS ? 'Mark back in stock' : 'Mark item as Out of Stock for buyers'}
                    >
                      {isOOS ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mark In Stock</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-3.5 h-3.5 text-rose-600" />
                          <span>Mark Out of Stock</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenRestock(p)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Restock & Price</span>
                    </button>

                    <button
                      onClick={() => onNavigate('product', p.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                      title="View live product"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {p.status === 'active' ? (
                      <button
                        onClick={() => handleToggleStatus(p, 'paused')}
                        disabled={isBusy}
                        className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer disabled:opacity-50"
                        title="Pause product"
                      >
                        <PauseCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(p, 'active')}
                        disabled={isBusy}
                        className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer disabled:opacity-50"
                        title="Activate product"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDuplicateToDraft(p)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                      title="Duplicate to new draft"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete Permanently Button */}
                    <button
                      onClick={() => handleDeleteListing(p.id)}
                      disabled={isBusy}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-50 transition-colors"
                      title="Delete permanently from store"
                    >
                      {isBusy ? (
                        <div className="w-4 h-4 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      )}

      {/* Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                Restock Inventory: {restockProduct.title}
              </h3>
              <button
                onClick={() => setRestockProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Units in Warehouse *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStockQty}
                  onChange={e => setNewStockQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Retail Price ($ USD) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveRestock}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? 'Saving...' : 'Update Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
