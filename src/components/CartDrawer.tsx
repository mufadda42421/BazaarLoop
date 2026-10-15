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
  Sparkles,
  Package
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
    totalCount,
    openCheckout
  } = useCart();

  if (!isCartOpen) return null;

  const FREE_SHIPPING_THRESHOLD = 50;
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const diffToFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

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
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Brand New & Factory Sealed
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

          {/* Free Shipping Progress Bar */}
          <div className="px-5 py-3 bg-indigo-50/60 border-b border-indigo-100/60 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950 mb-1.5">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                {diffToFree === 0 ? 'Free Express Delivery Unlocked!' : `Add $${diffToFree.toFixed(2)} more for Free Express Shipping`}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-indigo-200/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
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
                  Explore our brand-new retail collections, technology, and designer items.
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
                <div key={product.id} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                  {/* Thumbnail with SafeImage */}
                  <div
                    onClick={() => {
                      closeCart();
                      onNavigate('product', product.id);
                    }}
                    className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden flex-shrink-0 cursor-pointer flex items-center justify-center relative"
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
                          onClick={() => {
                            closeCart();
                            onNavigate('product', product.id);
                          }}
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
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 font-['Space_Grotesk']">
                    ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Express Shipping</span>
                  <span className="font-bold text-emerald-600">
                    {diffToFree === 0 ? 'FREE' : '$9.99'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-extrabold text-slate-900">
                  <span>Estimated Total</span>
                  <span className="text-indigo-600 font-['Space_Grotesk']">
                    ${(subtotal + (diffToFree === 0 ? 0 : 9.99)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                onClick={openCheckout}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>30-Day Money-Back Guarantee • Factory Sealed Delivery</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
