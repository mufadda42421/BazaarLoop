import { User, Product, Conversation, Message, AdCampaign, Report, Review, Notification, Order } from '../types';

const TOKEN_KEY = 'bazaarloop_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const data = await response.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Builds standard WhatsApp deep links for direct messaging.
 * Uses normalized phone digits without plus sign or formatting.
 */
export function buildWhatsAppChatUrl(phoneDigits: string, message: string): string {
  const cleanDigits = phoneDigits.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanDigits}?text=${encodedText}`;
}

/**
 * Builds WhatsApp link to open contact chat where voice/video call can be placed.
 */
export function buildWhatsAppCallUrl(phoneDigits: string): string {
  const cleanDigits = phoneDigits.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanDigits}`;
}

/**
 * Generates product-specific contextual WhatsApp messages for brand-new retail ordering.
 */
export function generateWhatsAppMessage(
  templateType: 'order_now' | 'availability' | 'specs' | 'delivery' | 'custom',
  product: { title: string; price: number; currency: string; id: string; brand?: string },
  customText?: string
): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const listingUrl = `${baseUrl}/#product-${product.id}`;
  const brandName = product.brand ? ` [${product.brand}]` : '';

  switch (templateType) {
    case 'order_now':
      return `Hello! I would like to order "${product.title}"${brandName} (${product.currency} ${product.price}). Please confirm stock and delivery timeframe. ${listingUrl}`;
    case 'availability':
      return `Hi! Is the brand-new "${product.title}"${brandName} (${product.currency} ${product.price}) currently in stock for immediate dispatch? ${listingUrl}`;
    case 'specs':
      return `Hi! Could you please share full manufacturer specs and warranty details for "${product.title}"? ${listingUrl}`;
    case 'delivery':
      return `Hi! What are the express shipping and delivery options for "${product.title}"? ${listingUrl}`;
    case 'custom':
      return customText
        ? `${customText} — Product: "${product.title}" ${listingUrl}`
        : `Hi! Inquiring about "${product.title}": ${listingUrl}`;
    default:
      return `Hello! Inquiring about "${product.title}"${brandName} (${product.currency} ${product.price}): ${listingUrl}`;
  }
}

export const api = {
  // Auth
  register: (data: any) => request<{ token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  login: (credentials: { email: string; password: string }) => request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  getMe: () => request<{ user: User }>('/api/auth/me'),
  updateProfile: (profile: Partial<User>) => request<{ user: User }>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profile)
  }),
  updateWhatsAppSettings: (settings: any) => request<{ message: string; user: User }>('/api/auth/whatsapp-settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  }),
  deactivateAccount: () => request<{ message: string }>('/api/auth/account', {
    method: 'DELETE'
  }),

  // Products
  getProducts: (params: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') query.append(key, String(val));
    });
    return request<{ products: Product[]; total: number }>(`/api/products?${query.toString()}`);
  },
  getProduct: (id: string) => request<{ product: Product; seller: any }>(`/api/products/${id}`),
  createProduct: (data: any) => request<{ product: Product }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateProduct: (id: string, data: any) => request<{ product: Product }>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteProduct: (id: string) => request<{ message: string }>(`/api/products/${id}`, {
    method: 'DELETE'
  }),
  toggleSaveProduct: (id: string) => request<{ saved: boolean; savesCount: number }>(`/api/products/${id}/save`, {
    method: 'POST'
  }),

  // Orders & E-Commerce Checkout
  createOrder: (data: {
    items: { productId: string; quantity: number }[];
    shippingAddress: {
      fullName: string;
      street: string;
      city: string;
      state?: string;
      postalCode: string;
      phone: string;
    };
    paymentMethod?: 'card' | 'apple_pay' | 'cod';
  }) => request<{ order: Order }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getOrders: () => request<{ orders: Order[] }>('/api/orders'),
  getOrder: (id: string) => request<{ order: Order }>(`/api/orders/${id}`),

  // Image Upload
  uploadImage: (dataUrl: string, filename?: string) => request<{ url: string; filename: string }>('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, filename })
  }),

  // Storefront & Social
  getStorefront: (sellerId: string) => request<{ seller: any; listings: Product[]; reviews: Review[] }>(`/api/users/${sellerId}/storefront`),
  toggleFollow: (sellerId: string) => request<{ isFollowing: boolean; followersCount: number }>(`/api/users/${sellerId}/follow`, {
    method: 'POST'
  }),
  submitReview: (sellerId: string, rating: number, comment: string) => request<{ review: Review }>(`/api/users/${sellerId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment })
  }),

  // Messaging
  getConversations: () => request<{ conversations: Conversation[] }>('/api/conversations'),
  getConversation: (id: string) => request<{ conversation: Conversation; messages: Message[]; product?: Product }>(`/api/conversations/${id}`),
  startConversation: (productId: string, messageText: string, imageUrl?: string) => request<{ conversation: Conversation; message: Message; isNew: boolean }>('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ productId, messageText, imageUrl })
  }),
  sendMessage: (conversationId: string, text: string, imageUrl?: string) => request<{ message: Message }>(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text, imageUrl })
  }),
  markConversationRead: (conversationId: string) => request<{ success: boolean }>(`/api/conversations/${conversationId}/read`, {
    method: 'PUT'
  }),

  // Campaigns
  getCampaigns: () => request<{ campaigns: AdCampaign[] }>('/api/campaigns'),
  createCampaign: (data: any) => request<{ campaign: AdCampaign }>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateCampaignStatus: (id: string, status: string) => request<{ campaign: AdCampaign }>(`/api/campaigns/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),

  // Notifications
  getNotifications: () => request<{ notifications: Notification[]; unreadCount: number }>('/api/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/api/notifications/${id}/read`, {
    method: 'PUT'
  }),

  // Safety & Moderation
  reportTarget: (data: { targetType: 'listing' | 'user'; targetId: string; targetTitleOrName: string; reason: string; details?: string }) => request<{ message: string; report: Report }>('/api/reports', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  toggleBlockUser: (blockedUserId: string) => request<{ isBlocked: boolean }>('/api/users/block', {
    method: 'POST',
    body: JSON.stringify({ blockedUserId })
  }),
  getAdminStats: () => request<{ stats: any }>('/api/admin/stats'),
  getAdminReports: () => request<{ reports: Report[] }>('/api/admin/reports'),
  updateAdminReport: (id: string, status: string) => request<{ report: Report }>(`/api/admin/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
};
