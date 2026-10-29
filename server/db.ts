import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export type PaymentMethodType = 'upi' | 'gpay' | 'apple_pay' | 'paypal' | 'card';

export interface BankingDetails {
  acceptedMethods: PaymentMethodType[];
  upiId?: string;
  gpayNumber?: string;
  applePayId?: string;
  paypalEmail?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifscOrRouting?: string;
  cardType?: 'credit' | 'debit' | 'both';
  paymentNotes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  // WhatsApp settings
  whatsappNumber: string | null;
  whatsappCountryCode: string;
  whatsappLocalNumber: string;
  whatsappNumberVerified: boolean;
  whatsappContactEnabled: boolean;
  whatsappNumberPublic: boolean;
  whatsappContactPreference: 'direct_chat' | 'on_request';
  whatsappOnStorefront: boolean;
  whatsappOnListings: boolean;
  // Phone settings
  phoneNumber: string | null;
  phoneCallEnabled: boolean;
  isDifferentPhone: boolean;
  // Banking and payment details
  bankingDetails?: BankingDetails;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  subcategory?: string;
  brand?: string;
  sku?: string;
  warranty?: string;
  condition: 'new'; // All goods in BazaarLoop are brand-new
  quantity: number;
  initialQuantity: number;
  images: string[];
  location: string;
  deliveryOptions: ('shipping' | 'express_delivery' | 'local_pickup')[];
  whatsappContactEnabled: boolean;
  status: 'active' | 'draft' | 'paused' | 'sold' | 'out_of_stock';
  viewsCount: number;
  savesCount: number;
  inquiriesCount: number;
  salesCount?: number;
  createdAt: string;
  updatedAt: string;
  contactPreferenceUpdatedAt?: string;
  isSponsored?: boolean;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  currency: string;
  image?: string;
  sellerId: string;
  brand?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    phone: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  status: 'placed' | 'processing' | 'shipped' | 'delivered';
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  paymentMethod: 'upi' | 'gpay' | 'apple_pay' | 'paypal' | 'card' | 'cod';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  readBy: string[];
}

export interface Conversation {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productCurrency: string;
  productImage?: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  sellerName: string;
  lastMessageText: string;
  lastMessageAt: string;
  updatedAt: string;
  createdAt: string;
}

export interface AdCampaign {
  id: string;
  sellerId: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  planName: 'Starter Boost' | 'Growth Spotlight' | 'Market Leader';
  budgetUSD: number;
  durationDays: number;
  status: 'pending_payment' | 'active' | 'paused' | 'ended';
  impressions: number;
  clicks: number;
  spendUSD: number;
  createdAt: string;
  expiresAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'listing' | 'user';
  targetId: string;
  targetTitleOrName: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface Review {
  id: string;
  sellerId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  type: 'order' | 'message' | 'inquiry' | 'inventory' | 'campaign' | 'system';
}

export interface BizTransaction {
  id: string;
  userId: string;
  businessId?: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  title: string;
  description?: string;
  date: string;
  paymentMode: 'upi' | 'gpay' | 'apple_pay' | 'paypal' | 'card' | 'cash' | 'bank_transfer';
  referenceId?: string;
  wajebaatAmount?: number;
  source: 'auto_order' | 'manual';
  createdAt: string;
}

export interface BizBusiness {
  id: string;
  userId: string;
  name: string;
  tagline?: string;
  category?: string;
  currency: string;
  createdAt: string;
}

export interface BizPerson {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  role: 'customer' | 'supplier' | 'partner' | 'staff';
  balance: number;
  notes?: string;
  createdAt: string;
}

export interface BizInvoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: Array<{ title: string; quantity: number; price: number; total: number }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

export interface BizNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  color?: string;
  createdAt: string;
}

export interface BizSettings {
  userId: string;
  defaultCurrency: string;
  wajebaatEnabled: boolean;
  wajebaatRate: number;
  khumusRate: number;
  invoiceWatermarkText: string;
  invoiceBusinessName: string;
  invoicePhone: string;
  invoiceAddress: string;
  bankName?: string;
  accountNumber?: string;
  upiId?: string;
}

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  orders: Order[];
  conversations: Conversation[];
  messages: Message[];
  savedListings: { userId: string; productId: string; savedAt: string }[];
  follows: { followerId: string; sellerId: string; createdAt: string }[];
  reviews: Review[];
  campaigns: AdCampaign[];
  reports: Report[];
  notifications: Notification[];
  blockedUsers: { userId: string; blockedUserId: string; createdAt: string }[];
  bizTransactions: BizTransaction[];
  bizBusinesses: BizBusiness[];
  bizPeople: BizPerson[];
  bizInvoices: BizInvoice[];
  bizNotes: BizNote[];
  bizSettings: BizSettings[];
}

// Only Admin Moderator is retained as a private administrative account
// AdminPass1234! -> 5156876d272e764b5f2a4c57a77454db:b6db12c2d44d6fc17e227a29f7fde4d14374676bd98a4b702e8afc5a2c6566f273bfb6be8677d65baee7fbfd80f4da30736e36aaeebe9373e70d0687f6b26dc3
const SEED_USERS: User[] = [
  {
    id: 'user-admin-bazaar',
    name: 'Admin Moderator',
    email: 'admin@bazaarloop.com',
    passwordHash: '5156876d272e764b5f2a4c57a77454db:b6db12c2d44d6fc17e227a29f7fde4d14374676bd98a4b702e8afc5a2c6566f273bfb6be8677d65baee7fbfd80f4da30736e36aaeebe9373e70d0687f6b26dc3',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    bio: 'Platform safety, moderation & administration team.',
    city: 'Headquarters',
    role: 'admin',
    isVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    whatsappNumber: null,
    whatsappCountryCode: '+1',
    whatsappLocalNumber: '',
    whatsappNumberVerified: false,
    whatsappContactEnabled: false,
    whatsappNumberPublic: false,
    whatsappContactPreference: 'direct_chat',
    whatsappOnStorefront: false,
    whatsappOnListings: false,
    phoneNumber: null,
    phoneCallEnabled: false,
    isDifferentPhone: false
  }
];

// No demo products - clean slate for user-created products
const SEED_PRODUCTS: Product[] = [];

const defaultDatabase: DatabaseSchema = {
  users: SEED_USERS,
  products: SEED_PRODUCTS,
  orders: [],
  conversations: [],
  messages: [],
  savedListings: [],
  follows: [],
  reviews: [],
  campaigns: [],
  reports: [],
  notifications: [],
  blockedUsers: [],
  bizTransactions: [],
  bizBusinesses: [],
  bizPeople: [],
  bizInvoices: [],
  bizNotes: [],
  bizSettings: []
};

// In-memory cache + atomic sync
let dbCache: DatabaseSchema | null = null;

function sanitizeAndEnsureData(data: DatabaseSchema): DatabaseSchema {
  let changed = false;

  // Filter out demo users, keep only admin moderator and non-demo users
  const demoEmails = ['alex.seller@example.com', 'jordan.buyer@example.com', 'test@example.com', 'john@example.com'];
  const cleanedUsers = (data.users || []).filter(u => !demoEmails.includes(u.email.toLowerCase()));
  
  // Ensure Admin Moderator exists
  if (!cleanedUsers.some(u => u.email.toLowerCase() === 'admin@bazaarloop.com')) {
    cleanedUsers.unshift(SEED_USERS[0]);
    changed = true;
  }
  if (data.users?.length !== cleanedUsers.length) {
    data.users = cleanedUsers;
    changed = true;
  }

  // Remove all demo products
  const demoProductPrefixes = ['prod-iphone', 'prod-sony', 'prod-macbook', 'prod-ember'];
  const cleanedProducts = (data.products || []).filter(p => !demoProductPrefixes.some(pref => p.id.startsWith(pref)));
  if (data.products?.length !== cleanedProducts.length) {
    data.products = cleanedProducts;
    changed = true;
  }

  if (!data.orders) {
    data.orders = [];
    changed = true;
  }
  if (!data.conversations) {
    data.conversations = [];
    changed = true;
  }
  if (!data.messages) {
    data.messages = [];
    changed = true;
  }
  if (!data.savedListings) {
    data.savedListings = [];
    changed = true;
  }
  if (!data.follows) {
    data.follows = [];
    changed = true;
  }
  if (!data.reviews) {
    data.reviews = [];
    changed = true;
  }
  if (!data.campaigns) {
    data.campaigns = [];
    changed = true;
  }
  if (!data.reports) {
    data.reports = [];
    changed = true;
  }
  if (!data.notifications) {
    data.notifications = [];
    changed = true;
  }
  if (!data.blockedUsers) {
    data.blockedUsers = [];
    changed = true;
  }
  if (!data.bizTransactions) {
    data.bizTransactions = [];
    changed = true;
  }
  if (!data.bizBusinesses) {
    data.bizBusinesses = [];
    changed = true;
  }
  if (!data.bizPeople) {
    data.bizPeople = [];
    changed = true;
  }
  if (!data.bizInvoices) {
    data.bizInvoices = [];
    changed = true;
  }
  if (!data.bizNotes) {
    data.bizNotes = [];
    changed = true;
  }
  if (!data.bizSettings) {
    data.bizSettings = [];
    changed = true;
  }

  if (changed) {
    saveDb(data);
  }

  return data;
}

export function getDb(): DatabaseSchema {
  if (dbCache) {
    return sanitizeAndEnsureData(dbCache);
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDatabase, null, 2), 'utf-8');
    dbCache = JSON.parse(JSON.stringify(defaultDatabase));
    return dbCache!;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
    return sanitizeAndEnsureData(dbCache!);
  } catch (err) {
    console.error('Failed to parse database, resetting to clean state:', err);
    dbCache = JSON.parse(JSON.stringify(defaultDatabase));
    return dbCache!;
  }
}

export function saveDb(data: DatabaseSchema): void {
  dbCache = data;
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}
