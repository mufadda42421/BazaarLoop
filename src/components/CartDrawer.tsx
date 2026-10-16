import React from 'react';
import { useCart } from '../context/CartContext';
import { SafeImage } from './SafeImage';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  Package,
  ExternalLink,
  MessageCircle
} from 'lucide-react';

interface CartDrawerProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalCount
  } = useCart();

  if (!isCartOpen) return null;

  const handleOpenListing = (productId: string) => {
    closeCart();
    onNavigate('product', productId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                  Shopping Bag ({totalCount})
                </h3>
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Brand New Retail Items
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prominent Delivery Notice Banner (No Free Delivery Option) */}
          <div className="px-5 py-3 bg-amber-50/90 border-b border-amber-200/70 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-950 mb-0.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>For delivery, contact your seller</span>
              </span>
              <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-semibold">
                Direct Delivery
              </span>
            </div>
            <p className="text-[10px] text-amber-800 leading-tight">
              Delivery schedule and courier fees are arranged directly with your seller.
            </p>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Your Bag is Empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explore our brand-new retail collections, technology, and essentials.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div key={product.id} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex gap-3.5 items-start">
                    {/* Thumbnail with SafeImage - clicking opens listing */}
                    <div
                      onClick={() => handleOpenListing(product.id)}
                      className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden flex-shrink-0 cursor-pointer flex items-center justify-center relative hover:opacity-90 transition-opacity"
                    >
                      <SafeImage
                        src={product.images?.[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        fallback={<Package className="w-6 h-6 text-slate-300" />}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {product.brand && (
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                              {product.brand}
                            </span>
                          )}
                          <h4
                            onClick={() => handleOpenListing(product.id)}
                            className="text-xs font-bold text-slate-900 truncate hover:text-indigo-600 cursor-pointer"
                          >
                            {product.title}
                          </h4>
                        </div>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        {/* Quantity stepper */}
                        <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-900 w-5 text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= (product.quantity || 99)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900 font-['Space_Grotesk']">
                            {product.currency} {(product.price * quantity).toLocaleString()}
                          </span>
                          {quantity > 1 && (
                            <span className="text-[10px] text-slate-400 block">
                              {product.currency} {product.price.toLocaleString()} each
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Explicit Order / View Listing Button for this item */}
                  <button
                    type="button"
                    onClick={() => handleOpenListing(product.id)}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Order This Item (Opens Listing)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-slate-900 font-['Space_Grotesk']">
                    ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Delivery Note: No Free Delivery Option */}
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                    Delivery
                  </span>
                  <span className="font-bold text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Contact seller for delivery
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-extrabold text-slate-900">
                  <span>Items Total</span>
                  <span className="text-indigo-600 font-['Space_Grotesk']">
                    ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Clicking Order from the Bag opens the product listing */}
              <button
                type="button"
                onClick={() => handleOpenListing(cart[0].product.id)}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Order from Bag (Opens Listing)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-center">
                <p className="text-[11px] text-amber-900 font-medium">
                  <strong>For delivery, contact your seller.</strong> Clicking Order opens the listing to view seller payment details (UPI, GPay, Apple Pay, PayPal, Card) and arrange delivery.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
