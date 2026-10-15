import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.resolve(__dirname, '../public/uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
  condition: 'new'; // All products are 100% Brand New in BazaarLoop E-Commerce
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
  paymentMethod: 'card' | 'apple_pay' | 'cod';
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
  rating: number; // 1 to 5
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
}

const defaultDatabase: DatabaseSchema = {
  users: [],
  products: [],
  orders: [],
  conversations: [],
  messages: [],
  savedListings: [],
  follows: [],
  reviews: [],
  campaigns: [],
  reports: [],
  notifications: [],
  blockedUsers: []
};

// In-memory cache + atomic sync
let dbCache: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (dbCache) {
    if (!dbCache.orders) dbCache.orders = [];
    return dbCache;
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDatabase, null, 2), 'utf-8');
    dbCache = JSON.parse(JSON.stringify(defaultDatabase));
    return dbCache!;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
    if (!dbCache!.orders) dbCache!.orders = [];
    return dbCache!;
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
