import React, { useState, useEffect } from 'react';
import { Product, User } from '../types';
import { api, buildWhatsAppChatUrl, buildWhatsAppCallUrl, generateWhatsAppMessage } from '../services/api';
import { addRecentlyViewed } from '../services/recentViewed';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ReportModal } from '../components/ReportModal';
import { SafeImage } from '../components/SafeImage';
import {
  Heart,
  Share2,
  MapPin,
  Truck,
  ShieldCheck,
  Store,
  MessageSquare,
  PhoneCall,
  Clock,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  CheckCircle2,
  ExternalLink,
  ShoppingBag,
  Zap,
  RotateCcw,
  BadgeCheck,
  Plus,
  Minus,
  Package
} from 'lucide-react';

interface ProductDetailViewProps {
  productId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ productId, onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const { addToCart, quickBuyProduct } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Photo gallery state
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Purchasing state
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // WhatsApp template selector
  const [selectedTemplate, setSelectedTemplate] = useState<'order_now' | 'availability' | 'specs' | 'delivery' | 'custom'>('order_now');
  const [customMessageText, setCustomMessageText] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Messaging modal state
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSentSuccess, setMessageSentSuccess] = useState(false);

  // Saved state
  const [isSaved, setIsSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(0);

  // Follow seller state
  const [isFollowing, setIsFollowing] = useState(false);

  // Share & Report state
  const [copiedLink, setCopiedLink] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.getProduct(productId);
        if (isMounted) {
          setProduct(res.product);
          setSeller(res.seller);
          setIsSaved(Boolean(res.product.isSaved));
          setSavesCount(res.product.savesCount || 0);
          setIsFollowing(Boolean(res.seller?.isFollowing));
          setActivePhotoIndex(0);
          setBuyQuantity(1);

          if (res.product) {
            addRecentlyViewed({
              id: res.product.id,
              title: res.product.title,
              price: res.product.price,
              currency: res.product.currency,
              image: res.product.images?.[0] || '',
              category: res.product.category,
              location: res.product.location,
              condition: 'new',
              hasWhatsApp: Boolean(res.product.whatsappContactEnabled && res.seller?.whatsappContactEnabled)
            });
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Product not found');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-24 bg-slate-100 rounded" />
            <div className="h-12 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          This item may have been restocked or moved to another category.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
        >
          Return to E-Commerce Store
        </button>
      </div>
    );
  }

  const isOwner = user && user.id === product.sellerId;
  const isOutOfStock = product.quantity === 0 || product.status === 'out_of_stock';

  const isWhatsAppAvailable = Boolean(
    product.whatsappContactEnabled &&
    seller &&
    seller.whatsappContactEnabled &&
    seller.whatsappNumber
  );

  const currentWhatsAppMessage = generateWhatsAppMessage(
    selectedTemplate,
    product,
    customMessageText.trim() || undefined
  );

  const whatsAppDeepLink = isWhatsAppAvailable
    ? buildWhatsAppChatUrl(seller.whatsappNumber, currentWhatsAppMessage)
    : '';

  const handleToggleSave = async () => {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    try {
      const nextSaved = !isSaved;
      setIsSaved(nextSaved);
      setSavesCount(prev => (nextSaved ? prev + 1 : Math.max(0, prev - 1)));
      const res = await api.toggleSaveProduct(product.id);
      setIsSaved(res.saved);
      setSavesCount(res.savesCount);
    } catch {
      setIsSaved(!isSaved);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    try {
      const res = await api.toggleFollow(seller.id);
      setIsFollowing(res.isFollowing);
    } catch {}
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#product-${product.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, buyQuantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    quickBuyProduct(product, buyQuantity);
  };

  const handleSendInternalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('signin');
      return;
    }
    if (!messageText.trim()) return;

    setIsSendingMessage(true);
    try {
      const res = await api.startConversation(product.id, messageText.trim());
      setMessageSentSuccess(true);
      setTimeout(() => {
        onNavigate('inbox', res.conversation.id);
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Store
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>

          {!isOwner && (
            <button
              onClick={() => {
                if (!user) openAuthModal('signin');
                else setReportModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer text-xs transition-colors"
            >
              Report Item
            </button>
          )}
        </div>
      </div>

      {/* Main Product Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Media Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-[4/3] w-full rounded-3xl bg-slate-100 border border-slate-200/80 overflow-hidden shadow-sm flex items-center justify-center">
              <SafeImage
                src={product.images?.[activePhotoIndex] || product.images?.[0]}
                alt={product.title}
                className={`w-full h-full object-contain ${
                  isOutOfStock ? 'grayscale opacity-80' : ''
                }`}
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Package className="w-12 h-12 stroke-1 mb-2" />
                    <span>Brand New Product</span>
                  </div>
                }
              />

              {/* Status badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Brand New
                </span>

                {product.isSponsored && (
                  <span className="flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Featured Brand
                  </span>
                )}

                {isOutOfStock && (
                  <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                    Currently Out of Stock
                  </span>
                )}
              </div>

              {/* Prev / Next photo controls if multiple */}
              {product.images && product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIndex(prev => (prev > 0 ? prev - 1 : product.images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md backdrop-blur-sm transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActivePhotoIndex(prev => (prev < product.images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md backdrop-blur-sm transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Row */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                {product.images.map((img, idx) => {
                  if (!img || !img.trim()) return null;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer bg-slate-100 ${
                        activePhotoIndex === idx
                          ? 'border-indigo-600 scale-105 shadow-sm'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <SafeImage src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* E-Commerce Guarantee Badges */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center text-xs">
              <div className="space-y-1 p-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 mx-auto" />
                <strong className="block font-bold text-slate-900">Brand Sealed</strong>
                <span className="text-[11px] text-slate-500">100% Original Unit</span>
              </div>
              <div className="space-y-1 p-2 border-x border-slate-100">
                <Truck className="w-5 h-5 text-emerald-600 mx-auto" />
                <strong className="block font-bold text-slate-900">Express Delivery</strong>
                <span className="text-[11px] text-slate-500">Dispatched in 24h</span>
              </div>
              <div className="space-y-1 p-2">
                <RotateCcw className="w-5 h-5 text-violet-600 mx-auto" />
                <strong className="block font-bold text-slate-900">30-Day Guarantee</strong>
                <span className="text-[11px] text-slate-500">Hassle-Free Returns</span>
              </div>
            </div>

            {/* Product Specifications & Description */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider font-['Space_Grotesk']">
                Product Details & Specifications
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {product.description}
              </p>

              {/* Specs Grid */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Condition</span>
                  <span className="font-bold text-slate-900">100% Brand New & Factory Sealed</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-bold text-slate-900">{product.category}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Warranty</span>
                  <span className="font-bold text-slate-900">{product.warranty || '1-Year Official Manufacturer Warranty'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Availability</span>
                  <span className="font-bold text-emerald-600">{product.quantity} Units in Warehouse</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Cart & WhatsApp Suite */}
          <div className="lg:col-span-5 space-y-5">
            {/* Main Purchasing & WhatsApp Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    {product.brand || product.category}
                  </span>
                  <button
                    onClick={handleToggleSave}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{savesCount} saves</span>
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-['Space_Grotesk'] leading-tight">
                  {product.title}
                </h1>

                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-indigo-700 font-['Space_Grotesk']">
                    {product.currency} {product.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    Brand New
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {product.location}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Listed {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-400" /> {product.viewsCount} views
                  </span>
                </div>

                {/* Stock indicator */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">In-Stock Quantity:</span>
                  <span className={`font-bold ${isOutOfStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {product.quantity > 0 ? `${product.quantity} units ready to ship` : 'Currently out of stock'}
                  </span>
                </div>
              </div>

              {/* PRIMARY E-COMMERCE CHECKOUT & ADD TO BAG */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                {!isOutOfStock && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-1 bg-slate-50">
                      <button
                        onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-slate-900 w-8 text-center">
                        {buyQuantity}
                      </span>
                      <button
                        onClick={() => setBuyQuantity(Math.min(product.quantity, buyQuantity + 1))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className="flex-1 py-3 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold border border-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{addedNotice ? 'Added to Bag!' : 'Add to Shopping Bag'}</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Buy Now — Instant Checkout</span>
                </button>
              </div>

              {/* WHATSAPP RETAIL ORDER & CONCIERGE SUITE */}
              {isWhatsAppAvailable && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <a
                    href={whatsAppDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <WhatsAppIcon className="w-5 h-5 fill-white flex-shrink-0" />
                    <span>Order via WhatsApp Concierge</span>
                  </a>

                  {/* Smart Contextual Message Template Selector */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                        WhatsApp Concierge Message
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTemplateEditor(!showTemplateEditor)}
                        className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
                      >
                        {showTemplateEditor ? 'Hide options' : 'Choose template'}
                      </button>
                    </div>

                    {showTemplateEditor && (
                      <div className="space-y-2 pt-1 border-t border-emerald-200/50">
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedTemplate('order_now')}
                            className={`py-1.5 px-2.5 rounded-xl font-medium text-left transition-all ${
                              selectedTemplate === 'order_now'
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100/50'
                            }`}
                          >
                            Order Item Now
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTemplate('availability')}
                            className={`py-1.5 px-2.5 rounded-xl font-medium text-left transition-all ${
                              selectedTemplate === 'availability'
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100/50'
                            }`}
                          >
                            Check Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTemplate('specs')}
                            className={`py-1.5 px-2.5 rounded-xl font-medium text-left transition-all ${
                              selectedTemplate === 'specs'
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100/50'
                            }`}
                          >
                            Specs & Warranty
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTemplate('delivery')}
                            className={`py-1.5 px-2.5 rounded-xl font-medium text-left transition-all ${
                              selectedTemplate === 'delivery'
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100/50'
                            }`}
                          >
                            Shipping Options
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Internal Inquiries Accordion */}
              {!isOwner && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Direct Merchant Inquiry
                    </h4>

                    {messageSentSuccess ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Message sent! Opening your conversation...</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSendInternalMessage} className="space-y-2">
                        <textarea
                          value={messageText}
                          onChange={e => setMessageText(e.target.value)}
                          placeholder={`Ask ${seller?.name || 'the brand representative'} questions about this product...`}
                          rows={2}
                          className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={isSendingMessage || !messageText.trim()}
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          {isSendingMessage ? 'Sending...' : 'Send Message to Store'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Seller Storefront Card */}
            {seller && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Merchant Store</span>
                  <button
                    onClick={() => onNavigate('storefront', seller.id)}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    View Storefront <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-lg shadow-sm">
                    <SafeImage
                      src={seller.avatarUrl}
                      alt={seller.name}
                      className="w-full h-full object-cover"
                      fallback={<span>{seller.name.charAt(0).toUpperCase()}</span>}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{seller.name}</h4>
                      {seller.isVerified && (
                        <span title="Verified Brand Store">
                          <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Brand Merchant since {new Date(seller.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-600 font-medium">
                      {seller.activeListingsCount} active brand {seller.activeListingsCount === 1 ? 'product' : 'products'}
                    </p>
                  </div>

                  {!isOwner && (
                    <button
                      onClick={handleToggleFollow}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isFollowing
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow Store'}
                    </button>
                  )}
                </div>

                {seller.bio && (
                  <p className="text-xs text-slate-600 line-clamp-2 italic">
                    "{seller.bio}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="listing"
        targetId={product.id}
        targetTitleOrName={product.title}
      />
    </div>
  );
};
