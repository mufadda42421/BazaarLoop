import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COUNTRY_CODES } from '../types';
import { WhatsAppIcon } from './WhatsAppIcon';
import { PaymentMethodType } from '../types';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  CreditCard,
  Smartphone,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, login, register, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register'>(authModalMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // WhatsApp fields
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+1');
  const [whatsappLocalNumber, setWhatsappLocalNumber] = useState('');
  const [whatsappContactEnabled, setWhatsappContactEnabled] = useState(false);
  const [isDifferentPhone, setIsDifferentPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCallEnabled, setPhoneCallEnabled] = useState(false);

  // Banking and Payment Details for Registration
  const [showBankingSection, setShowBankingSection] = useState(true);
  const [acceptedMethods, setAcceptedMethods] = useState<PaymentMethodType[]>([
    'upi',
    'gpay',
    'apple_pay',
    'paypal',
    'card'
  ]);
  const [upiId, setUpiId] = useState('');
  const [gpayNumber, setGpayNumber] = useState('');
  const [applePayId, setApplePayId] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscOrRouting, setIfscOrRouting] = useState('');
  const [cardType, setCardType] = useState<'credit' | 'debit' | 'both'>('both');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Sync mode when parent opens
  React.useEffect(() => {
    setMode(authModalMode);
    setError(null);
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

  const toggleMethod = (method: PaymentMethodType) => {
    setAcceptedMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          throw new Error('Please enter your email and password');
        }
        await login(email.trim(), password);
      } else {
        if (!name.trim()) throw new Error('Full name is required');
        if (!email.trim()) throw new Error('Email address is required');
        if (!password) throw new Error('Password is required');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        if (password !== confirmPassword) throw new Error('Passwords do not match');

        // If WhatsApp number provided, validate basic length
        if (whatsappLocalNumber.trim()) {
          const digitsOnly = whatsappLocalNumber.replace(/[^0-9]/g, '');
          if (digitsOnly.length < 5 || digitsOnly.length > 14) {
            throw new Error('Please enter a valid phone number (digits only, 5-14 digits)');
          }
        }

        const bankingDetailsPayload = {
          acceptedMethods,
          upiId: upiId.trim(),
          gpayNumber: gpayNumber.trim(),
          applePayId: applePayId.trim(),
          paypalEmail: paypalEmail.trim(),
          bankName: bankName.trim(),
          accountHolder: accountHolder.trim() || name.trim(),
          accountNumber: accountNumber.trim(),
          ifscOrRouting: ifscOrRouting.trim(),
          cardType,
          paymentNotes: paymentNotes.trim()
        };

        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          whatsappCountryCode,
          whatsappLocalNumber: whatsappLocalNumber.trim(),
          whatsappContactEnabled: whatsappContactEnabled && Boolean(whatsappLocalNumber.trim()),
          isDifferentPhone,
          phoneNumber: phoneNumber.trim(),
          phoneCallEnabled,
          bankingDetails: bankingDetailsPayload
        });
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToRegisterWithCurrentEmail = () => {
    setMode('register');
    setName(email.split('@')[0] ? email.split('@')[0].replace(/[._-]/g, ' ') : 'Shopper');
    setConfirmPassword(password);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/Bazaar-Loop_Shopping_Bag_Logo_6ec1025c.png"
              alt="Bazaar-Loop Logo"
              className="w-10 h-10 object-contain rounded-2xl shadow-sm border border-slate-200/60 bg-white"
            />
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight flex items-center gap-2">
                {mode === 'signin' ? 'Sign in to BazaarLoop' : 'Create BazaarLoop Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'signin'
                  ? 'Access your orders, shopping bag, wishlist & storefront.'
                  : 'Join the direct e-commerce retail marketplace.'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200/80 bg-slate-100/50 p-1 mx-6 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">
                <span>{error}</span>
                {mode === 'signin' && error.toLowerCase().includes('invalid') && (
                  <button
                    type="button"
                    onClick={handleSwitchToRegisterWithCurrentEmail}
                    className="block mt-1.5 text-xs font-semibold text-indigo-700 hover:underline cursor-pointer"
                  >
                    Don't have an account yet? Click to Register with {email || 'this email'} →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 1-Click Firebase Google Authentication */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? 'Connecting with Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              or continue with email
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>

                {/* WhatsApp & Contact Section */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">
                      WhatsApp Contact (Optional)
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Phone Number for WhatsApp Concierge / Orders
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={whatsappCountryCode}
                        onChange={e => setWhatsappCountryCode(e.target.value)}
                        className="w-36 py-2 px-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code} ({c.country.substring(0, 10)})
                          </option>
                        ))}
                      </select>

                      <input
                        type="tel"
                        value={whatsappLocalNumber}
                        onChange={e => setWhatsappLocalNumber(e.target.value)}
                        placeholder="e.g. 415 555 2671"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={whatsappContactEnabled}
                      onChange={e => setWhatsappContactEnabled(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      <strong className="text-slate-900">Enable WhatsApp for order chat & delivery alerts</strong>
                    </span>
                  </label>
                </div>

                {/* BANKING & PAYMENT DETAILS SECTION */}
                <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 rounded-2xl border border-indigo-200/80 space-y-3">
                  <div
                    onClick={() => setShowBankingSection(!showBankingSection)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Banking & Payment Details
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Configure your payment methods (UPI, GPay, Apple Pay, PayPal, Card)
                        </span>
                      </div>
                    </div>
                    <button type="button" className="text-indigo-600 p-1">
                      {showBankingSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {showBankingSection && (
                    <div className="space-y-3.5 pt-2 border-t border-indigo-100">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Accepted / Preferred Payment Methods
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                          {[
                            { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, BHIM' },
                            { id: 'gpay', label: 'GPay', desc: 'Google Pay' },
                            { id: 'apple_pay', label: 'Apple Pay', desc: 'Apple Wallet' },
                            { id: 'paypal', label: 'PayPal', desc: 'Global online' },
                            { id: 'card', label: 'Credit/Debit Card', desc: 'Visa, MC, RuPay, Bank' }
                          ].map(item => {
                            const isSelected = acceptedMethods.includes(item.id as PaymentMethodType);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => toggleMethod(item.id as PaymentMethodType)}
                                className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-xs">{item.label}</div>
                                  <div className={`text-[9px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                    {item.desc}
                                  </div>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* UPI ID Field */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          UPI ID / VPA
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={e => setUpiId(e.target.value)}
                          placeholder="e.g. yourname@oksbi or 9876543210@upi"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      {/* GPay Field */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          GPay Number / ID
                        </label>
                        <input
                          type="text"
                          value={gpayNumber}
                          onChange={e => setGpayNumber(e.target.value)}
                          placeholder="e.g. +1 555 123 4567 or gpay-handle"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      {/* Apple Pay Field */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Apple Pay ID / Phone / Email
                        </label>
                        <input
                          type="text"
                          value={applePayId}
                          onChange={e => setApplePayId(e.target.value)}
                          placeholder="e.g. applepay@example.com or +1 415 555 0192"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      {/* PayPal Field */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          PayPal Email or PayPal.Me Link
                        </label>
                        <input
                          type="text"
                          value={paypalEmail}
                          onChange={e => setPaypalEmail(e.target.value)}
                          placeholder="e.g. payments@example.com or paypal.me/handle"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      {/* Card & Bank Details */}
                      <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 space-y-2">
                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                          Credit Card / Debit Card & Bank Transfer Details
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500">Bank Name</label>
                            <input
                              type="text"
                              value={bankName}
                              onChange={e => setBankName(e.target.value)}
                              placeholder="e.g. Chase / HDFC / Wells Fargo"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500">Account Holder Name</label>
                            <input
                              type="text"
                              value={accountHolder}
                              onChange={e => setAccountHolder(e.target.value)}
                              placeholder="Account holder name"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500">Account / Card Number</label>
                            <input
                              type="text"
                              value={accountNumber}
                              onChange={e => setAccountNumber(e.target.value)}
                              placeholder="Account # or Card Last 4"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500">IFSC / Routing / SWIFT</label>
                            <input
                              type="text"
                              value={ifscOrRouting}
                              onChange={e => setIfscOrRouting(e.target.value)}
                              placeholder="Routing / IFSC Code"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Payment Notes */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Payment Instructions / Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={paymentNotes}
                          onChange={e => setPaymentNotes(e.target.value)}
                          placeholder="e.g. Please share payment receipt on WhatsApp for instant order confirmation"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'signin' ? (
                'Sign In to BazaarLoop'
              ) : (
                'Create BazaarLoop Account'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 text-center">
          <p className="text-xs text-slate-500">
            {mode === 'signin' ? (
              <>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
