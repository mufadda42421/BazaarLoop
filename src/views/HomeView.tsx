import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { CategoryNav } from '../components/CategoryNav';
import { AnimatedMarketplaceHero } from '../components/AnimatedMarketplaceHero';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  SlidersHorizontal,
  PlusCircle,
  ShoppingBag,
  TrendingUp,
  Bookmark,
  Users,
  Compass,
  ArrowUpDown,
  CheckCircle2,
  PackageSearch,
  BadgeCheck,
  ShieldCheck,
  Truck
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: string, param?: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, searchQuery, onSearchChange }) => {
  const { user, openAuthModal } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'saved'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getProducts({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        sort: sortBy,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        tab: activeTab !== 'all' ? activeTab : undefined
      });

      let list = res.products || [];
      if (inStockOnly) {
        list = list.filter(p => p.quantity > 0 && p.status !== 'out_of_stock');
      }
      setProducts(list);
    } catch (err) {
      console.error('Failed to load listings:', err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy, inStockOnly, minPrice, maxPrice, activeTab]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const [justAddedProductId, setJustAddedProductId] = useState<string | null>(null);

  const handleListingAdded = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev.filter(p => p.id !== newProduct.id)]);
    setJustAddedProductId(newProduct.id);
    setTimeout(() => setJustAddedProductId(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24">
      {/* Animated Marketplace Hero & Interactive Quick Add Module */}
      <AnimatedMarketplaceHero
        onListingAdded={handleListingAdded}
        onNavigate={onNavigate}
        totalListingsCount={products.length}
      />

      {/* Anchor right after the animated hero where newly launched products appear */}
      <div id="marketplace-feed-anchor" className="bg-white border-b border-slate-200/60 py-3 px-4 sm:px-6 lg:px-8 shadow-xs sticky top-16 z-30 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto">
          <CategoryNav
            selectedCategory={selectedCategory}
            onSelectCategory={cat => setSelectedCategory(cat)}
          />
        </div>
      </div>

      {/* Main Catalog Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Filter & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-6 border-b border-slate-200/60">
          {/* Feed Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>All Brand Catalog</span>
            </button>

            <button
              onClick={() => {
                if (!user) openAuthModal('signin');
                else setActiveTab('following');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'following'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Followed Brands</span>
            </button>

            <button
              onClick={() => {
                if (!user) openAuthModal('signin');
                else setActiveTab('saved');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Wishlist</span>
            </button>
          </div>

          {/* Right controls: Sort & Filter Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            <button
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                showFiltersDrawer || inStockOnly || minPrice || maxPrice
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(inStockOnly || minPrice || maxPrice) && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Filter Tray */}
        {showFiltersDrawer && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Availability
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>In-Stock Only (Ready for Express Dispatch)</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Price Range ($ USD)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-slate-400 text-xs">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setInStockOnly(false);
                  setMinPrice('');
                  setMaxPrice('');
                }}
                className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Listings Feed Header */}
        <div className="mt-6 mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-['Space_Grotesk']">
            <span>
              {searchQuery ? `Search Results for "${searchQuery}"` : selectedCategory !== 'All' ? selectedCategory : 'Brand-New Retail Catalog'}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
              {products.length} products
            </span>
          </h2>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Brand New
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-600" /> For delivery contact your seller
            </span>
          </div>
        </div>

        {/* Product Grid / Skeleton / Genuine Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/70 p-3 space-y-3 animate-pulse">
                <div className="aspect-square bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* DESIGNED GENUINE EMPTY STATE - NO FABRICATED OR DUMMY DATA */
          <div className="mt-8 mb-16 py-16 px-6 max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 mb-4 shadow-inner">
              <PackageSearch className="w-8 h-8 stroke-1" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">
              {searchQuery
                ? 'No matching brand products found'
                : activeTab === 'saved'
                ? 'No saved items in your wishlist'
                : activeTab === 'following'
                ? 'No products from followed brand stores'
                : selectedCategory !== 'All'
                ? `No products currently available in "${selectedCategory}"`
                : 'Welcome to BazaarLoop Brand Direct E-Commerce'}
            </h3>

            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              {searchQuery
                ? `We couldn't find any products matching "${searchQuery}". Try different keywords or browse all categories.`
                : activeTab === 'saved'
                ? 'Click the heart icon on any product to save it to your personal wishlist.'
                : activeTab === 'following'
                ? 'Follow official brand stores to see their newly dropped inventory appear here.'
                : 'BazaarLoop is live and waiting for its first brand product. Be the pioneer merchant or brand creator and launch your factory-sealed item with photos, price, and instant checkout!'}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (!user) openAuthModal('signin');
                  else onNavigate('create-listing');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Launch your first product</span>
              </button>

              {(searchQuery || selectedCategory !== 'All' || activeTab !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    onSearchChange('');
                    setActiveTab('all');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 text-left gap-4 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Factory-sealed original manufacturer packaging</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>1-Click Shopping Bag Checkout and WhatsApp Concierge</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {products.map(product => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="relative"
                >
                  {justAddedProductId === product.id && (
                    <div className="absolute -top-2 left-2 z-20 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md animate-bounce flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      <span>Just Added to Catalog!</span>
                    </div>
                  )}
                  <ProductCard
                    product={product}
                    onClick={() => onNavigate('product', product.id)}
                    onSavedToggle={(pid, isSaved) => {
                      setProducts(prev =>
                        prev.map(p => (p.id === pid ? { ...p, isSaved } : p))
                      );
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};
