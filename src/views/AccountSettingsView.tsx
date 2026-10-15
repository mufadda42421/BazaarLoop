import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { COUNTRY_CODES } from '../types';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { SafeImage } from '../components/SafeImage';
import {
  User as UserIcon,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  Upload,
  Lock,
  ChevronLeft,
  Info
} from 'lucide-react';

interface AccountSettingsViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ onNavigate }) => {
  const { user, updateProfile, updateWhatsAppSettings, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'whatsapp' | 'profile' | 'security'>('whatsapp');

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // WhatsApp fields
  const [whatsappCountryCode, setWhatsappCountryCode] = useState(user?.whatsappCountryCode || '+1');
  const [whatsappLocalNumber, setWhatsappLocalNumber] = useState(user?.whatsappLocalNumber || '');
  const [whatsappContactEnabled, setWhatsappContactEnabled] = useState(Boolean(user?.whatsappContactEnabled));
  const [whatsappNumberPublic, setWhatsappNumberPublic] = useState(Boolean(user?.whatsappNumberPublic));
  const [whatsappContactPreference, setWhatsappContactPreference] = useState<'direct_chat' | 'on_request'>(
    user?.whatsappContactPreference || 'direct_chat'
  );
  const [whatsappOnStorefront, setWhatsappOnStorefront] = useState(user?.whatsappOnStorefront ?? true);
  const [whatsappOnListings, setWhatsappOnListings] = useState(user?.whatsappOnListings ?? true);

  // Phone fields
  const [isDifferentPhone, setIsDifferentPhone] = useState(Boolean(user?.isDifferentPhone));
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [phoneCallEnabled, setPhoneCallEnabled] = useState(Boolean(user?.phoneCallEnabled));

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateProfile({ name, bio, city, avatarUrl });
      setSuccessMsg('Your profile has been updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateWhatsAppSettings({
        whatsappCountryCode,
        whatsappLocalNumber: whatsappLocalNumber.trim(),
        whatsappContactEnabled,
        whatsappNumberPublic,
        whatsappContactPreference,
        whatsappOnStorefront,
        whatsappOnListings,
        isDifferentPhone,
        phoneNumber: phoneNumber.trim(),
        phoneCallEnabled
      });
      setSuccessMsg('WhatsApp & contact preferences saved. Listings have been synced.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update WhatsApp settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveWhatsAppNumber = async () => {
    if (!confirm('Are you sure you want to remove your WhatsApp phone number? WhatsApp contact buttons will be immediately disabled on all your listings.')) return;
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateWhatsAppSettings({
        whatsappLocalNumber: '',
        whatsappContactEnabled: false
      });
      setWhatsappLocalNumber('');
      setWhatsappContactEnabled(false);
      setSuccessMsg('WhatsApp phone number removed and contact options disabled.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove WhatsApp number');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your account? All your active listings will be removed from the marketplace.')) return;
    try {
      await api.deactivateAccount();
      logout();
      onNavigate('home');
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate account');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const uploadRes = await api.uploadImage(reader.result as string, 'avatar.jpg');
        setAvatarUrl(uploadRes.url);
      } catch (err: any) {
        alert(err.message || 'Failed to upload avatar');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between border-b border-slate-200/60">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to marketplace
        </button>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-['Space_Grotesk']">
          Account Settings
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk'] mb-6">
          Settings & Contact Preferences
        </h1>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-slate-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
            <span>WhatsApp & Contact Integration</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile Information</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & Deactivation</span>
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* WHATSAPP SETTINGS TAB */}
        {activeTab === 'whatsapp' && (
          <form onSubmit={handleSaveWhatsApp} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                  <WhatsAppIcon className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    WhatsApp Merchant Number & Privacy
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure your official WhatsApp click-to-chat contact channel for buyers.
                  </p>
                </div>
              </div>

              {/* Privacy Explanation banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
                <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  Your WhatsApp number is used for marketplace contact features. It will only be shared according to your contact preferences and when you choose to make it available. Disabling contact immediately hides all WhatsApp buttons on your listings.
                </span>
              </div>

              {/* WhatsApp Number Inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  WhatsApp Phone Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={whatsappCountryCode}
                    onChange={e => setWhatsappCountryCode(e.target.value)}
                    className="w-40 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />

                  {whatsappLocalNumber && (
                    <button
                      type="button"
                      onClick={handleRemoveWhatsAppNumber}
                      className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Master toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappContactEnabled}
                    onChange={e => setWhatsappContactEnabled(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Enable WhatsApp Contact for Buyers
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      When enabled, eligible product pages display the "Chat on WhatsApp" and "Call Merchant on WhatsApp" actions.
                    </span>
                  </div>
                </label>
              </div>

              {/* Scope Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="p-3.5 rounded-2xl border border-slate-200 flex items-start gap-2.5 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={whatsappOnStorefront}
                    onChange={e => setWhatsappOnStorefront(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Show on Public Storefront
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Display WhatsApp contact buttons on your public merchant profile.
                    </span>
                  </div>
                </label>

                <label className="p-3.5 rounded-2xl border border-slate-200 flex items-start gap-2.5 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={whatsappOnListings}
                    onChange={e => setWhatsappOnListings(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Enable on Product Listings by Default
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Individual listings inherit this setting unless customized per item.
                    </span>
                  </div>
                </label>
              </div>

              {/* Direct Chat Preference */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Contact Action Behavior
                </label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contactPref"
                      value="direct_chat"
                      checked={whatsappContactPreference === 'direct_chat'}
                      onChange={() => setWhatsappContactPreference('direct_chat')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">
                      Direct Click-to-Chat (Recommended): Buyers initiate chat via pre-filled message instantly.
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contactPref"
                      value="on_request"
                      checked={whatsappContactPreference === 'on_request'}
                      onChange={() => setWhatsappContactPreference('on_request')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">
                      On Request Only: Only reveal WhatsApp number after buyer initiates internal conversation.
                    </span>
                  </label>
                </div>
              </div>

              {/* Separate Regular Telephone Calls */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={isDifferentPhone}
                    onChange={e => setIsDifferentPhone(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>I have a separate regular telephone number for voice calls</span>
                </label>

                {isDifferentPhone && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="e.g. +1 415 555 0199"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={phoneCallEnabled}
                        onChange={e => setPhoneCallEnabled(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Allow regular phone voice calls via <code>tel:</code> link</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save WhatsApp Preferences'}</span>
              </button>
            </div>
          </form>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Public Seller Profile
              </h3>

              {/* Avatar section */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-2xl flex-shrink-0">
                  <SafeImage
                    src={avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    fallback={<span>{name?.charAt(0) || 'U'}</span>}
                  />
                </div>

                <div>
                  <label className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">PNG, JPG up to 5MB.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  City / General Location
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bio / Storefront Description
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell buyers about your items, experience, and turnaround times..."
                  className="w-full p-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}

        {/* SECURITY & DEACTIVATION TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Account Credentials
              </h3>
              <p className="text-xs text-slate-500">
                Logged in as <strong>{user?.email}</strong>. Authentication sessions are secured via cryptographic token signatures.
              </p>
            </div>

            <div className="bg-rose-50/60 rounded-3xl p-6 border border-rose-200/80 space-y-3">
              <h3 className="text-base font-bold text-rose-900">
                Danger Zone: Deactivate Account
              </h3>
              <p className="text-xs text-rose-700 leading-relaxed">
                Deactivating your account will immediately remove your profile and all your active marketplace listings from BazaarLoop. This action cannot be reversed.
              </p>
              <button
                type="button"
                onClick={handleDeactivate}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Deactivate My Account & Delete Listings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
