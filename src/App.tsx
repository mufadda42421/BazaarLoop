import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { HomeView } from './views/HomeView';
import { ProductDetailView } from './views/ProductDetailView';
import { CreateListingView } from './views/CreateListingView';
import { SellerDashboardView } from './views/SellerDashboardView';
import { InboxView } from './views/InboxView';
import { StorefrontView } from './views/StorefrontView';
import { AccountSettingsView } from './views/AccountSettingsView';
import { AdvertisingView } from './views/AdvertisingView';
import { AdminView } from './views/AdminView';
import { BuyerDashboardView } from './views/BuyerDashboardView';
import { Compass, PlusCircle, MessageSquare, Store, LayoutDashboard, ShoppingBag, Truck } from 'lucide-react';

function AppContent() {
  const { user, unreadMessages, openAuthModal } = useAuth();
  const { totalCount, openCart } = useCart();

  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize with URL hash for shareable links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setCurrentView('home');
        setViewParam(undefined);
        return;
      }

      if (hash.startsWith('product-')) {
        setCurrentView('product');
        setViewParam(hash.replace('product-', ''));
      } else if (hash.startsWith('storefront-')) {
        setCurrentView('storefront');
        setViewParam(hash.replace('storefront-', ''));
      } else if (hash.startsWith('inbox-')) {
        setCurrentView('inbox');
        setViewParam(hash.replace('inbox-', ''));
      } else if (hash === 'bizmanager') {
        setCurrentView('seller-dashboard');
        setViewParam('bizmanager');
      } else if (['home', 'buyer-hub', 'create-listing', 'seller-dashboard', 'inbox', 'account-settings', 'advertising', 'admin'].includes(hash)) {
        setCurrentView(hash);
        setViewParam(undefined);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let newHash = view;
    if (view === 'product' && param) newHash = `product-${param}`;
    else if (view === 'storefront' && param) newHash = `storefront-${param}`;
    else if (view === 'inbox' && param) newHash = `inbox-${param}`;
    else if (view === 'home') newHash = '';

    window.history.pushState(null, '', newHash ? `#${newHash}` : window.location.pathname);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-slate-900 font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Sticky Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={navigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main View Router */}
      <div className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onNavigate={navigate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentView === 'product' && viewParam && (
          <ProductDetailView
            productId={viewParam}
            onNavigate={navigate}
          />
        )}

        {currentView === 'create-listing' && (
          <CreateListingView
            onNavigate={navigate}
          />
        )}

        {currentView === 'seller-dashboard' && (
          <SellerDashboardView
            onNavigate={navigate}
            initialSection={viewParam === 'bizmanager' ? 'bizmanager' : 'inventory'}
          />
        )}

        {currentView === 'inbox' && (
          <InboxView
            initialConversationId={viewParam}
            onNavigate={navigate}
          />
        )}

        {currentView === 'storefront' && viewParam && (
          <StorefrontView
            sellerId={viewParam}
            onNavigate={navigate}
          />
        )}

        {currentView === 'account-settings' && (
          <AccountSettingsView
            onNavigate={navigate}
          />
        )}

        {currentView === 'advertising' && (
          <AdvertisingView
            onNavigate={navigate}
          />
        )}

        {currentView === 'admin' && (
          <AdminView
            onNavigate={navigate}
          />
        )}

        {currentView === 'buyer-hub' && (
          <BuyerDashboardView
            onNavigate={navigate}
          />
        )}
      </div>

      {/* Responsive Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => navigate('home')}
          className={`flex flex-col items-center gap-1 py-1 cursor-pointer ${
            currentView === 'home' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-[10px]">Shop</span>
        </button>

        <button
          onClick={() => navigate('buyer-hub')}
          className={`flex flex-col items-center gap-1 py-1 cursor-pointer ${
            currentView === 'buyer-hub' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span className="text-[10px]">Orders</span>
        </button>

        <button
          onClick={openCart}
          className="flex flex-col items-center gap-0.5 py-0.5 text-indigo-600 cursor-pointer relative"
        >
          <div className="w-10 h-10 -mt-5 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-300">
            <ShoppingBag className="w-5 h-5" />
          </div>
          {totalCount > 0 && (
            <span className="absolute top-[-10px] right-2 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
              {totalCount}
            </span>
          )}
          <span className="text-[10px] font-bold">Bag</span>
        </button>

        <button
          onClick={() => {
            if (!user) openAuthModal('signin');
            else navigate('inbox');
          }}
          className={`flex flex-col items-center gap-1 py-1 relative cursor-pointer ${
            currentView === 'inbox' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {unreadMessages > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          )}
          <span className="text-[10px]">Inbox</span>
        </button>

        <button
          onClick={() => {
            if (!user) openAuthModal('signin');
            else navigate('seller-dashboard');
          }}
          className={`flex flex-col items-center gap-1 py-1 cursor-pointer ${
            currentView === 'seller-dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px]">Store</span>
        </button>
      </div>

      {/* Global E-Commerce Drawers & Modals */}
      <CartDrawer onNavigate={navigate} />
      <CheckoutModal onNavigate={navigate} />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
