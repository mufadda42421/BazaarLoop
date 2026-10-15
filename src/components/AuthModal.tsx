import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COUNTRY_CODES } from '../types';
import { WhatsAppIcon } from './WhatsAppIcon';
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register'>(authModalMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Sync mode when parent opens
  React.useEffect(() => {
    setMode(authModalMode);
    setError(null);
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

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

        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          whatsappCountryCode,
          whatsappLocalNumber: whatsappLocalNumber.trim(),
          whatsappContactEnabled: whatsappContactEnabled && Boolean(whatsappLocalNumber.trim()),
          isDifferentPhone,
          phoneNumber: phoneNumber.trim(),
          phoneCallEnabled
        });
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFillSeller = () => {
    const randomSuffix = Math.floor(Math.random() * 1000);
    setName('Alex Vance');
    setEmail(`alex.seller${randomSuffix}@example.com`);
    setPassword('Pass1234!');
    setConfirmPassword('Pass1234!');
    setWhatsappCountryCode('+1');
    setWhatsappLocalNumber('4155552671');
    setWhatsappContactEnabled(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <span className="font-bold text-lg">B</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">
                {mode === 'signin' ? 'Sign in to BazaarLoop' : 'Create your account'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'signin' ? 'Welcome back! Access your messages and listings.' : 'Join the marketplace as a buyer, seller, or both.'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200/80 bg-slate-100/50 p-1 mx-6 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
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
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
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
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
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
                Email Address
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
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>

                {/* WHATSAPP INTEGRATION SECTION */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <WhatsAppIcon className="text-emerald-500 w-5 h-5" />
                    <h3 className="text-sm font-bold text-slate-900">
                      WhatsApp Contact <span className="text-xs font-normal text-slate-400">(Optional for Buyers)</span>
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-emerald-900">
                    Your WhatsApp number is used for marketplace contact features. It will only be shared according to your contact preferences and when you choose to make it available.
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      WhatsApp Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={whatsappCountryCode}
                        onChange={e => setWhatsappCountryCode(e.target.value)}
                        className="w-36 py-2.5 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 pt-1">
                    <input
                      type="checkbox"
                      checked={whatsappContactEnabled}
                      onChange={e => setWhatsappContactEnabled(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      <strong className="text-slate-900">Allow buyers to contact me through WhatsApp</strong>
                      <br />
                      <span className="text-slate-500 text-[11px]">Enables a "Chat on WhatsApp" button on your listings and storefront.</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={isDifferentPhone}
                      onChange={e => setIsDifferentPhone(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>My WhatsApp number is different from my account phone number</span>
                  </label>

                  {isDifferentPhone && (
                    <div className="pl-6 pt-1 space-y-2">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="Regular phone number"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={phoneCallEnabled}
                          onChange={e => setPhoneCallEnabled(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Allow direct phone voice calls (tel: link)</span>
                      </label>
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
                'Sign In'
              ) : (
                'Create BazaarLoop Account'
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill for Convenience */}
          {mode === 'register' && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleQuickFillSeller}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
              >
                Pre-fill with sample seller info & WhatsApp (+1 415 555 2671)
              </button>
            </div>
          )}
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
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
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
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
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
