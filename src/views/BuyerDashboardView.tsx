import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Product, Conversation, Order } from '../types';
import { api, buildWhatsAppChatUrl, generateWhatsAppMessage } from '../services/api';
import { getRecentlyViewed, clearRecentlyViewed, RecentItem } from '../services/recentViewed';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { SafeImage } from '../components/SafeImage';
import {
  Bookmark,
  MessageSquare,
  Users,
  History,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Store,
  Tag,
  Package,
  Truck,
  CreditCard,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';

interface BuyerDashboardViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const BuyerDashboardView: React.FC<BuyerDashboardViewProps> = ({ onNavigate }) => {
  const { user, openAuthModal, updateProfile } = useAuth();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<'orders' | 'saved' | 'inquiries' | 'following' | 'recent' | 'banking' | 'safety'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [buyerConversations, setBuyerConversations] = useState<Conversation[]>([]);
  const [followedSellers, setFollowedSellers] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedTrack, setCopiedTrack] = useState<string | null>(null);

  // Banking & Payment Details State
  const [bankingData, setBankingData] = useState<any>(user?.bankingDetails || {
    acceptedMethods: ['upi', 'gpay', 'apple_pay', 'paypal', 'card'],
    upiId: '',
    gpayNumber: '',
    applePayId: '',
    paypalEmail: '',
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifscOrRouting: '',
    paymentNotes: ''
  });
  const [isSavingBanking, setIsSavingBanking] = useState(false);
  const [bankingSavedMsg, setBankingSavedMsg] = useState(false);

  useEffect(() => {
    if (user?.bankingDetails) {
      setBankingData(user.bankingDetails);
    }
  }, [user?.bankingDetails]);

  const handleSaveBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBanking(true);
    try {
      if (updateProfile) {
        await updateProfile({ bankingDetails: bankingData });
      }
      setBankingSavedMsg(true);
      setTimeout(() => setBankingSavedMsg(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingBanking(false);
    }
  };

  const fetchBuyerData = async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Fetch real e-commerce orders
        try {
          const ordersRes = await api.getOrders();
          setOrders(ordersRes.orders || []);
        } catch {}

        // Fetch conversations
        try {
          const convosRes = await api.getConversations();
          const buyerConvos = (convosRes.conversations || []).filter(c => c.buyerId === user.id);
          setBuyerConversations(buyerConvos);
        } catch {}

        // Fetch followed stores
        try {
          const followingRes = await api.getProducts({ tab: 'following' });
          const sellerMap = new Map<string, any>();
          for (const p of followingRes.products || []) {
            if (!sellerMap.has(p.sellerId)) {
              sellerMap.set(p.sellerId, {
                id: p.sellerId,
                name: p.sellerName,
                avatarUrl: p.sellerAvatar,
                location: p.location,
                activeCount: followingRes.products.filter(item => item.sellerId === p.sellerId).length
              });
            }
          }
          setFollowedSellers(Array.from(sellerMap.values()));
        } catch {}
      }

      // Fetch saved products
      try {
        const savedRes = await api.getProducts({ tab: 'saved' });
        setSavedProducts(savedRes.products || []);
      } catch {}

      // Fetch local recently viewed
      setRecentlyViewed(getRecentlyViewed());
    } catch (err) {
      console.error('Failed to load buyer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyerData();
  }, [user]);

  const handleRemoveSaved = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleSaveProduct(productId);
      setSavedProducts(prev => prev.filter(p => p.id !== productId));
    } catch {}
  };

  const handleClearHistory = () => {
    clearRecentlyViewed();
    setRecentlyViewed([]);
  };

  const copyTracking = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedTrack(code);
      setTimeout(() => setCopiedTrack(null), 2000);
    });
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
          <ShoppingBag className="w-8 h-8 stroke-1" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk']">
          Buyer & Customer Portal
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
          Sign in or create an account to track your orders, view delivery progress, access your wishlist, and contact official merchant stores.
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => openAuthModal('signin')}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            Sign In to Buyer Portal
          </button>
          <button
            onClick={() => openAuthModal('register')}
            className="flex-1 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            Register Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24">
      {/* Top Banner */}
      <section className="bg-white border-b border-slate-200/60 pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wider uppercase mb-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Customer Account
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
              Orders & Buyer Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Track express shipments, manage wishlist items, and connect with brand merchants.
            </p>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Shop New Collections</span>
          </button>
        </div>

        {/* Quick metrics summary */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div
            onClick={() => setActiveTab('orders')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'orders'
                ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>My Orders</span>
              <Truck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-['Space_Grotesk']">
              {orders.length}
            </div>
            <span className="text-[11px] text-slate-400">Total shipments</span>
          </div>

          <div
            onClick={() => setActiveTab('saved')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'saved'
                ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Wishlist</span>
              <Bookmark className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-['Space_Grotesk']">
              {savedProducts.length}
            </div>
            <span className="text-[11px] text-slate-400">Saved brand items</span>
          </div>

          <div
            onClick={() => setActiveTab('inquiries')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'inquiries'
                ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Brand Inquiries</span>
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-['Space_Grotesk']">
              {buyerConversations.length}
            </div>
            <span className="text-[11px] text-slate-400">Merchant chats</span>
          </div>

          <div
            onClick={() => setActiveTab('following')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'following'
                ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Followed Stores</span>
              <Store className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-['Space_Grotesk']">
              {followedSellers.length}
            </div>
            <span className="text-[11px] text-slate-400">Favorite brands</span>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'orders', label: 'My Orders & Deliveries', icon: Truck, count: orders.length },
            { id: 'saved', label: 'Wishlist & Watchlist', icon: Bookmark, count: savedProducts.length },
            { id: 'inquiries', label: 'Store Inquiries', icon: MessageSquare, count: buyerConversations.length },
            { id: 'following', label: 'Followed Brands', icon: Users, count: followedSellers.length },
            { id: 'recent', label: 'Browsing Trail', icon: History, count: recentlyViewed.length },
            { id: 'banking', label: 'Banking & Payments', icon: CreditCard, count: undefined },
            { id: 'safety', label: 'Authenticity & Warranty Guide', icon: ShieldCheck, count: undefined }
          ].map(t => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: REAL ORDERS & TRACKING */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
              Your Orders ({orders.length})
            </h2>

            {isLoading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading your orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
                <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
                <h3 className="text-base font-bold text-slate-900">No Orders Placed Yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
                  Discover brand-new factory-sealed items and use our instant checkout or WhatsApp ordering to receive fast delivery.
                </p>
                <button
                  onClick={() => onNavigate('home')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 cursor-pointer"
                >
                  Shop Brand-New Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => {
                  const whatsAppSupportMsg = `Hello! Inquiring regarding my order #${order.orderNumber} (Tracking: ${order.trackingNumber}).`;
                  const whatsAppLink = buildWhatsAppChatUrl(
                    order.shippingAddress.phone || '14155552671',
                    whatsAppSupportMsg
                  );

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden"
                    >
                      {/* Order Header */}
                      <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 font-mono text-sm">
                              #{order.orderNumber}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {order.status === 'processing' ? 'Processing at Warehouse' : order.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Placed on {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Tracking pill */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-xs shadow-xs">
                            <span className="text-slate-400">Tracking:</span>
                            <strong className="text-indigo-600">{order.trackingNumber}</strong>
                            <button
                              onClick={() => copyTracking(order.trackingNumber)}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                              title="Copy tracking"
                            >
                              {copiedTrack === order.trackingNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <a
                            href={whatsAppLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                            <span>WhatsApp Updates</span>
                          </a>
                        </div>
                      </div>

                      {/* Items in order */}
                      <div className="p-4 sm:p-5 divide-y divide-slate-100">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => onNavigate('product', item.productId)}
                            className="pt-3 first:pt-0 flex items-center justify-between gap-3 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                                <SafeImage
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                  fallback={<Package className="w-6 h-6 text-slate-300" />}
                                />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase">
                                  {item.brand || 'Brand Direct'}
                                </span>
                                <h4 className="text-xs font-semibold text-slate-900 truncate group-hover:text-indigo-600">
                                  {item.title}
                                </h4>
                                <span className="text-[11px] text-slate-400">Qty: {item.quantity}</span>
                              </div>
                            </div>

                            <span className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex-shrink-0">
                              {item.currency} {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Order Footer Details */}
                      <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Estimated Delivery: <strong>{order.estimatedDelivery}</strong></span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</span>
                          </span>
                        </div>

                        <div className="font-extrabold text-sm text-slate-900">
                          Total: <span className="text-indigo-600 font-['Space_Grotesk']">${order.total.toFixed(2)} USD</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED WISHLIST */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
              Wishlist & Saved Items ({savedProducts.length})
            </h2>

            {savedProducts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
                <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
                <h3 className="text-base font-bold text-slate-900">Your Wishlist is Empty</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
                  Save your favorite brand items to get notified when prices update or stock arrives.
                </p>
                <button
                  onClick={() => onNavigate('home')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 cursor-pointer"
                >
                  Explore Brand Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onNavigate('product', p.id)}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-3.5 flex flex-col justify-between gap-3 cursor-pointer group"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                      <SafeImage
                        src={p.images?.[0]}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        fallback={<Package className="w-8 h-8 text-slate-300" />}
                      />
                      <button
                        onClick={(e) => handleRemoveSaved(p.id, e)}
                        title="Remove from saved"
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-rose-600 hover:bg-white shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-base font-extrabold text-slate-900">
                          {p.currency} {p.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
                          Brand New
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600">
                        {p.title}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p, 1);
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Bag</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
              Brand Store Inquiries ({buyerConversations.length})
            </h2>

            {buyerConversations.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
                <h3 className="text-base font-bold text-slate-900">No Inquiries Yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  When you contact a merchant on a product page, your conversations appear here.
                </p>
                <button
                  onClick={() => onNavigate('home')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Browse Store
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {buyerConversations.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onNavigate('inbox', c.id)}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center flex-shrink-0">
                        <SafeImage
                          src={c.productImage}
                          alt=""
                          className="w-full h-full object-cover"
                          fallback={<Package className="w-5 h-5 text-slate-400" />}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Merchant: {c.sellerName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-indigo-600 truncate mt-0.5">
                          {c.productTitle} — {c.productCurrency} {c.productPrice}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5 italic">
                          "{c.lastMessageText}"
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('inbox', c.id)}
                      className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Continue Conversation</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FOLLOWED BRANDS */}
        {activeTab === 'following' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
              Followed Brand Stores ({followedSellers.length})
            </h2>

            {followedSellers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
                <h3 className="text-base font-bold text-slate-900">No Followed Brands Yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  Follow official brand storefronts to get first access to newly dropped retail collections.
                </p>
                <button
                  onClick={() => onNavigate('home')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Discover Brands
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {followedSellers.map(s => (
                  <div
                    key={s.id}
                    onClick={() => onNavigate('storefront', s.id)}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <SafeImage
                          src={s.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          fallback={
                            <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-base flex items-center justify-center">
                              {s.name?.charAt(0) || 'S'}
                            </div>
                          }
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{s.name}</h4>
                        <p className="text-[11px] text-slate-500">{s.location || 'Official Store'}</p>
                        <p className="text-[10px] text-indigo-600 font-semibold">{s.activeCount} active items</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('storefront', s.id);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BROWSING TRAIL */}
        {activeTab === 'recent' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                Recently Viewed ({recentlyViewed.length})
              </h2>
              {recentlyViewed.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear History
                </button>
              )}
            </div>

            {recentlyViewed.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
                <h3 className="text-base font-bold text-slate-900">No Browsing History</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  Products you inspect will automatically be saved here.
                </p>
                <button
                  onClick={() => onNavigate('home')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recentlyViewed.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('product', item.id)}
                    className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2 flex items-center justify-center">
                        <SafeImage
                          src={item.image}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          fallback={<Package className="w-8 h-8 text-slate-300" />}
                        />
                      </div>
                      <div className="flex items-baseline justify-between gap-1 mb-0.5">
                        <span className="text-xs font-extrabold text-slate-900">
                          {item.currency} {item.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Brand New</span>
                      </div>
                      <h4 className="text-xs font-medium text-slate-800 line-clamp-1 group-hover:text-indigo-600">
                        {item.title}
                      </h4>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{item.location}</span>
                      {item.hasWhatsApp && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                          <WhatsAppIcon className="w-3 h-3 text-emerald-600" /> WhatsApp
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: BANKING & PAYMENT DETAILS */}
        {activeTab === 'banking' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                      Banking & Payment Details
                    </h3>
                    <p className="text-xs text-slate-500">
                      Manage your payment details for UPI, GPay, Apple Pay, PayPal, and Card.
                    </p>
                  </div>
                </div>

                {bankingSavedMsg && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-4 h-4" /> Saved!
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveBanking} className="space-y-4">
                {/* UPI ID */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    ⚡ UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    value={bankingData.upiId || ''}
                    onChange={e => setBankingData({ ...bankingData, upiId: e.target.value })}
                    placeholder="e.g. name@oksbi or 9876543210@upi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* GPay */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    🌐 Google Pay (GPay) Phone or ID
                  </label>
                  <input
                    type="text"
                    value={bankingData.gpayNumber || ''}
                    onChange={e => setBankingData({ ...bankingData, gpayNumber: e.target.value })}
                    placeholder="e.g. +1 555 123 4567 or gpay-handle"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* Apple Pay */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    🍎 Apple Pay Contact / ID
                  </label>
                  <input
                    type="text"
                    value={bankingData.applePayId || ''}
                    onChange={e => setBankingData({ ...bankingData, applePayId: e.target.value })}
                    placeholder="e.g. applepay@example.com or +1 415 555 0192"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* PayPal */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    🅿️ PayPal Email or PayPal.Me Link
                  </label>
                  <input
                    type="text"
                    value={bankingData.paypalEmail || ''}
                    onChange={e => setBankingData({ ...bankingData, paypalEmail: e.target.value })}
                    placeholder="e.g. user@paypal.com or paypal.me/handle"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* Credit card or debit card & Bank Transfer */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Credit Card or Debit Card & Bank Transfer Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankingData.bankName || ''}
                        onChange={e => setBankingData({ ...bankingData, bankName: e.target.value })}
                        placeholder="e.g. JPMorgan Chase, HDFC, Barclays"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={bankingData.accountHolder || ''}
                        onChange={e => setBankingData({ ...bankingData, accountHolder: e.target.value })}
                        placeholder="Legal account name"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account / Card Number</label>
                      <input
                        type="text"
                        value={bankingData.accountNumber || ''}
                        onChange={e => setBankingData({ ...bankingData, accountNumber: e.target.value })}
                        placeholder="Account Number or Card Info"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">IFSC / Routing / SWIFT</label>
                      <input
                        type="text"
                        value={bankingData.ifscOrRouting || ''}
                        onChange={e => setBankingData({ ...bankingData, ifscOrRouting: e.target.value })}
                        placeholder="IFSC / Routing / BIC code"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Payment Instructions / Note
                  </label>
                  <input
                    type="text"
                    value={bankingData.paymentNotes || ''}
                    onChange={e => setBankingData({ ...bankingData, paymentNotes: e.target.value })}
                    placeholder="e.g. Share screenshot of payment on WhatsApp to expedite courier dispatch"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingBanking}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all cursor-pointer"
                  >
                    {isSavingBanking ? 'Saving...' : 'Save Payment & Banking Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: AUTHENTICITY & WARRANTY GUIDE */}
        {activeTab === 'safety' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                    BazaarLoop 100% Brand-New Authenticity Policy
                  </h3>
                  <p className="text-xs text-slate-500">
                    Why our direct-to-consumer e-commerce model protects every customer.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs text-slate-700 leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-950 font-bold block">1. Factory-Sealed Guarantee</strong>
                    <span>Every product sold on BazaarLoop is brand new, sealed in original manufacturer retail packaging with serial numbers and certificates intact. Zero pre-owned, refurbished, or used items are permitted.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold block">2. Official Manufacturer Warranty</strong>
                    <span>All electronics, apparel, and home items include full manufacturer coverage and repair/replacement warranties.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold block">3. 30-Day Hassle-Free Returns</strong>
                    <span>If your item arrives with any defect or damage, our priority courier fleet handles free replacement or instant full refund.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold block">4. Direct WhatsApp Merchant Concierge</strong>
                    <span>Need immediate tracking, delivery rescheduling, or sizing guidance? Connect directly with the brand's verified support representative on WhatsApp in 1 click.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
