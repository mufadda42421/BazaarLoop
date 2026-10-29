import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { NotificationDropdown } from './NotificationDropdown';
import { WhatsAppIcon } from './WhatsAppIcon';
import { SafeImage } from './SafeImage';
import {
  Search,
  PlusCircle,
  MessageSquare,
  User as UserIcon,
  Store,
  LayoutDashboard,
  Settings,
  Megaphone,
  Shield,
  LogOut,
  ChevronDown,
  X,
  ShoppingBag,
  Truck,
  Briefcase
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  searchQuery,
  onSearchChange
}) => {
  const { user, unreadMessages, openAuthModal, logout } = useAuth();
  const { totalCount, openCart } = useCart();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
    if (currentView !== 'home') {
      onNavigate('home');
    }
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-center justify-center p-0.5 overflow-hidden group-hover:scale-105 transition-transform duration-200">
            <img
              src="/assets/aistudio/Bazaar-Loop_Shopping_Bag_Logo_6ec1025c.png"
              alt="BazaarLoop"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-['Space_Grotesk'] block leading-none">
              Bazaar<span className="text-indigo-600">Loop</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest block mt-0.5">
              Brand E-Commerce
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search brand-new items, flagship labels, tech, fashion..."
              className="w-full pl-10 pr-9 py-2 rounded-2xl bg-slate-100/80 border border-transparent focus:border-indigo-500/50 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Right Navigation & User Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Shopping Bag Button with Real Badge */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-600 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            title="Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Bag</span>
            {totalCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-extrabold text-white flex items-center justify-center animate-in zoom-in-75">
                {totalCount}
              </span>
            )}
          </button>

          {/* Orders & Buyer Hub Button */}
          <button
            onClick={() => onNavigate('buyer-hub')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentView === 'buyer-hub'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Orders & Buyer Hub"
          >
            <Truck className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Orders</span>
          </button>

          {/* Merchant Add Item Button */}
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('signin');
              } else {
                onNavigate('create-listing');
              }
            }}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden xs:inline">Add Product</span>
          </button>

          {user ? (
            <>
              {/* Messages Inbox Shortcut */}
              <button
                onClick={() => onNavigate('inbox')}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                aria-label="Direct Messages"
                title="Messages"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>

              {/* Real Notifications */}
              <NotificationDropdown onNavigate={onNavigate} />

              {/* User Profile Menu with SafeImage */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/60"
                >
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-xs">
                    <SafeImage
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      fallback={<span>{user.name.charAt(0).toUpperCase()}</span>}
                    />
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 py-1.5">
                    {/* User header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {user.whatsappNumber && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 w-fit">
                          <WhatsAppIcon className="w-3 h-3 text-emerald-600" />
                          <span>+{user.whatsappNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Menu items */}
                    <div className="py-1 text-xs">
                      <button
                        onClick={() => { setProfileMenuOpen(false); onNavigate('buyer-hub'); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left font-semibold"
                      >
                        <Truck className="w-4 h-4 text-indigo-500" />
                        <span>My Orders & Deliveries</span>
                      </button>

                      <button
                        onClick={() => { setProfileMenuOpen(false); onNavigate('storefront', user.id); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left"
                      >
                        <Store className="w-4 h-4 text-slate-400" />
                        <span>Official Brand Storefront</span>
                      </button>

                      <button
                        onClick={() => { setProfileMenuOpen(false); onNavigate('seller-dashboard'); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        <span>Merchant Inventory & Stock</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          window.location.hash = 'bizmanager';
                          onNavigate('seller-dashboard');
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 text-indigo-700 hover:bg-indigo-50 font-semibold transition-colors text-left bg-indigo-50/40"
                      >
                        <div className="flex items-center gap-2.5">
                          <Briefcase className="w-4 h-4 text-indigo-600" />
                          <span>BizManager Portal</span>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full tracking-wider">
                          Auto Flow
                        </span>
                      </button>

                      <button
                        onClick={() => { setProfileMenuOpen(false); onNavigate('advertising'); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left"
                      >
                        <Megaphone className="w-4 h-4 text-slate-400" />
                        <span>Promoted Brand Listings</span>
                      </button>

                      <button
                        onClick={() => { setProfileMenuOpen(false); onNavigate('account-settings'); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Store & Account Settings</span>
                      </button>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => { setProfileMenuOpen(false); onNavigate('admin'); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-700 hover:bg-rose-50 transition-colors text-left font-semibold"
                        >
                          <Shield className="w-4 h-4 text-rose-500" />
                          <span>Admin Moderation Console</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1 text-xs">
                      <button
                        onClick={() => { setProfileMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
