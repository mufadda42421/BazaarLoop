import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CATEGORIES } from '../types';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { SafeImage } from '../components/SafeImage';
import {
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Truck,
  ShieldCheck,
  ChevronLeft,
  BadgeCheck,
  Package
} from 'lucide-react';

interface CreateListingViewProps {
  onNavigate: (view: string, param?: string) => void;
  editingProductId?: string;
}

export const CreateListingView: React.FC<CreateListingViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [warranty, setWarranty] = useState('1-Year Official Manufacturer Warranty');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState<string>(CATEGORIES[1] || 'Consumer Tech & Gadgets');
  const [subcategory, setSubcategory] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [location, setLocation] = useState(user?.city || 'San Francisco, CA');
  const [deliveryOptions, setDeliveryOptions] = useState<('shipping' | 'express_delivery' | 'local_pickup')[]>([
    'shipping',
    'express_delivery'
  ]);

  const [whatsappContactEnabled, setWhatsappContactEnabled] = useState(
    Boolean(user?.whatsappContactEnabled && user?.whatsappNumber && user?.whatsappOnListings)
  );

  // Photos state
  const [images, setImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setUploadProgress(10);

    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 8 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds the 8MB limit.`);
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        setUploadProgress(Math.round(((i + 0.5) / files.length) * 90));
        const uploaded = await api.uploadImage(dataUrl, file.name);
        newUrls.push(uploaded.url);
      } catch (err: any) {
        setUploadError(err.message || 'Failed to upload photo');
      }
    }

    setImages(prev => [...prev, ...newUrls].slice(0, 8));
    setUploadProgress(null);
    e.target.value = '';
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const toggleDeliveryOption = (opt: 'shipping' | 'express_delivery' | 'local_pickup') => {
    setDeliveryOptions(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

  const handleSubmit = async (status: 'active' | 'draft') => {
    setFormError(null);
    if (!title.trim()) {
      setFormError('Product title is required');
      return;
    }
    if (!description.trim()) {
      setFormError('Product description is required');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setFormError('Please enter a valid retail price');
      return;
    }
    if (!location.trim()) {
      setFormError('Warehouse / dispatch location is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createProduct({
        title: title.trim(),
        brand: brand.trim() || 'Brand Store',
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        warranty: warranty.trim(),
        description: description.trim(),
        price: Number(price),
        currency,
        category,
        subcategory: subcategory.trim(),
        condition: 'new', // 100% Brand New
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        images,
        location: location.trim(),
        deliveryOptions,
        whatsappContactEnabled,
        status
      });

      onNavigate('product', res.product.id);
    } catch (err: any) {
      setFormError(err.message || 'Failed to publish product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between border-b border-slate-200/60">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Cancel & Back
        </button>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-['Space_Grotesk']">
            Merchant Studio
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-wider uppercase mb-2">
            <BadgeCheck className="w-3.5 h-3.5" /> 100% Brand-New Retail Catalog
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk'] tracking-tight">
            Launch a Brand-New Product
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish genuine, factory-sealed products directly to the BazaarLoop marketplace with instant checkout and WhatsApp concierge support.
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <strong className="block font-bold">Please check the form</strong>
              <span>{formError}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Photo Uploader */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-['Space_Grotesk']">
                  Product Photos ({images.length}/8)
                </h3>
                <p className="text-xs text-slate-500">
                  Upload crisp retail photography. The first image will be your product cover.
                </p>
              </div>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {uploadError}
              </div>
            )}

            {uploadProgress !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Uploading photos...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Photo Grid with SafeImage */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm flex items-center justify-center"
                >
                  <SafeImage
                    src={imgUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    fallback={<Package className="w-8 h-8 text-slate-300" />}
                  />

                  {idx === 0 && (
                    <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      Cover Photo
                    </span>
                  )}

                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-[10px] font-semibold cursor-pointer"
                        title="Set as Cover"
                      >
                        Set Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {images.length < 8 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/20 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 cursor-pointer transition-all">
                  <Upload className="w-6 h-6 stroke-1" />
                  <span className="text-xs font-semibold">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Core Product Information */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-['Space_Grotesk']">
              Product Specifications & Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Brand / Manufacturer Name *
                </label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="e.g. Sony, Apple, Nike, Dyson, Aesop"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Model SKU / Code
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder="e.g. WH1000XM5-BLK"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. WH-1000XM5 Wireless Noise-Cancelling Headphones (Midnight Blue)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Warranty Coverage
                </label>
                <input
                  type="text"
                  value={warranty}
                  onChange={e => setWarranty(e.target.value)}
                  placeholder="e.g. 1-Year Official Manufacturer Warranty"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Product Description *
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide accurate brand specifications, package contents, dimensions, warranty, and authentic features..."
                className="w-full p-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 leading-relaxed"
              />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-['Space_Grotesk']">
              Pricing & Warehouse Stock
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Retail Price ($ USD) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="299.99"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Available Quantity (Units) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="10"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dispatch Warehouse Location *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Delivery options */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Shipping Methods *
              </label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={deliveryOptions.includes('shipping')}
                    onChange={() => toggleDeliveryOption('shipping')}
                    className="rounded text-indigo-600"
                  />
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>Standard Express Shipping</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={deliveryOptions.includes('express_delivery')}
                    onChange={() => toggleDeliveryOption('express_delivery')}
                    className="rounded text-indigo-600"
                  />
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Next-Day Priority Courier</span>
                </label>
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Ordering Switch */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <WhatsAppIcon className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-['Space_Grotesk']">
                    WhatsApp Retail Concierge Ordering
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Allow buyers to tap "Order via WhatsApp Concierge" to initiate instant purchase coordination with your phone number.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappContactEnabled}
                  onChange={e => setWhatsappContactEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('draft')}
              className="px-5 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('active')}
              className="px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-indigo-200 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Publishing Product...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Brand Product</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
