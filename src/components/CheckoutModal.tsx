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
  Smartphone,
  Check
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
  
  // Payment methods requested: UPI, GPay, Apple Pay, PayPal, Credit card or debit card
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'gpay' | 'apple_pay' | 'paypal' | 'card'>('upi');
  const [paymentIdentifier, setPaymentIdentifier] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (!isCheckoutOpen) return null;

  const total = subtotal;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('signin');
      return;
    }
    if (!fullName.trim() || !street.trim() || !city.trim() || !postalCode.trim()) {
      setErrorMsg('Please complete all required address fields');
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
        `Hello! I just placed order #${completedOrder.orderNumber} ($${completedOrder.total}). For delivery, please let me know when it can be dispatched.`
      )
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/Bazaar-Loop_Shopping_Bag_Logo_6ec1025c.png"
              alt="Bazaar-Loop Logo"
              className="w-9 h-9 object-contain rounded-xl shadow-xs border border-slate-200/50 bg-white"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                {completedOrder ? 'Order Confirmed!' : 'Direct Order & Checkout'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {completedOrder
                  ? `Order #${completedOrder.orderNumber} authorized`
                  : '100% Brand-New Retail Guarantee'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ORDER SUCCESS VIEW */}
        {completedOrder ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9 stroke-2" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                Thank You for Your Order!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your order <strong>#{completedOrder.orderNumber}</strong> has been received by the seller.
              </p>
            </div>

            {/* Note: For delivery contact your seller */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                <Truck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>For delivery, contact your seller</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                Please reach out to your seller via WhatsApp or messages to confirm your delivery address, preferred courier, and dispatch schedule.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-900 uppercase">{completedOrder.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="font-bold text-slate-900 text-right">
                  {completedOrder.shippingAddress.street}, {completedOrder.shippingAddress.city}
                </span>
              </div>
              <div className="flex justify-between py-1 text-sm font-extrabold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-indigo-600 font-['Space_Grotesk']">
                  ${completedOrder.total.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* WhatsApp Contact Action */}
            {phone && (
              <a
                href={whatsAppOrderTrackingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <WhatsAppIcon className="w-5 h-5 fill-white" />
                <span>Contact Seller on WhatsApp for Delivery Updates</span>
              </a>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleViewOrders}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                View My Orders
              </button>
              <button
                onClick={handleClose}
                className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* CHECKOUT FORM */
          <form onSubmit={handlePlaceOrder} className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Notice: For delivery contact your seller */}
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <strong className="block font-bold">For delivery, contact your seller</strong>
                <span className="text-[11px] text-amber-800">
                  Exact delivery fees and dispatch options are arranged directly with your seller upon order.
                </span>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Delivery Address</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Recipient's full name"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Mobile for delivery contact"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder="House / Flat / Street address"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    placeholder="Postal / PIN code"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods Section (UPI, GPay, Apple Pay, PayPal, Credit/Debit card) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Payment Method</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {/* UPI */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-base mb-0.5">⚡</div>
                  <span>UPI</span>
                </button>

                {/* GPay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('gpay')}
                  className={`p-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    paymentMethod === 'gpay'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-base mb-0.5">🌐</div>
                  <span>GPay</span>
                </button>

                {/* Apple Pay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`p-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    paymentMethod === 'apple_pay'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-base mb-0.5">🍎</div>
                  <span>Apple Pay</span>
                </button>

                {/* PayPal */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    paymentMethod === 'paypal'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-base mb-0.5">🅿️</div>
                  <span>PayPal</span>
                </button>

                {/* Credit card or debit card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`col-span-2 sm:col-span-2 p-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-0.5 text-indigo-600" />
                  <span>Credit Card or Debit Card</span>
                </button>
              </div>

              {/* Dynamic input for selected payment method */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                {paymentMethod === 'upi' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Enter Your UPI ID (VPA)</label>
                    <input
                      type="text"
                      value={paymentIdentifier}
                      onChange={e => setPaymentIdentifier(e.target.value)}
                      placeholder="e.g. name@oksbi / mobile@upi"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
                {paymentMethod === 'gpay' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Google Pay Mobile Number / ID</label>
                    <input
                      type="text"
                      value={paymentIdentifier}
                      onChange={e => setPaymentIdentifier(e.target.value)}
                      placeholder="e.g. +1 555 0192 or GPay handle"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
                {paymentMethod === 'apple_pay' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Apple Pay Confirmation</label>
                    <input
                      type="text"
                      value={paymentIdentifier}
                      onChange={e => setPaymentIdentifier(e.target.value)}
                      placeholder="Apple ID phone or email"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
                {paymentMethod === 'paypal' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">PayPal Email Address</label>
                    <input
                      type="email"
                      value={paymentIdentifier}
                      onChange={e => setPaymentIdentifier(e.target.value)}
                      placeholder="yourname@paypal.com"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
                {paymentMethod === 'card' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-700">Card Information</label>
                    <input
                      type="text"
                      placeholder="Card Number (Visa, Mastercard, RuPay)"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        className="p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  Delivery
                </span>
                <span className="font-bold text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Contact seller for delivery
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
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm Order & Contact Seller</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
