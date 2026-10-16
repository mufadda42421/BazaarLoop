import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Product, Review } from '../types';
import { api, buildWhatsAppChatUrl, buildWhatsAppCallUrl } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ReportModal } from '../components/ReportModal';
import { SafeImage } from '../components/SafeImage';
import {
  Store,
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  Users,
  MessageSquare,
  ChevronLeft,
  BadgeCheck,
  Package,
  Truck,
  CreditCard
} from 'lucide-react';

interface StorefrontViewProps {
  sellerId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({ sellerId, onNavigate }) => {
  const { user, openAuthModal } = useAuth();

  const [seller, setSeller] = useState<any>(null);
  const [listings, setListings] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Report modal
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const fetchStorefrontData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStorefront(sellerId);
      setSeller(res.seller);
      setListings(res.listings || []);
      setReviews(res.reviews || []);
      setIsFollowing(Boolean(res.seller?.isFollowing));
      setFollowersCount(res.seller?.followersCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStorefrontData();
  }, [sellerId]);

  const handleToggleFollow = async () => {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    try {
      const res = await api.toggleFollow(sellerId);
      setIsFollowing(res.isFollowing);
      setFollowersCount(res.followersCount);
    } catch {}
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('signin');
      return;
    }
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const res = await api.submitReview(sellerId, reviewRating, reviewComment.trim());
      setReviews(prev => [res.review, ...prev]);
      setReviewComment('');
      setShowReviewModal(false);
      fetchStorefrontData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading official brand storefront...
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Brand Store Not Found</h2>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          Back to Store
        </button>
      </div>
    );
  }

  const isOwner = user?.id === seller.id;

  const whatsAppChatUrl = seller.whatsappContactEnabled && seller.whatsappNumber
    ? buildWhatsAppChatUrl(
        seller.whatsappNumber,
        `Hello ${seller.name}! I am browsing your official storefront on BazaarLoop and would like to inquire about your products.`
      )
    : '';

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Store
        </button>
      </div>

      {/* Seller Header Banner */}
      <section className="bg-white border-b border-slate-200/60 pb-8 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Seller profile info */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-sm border border-slate-200 flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-2xl flex-shrink-0">
                <SafeImage
                  src={seller.avatarUrl}
                  alt={seller.name}
                  className="w-full h-full object-cover"
                  fallback={<span>{seller.name.charAt(0).toUpperCase()}</span>}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                    {seller.name}
                  </h1>
                  {seller.isVerified && (
                    <span title="Verified Official Merchant Store">
                      <BadgeCheck className="w-5 h-5 text-indigo-600" />
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {seller.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {seller.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Merchant since {new Date(seller.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> {followersCount} followers
                  </span>
                  {seller.rating > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {seller.rating} ({seller.reviewsCount} reviews)
                    </span>
                  )}
                </div>

                {seller.bio && (
                  <p className="text-xs text-slate-600 max-w-xl pt-1 leading-relaxed">
                    "{seller.bio}"
                  </p>
                )}
              </div>
            </div>

            {/* Actions Panel */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {!isOwner && (
                <>
                  <button
                    onClick={handleToggleFollow}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isFollowing
                        ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                    }`}
                  >
                    {isFollowing ? 'Following Store' : 'Follow Brand Store'}
                  </button>

                  <button
                    onClick={() => {
                      if (!user) openAuthModal('signin');
                      else setShowReviewModal(true);
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Leave Brand Review
                  </button>

                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="px-3 py-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs cursor-pointer"
                    title="Report Store"
                  >
                    Report
                  </button>
                </>
              )}

              {/* WhatsApp direct concierge button */}
              {whatsAppChatUrl && (
                <a
                  href={whatsAppChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                  <span>Chat on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Store Listings */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Delivery & Payment Methods Banner */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-950">
            <Truck className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <strong className="block font-bold">For delivery, contact your seller</strong>
              <span className="text-[11px] text-amber-800">
                Courier dispatch, tracking, and delivery schedules are coordinated directly with this store.
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500 mr-1">Accepted Payments:</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-800">⚡ UPI</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-800">🌐 GPay</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-800">🍎 Apple Pay</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-800">🅿️ PayPal</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-800">💳 Card</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider font-['Space_Grotesk']">
            Brand Catalog ({listings.length})
          </h2>
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> 100% Brand-New Factory-Sealed Goods
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
            <h3 className="text-base font-bold text-slate-900">No active products right now</h3>
            <p className="text-xs text-slate-500 mt-1">
              This brand store is currently restocking new seasonal collections.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {listings.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onNavigate('product', product.id)}
              />
            ))}
          </div>
        )}

        {/* Brand Customer Reviews */}
        <section className="pt-8 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
              Customer Reviews ({reviews.length})
            </h3>
            {!isOwner && (
              <button
                onClick={() => {
                  if (!user) openAuthModal('signin');
                  else setShowReviewModal(true);
                }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Write a Review
              </button>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No customer reviews yet. Be the first to review after an order!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.map(r => (
                <div key={r.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{r.reviewerName}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">"{r.comment}"</p>
                  <span className="text-[10px] text-slate-400 block">
                    Verified Purchase • {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Leave Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                Review {seller.name}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{reviewRating} Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your Review
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share details about product condition, packaging, and shipping speed..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="user"
        targetId={seller.id}
        targetTitleOrName={seller.name}
      />
    </div>
  );
};
