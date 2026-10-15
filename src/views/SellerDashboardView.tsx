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
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  BadgeCheck,
  Truck
} from 'lucide-react';

interface SellerDashboardViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const SellerDashboardView: React.FC<SellerDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'active' | 'out_of_stock' | 'paused' | 'draft'>('all');

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

  const filteredProducts = products.filter(p => {
    if (tab === 'all') return true;
    if (tab === 'out_of_stock') return p.quantity === 0 || p.status === 'out_of_stock';
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
        status: updatedQty > 0 && restockProduct.status === 'out_of_stock' ? 'active' : undefined
      });

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
      await api.updateProduct(p.id, { status: newStatus });
      fetchSellerListings();
    } catch (err: any) {
      alert(err.message || 'Failed to change product status');
    }
  };

  const handleDeleteListing = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product listing permanently?')) return;
    try {
      await api.deleteProduct(productId);
      fetchSellerListings();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
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
      <section className="bg-white border-b border-slate-200/60 pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-['Space_Grotesk']">
                Brand Merchant Operations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk'] mt-1">
              Storefront Inventory & Warehouse
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage your brand catalog, restock quantities with 1 click, track customer inquiries, and optimize listings.
            </p>
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

        {/* Real Live Metrics */}
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
      </section>

      {/* Main Inventory Management Table */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Products', count: products.length },
              { id: 'active', label: 'Active', count: products.filter(p => p.status === 'active' && p.quantity > 0).length },
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
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'
                  }`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

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
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 flex items-center justify-center">
                      <SafeImage
                        src={p.images?.[0]}
                        alt={p.title}
                        className="w-full h-full object-cover"
                        fallback={<Package className="w-6 h-6 text-slate-400" />}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{p.title}</span>
                        {p.status === 'active' && !isOOS && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Active & In Stock
                          </span>
                        )}
                        {isOOS && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
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

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-extrabold text-slate-900">
                          {p.currency} {p.price.toLocaleString()}
                        </span>
                        <span>•</span>
                        <span className={p.quantity === 0 ? 'text-rose-600 font-bold' : 'text-slate-700 font-semibold'}>
                          Stock: {p.quantity} units
                        </span>
                        <span>•</span>
                        <span>{p.brand || p.category}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>{p.viewsCount || 0} views</span>
                        <span>{p.savesCount || 0} saves</span>
                        <span>{p.inquiriesCount || 0} inquiries</span>
                        <span>WhatsApp Concierge: {p.whatsappContactEnabled ? 'Enabled' : 'Off'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
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
                        className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                        title="Pause product"
                      >
                        <PauseCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(p, 'active')}
                        className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
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

                    <button
                      onClick={() => handleDeleteListing(p.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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
