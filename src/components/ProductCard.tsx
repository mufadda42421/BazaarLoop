import React from 'react';
import { Product } from '../types';
import { Heart, MapPin, Sparkles, ShoppingBag, CheckCircle, Package } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { SafeImage } from './SafeImage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api, buildWhatsAppChatUrl, generateWhatsAppMessage } from '../services/api';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onSavedToggle?: (productId: string, isSaved: boolean) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onSavedToggle }) => {
  const { user, openAuthModal } = useAuth();
  const { addToCart } = useCart();
  const [isSaved, setIsSaved] = React.useState(Boolean(product.isSaved));
  const [savesCount, setSavesCount] = React.useState(product.savesCount || 0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [addedAnimation, setAddedAnimation] = React.useState(false);

  React.useEffect(() => {
    setIsSaved(Boolean(product.isSaved));
    setSavesCount(product.savesCount || 0);
  }, [product.isSaved, product.savesCount]);

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('signin');
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      const nextSaved = !isSaved;
      setIsSaved(nextSaved);
      setSavesCount(prev => (nextSaved ? prev + 1 : Math.max(0, prev - 1)));
      const res = await api.toggleSaveProduct(product.id);
      setIsSaved(res.saved);
      setSavesCount(res.savesCount);
      onSavedToggle?.(product.id, res.saved);
    } catch {
      setIsSaved(!isSaved);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const isOutOfStock = product.quantity === 0 || product.status === 'out_of_stock';
  const hasWhatsApp = Boolean(product.sellerWhatsApp?.normalizedNumber);

  const whatsAppDirectMsg = generateWhatsAppMessage('order_now', product);
  const whatsAppDirectUrl = product.sellerWhatsApp?.normalizedNumber
    ? buildWhatsAppChatUrl(product.sellerWhatsApp.normalizedNumber, whatsAppDirectMsg)
    : '';

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Product Media Box */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        <SafeImage
          src={product.images?.[0]}
          alt={product.title}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isOutOfStock ? 'grayscale opacity-75' : ''
          }`}
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
              <Package className="w-10 h-10 mb-1 stroke-1" />
              <span className="text-[11px] text-slate-400 font-medium">New Stock Item</span>
            </div>
          }
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          <span className="bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Brand New
          </span>

          {product.isSponsored && (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Featured Brand
            </span>
          )}

          {isOutOfStock && (
            <span className="bg-rose-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
              Out of Stock
            </span>
          )}
        </div>

        {/* Top right actions */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {hasWhatsApp && (
            <a
              href={whatsAppDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              title="Order directly via Merchant WhatsApp"
              className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 transition-transform hover:scale-110"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
            </a>
          )}

          <button
            onClick={handleHeartClick}
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-slate-600 hover:text-rose-500 flex items-center justify-center shadow-sm hover:scale-110 transition-all cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
              }`}
            />
          </button>
        </div>

        {/* Photo count indicator */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/60 backdrop-blur-sm text-white text-[10px] font-medium">
            {product.images.length} photos
          </div>
        )}

        {/* Quick Add to Bag hover button */}
        {!isOutOfStock && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleQuickAdd}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/95 hover:bg-white text-slate-900 backdrop-blur-md hover:text-indigo-600'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{addedAnimation ? 'Added to Bag!' : 'Quick Add to Bag'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Brand & Price */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider truncate">
              {product.brand || product.category}
            </span>
            <span className="text-base font-extrabold text-slate-900 tracking-tight font-['Space_Grotesk']">
              {product.currency} {product.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
            {product.title}
          </h3>
        </div>

        {/* Bottom meta */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 truncate max-w-[140px]">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="truncate">{product.location || 'Express Dispatch'}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span>In Stock ({product.quantity})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
