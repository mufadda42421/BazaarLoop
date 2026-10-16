import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Product, AdCampaign } from '../types';
import { api } from '../services/api';
import { SafeImage } from '../components/SafeImage';
import {
  Megaphone,
  Sparkles,
  TrendingUp,
  Clock,
  Eye,
  MousePointer,
  DollarSign,
  Plus,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ShieldCheck
} from 'lucide-react';

interface AdvertisingViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AdvertisingView: React.FC<AdvertisingViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New campaign modal
  const [showModal, setShowModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'Starter Boost' | 'Growth Spotlight' | 'Market Leader'>('Growth Spotlight');
  const [durationDays, setDurationDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [campRes, prodRes] = await Promise.all([
        api.getCampaigns(),
        api.getProducts({ sellerId: user.id })
      ]);
      setCampaigns(campRes.campaigns || []);
      setProducts(prodRes.products || []);
      if (prodRes.products?.length > 0 && !selectedProductId) {
        setSelectedProductId(prodRes.products[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const planPricing = {
    'Starter Boost': { pricePerDay: 5, multiplier: '2x Feed Visibility', badge: 'Standard' },
    'Growth Spotlight': { pricePerDay: 12, multiplier: '5x Visibility + Category Top', badge: 'Popular' },
    'Market Leader': { pricePerDay: 28, multiplier: '10x Visibility + Homepage Hero Badge', badge: 'Maximum Reach' }
  };

  const calculatedBudget = planPricing[selectedPlan].pricePerDay * durationDays;

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setErrorMsg('Please select a product to promote');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.createCampaign({
        productId: selectedProductId,
        planName: selectedPlan,
        budgetUSD: calculatedBudget,
        durationDays
      });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCampaignStatus = async (c: AdCampaign, newStatus: string) => {
    try {
      await api.updateCampaignStatus(c.id, newStatus);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update campaign');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24">
      {/* Header */}
      <section className="bg-white border-b border-slate-200/60 pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest font-['Space_Grotesk']">
              Promotions & Growth
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk'] mt-1">
              BazaarLoop Advertising Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Promote your listings to reach more buyers across the discovery feed and category highlights.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            disabled={products.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-amber-200 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create New Campaign</span>
          </button>
        </div>
      </section>

      {/* Main Campaign Management */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Transparent Honesty Banner */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Transparent Campaign Billing Guarantee</strong>
            <span>
              Campaign drafts are labeled "Pending Payment / Draft" until payment is finalized. BazaarLoop will never fake campaign success metrics, fabricate impressions, or claim advertising spend has occurred without real operations.
            </span>
          </div>
        </div>

        {/* Existing Campaigns */}
        <div>
          <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] mb-4">
            Your Advertising Campaigns ({campaigns.length})
          </h2>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
              <h3 className="text-base font-bold text-slate-900">No Advertising Campaigns Yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Boost your listings to get featured in search results and category recommendations.
              </p>
              <button
                onClick={() => setShowModal(true)}
                disabled={products.length === 0}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold"
              >
                Launch your first campaign
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <SafeImage
                      src={c.productImage}
                      alt={c.productTitle || ''}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-100 flex-shrink-0 border border-slate-100"
                      fallback={
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-100 text-slate-400">
                          <Megaphone className="w-5 h-5" />
                        </div>
                      }
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {c.productTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                          {c.planName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Budget: ${c.budgetUSD} ({c.durationDays} days)</span>
                        <span>•</span>
                        <span>Spend: ${c.spendUSD}</span>
                        <span>•</span>
                        <span>Impressions: {c.impressions}</span>
                        <span>•</span>
                        <span>Clicks: {c.clicks}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {c.status === 'active' ? (
                      <button
                        onClick={() => handleToggleCampaignStatus(c, 'paused')}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </button>
                    ) : c.status === 'paused' ? (
                      <button
                        onClick={() => handleToggleCampaignStatus(c, 'active')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume
                      </button>
                    ) : null}

                    <button
                      onClick={() => handleToggleCampaignStatus(c, 'ended')}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold"
                    >
                      End Campaign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Advertising Campaign</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Product Listing to Promote *
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.currency} {p.price}) - {p.quantity} in stock
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Promotion Tier
                </label>
                <div className="space-y-2">
                  {(Object.keys(planPricing) as (keyof typeof planPricing)[]).map(planKey => {
                    const info = planPricing[planKey];
                    const isSelected = selectedPlan === planKey;
                    return (
                      <div
                        key={planKey}
                        onClick={() => setSelectedPlan(planKey)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{planKey}</span>
                          <span className="text-xs font-extrabold text-amber-700">
                            ${info.pricePerDay}/day
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{info.multiplier}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Campaign Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 7, 14, 30].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        durationDays === days
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Plan Rate:</span>
                  <span>${planPricing[selectedPlan].pricePerDay} / day</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                  <span>Total Budget:</span>
                  <span>${calculatedBudget} USD</span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Campaign will be registered as an unpaid draft until payment verification is completed.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Submit Campaign Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
