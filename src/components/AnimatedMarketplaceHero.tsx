import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Product, CATEGORIES } from '../types';
import { WhatsAppIcon } from './WhatsAppIcon';
import { SafeImage } from './SafeImage';
import {
  Sparkles,
  PlusCircle,
  ArrowDown,
  ShoppingBag,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Truck,
  RotateCcw,
  BadgeCheck,
  Upload,
  Package
} from 'lucide-react';

interface AnimatedMarketplaceHeroProps {
  onListingAdded: (product: Product) => void;
  onNavigate: (view: string, param?: string) => void;
  totalListingsCount: number;
}

export const AnimatedMarketplaceHero: React.FC<AnimatedMarketplaceHeroProps> = ({
  onListingAdded,
  onNavigate,
  totalListingsCount
}) => {
  const { user, openAuthModal } = useAuth();

  const [activeExperience, setActiveExperience] = useState<'buyer' | 'merchant'>('buyer');
  const [showQuickAddDrawer, setShowQuickAddDrawer] = useState(false);

  // Quick brand product form state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickBrand, setQuickBrand] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickCategory, setQuickCategory] = useState<string>(CATEGORIES[1] || 'Consumer Tech & Gadgets');
  const [quickLocation, setQuickLocation] = useState(user?.city || 'San Francisco, CA');
  const [quickWhatsApp, setQuickWhatsApp] = useState(true);
  const [quickImage, setQuickImage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const uploadRes = await api.uploadImage(reader.result as string, file.name);
        setQuickImage(uploadRes.url);
      } catch (err: any) {
        setErrorMsg(err.message || 'Image upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuickPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('signin');
      return;
    }
    if (!quickTitle.trim() || !quickPrice) {
      setErrorMsg('Please enter a product title and price');
      return;
    }

    setIsPublishing(true);
    setErrorMsg(null);
    try {
      const res = await api.createProduct({
        title: quickTitle.trim(),
        brand: quickBrand.trim() || 'BazaarLoop Brand Store',
        description: `100% Brand-new, factory-sealed authentic product with full manufacturer warranty. For delivery, contact your seller directly.`,
        price: Number(quickPrice),
        currency: 'USD',
        category: quickCategory,
        condition: 'new',
        quantity: 15,
        warranty: '1-Year Official Manufacturer Warranty',
        images: quickImage ? [quickImage] : [],
        location: quickLocation.trim(),
        deliveryOptions: ['shipping', 'express_delivery'],
        whatsappContactEnabled: quickWhatsApp,
        status: 'active'
      });

      setPublishSuccess(true);
      onListingAdded(res.product);

      setQuickTitle('');
      setQuickBrand('');
      setQuickPrice('');
      setQuickImage(null);

      setTimeout(() => {
        setPublishSuccess(false);
        setShowQuickAddDrawer(false);
        const feedElem = document.getElementById('marketplace-feed-anchor');
        if (feedElem) {
          feedElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish product');
    } finally {
      setIsPublishing(false);
    }
  };

  const scrollToFeed = () => {
    const feedElem = document.getElementById('marketplace-feed-anchor');
    if (feedElem) {
      feedElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/50">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Animated Headlines & Controls */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md"
            >
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Brand-New Retail • Verified Official Stores • Contact Seller for Delivery</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-['Space_Grotesk'] leading-[1.15]"
            >
              Direct E-Commerce for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-200 to-emerald-300">
                Brand-New Goods
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
            >
              Shop factory-sealed products from verified brands, independent creators, and flagship boutiques. Fast priority dispatch, manufacturer warranty, and direct 1-tap WhatsApp concierge ordering.
            </motion.p>

            {/* Interactive Experience Mode Selector */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center lg:justify-start gap-2 pt-1"
            >
              <div className="bg-slate-900/80 p-1 rounded-2xl border border-slate-700/80 backdrop-blur-md flex items-center gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveExperience('buyer')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeExperience === 'buyer'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Buyer Experience</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveExperience('merchant')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeExperience === 'merchant'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Merchant Studio</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('buyer-hub')}
                className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Track Orders</span>
              </button>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2"
            >
              <button
                type="button"
                onClick={() => setShowQuickAddDrawer(!showQuickAddDrawer)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer group"
              >
                <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span>{showQuickAddDrawer ? 'Close Quick Add' : 'Quick Add New Brand Product'}</span>
              </button>

              <button
                type="button"
                onClick={scrollToFeed}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-semibold backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Shop New Arrivals</span>
                <ArrowDown className="w-4 h-4 text-slate-300 animate-bounce" />
              </button>
            </motion.div>
          </div>

          {/* Right Column: Animated Interactive Preview Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <AnimatePresence mode="wait">
              {activeExperience === 'buyer' ? (
                /* Animated E-Commerce Buyer Showcase */
                <motion.div
                  key="buyer-card"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="w-full max-w-sm rounded-3xl bg-slate-900/90 border border-slate-700/80 p-5 shadow-2xl backdrop-blur-xl space-y-4 relative"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-slate-200">Contact Seller for Delivery</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800 uppercase tracking-wider">
                      Factory Sealed
                    </span>
                  </div>

                  {/* Simulated Product Card */}
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/60 via-slate-900 to-violet-950/40 flex items-center justify-center">
                        <Smartphone className="w-12 h-12 text-indigo-400 stroke-1" />
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-extrabold text-white">
                        $999 USD
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold shadow-md">
                          Brand New
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Apple Direct</span>
                      <h4 className="text-xs font-bold text-white">iPhone 16 Pro — 256GB Natural Titanium</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">1-Year Official Apple Warranty • Free Express Dispatch</p>
                    </div>

                    {/* Pre-filled Concierge Order Bubble */}
                    <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 mb-1">
                        <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                        <span>Instant Retail WhatsApp Concierge:</span>
                      </div>
                      <p className="text-[11px] text-slate-200">
                        "Hello! I would like to order iPhone 16 Pro ($999). Please confirm express dispatch."
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={scrollToFeed}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Shop Flagship Brand Feed</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Animated Merchant Showcase */
                <motion.div
                  key="merchant-card"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="w-full max-w-sm rounded-3xl bg-slate-900/90 border border-slate-700/80 p-5 shadow-2xl backdrop-blur-xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold text-slate-200">Merchant Retail Operations</span>
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800">
                      Brand Store
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Total Live Catalog:</span>
                      <strong className="text-white font-extrabold">{totalListingsCount} New Products</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Inventory Sync:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Concurrency Safe Restocking
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Customer Checkout:</span>
                      <span className="text-indigo-300 font-bold">1-Click Bag & WhatsApp Direct</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('create-listing')}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer mt-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Launch Brand Product</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Add Product Drawer */}
        <AnimatePresence>
          {showQuickAddDrawer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-8 overflow-hidden"
            >
              <div className="bg-slate-900/95 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                      Add New Brand Product — Drops directly into the live catalog below
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowQuickAddDrawer(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-950/70 border border-red-500/40 text-red-200 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {publishSuccess ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="py-6 text-center space-y-2"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <h4 className="text-base font-bold text-white">Brand Product Published!</h4>
                    <p className="text-xs text-slate-300">Scrolling to your new product right after this hero...</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleQuickPublish} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Brand / Label
                      </label>
                      <input
                        type="text"
                        value={quickBrand}
                        onChange={e => setQuickBrand(e.target.value)}
                        placeholder="e.g. Sony, Nike, Dyson"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Product Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={quickTitle}
                        onChange={e => setQuickTitle(e.target.value)}
                        placeholder="e.g. WH-1000XM5 Wireless Headphones"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Price ($ USD) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={quickPrice}
                        onChange={e => setQuickPrice(e.target.value)}
                        placeholder="299.00"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <select
                        value={quickCategory}
                        onChange={e => setQuickCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-400"
                      >
                        {CATEGORIES.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Product Photo
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs flex items-center justify-center gap-1.5 cursor-pointer truncate">
                          <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{quickImage ? 'Photo Attached' : 'Select Photo'}</span>
                          <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                        </label>
                        <SafeImage
                          src={quickImage}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4 text-xs text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quickWhatsApp}
                          onChange={e => setQuickWhatsApp(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-400"
                        />
                        <span className="flex items-center gap-1">
                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Enable 1-Tap "Order on WhatsApp" Concierge</span>
                        </span>
                      </label>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isPublishing}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isPublishing ? (
                          <span>Publishing...</span>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Add Brand Product to Feed</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
