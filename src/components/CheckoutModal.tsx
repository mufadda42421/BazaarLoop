import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api, buildWhatsAppChatUrl } from '../services/api';
import { Order } from '../types';
import { SafeImage } from './SafeImage';
import { WhatsAppIcon } from './WhatsAppIcon';
import {
  X,
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Package,
  MapPin,
  Clock,
  ArrowRight,
  AlertCircle,
  Smartphone
} from 'lucide-react';

interface CheckoutModalProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onNavigate }) => {
  const { cart, subtotal, isCheckoutOpen, closeCheckout, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();

  const [fullName, setFullName] = useState(user?.name || '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(user?.city || 'San Francisco');
  const [state, setState] = useState('CA');
  const [postalCode, setPostalCode] = useState('94105');
  const [phone, setPhone] = useState(user?.whatsappNumber || user?.phoneNumber || '');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'cod'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (!isCheckoutOpen) return null;

  const shippingCost = subtotal >= 50 ? 0 : 9.99;
  const total = subtotal + shippingCost;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('signin');
      return;
    }
    if (!fullName.trim() || !street.trim() || !city.trim() || !postalCode.trim()) {
      setErrorMsg('Please complete all required shipping fields');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const orderPayload = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        shippingAddress: {
          fullName: fullName.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          phone: phone.trim()
        },
        paymentMethod
      };

      const res = await api.createOrder(orderPayload);
      setCompletedOrder(res.order);
      clearCart();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please check item stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCompletedOrder(null);
    closeCheckout();
  };

  const handleViewOrders = () => {
    handleClose();
    onNavigate('buyer-hub');
  };

  const whatsAppOrderTrackingLink = completedOrder && phone
    ? buildWhatsAppChatUrl(
        phone,
        `Hello BazaarLoop Store! I just placed order #${completedOrder.orderNumber} ($${completedOrder.total}). Tracking: ${completedOrder.trackingNumber}. Please send delivery alerts here.`
      )
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              BL
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                {completedOrder ? 'Order Confirmed!' : 'Express Checkout & Delivery'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {completedOrder ? 'Your brand-new items are being prepared' : '100% Genuine Retail • Factory Sealed Guaranteed'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completed Order Confirmation View */}
        {completedOrder ? (
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
                Order #{completedOrder.orderNumber}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk'] mt-1">
                Thank You for Your Order!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Your order has been authorized and dispatched to the warehouse. Estimated delivery date: <strong>{completedOrder.estimatedDelivery}</strong>.
              </p>
            </div>

            {/* Tracking Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Carrier:</span>
                <span className="font-bold text-slate-900">{completedOrder.carrier}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tracking Code:</span>
                <span className="font-mono font-bold text-indigo-600">{completedOrder.trackingNumber}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="font-medium text-slate-800 text-right truncate max-w-[200px]">
                  {completedOrder.shippingAddress.street}, {completedOrder.shippingAddress.city}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-extrabold text-slate-900">
                <span>Total Paid:</span>
                <span>${completedOrder.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
              <button
                onClick={handleViewOrders}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Track in Buyer Hub</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {whatsAppOrderTrackingLink && (
                <a
                  href={whatsAppOrderTrackingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                  <span>WhatsApp Concierge</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handlePlaceOrder} className="p-6 space-y-6">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Shipping Address */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Shipping Address</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder="e.g. 500 Howard Street, Suite 400"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="San Francisco"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      placeholder="CA"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      placeholder="94105"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Phone (for delivery SMS/WhatsApp updates) *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 415 555 0199"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Payment Method</span>
              </h4>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                  <span>Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`p-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    paymentMethod === 'apple_pay'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 mx-auto mb-1 text-slate-800" />
                  <span>Apple / GPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span>Cash on Delivery</span>
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Express Priority Delivery</span>
                <span className="font-bold text-emerald-600">
                  {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Total</span>
                <span className="text-indigo-600 font-['Space_Grotesk']">${total.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeCheckout}
                className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Bag
              </button>
              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Authorizing & Placing Order...' : `Pay $${total.toFixed(2)} & Place Order`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
