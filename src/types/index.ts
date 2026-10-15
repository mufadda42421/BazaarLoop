export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  whatsappNumber: string | null;
  whatsappCountryCode: string;
  whatsappLocalNumber: string;
  whatsappNumberVerified: boolean;
  whatsappContactEnabled: boolean;
  whatsappNumberPublic: boolean;
  whatsappContactPreference: 'direct_chat' | 'on_request';
  whatsappOnStorefront: boolean;
  whatsappOnListings: boolean;
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
  condition: 'new'; // All goods are 100% Brand New in BazaarLoop
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
  isSaved?: boolean;
  sellerWhatsApp?: {
    normalizedNumber: string;
    countryCode: string;
    contactPreference: 'direct_chat' | 'on_request';
  } | null;
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
  unreadCount?: number;
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

export interface CountryCode {
  code: string;
  country: string;
  flag: string;
  sample: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+1', country: 'United States & Canada', flag: '🇺🇸', sample: '415 555 2671' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', sample: '7911 123456' },
  { code: '+91', country: 'India', flag: '🇮🇳', sample: '98765 43210' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', sample: '412 345 678' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', sample: '151 12345678' },
  { code: '+33', country: 'France', flag: '🇫🇷', sample: '6 12 34 56 78' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪', sample: '50 123 4567' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', sample: '50 123 4567' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', sample: '9123 4567' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', sample: '12 345 6789' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩', sample: '812 3456 789' },
  { code: '+81', country: 'Japan', flag: '🇯🇵', sample: '90 1234 5678' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷', sample: '11 91234 5678' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽', sample: '55 1234 5678' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', sample: '802 123 4567' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪', sample: '712 345678' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', sample: '82 123 4567' }
];

export const CATEGORIES = [
  'All',
  'Consumer Tech & Gadgets',
  'Designer Apparel & Footwear',
  'Watches & Fine Jewelry',
  'Home, Living & Interior',
  'Beauty, Skincare & Fragrance',
  'Sports, Fitness & Activewear',
  'Audio & Pro Sound',
  'Luxury Bags & Accessories',
  'Gourmet & Modern Pantry'
] as const;

export const CONDITIONS = [
  { value: 'new', label: '100% Brand New', description: 'Factory-sealed original retail box with warranty' }
] as const;
