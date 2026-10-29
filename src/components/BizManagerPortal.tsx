import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, buildWhatsAppChatUrl } from '../services/api';
import {
  BizTransaction,
  BizBusiness,
  BizPerson,
  BizInvoice,
  BizNote,
  BizSettings,
  Product
} from '../types';
import { SafeImage } from './SafeImage';
import { WhatsAppIcon } from './WhatsAppIcon';
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  Users,
  CreditCard,
  Receipt,
  Package,
  FileText,
  Save,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calculator,
  RefreshCw,
  Printer,
  Share2,
  Download,
  Calendar,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sliders,
  X,
  HelpCircle,
  Sun,
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';

interface BizManagerPortalProps {
  onNavigate?: (view: string, param?: string) => void;
}

export const BizManagerPortal: React.FC<BizManagerPortalProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'transactions'
    | 'businesses'
    | 'money'
    | 'people'
    | 'invoice'
    | 'wajebaat'
    | 'khumus'
    | 'interest'
    | 'currency'
    | 'inventory'
    | 'notes'
    | 'backup'
  >('dashboard');

  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<BizTransaction[]>([]);
  const [businesses, setBusinesses] = useState<BizBusiness[]>([]);
  const [people, setPeople] = useState<BizPerson[]>([]);
  const [invoices, setInvoices] = useState<BizInvoice[]>([]);
  const [notes, setNotes] = useState<BizNote[]>([]);
  const [settings, setSettings] = useState<BizSettings | null>(null);
  const [merchantProducts, setMerchantProducts] = useState<Product[]>([]);

  // Modals & form states
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txAmount, setTxAmount] = useState('');
  const [txTitle, setTxTitle] = useState('');
  const [txCategory, setTxCategory] = useState('Sales Revenue');
  const [txPaymentMode, setTxPaymentMode] = useState<'upi' | 'gpay' | 'apple_pay' | 'paypal' | 'card' | 'cash' | 'bank_transfer'>('upi');
  const [txRef, setTxRef] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txBusinessId, setTxBusinessId] = useState('');

  // Invoice generator state
  const [invCustomerName, setInvCustomerName] = useState('');
  const [invCustomerPhone, setInvCustomerPhone] = useState('');
  const [invCustomerEmail, setInvCustomerEmail] = useState('');
  const [invItems, setInvItems] = useState<Array<{ title: string; quantity: number; price: number; total: number }>>([
    { title: 'Brand Retail Order Item', quantity: 1, price: 100, total: 100 }
  ]);
  const [invTaxRate, setInvTaxRate] = useState('0');
  const [invDiscount, setInvDiscount] = useState('0');
  const [invDueDate, setInvDueDate] = useState('');
  const [invNotes, setInvNotes] = useState('Thank you for shopping with us! For delivery arrangements, please contact our merchant support.');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<BizInvoice | null>(null);

  // Wajebaat state
  const [wajebaatInput, setWajebaatInput] = useState('');
  const [wajebaatResult, setWajebaatResult] = useState<number | null>(null);

  // Khumus state
  const [khumusSavings, setKhumusSavings] = useState('');
  const [khumusInventory, setKhumusInventory] = useState('');
  const [khumusDebts, setKhumusDebts] = useState('');
  const [khumusExpenses, setKhumusExpenses] = useState('');

  // Interest calculator state
  const [intPrincipal, setIntPrincipal] = useState('10000');
  const [intRate, setIntRate] = useState('8.5');
  const [intTenureMonths, setIntTenureMonths] = useState('12');
  const [intType, setIntType] = useState<'simple' | 'compound' | 'emi'>('emi');

  // Currency Converter state
  const [currAmount, setCurrAmount] = useState('100');
  const [currFrom, setCurrFrom] = useState('USD');
  const [currTo, setCurrTo] = useState('INR');

  // Search & filter
  const [txSearch, setTxSearch] = useState('');
  const [txFilterType, setTxFilterType] = useState<'all' | 'income' | 'expense' | 'auto'>('all');

  // Feedback notifications
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Theme state: Dark mode (default) vs Light mode
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('bizmanager_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('bizmanager_theme', nextTheme);
  };

  // Islamic Duties (Wajebaat & Khumus) - MUST BE CLOSED BY DEFAULT (false)
  const [islamicDutiesOpen, setIslamicDutiesOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('bizmanager_islamic_duties');
    if (saved !== null) {
      return saved === 'true';
    }
    return false; // Default: closed
  });

  const toggleIslamicDuties = async (targetVal?: boolean) => {
    const nextVal = typeof targetVal === 'boolean' ? targetVal : !islamicDutiesOpen;
    setIslamicDutiesOpen(nextVal);
    localStorage.setItem('bizmanager_islamic_duties', String(nextVal));

    if (!nextVal && (activeTab === 'wajebaat' || activeTab === 'khumus')) {
      setActiveTab('dashboard');
    }

    try {
      const res = await api.updateBizSettings({ wajebaatEnabled: nextVal });
      if (res?.settings) {
        setSettings(res.settings);
      }
    } catch (err: any) {
      console.error('Failed to sync settings:', err);
    }

    showAlert(
      nextVal
        ? 'Islamic Duties (Wajebaat & Khumus) opened and added to options bar.'
        : 'Islamic Duties closed. Wajebaat & Khumus options are now hidden.'
    );
  };

  // Option bar scroll & interactive scrubber
  const navScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkScroll = () => {
    if (navScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
      } else {
        setScrollProgress(0);
      }
    }
  };

  useEffect(() => {
    checkScroll();
    const el = navScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = 260;
      navScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 150);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrollProgress(val);
    if (navScrollRef.current) {
      const { scrollWidth, clientWidth } = navScrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      navScrollRef.current.scrollLeft = (val / 100) * maxScroll;
    }
  };

  const fetchBizData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBizManagerData();
      setTransactions(res.transactions || []);
      setBusinesses(res.businesses || []);
      setPeople(res.people || []);
      setInvoices(res.invoices || []);
      setNotes(res.notes || []);
      setSettings(res.settings || null);
      setMerchantProducts(res.products || []);
      if (res.businesses?.[0]?.id) {
        setTxBusinessId(res.businesses[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load BizManager data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBizData();
  }, [user]);

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Financial calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netBalance = totalIncome - totalExpense;

  const totalAutoOrders = transactions.filter(t => t.source === 'auto_order').length;

  const totalWajebaatReserved = transactions
    .filter(t => t.type === 'income' && (t.wajebaatAmount || 0) > 0)
    .reduce((sum, t) => sum + (t.wajebaatAmount || 0), 0);

  // Currency rates approximation
  const currencyRates: Record<string, number> = {
    USD: 1.0,
    INR: 84.2,
    EUR: 0.92,
    GBP: 0.77,
    AED: 3.67,
    SAR: 3.75,
    CAD: 1.39
  };

  const handleConvert = (amount: number, from: string, to: string) => {
    const fromRate = currencyRates[from] || 1;
    const toRate = currencyRates[to] || 1;
    const inUSD = amount / fromRate;
    return inUSD * toRate;
  };

  // Add Manual Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txAmount);
    if (!amt || amt <= 0) {
      showAlert('Please enter a valid amount', 'error');
      return;
    }
    if (!txTitle.trim()) {
      showAlert('Please enter a title or description', 'error');
      return;
    }

    try {
      const isWajebaat = settings?.wajebaatEnabled && txType === 'income';
      const wajebaatAmt = isWajebaat ? Math.round(amt * 0.025 * 100) / 100 : 0;

      const res = await api.addBizTransaction({
        type: txType,
        amount: amt,
        currency: settings?.defaultCurrency || 'USD',
        category: txCategory,
        title: txTitle.trim(),
        description: txNotes.trim(),
        paymentMode: txPaymentMode,
        referenceId: txRef.trim() || undefined,
        businessId: txBusinessId || undefined,
        wajebaatAmount: wajebaatAmt
      });

      setTransactions([res.transaction, ...transactions]);
      setShowAddTxModal(false);
      setTxAmount('');
      setTxTitle('');
      setTxNotes('');
      setTxRef('');
      showAlert(`Transaction successfully added! ${txType === 'income' ? '+$' : '-$'}${amt.toFixed(2)}`);
    } catch (err: any) {
      showAlert(err.message || 'Failed to save transaction', 'error');
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      await api.deleteBizTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
      showAlert('Transaction removed from ledger');
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete transaction', 'error');
    }
  };

  // Toggle Wajebaat in Settings
  const handleToggleWajebaat = async () => {
    if (!settings) return;
    const nextState = !settings.wajebaatEnabled;
    try {
      const res = await api.updateBizSettings({ wajebaatEnabled: nextState });
      setSettings(res.settings);
      showAlert(`Islamic Duties (Wajebaat) calculation is now turned ${nextState ? 'ON (₹40 = ₹1 on profits)' : 'OFF'}`);
    } catch (err: any) {
      showAlert(err.message || 'Failed to update settings', 'error');
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(txSearch.toLowerCase()) ||
      (t.referenceId && t.referenceId.toLowerCase().includes(txSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (txFilterType === 'all') return true;
    if (txFilterType === 'auto') return t.source === 'auto_order';
    return t.type === txFilterType;
  });

  // Calculate Wajebaat custom input
  const calculateWajebaatQuick = (val: string) => {
    setWajebaatInput(val);
    const n = parseFloat(val);
    if (!n || n <= 0) {
      setWajebaatResult(null);
    } else {
      // 1 rupee per 40 rupees = 2.5%
      setWajebaatResult(Math.round((n / 40) * 100) / 100);
    }
  };

  // Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCustomerName.trim()) {
      showAlert('Customer name is required', 'error');
      return;
    }
    if (invItems.length === 0) {
      showAlert('Add at least one item to invoice', 'error');
      return;
    }

    try {
      const res = await api.saveBizInvoice({
        customerName: invCustomerName.trim(),
        customerPhone: invCustomerPhone.trim(),
        customerEmail: invCustomerEmail.trim(),
        items: invItems,
        taxRate: parseFloat(invTaxRate) || 0,
        discount: parseFloat(invDiscount) || 0,
        currency: settings?.defaultCurrency || 'USD',
        dueDate: invDueDate,
        notes: invNotes.trim()
      });

      setInvoices([res.invoice, ...invoices]);
      setSelectedInvoiceForPrint(res.invoice);
      showAlert(`Invoice ${res.invoice.invoiceNumber} created successfully!`);
    } catch (err: any) {
      showAlert(err.message || 'Failed to generate invoice', 'error');
    }
  };

  return (
    <div className={`rounded-3xl border shadow-2xl overflow-hidden font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0B1120] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-800 border-slate-200'
    }`}>
      {/* Top Banner / Merchant Portal Branding Header */}
      <div className={`p-4 sm:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-slate-800 text-white'
          : 'bg-gradient-to-r from-white via-indigo-50/50 to-white border-slate-200 text-slate-900 shadow-xs'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-indigo-500/30 p-1 flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-500/10">
            <img
              src="/assets/aistudio/Bazaar-Loop_Shopping_Bag_Logo_6ec1025c.png"
              alt="BazaarLoop"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-widest font-mono">
                BizManager Portal
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Order Flow Sync
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-extrabold font-['Space_Grotesk'] mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              FlowBizManager Native Operations
            </h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Zero login required • Auto-credits on sales • Auto-debits on purchases • Full ledger
            </p>
          </div>
        </div>

        {/* Action Controls, Toggles & Balance Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Islamic Duties Toggle (Closed by Default) */}
          <button
            type="button"
            onClick={() => toggleIslamicDuties()}
            className={`px-3 py-2 rounded-2xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
              islamicDutiesOpen
                ? (theme === 'dark' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200')
                : (theme === 'dark' ? 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:text-slate-200 hover:bg-slate-750' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900 shadow-xs')
            }`}
            title="Click to open or close Islamic Duties (Wajebaat & Khumus)"
          >
            <span>🕌</span>
            <span className="hidden sm:inline">Islamic Duties:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                islamicDutiesOpen
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : (theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700')
              }`}
            >
              {islamicDutiesOpen ? (
                <>
                  <Eye className="w-3 h-3" />
                  <span>Open</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span>Closed</span>
                </>
              )}
            </span>
          </button>

          {/* Dark / Light Mode Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              theme === 'dark'
                ? 'bg-slate-850 text-amber-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 shadow-xs'
            }`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          {/* Balance Pill */}
          <div className={`px-4 py-2 rounded-2xl border text-right ${
            theme === 'dark' ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <span className={`text-[10px] uppercase font-bold block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Current Net Balance</span>
            <span
              className={`text-lg font-extrabold font-['Space_Grotesk'] ${
                netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              ${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setTxType('income');
              setShowAddTxModal(true);
            }}
            className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {alertMsg && (
        <div
          className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-all ${
            alertMsg.type === 'success'
              ? 'bg-emerald-900/80 text-emerald-200 border-b border-emerald-800'
              : 'bg-rose-900/80 text-rose-200 border-b border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* FlowBizManager Options Navigation Bar with Scroll Bar & Controls */}
      {(() => {
        const portalTabs = [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, emoji: '📊' },
          { id: 'transactions', label: 'Ledger & Cash Flow', icon: CreditCard, emoji: '💳' },
          { id: 'businesses', label: 'Businesses', icon: Building2, emoji: '🏢' },
          { id: 'money', label: 'Money Tracker', icon: DollarSign, emoji: '💰' },
          { id: 'people', label: 'People (Khata)', icon: Users, emoji: '👥' },
          { id: 'invoice', label: 'Invoice Maker', icon: Receipt, emoji: '🧾' },
          ...(islamicDutiesOpen
            ? [
                { id: 'wajebaat', label: 'Wajebaat (1/40)', icon: Calculator, emoji: '🕌' },
                { id: 'khumus', label: 'KHUMUS (20%)', icon: ShieldCheck, emoji: '🕋' },
              ]
            : []),
          { id: 'interest', label: 'Interest & EMI', icon: Sliders, emoji: '🧮' },
          { id: 'currency', label: 'Currency', icon: RefreshCw, emoji: '💱' },
          { id: 'inventory', label: 'Stock Valuation', icon: Package, emoji: '📦' },
          { id: 'notes', label: 'Notes', icon: FileText, emoji: '📝' },
          { id: 'backup', label: 'Export & Backup', icon: Save, emoji: '💾' }
        ];

        const activeIndex = portalTabs.findIndex(t => t.id === activeTab);
        const currentTabObj = portalTabs[activeIndex] || portalTabs[0];

        return (
          <div className={`border-b transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            {/* Primary Tab Row with Smooth Scroll Buttons */}
            <div className="flex items-center px-2 sm:px-4 py-2 gap-1.5 relative">
              {/* Left Scroll Button */}
              <button
                type="button"
                onClick={() => scrollNav('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left through options"
                className={`p-2 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                  canScrollLeft
                    ? (theme === 'dark' ? 'bg-slate-800 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600 hover:text-white shadow-md' : 'bg-white text-indigo-600 border-slate-300 hover:bg-indigo-50 shadow-xs')
                    : (theme === 'dark' ? 'bg-slate-900/60 text-slate-600 border-slate-800 opacity-40 cursor-not-allowed' : 'bg-slate-100 text-slate-400 border-slate-200 opacity-40 cursor-not-allowed')
                }`}
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Scrollable Container with Custom Visible Scrollbar */}
              <div
                ref={navScrollRef}
                onScroll={checkScroll}
                className="bizmanager-scrollbar overflow-x-auto scroll-smooth flex items-center gap-1.5 py-1 px-1 flex-1 pb-2"
              >
                {portalTabs.map((tabItem, idx) => {
                  const isSelected = activeTab === tabItem.id;
                  return (
                    <button
                      key={tabItem.id}
                      onClick={e => {
                        setActiveTab(tabItem.id as any);
                        e.currentTarget.scrollIntoView({
                          behavior: 'smooth',
                          inline: 'center',
                          block: 'nearest'
                        });
                        setTimeout(checkScroll, 150);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/40 ring-1 ring-indigo-400/50'
                          : (theme === 'dark'
                              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200')
                      }`}
                    >
                      <span className="text-sm">{tabItem.emoji}</span>
                      <span>{tabItem.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected
                            ? 'bg-indigo-900/80 text-indigo-200'
                            : (theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-600')
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Scroll Button */}
              <button
                type="button"
                onClick={() => scrollNav('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right through options"
                className={`p-2 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                  canScrollRight
                    ? (theme === 'dark' ? 'bg-slate-800 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600 hover:text-white shadow-md' : 'bg-white text-indigo-600 border-slate-300 hover:bg-indigo-50 shadow-xs')
                    : (theme === 'dark' ? 'bg-slate-900/60 text-slate-600 border-slate-800 opacity-40 cursor-not-allowed' : 'bg-slate-100 text-slate-400 border-slate-200 opacity-40 cursor-not-allowed')
                }`}
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Dedicated Interactive Scroll Bar & Module Status Track */}
            <div className={`px-4 sm:px-6 py-2 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] transition-colors ${
              theme === 'dark' ? 'bg-slate-950/80 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Active Module:
                </span>
                <span className={`font-bold border px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 ${
                  theme === 'dark'
                    ? 'text-white bg-indigo-950/70 text-indigo-300 border-indigo-500/30'
                    : 'text-slate-900 bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  <span>{currentTabObj.emoji}</span>
                  <span>{currentTabObj.label}</span>
                  <span className="text-[10px] font-mono opacity-80">
                    ({activeIndex + 1}/{portalTabs.length})
                  </span>
                </span>
                {!islamicDutiesOpen && (
                  <button
                    type="button"
                    onClick={() => toggleIslamicDuties(true)}
                    className="text-[10px] text-amber-500 hover:underline font-semibold ml-1 cursor-pointer flex items-center gap-1"
                  >
                    <span>(Islamic duties closed • click to open)</span>
                  </button>
                )}
              </div>

              {/* Interactive Scroll Bar / Range Scrubber */}
              <div className="flex items-center gap-2.5 w-full sm:w-80">
                <span className={`text-[10px] font-semibold whitespace-nowrap ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                  Scroll options:
                </span>
                <div className="relative flex-1 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(scrollProgress)}
                    onChange={handleSliderChange}
                    aria-label="Scroll options bar"
                    className="w-full h-2 bg-slate-700/60 rounded-lg appearance-none cursor-ew-resize accent-indigo-500 hover:accent-indigo-400 transition-all focus:outline-none ring-1 ring-slate-600/40"
                  />
                </div>
                <span className="text-[10px] font-mono text-indigo-500 w-8 text-right font-bold">
                  {Math.round(scrollProgress)}%
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Portal Main Body */}
      <div className="p-4 sm:p-6 lg:p-8 min-h-[500px]">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading FlowBizManager financial core...</p>
          </div>
        ) : (
          <>
            {/* 1. DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 4 Core Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Net Balance */}
                  <div className={`p-5 rounded-2xl border shadow-lg relative overflow-hidden group transition-colors ${
                    theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className={`flex items-center justify-between text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>Net Cash Balance</span>
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className={`text-2xl sm:text-3xl font-extrabold font-['Space_Grotesk'] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      ${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Live ledger funds</span>
                      <span className="text-emerald-500 font-bold">{transactions.length} entries</span>
                    </div>
                  </div>

                  {/* Card 2: Total Revenue / Income */}
                  <div className={`p-5 rounded-2xl border shadow-lg relative overflow-hidden group transition-colors ${
                    theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className={`flex items-center justify-between text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>Total Revenue & Sales</span>
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-500 font-['Space_Grotesk']">
                      +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Sales & Inflows</span>
                      <span className="text-emerald-500 font-bold">
                        {transactions.filter(t => t.type === 'income').length} sales
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Total Expenses & Purchases */}
                  <div className={`p-5 rounded-2xl border shadow-lg relative overflow-hidden group transition-colors ${
                    theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className={`flex items-center justify-between text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>Expenses & Purchases</span>
                      <ArrowDownRight className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-rose-500 font-['Space_Grotesk']">
                      -${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Debits & Restocks</span>
                      <span className="text-rose-500 font-bold">
                        {transactions.filter(t => t.type === 'expense').length} purchases
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Wajebaat / Duties Reserve or Islamic Duties Closed Status */}
                  <div className={`p-5 rounded-2xl border shadow-lg relative overflow-hidden group transition-colors ${
                    theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    {islamicDutiesOpen ? (
                      <>
                        <div className={`flex items-center justify-between text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span>Wajebaat & Duties</span>
                          <Calculator className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-indigo-500 font-['Space_Grotesk']">
                          ${totalWajebaatReserved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>₹40 = ₹1 calculation</span>
                          <button
                            type="button"
                            onClick={() => toggleIslamicDuties(false)}
                            className="font-bold px-2 py-0.5 rounded cursor-pointer bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 transition-all text-[10px]"
                            title="Close Islamic duties"
                          >
                            Close Duties
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`flex items-center justify-between text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span>Islamic Duties</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Closed
                          </span>
                        </div>
                        <div className={`text-xl sm:text-2xl font-bold font-['Space_Grotesk'] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          Closed (Default)
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>Wajebaat & Khumus</span>
                          <button
                            type="button"
                            onClick={() => toggleIslamicDuties(true)}
                            className="font-bold px-2.5 py-1 rounded-lg cursor-pointer bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-xs text-[11px]"
                          >
                            Open Duties
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Auto Order Flow Live Banner */}
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold">
                      ⚡
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Automatic Money Flow Active
                      </h4>
                      <p className="text-slate-400 text-[11px]">
                        Every time a buyer purchases from your store on BazaarLoop, money is automatically added to this ledger. When you buy goods, it's auto-debited.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-indigo-900/60 text-indigo-200 border border-indigo-700 font-mono text-[11px]">
                      {totalAutoOrders} Auto-Sync Orders
                    </span>
                  </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => {
                      setTxType('income');
                      setShowAddTxModal(true);
                    }}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 text-left transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 font-bold group-hover:scale-110 transition-transform">
                      +
                    </div>
                    <span className="text-xs font-bold text-white block">Add Income / Sale</span>
                    <span className="text-[10px] text-slate-400">Record cash, UPI, bank receipts</span>
                  </button>

                  <button
                    onClick={() => {
                      setTxType('expense');
                      setShowAddTxModal(true);
                    }}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-850 text-left transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-2 font-bold group-hover:scale-110 transition-transform">
                      -
                    </div>
                    <span className="text-xs font-bold text-white block">Add Expense / Spend</span>
                    <span className="text-[10px] text-slate-400">Stock purchase, courier, rent</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('invoice')}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-left transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 font-bold group-hover:scale-110 transition-transform">
                      🧾
                    </div>
                    <span className="text-xs font-bold text-white block">Generate Invoice</span>
                    <span className="text-[10px] text-slate-400">Watermark branded receipts</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('wajebaat')}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 text-left transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 font-bold group-hover:scale-110 transition-transform">
                      🕌
                    </div>
                    <span className="text-xs font-bold text-white block">Wajebaat & Khumus</span>
                    <span className="text-[10px] text-slate-400">1/40th & 20% calculations</span>
                  </button>
                </div>

                {/* Recent Transactions List on Dashboard */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white font-['Space_Grotesk']">
                        Recent Financial Transactions
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {transactions.length} total
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Full Ledger</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800/80">
                    {transactions.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
                          💸
                        </div>
                        <h4 className="text-sm font-bold text-white">No transactions yet</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Transactions will appear automatically when products are sold or bought, or you can record manual entries.
                        </p>
                      </div>
                    ) : (
                      transactions.slice(0, 6).map(tx => (
                        <div
                          key={tx.id}
                          className="p-4 flex items-center justify-between gap-4 hover:bg-slate-850/50 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                tx.type === 'income'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {tx.type === 'income' ? '↓' : '↑'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white truncate">{tx.title}</span>
                                {tx.source === 'auto_order' && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                                    AUTO-SYNC
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{new Date(tx.date).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="text-slate-300 font-medium">{tx.category}</span>
                                <span>•</span>
                                <span className="uppercase text-slate-400">{tx.paymentMode}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span
                              className={`font-bold font-mono text-sm block ${
                                tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                            </span>
                            {tx.wajebaatAmount ? (
                              <span className="text-[10px] text-purple-400 block font-mono">
                                Wajebaat: ${tx.wajebaatAmount.toFixed(2)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. TRANSACTIONS & CASH FLOW LEDGER */}
            {activeTab === 'transactions' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                      Complete Financial Ledger
                    </h3>
                    <p className="text-xs text-slate-400">
                      Audit log of sales, expenses, direct buyer transfers, and merchant operational costs.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setTxType('income');
                        setShowAddTxModal(true);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Income</span>
                    </button>
                    <button
                      onClick={() => {
                        setTxType('expense');
                        setShowAddTxModal(true);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Expense</span>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={txSearch}
                      onChange={e => setTxSearch(e.target.value)}
                      placeholder="Search title, category, order #..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {[
                      { id: 'all', label: 'All Entries' },
                      { id: 'income', label: 'Income Only' },
                      { id: 'expense', label: 'Expenses Only' },
                      { id: 'auto', label: 'BazaarLoop Orders' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setTxFilterType(f.id as any)}
                        className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer whitespace-nowrap ${
                          txFilterType === f.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto shadow-lg">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Description</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Method</th>
                        <th className="p-3.5">Reference</th>
                        <th className="p-3.5 text-right">Amount</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No ledger records found matching filter.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                              {new Date(tx.date).toLocaleDateString()}
                            </td>
                            <td className="p-3.5 font-medium text-white max-w-xs">
                              <div className="truncate font-semibold">{tx.title}</div>
                              {tx.description && (
                                <div className="text-[10px] text-slate-400 truncate">{tx.description}</div>
                              )}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                                {tx.category}
                              </span>
                            </td>
                            <td className="p-3.5 uppercase text-[10px] font-mono text-slate-400">
                              {tx.paymentMode}
                            </td>
                            <td className="p-3.5 font-mono text-[10px] text-indigo-400">
                              {tx.referenceId || '—'}
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap font-mono font-bold">
                              <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                                {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. BUSINESSES / STOREFRONT BRANCHES */}
            {activeTab === 'businesses' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                    Businesses & Storefront Branches
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure multiple merchant storefronts, retail outlets, or regional inventory divisions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businesses.map(b => (
                    <div
                      key={b.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative group shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                          🏢
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Active Branch
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base font-['Space_Grotesk']">{b.name}</h4>
                        <p className="text-xs text-slate-400">{b.tagline || 'BazaarLoop Verified Merchant Branch'}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                        <span>Category: {b.category || 'Retail'}</span>
                        <span className="font-mono text-indigo-400">{b.currency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. MONEY TRACKER & LIQUID ACCOUNTS */}
            {activeTab === 'money' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                    Money Tracker & Liquid Balances
                  </h3>
                  <p className="text-xs text-slate-400">
                    Monitor balances across UPI, Bank Accounts, GPay, Apple Pay, PayPal, and Cash in Hand.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {/* UPI / GPay Wallet */}
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold flex items-center gap-1.5">⚡ UPI & GPay</span>
                      <span className="text-indigo-400 font-mono">{user?.bankingDetails?.upiId || 'Linked'}</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white font-mono mt-1">
                      ${(netBalance * 0.45).toFixed(2)}
                    </div>
                    <p className="text-[10px] text-slate-500">Direct mobile instantaneous settlement</p>
                  </div>

                  {/* Bank Account */}
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold flex items-center gap-1.5">🏦 Bank Deposit Account</span>
                      <span className="text-indigo-400 font-mono">{user?.bankingDetails?.bankName || 'Direct Bank'}</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white font-mono mt-1">
                      ${(netBalance * 0.40).toFixed(2)}
                    </div>
                    <p className="text-[10px] text-slate-500">Checking & wire transfers</p>
                  </div>

                  {/* Cash in Hand / Reserve */}
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold flex items-center gap-1.5">💵 Cash in Hand / Reserve</span>
                      <span className="text-emerald-400 font-mono">Liquid</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white font-mono mt-1">
                      ${(netBalance * 0.15).toFixed(2)}
                    </div>
                    <p className="text-[10px] text-slate-500">Operational pocket reserve for dispatch fees</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. PEOPLE / CONTACTS & KHATA */}
            {activeTab === 'people' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                    People, Customers & Supplier Khata
                  </h3>
                  <p className="text-xs text-slate-400">
                    Track customer credit, supplier debts, and send direct WhatsApp payment reminders with 1 click.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {people.length === 0 ? (
                    <div className="col-span-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                      No customer ledger accounts yet. As buyers order products with your store, their contact and debt ledger is tracked here.
                    </div>
                  ) : (
                    people.map(p => (
                      <div key={p.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{p.name}</span>
                          <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {p.role}
                          </span>
                        </div>
                        {p.phone && (
                          <div className="text-slate-400 flex items-center gap-1 font-mono">
                            <span>📞 {p.phone}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <span>Balance:</span>
                          <span
                            className={`font-mono font-bold ${
                              p.balance > 0 ? 'text-emerald-400' : p.balance < 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}
                          >
                            ${p.balance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 6. INVOICE MAKER WITH WATERMARK */}
            {activeTab === 'invoice' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Column */}
                <div className="lg:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
                  <h3 className="text-base font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-400" />
                    <span>Create Watermark Invoice</span>
                  </h3>

                  <form onSubmit={handleCreateInvoice} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Customer Name *</label>
                      <input
                        type="text"
                        required
                        value={invCustomerName}
                        onChange={e => setInvCustomerName(e.target.value)}
                        placeholder="e.g. Alex Montgomery"
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Phone / WhatsApp</label>
                        <input
                          type="tel"
                          value={invCustomerPhone}
                          onChange={e => setInvCustomerPhone(e.target.value)}
                          placeholder="+1 555 0192"
                          className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Due Date</label>
                        <input
                          type="date"
                          value={invDueDate}
                          onChange={e => setInvDueDate(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Line Items */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Items on Invoice</label>
                        <button
                          type="button"
                          onClick={() => setInvItems([...invItems, { title: 'New Item', quantity: 1, price: 50, total: 50 }])}
                          className="text-indigo-400 hover:text-indigo-300 font-bold"
                        >
                          + Add Item
                        </button>
                      </div>

                      <div className="space-y-2">
                        {invItems.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={item.title}
                              onChange={e => {
                                const copy = [...invItems];
                                copy[idx].title = e.target.value;
                                setInvItems(copy);
                              }}
                              placeholder="Item description"
                              className="flex-1 p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                            />
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => {
                                const copy = [...invItems];
                                const qty = parseInt(e.target.value, 10) || 1;
                                copy[idx].quantity = qty;
                                copy[idx].total = qty * copy[idx].price;
                                setInvItems(copy);
                              }}
                              placeholder="Qty"
                              className="w-14 p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-center"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={e => {
                                const copy = [...invItems];
                                const pr = parseFloat(e.target.value) || 0;
                                copy[idx].price = pr;
                                copy[idx].total = copy[idx].quantity * pr;
                                setInvItems(copy);
                              }}
                              placeholder="Price"
                              className="w-20 p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-right"
                            />
                            {invItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setInvItems(invItems.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tax / GST %</label>
                        <input
                          type="number"
                          value={invTaxRate}
                          onChange={e => setInvTaxRate(e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Discount ($)</label>
                        <input
                          type="number"
                          value={invDiscount}
                          onChange={e => setInvDiscount(e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                    >
                      Issue & Preview Invoice
                    </button>
                  </form>
                </div>

                {/* Printable Invoice Preview Column */}
                <div className="lg:col-span-7 bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-slate-200 font-sans print:shadow-none">
                  {/* Subtle Background Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none rotate-[-25deg]">
                    <span className="text-6xl sm:text-7xl font-extrabold uppercase tracking-widest text-slate-900">
                      {settings?.invoiceWatermarkText || 'BazaarLoop Verified'}
                    </span>
                  </div>

                  {/* Invoice Header */}
                  <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white p-1 flex items-center justify-center overflow-hidden">
                        <img
                          src="/assets/aistudio/Bazaar-Loop_Shopping_Bag_Logo_6ec1025c.png"
                          alt="BazaarLoop"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="text-lg font-extrabold text-slate-900 font-['Space_Grotesk'] leading-tight">
                          {settings?.invoiceBusinessName || user?.name || 'BazaarLoop Store'}
                        </h4>
                        <p className="text-xs text-slate-500">{settings?.invoiceAddress || 'Authorized Merchant Store'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-extrabold text-indigo-700 font-['Space_Grotesk'] block">INVOICE</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {selectedInvoiceForPrint?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Date Meta */}
                  <div className="py-4 border-b border-slate-100 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Billed To:</span>
                      <strong className="text-slate-900 block font-semibold">
                        {invCustomerName || 'Customer Name'}
                      </strong>
                      {invCustomerPhone && <p className="text-slate-600">{invCustomerPhone}</p>}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Invoice Date:</span>
                      <span className="text-slate-800">{new Date().toLocaleDateString()}</span>
                      {invDueDate && (
                        <p className="text-[11px] text-amber-700">Due: {invDueDate}</p>
                      )}
                    </div>
                  </div>

                  {/* Invoice Items Table */}
                  <table className="w-full text-left text-xs my-4">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                        <th className="py-2">Item</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 font-medium text-slate-900">{item.title}</td>
                          <td className="py-2 text-center">{item.quantity}</td>
                          <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                          <td className="py-2 text-right font-bold text-slate-900">
                            ${(item.quantity * item.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Invoice Totals */}
                  <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">
                        ${invItems.reduce((s, it) => s + it.quantity * it.price, 0).toFixed(2)}
                      </span>
                    </div>
                    {parseFloat(invTaxRate) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Tax ({invTaxRate}%):</span>
                        <span className="font-mono">
                          ${((invItems.reduce((s, it) => s + it.quantity * it.price, 0) * parseFloat(invTaxRate)) / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Amount:</span>
                      <span className="text-indigo-700 font-['Space_Grotesk']">
                        ${(
                          invItems.reduce((s, it) => s + it.quantity * it.price, 0) * (1 + (parseFloat(invTaxRate) || 0) / 100) -
                          (parseFloat(invDiscount) || 0)
                        ).toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  {/* Notes & Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <p className="text-[10px] text-slate-500 max-w-xs">{invNotes}</p>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 7. WAJEBAAT CALCULATOR (1/40th or 2.5%) */}
            {activeTab === 'wajebaat' && (
              !islamicDutiesOpen ? (
                <div className={`max-w-xl mx-auto p-8 rounded-3xl border text-center space-y-4 shadow-xl ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl mx-auto">
                    🕌
                  </div>
                  <h3 className={`text-xl font-bold font-['Space_Grotesk'] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Islamic Duties (Wajebaat & Khumus) are Closed
                  </h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Islamic duties are closed by default on BazaarLoop. You can open them anytime to calculate Wajebaat (1/40th or 2.5%) and annual KHUMUS (20%).
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleIslamicDuties(true)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
                    >
                      Open Islamic Duties
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer border ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center space-y-1">
                    <span className="text-2xl">🕌</span>
                    <h3 className={`text-xl font-extrabold font-['Space_Grotesk'] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Islamic Duties: Wajebaat Calculator
                    </h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Traditional commercial duty computed at ₹40 = ₹1 (1/40th or 2.5%) on business earnings and profits.
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border space-y-5 shadow-xl ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    {/* Master ON/OFF Switch */}
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${
                      theme === 'dark' ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <strong className={`text-sm font-bold block ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Auto-Wajebaat Calculation</strong>
                        <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Automatically reserves 1/40th on every BazaarLoop customer sale
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleWajebaat}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          settings?.wajebaatEnabled
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : (theme === 'dark' ? 'bg-slate-750 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
                        }`}
                      >
                        {settings?.wajebaatEnabled ? 'Active (ON)' : 'Disabled (OFF)'}
                      </button>
                    </div>

                    {/* Calculator Input */}
                    <div className="space-y-2">
                      <label className={`block text-xs font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Calculate Wajebaat on any Amount (₹ / $)
                      </label>
                      <input
                        type="number"
                        value={wajebaatInput}
                        onChange={e => calculateWajebaatQuick(e.target.value)}
                        placeholder="Enter profit or transaction amount (e.g. 4000)"
                        className={`w-full p-3 rounded-xl border text-sm font-mono focus:outline-none focus:border-indigo-500 ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    {wajebaatResult !== null && (
                      <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 text-center space-y-1 animate-in fade-in duration-200">
                        <span className="text-xs text-purple-300 font-bold uppercase tracking-wider block">
                          Calculated Wajebaat (1/40)
                        </span>
                        <span className="text-3xl font-extrabold text-purple-400 font-mono">
                          ${wajebaatResult.toFixed(2)}
                        </span>
                        <p className="text-[11px] text-purple-300/80">
                          {wajebaatInput} ÷ 40 = ${wajebaatResult.toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className={`pt-3 border-t flex justify-between items-center text-xs ${
                      theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                    }`}>
                      <span>Total Wajebaat reserved across catalog:</span>
                      <strong className="text-purple-500 font-mono text-sm">${totalWajebaatReserved.toFixed(2)}</strong>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleIslamicDuties(false)}
                        className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer"
                      >
                        Close Islamic Duties (Hide Wajebaat & Khumus)
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* 8. KHUMUS CALCULATOR (20% or 1/5th) */}
            {activeTab === 'khumus' && (
              !islamicDutiesOpen ? (
                <div className={`max-w-xl mx-auto p-8 rounded-3xl border text-center space-y-4 shadow-xl ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl mx-auto">
                    🕋
                  </div>
                  <h3 className={`text-xl font-bold font-['Space_Grotesk'] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Islamic Duties (Wajebaat & Khumus) are Closed
                  </h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Islamic duties are closed by default on BazaarLoop. You can open them anytime to calculate annual KHUMUS (20%) and Wajebaat.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleIslamicDuties(true)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
                    >
                      Open Islamic Duties
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer border ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center space-y-1">
                    <span className="text-2xl">🕋</span>
                    <h3 className={`text-xl font-extrabold font-['Space_Grotesk'] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      KHUMUS Annual Surplus Calculator
                    </h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      20% (1/5th) duty on annual net savings and business surplus after deducting legitimate annual expenses.
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border space-y-4 shadow-xl text-xs ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Liquid Bank & Cash Surplus</label>
                        <input
                          type="number"
                          value={khumusSavings}
                          onChange={e => setKhumusSavings(e.target.value)}
                          placeholder="e.g. 50000"
                          className={`w-full p-2.5 rounded-xl border font-mono ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Stock / Inventory Valuation</label>
                        <input
                          type="number"
                          value={khumusInventory}
                          onChange={e => setKhumusInventory(e.target.value)}
                          placeholder="e.g. 20000"
                          className={`w-full p-2.5 rounded-xl border font-mono ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Debts & Unpaid Liabilities (-)</label>
                        <input
                          type="number"
                          value={khumusDebts}
                          onChange={e => setKhumusDebts(e.target.value)}
                          placeholder="e.g. 5000"
                          className={`w-full p-2.5 rounded-xl border font-mono ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Yearly Business Living Expenses (-)</label>
                        <input
                          type="number"
                          value={khumusExpenses}
                          onChange={e => setKhumusExpenses(e.target.value)}
                          placeholder="e.g. 15000"
                          className={`w-full p-2.5 rounded-xl border font-mono ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Khumus Computation Output */}
                    {(() => {
                      const totalAssets = (parseFloat(khumusSavings) || 0) + (parseFloat(khumusInventory) || 0);
                      const totalDeductions = (parseFloat(khumusDebts) || 0) + (parseFloat(khumusExpenses) || 0);
                      const netSurplus = Math.max(0, totalAssets - totalDeductions);
                      const khumusTotal = netSurplus * 0.20;
                      const sahmImam = khumusTotal / 2;
                      const sahmSadat = khumusTotal / 2;

                      return (
                        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-3 mt-4 text-center">
                          <div>
                            <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block">
                              Net Taxable Surplus
                            </span>
                            <span className="text-xl font-extrabold text-white font-mono">
                              ${netSurplus.toFixed(2)}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-emerald-800/50">
                            <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">
                              Total KHUMUS Payable (20%)
                            </span>
                            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                              ${khumusTotal.toFixed(2)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-200/80 pt-1">
                            <div className="p-2 rounded-lg bg-emerald-900/30">
                              <strong>Sahm-e-Imam (10%):</strong> ${sahmImam.toFixed(2)}
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-900/30">
                              <strong>Sahm-e-Sadat (10%):</strong> ${sahmSadat.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleIslamicDuties(false)}
                        className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer"
                      >
                        Close Islamic Duties (Hide Wajebaat & Khumus)
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* 9. INTEREST & EMI CALCULATOR */}
            {activeTab === 'interest' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                    Commercial Interest & Loan EMI Calculator
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compute commercial loan amortization schedules, supplier credit terms, or simple savings yield.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl text-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Principal ($)</label>
                      <input
                        type="number"
                        value={intPrincipal}
                        onChange={e => setIntPrincipal(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Annual Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={intRate}
                        onChange={e => setIntRate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tenure (Months)</label>
                      <input
                        type="number"
                        value={intTenureMonths}
                        onChange={e => setIntTenureMonths(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                      />
                    </div>
                  </div>

                  {(() => {
                    const P = parseFloat(intPrincipal) || 0;
                    const r = (parseFloat(intRate) || 0) / (12 * 100);
                    const n = parseInt(intTenureMonths, 10) || 1;

                    let emi = 0;
                    if (r > 0) {
                      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                    } else {
                      emi = P / n;
                    }
                    const totalPayable = emi * n;
                    const totalInterest = totalPayable - P;

                    return (
                      <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-center space-y-2 mt-4">
                        <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider block">
                          Monthly Installment (EMI)
                        </span>
                        <span className="text-3xl font-extrabold text-indigo-400 font-mono">
                          ${emi.toFixed(2)} / month
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-indigo-900/60">
                          <div>
                            <span>Total Interest: </span>
                            <strong className="text-rose-400 font-mono">${totalInterest.toFixed(2)}</strong>
                          </div>
                          <div>
                            <span>Total Repayment: </span>
                            <strong className="text-white font-mono">${totalPayable.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 10. CURRENCY CONVERTER */}
            {activeTab === 'currency' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                    Real-Time Currency Converter
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live exchange rate matrix across international retail currencies.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl text-xs">
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Amount</label>
                      <input
                        type="number"
                        value={currAmount}
                        onChange={e => setCurrAmount(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">From</label>
                      <select
                        value={currFrom}
                        onChange={e => setCurrFrom(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
                      >
                        {Object.keys(currencyRates).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">To</label>
                      <select
                        value={currTo}
                        onChange={e => setCurrTo(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
                      >
                        {Object.keys(currencyRates).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 text-center space-y-1">
                    <span className="text-xs text-slate-400">Converted Output</span>
                    <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                      {handleConvert(parseFloat(currAmount) || 0, currFrom, currTo).toFixed(2)} {currTo}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      1 {currFrom} = {handleConvert(1, currFrom, currTo).toFixed(4)} {currTo}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 11. INVENTORY VALUATION & STOCK LEDGER */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                    Warehouse Inventory & Stock Valuation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time stock value computed directly from your active BazaarLoop product listings.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Total Stock Asset Value</span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                      ${merchantProducts.reduce((sum, p) => sum + p.price * p.quantity, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Total Units in Stock</span>
                    <span className="text-2xl font-extrabold text-white font-mono">
                      {merchantProducts.reduce((sum, p) => sum + p.quantity, 0)} units
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Active Catalog Lines</span>
                    <span className="text-2xl font-extrabold text-indigo-400 font-mono">
                      {merchantProducts.length} items
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto shadow-lg">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                      <tr>
                        <th className="p-3.5">Product Title</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5 text-center">In-Stock Qty</th>
                        <th className="p-3.5 text-right">Unit Price</th>
                        <th className="p-3.5 text-right">Total Asset Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {merchantProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            No warehouse products listed yet. Products you launch in BazaarLoop will automatically reflect their stock asset value here.
                          </td>
                        </tr>
                      ) : (
                        merchantProducts.map(p => (
                          <tr key={p.id}>
                            <td className="p-3.5 font-bold text-white">{p.title}</td>
                            <td className="p-3.5 text-slate-400">{p.category}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-emerald-400">{p.quantity}</td>
                            <td className="p-3.5 text-right font-mono">${p.price.toFixed(2)}</td>
                            <td className="p-3.5 text-right font-mono font-bold text-white">
                              ${(p.quantity * p.price).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 12. NOTES & FINANCIAL REMINDERS */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                      Financial Notes & Audits
                    </h3>
                    <p className="text-xs text-slate-400">
                      Private reminders for tax season, supplier commitments, and shipment receivables.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notes.length === 0 ? (
                    <div className="col-span-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
                      No notes created yet.
                    </div>
                  ) : (
                    notes.map(n => (
                      <div key={n.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                        <strong className="text-white block font-bold text-sm">{n.title}</strong>
                        <p className="text-slate-400 whitespace-pre-line leading-relaxed">{n.content}</p>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 13. BACKUP, EXPORT & PRINT */}
            {activeTab === 'backup' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                    Backup, Restore & Data Exports
                  </h3>
                  <p className="text-xs text-slate-400">
                    Export your complete financial books, ledger CSV, or printable statements.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl text-xs">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-850 border border-slate-750">
                    <div>
                      <strong className="text-white text-sm block">Export Ledger (JSON / CSV)</strong>
                      <span className="text-slate-400 text-[11px]">
                        Download complete transaction history and invoices for accounting
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute('href', dataStr);
                        downloadAnchor.setAttribute('download', `bazaarloop_bizmanager_ledger_${Date.now()}.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                        showAlert('Ledger JSON successfully exported!');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ADD TRANSACTION MODAL */}
      {showAddTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-6 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-white font-['Space_Grotesk']">
                {txType === 'income' ? 'Record Income / Sale' : 'Record Expense / Payment'}
              </h4>
              <button onClick={() => setShowAddTxModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4 pt-4">
              {/* Type Switcher */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setTxType('income'); setTxCategory('Sales Revenue'); }}
                  className={`flex-1 py-2 rounded-xl font-bold cursor-pointer transition-all ${
                    txType === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  + Income (Inflow)
                </button>
                <button
                  type="button"
                  onClick={() => { setTxType('expense'); setTxCategory('Operating Expense'); }}
                  className={`flex-1 py-2 rounded-xl font-bold cursor-pointer transition-all ${
                    txType === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  - Expense (Outflow)
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={txAmount}
                  onChange={e => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-base font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Title / Item Description *</label>
                <input
                  type="text"
                  required
                  value={txTitle}
                  onChange={e => setTxTitle(e.target.value)}
                  placeholder="e.g. Retail sale / Warehouse packaging supplies"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Category</label>
                  <select
                    value={txCategory}
                    onChange={e => setTxCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium"
                  >
                    {txType === 'income' ? (
                      <>
                        <option value="Sales Revenue">Sales Revenue</option>
                        <option value="Client Settlement">Client Settlement</option>
                        <option value="Direct Transfer">Direct Transfer</option>
                        <option value="Other Inflow">Other Inflow</option>
                      </>
                    ) : (
                      <>
                        <option value="Stock & Inventory Purchase">Stock & Inventory</option>
                        <option value="Courier & Logistics">Courier & Logistics</option>
                        <option value="Packaging Materials">Packaging Materials</option>
                        <option value="Marketing & Promo">Marketing & Promo</option>
                        <option value="Utilities & Rent">Utilities & Rent</option>
                        <option value="Staff & Salaries">Staff & Salaries</option>
                        <option value="General Expense">General Expense</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Payment Method</label>
                  <select
                    value={txPaymentMode}
                    onChange={e => setTxPaymentMode(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium"
                  >
                    <option value="upi">UPI</option>
                    <option value="gpay">GPay</option>
                    <option value="apple_pay">Apple Pay</option>
                    <option value="paypal">PayPal</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Reference ID (Optional)</label>
                <input
                  type="text"
                  value={txRef}
                  onChange={e => setTxRef(e.target.value)}
                  placeholder="e.g. BL-847291 or UTR-93821"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={txNotes}
                  onChange={e => setTxNotes(e.target.value)}
                  placeholder="Additional merchant notes..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-white transition-all cursor-pointer shadow-md ${
                  txType === 'income' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Save {txType === 'income' ? 'Income' : 'Expense'} to Ledger
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
