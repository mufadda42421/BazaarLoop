import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  getDb,
  saveDb,
  User,
  Product,
  Order,
  Conversation,
  Message,
  AdCampaign,
  Report,
  Review,
  Notification,
  BizTransaction,
  BizBusiness,
  BizPerson,
  BizInvoice,
  BizNote,
  BizSettings
} from './server/db';
import {
  hashPassword,
  verifyPassword,
  createToken,
  normalizeWhatsAppNumber,
  requireAuth,
  optionalAuth,
  AuthenticatedRequest
} from './server/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable JSON body parser with generous limit for image uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
const UPLOADS_DIR = path.resolve(__dirname, 'public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Google Search Console Site Verification file endpoint
app.get('/google19cd285af1593cdf.html', (_req: Request, res: Response) => {
  res.type('text/html');
  res.send('google-site-verification: google19cd285af1593cdf.html');
});

// Helper: sanitize user for safe client consumption
function sanitizeUser(user: User) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// --------------------------------------------------------------------------
// 1. AUTHENTICATION & USER PROFILE ROUTES
// --------------------------------------------------------------------------

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      whatsappCountryCode = '+1',
      whatsappLocalNumber = '',
      whatsappContactEnabled = false,
      isDifferentPhone = false,
      phoneNumber = '',
      phoneCallEnabled = false,
      bankingDetails,
      firebaseUid
    } = req.body;

    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password : '';
    const cleanWhatsApp = typeof whatsappLocalNumber === 'string' ? whatsappLocalNumber.trim() : '';
    const cleanPhone = typeof phoneNumber === 'string' ? phoneNumber.trim() : '';

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDb();
    const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    let normalizedWhatsApp: string | null = null;
    let isWhatsAppValid = false;

    if (cleanWhatsApp) {
      const norm = normalizeWhatsAppNumber(whatsappCountryCode || '+1', cleanWhatsApp);
      if (!norm.isValid) {
        return res.status(400).json({ error: 'The WhatsApp number entered is invalid. Please check the country code and number.' });
      }
      normalizedWhatsApp = norm.normalized;
      isWhatsAppValid = true;
    }

    // Parse banking & payment details if provided
    let cleanBankingDetails = undefined;
    if (bankingDetails && typeof bankingDetails === 'object') {
      const accepted = Array.isArray(bankingDetails.acceptedMethods)
        ? bankingDetails.acceptedMethods.filter((m: string) => ['upi', 'gpay', 'apple_pay', 'paypal', 'card'].includes(m))
        : [];

      cleanBankingDetails = {
        acceptedMethods: accepted,
        upiId: typeof bankingDetails.upiId === 'string' ? bankingDetails.upiId.trim() : '',
        gpayNumber: typeof bankingDetails.gpayNumber === 'string' ? bankingDetails.gpayNumber.trim() : '',
        applePayId: typeof bankingDetails.applePayId === 'string' ? bankingDetails.applePayId.trim() : '',
        paypalEmail: typeof bankingDetails.paypalEmail === 'string' ? bankingDetails.paypalEmail.trim() : '',
        bankName: typeof bankingDetails.bankName === 'string' ? bankingDetails.bankName.trim() : '',
        accountHolder: typeof bankingDetails.accountHolder === 'string' ? bankingDetails.accountHolder.trim() : '',
        accountNumber: typeof bankingDetails.accountNumber === 'string' ? bankingDetails.accountNumber.trim() : '',
        ifscOrRouting: typeof bankingDetails.ifscOrRouting === 'string' ? bankingDetails.ifscOrRouting.trim() : '',
        cardType: bankingDetails.cardType === 'credit' || bankingDetails.cardType === 'debit' ? bankingDetails.cardType : 'both',
        paymentNotes: typeof bankingDetails.paymentNotes === 'string' ? bankingDetails.paymentNotes.trim() : ''
      };
    }

    const now = new Date().toISOString();
    // First user becomes admin automatically for moderation testing
    const isFirstUser = db.users.length === 0;
    const isAdminEmail = cleanEmail === 'admin@bazaarloop.com' || cleanEmail === 'jaorawalamufaddal7@gmail.com';

    const newUser: User = {
      id: firebaseUid || crypto.randomUUID(),
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashPassword(cleanPassword),
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
      bio: '',
      city: '',
      role: isFirstUser || isAdminEmail ? 'admin' : 'user',
      isVerified: true,
      createdAt: now,
      updatedAt: now,
      whatsappNumber: normalizedWhatsApp,
      whatsappCountryCode: whatsappCountryCode || '+1',
      whatsappLocalNumber: cleanWhatsApp,
      whatsappNumberVerified: false,
      whatsappContactEnabled: Boolean(whatsappContactEnabled && isWhatsAppValid),
      whatsappNumberPublic: false,
      whatsappContactPreference: 'direct_chat',
      whatsappOnStorefront: true,
      whatsappOnListings: true,
      phoneNumber: cleanPhone || null,
      phoneCallEnabled: Boolean(phoneCallEnabled),
      isDifferentPhone: Boolean(isDifferentPhone),
      bankingDetails: cleanBankingDetails
    };

    db.users.push(newUser);

    // Welcome notification
    db.notifications.push({
      id: crypto.randomUUID(),
      userId: newUser.id,
      title: 'Welcome to BazaarLoop E-Commerce!',
      message: 'Your account is active. Explore brand collections, place orders with express delivery, or start your official storefront.',
      isRead: false,
      createdAt: now,
      type: 'system'
    });

    saveDb(db);

    const token = createToken({ userId: newUser.id, email: newUser.email, role: newUser.role });
    return res.status(201).json({ token, user: sanitizeUser(newUser) });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password : '';

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user || !verifyPassword(cleanPassword, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken({ userId: user.id, email: user.email, role: user.role });
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Server error during login' });
  }
});

app.post('/api/auth/firebase', (req: Request, res: Response) => {
  try {
    const { email, name, avatarUrl, firebaseUid, bankingDetails } = req.body;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Valid email is required for Firebase authentication' });
    }

    const db = getDb();
    let user = db.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (user) {
      if (name && (!user.name || user.name === 'Member')) user.name = name.trim();
      if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
      user.isVerified = true;
      user.updatedAt = new Date().toISOString();
      saveDb(db);
    } else {
      const now = new Date().toISOString();
      const isFirstUser = db.users.length === 0;
      const isAdminEmail = cleanEmail === 'admin@bazaarloop.com' || cleanEmail === 'jaorawalamufaddal7@gmail.com';

      const newUser: User = {
        id: firebaseUid || crypto.randomUUID(),
        name: typeof name === 'string' && name.trim() ? name.trim() : cleanEmail.split('@')[0],
        email: cleanEmail,
        passwordHash: hashPassword(crypto.randomUUID()),
        avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
        bio: '',
        city: '',
        role: isFirstUser || isAdminEmail ? 'admin' : 'user',
        isVerified: true,
        createdAt: now,
        updatedAt: now,
        whatsappNumber: null,
        whatsappCountryCode: '+1',
        whatsappLocalNumber: '',
        whatsappNumberVerified: false,
        whatsappContactEnabled: false,
        whatsappNumberPublic: false,
        whatsappContactPreference: 'direct_chat',
        whatsappOnStorefront: true,
        whatsappOnListings: true,
        phoneNumber: null,
        phoneCallEnabled: false,
        isDifferentPhone: false,
        bankingDetails: bankingDetails || undefined
      };

      db.users.push(newUser);
      db.notifications.push({
        id: crypto.randomUUID(),
        userId: newUser.id,
        title: 'Welcome to BazaarLoop E-Commerce!',
        message: 'Your account is active via Firebase. Explore brand collections or start your official storefront.',
        isRead: false,
        createdAt: now,
        type: 'system'
      });

      saveDb(db);
      user = newUser;
    }

    const token = createToken({ userId: user.id, email: user.email, role: user.role });
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err: any) {
    console.error('Firebase auth endpoint error:', err);
    return res.status(500).json({ error: err.message || 'Firebase login failed' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: sanitizeUser(req.user!) });
});

app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, bio, city, avatarUrl, bankingDetails } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.id === req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name.trim();
    if (typeof bio === 'string') user.bio = bio.trim();
    if (typeof city === 'string') user.city = city.trim();
    if (typeof avatarUrl === 'string') user.avatarUrl = avatarUrl;
    if (bankingDetails && typeof bankingDetails === 'object') {
      user.bankingDetails = {
        acceptedMethods: Array.isArray(bankingDetails.acceptedMethods) ? bankingDetails.acceptedMethods : [],
        upiId: typeof bankingDetails.upiId === 'string' ? bankingDetails.upiId.trim() : '',
        gpayNumber: typeof bankingDetails.gpayNumber === 'string' ? bankingDetails.gpayNumber.trim() : '',
        applePayId: typeof bankingDetails.applePayId === 'string' ? bankingDetails.applePayId.trim() : '',
        paypalEmail: typeof bankingDetails.paypalEmail === 'string' ? bankingDetails.paypalEmail.trim() : '',
        bankName: typeof bankingDetails.bankName === 'string' ? bankingDetails.bankName.trim() : '',
        accountHolder: typeof bankingDetails.accountHolder === 'string' ? bankingDetails.accountHolder.trim() : '',
        accountNumber: typeof bankingDetails.accountNumber === 'string' ? bankingDetails.accountNumber.trim() : '',
        ifscOrRouting: typeof bankingDetails.ifscOrRouting === 'string' ? bankingDetails.ifscOrRouting.trim() : '',
        cardType: bankingDetails.cardType || 'both',
        paymentNotes: typeof bankingDetails.paymentNotes === 'string' ? bankingDetails.paymentNotes.trim() : ''
      };
    }
    user.updatedAt = new Date().toISOString();

    // Sync seller name on their products
    for (const p of db.products) {
      if (p.sellerId === user.id) {
        p.sellerName = user.name;
        if (user.avatarUrl) p.sellerAvatar = user.avatarUrl;
      }
    }

    saveDb(db);
    return res.json({ user: sanitizeUser(user) });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.put('/api/auth/whatsapp-settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      whatsappCountryCode,
      whatsappLocalNumber,
      whatsappContactEnabled,
      whatsappNumberPublic,
      whatsappContactPreference,
      whatsappOnStorefront,
      whatsappOnListings,
      phoneNumber,
      phoneCallEnabled,
      isDifferentPhone
    } = req.body;

    const db = getDb();
    const user = db.users.find(u => u.id === req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let normalizedWhatsApp: string | null = null;
    if (whatsappLocalNumber && whatsappLocalNumber.trim()) {
      const norm = normalizeWhatsAppNumber(whatsappCountryCode || user.whatsappCountryCode || '+1', whatsappLocalNumber);
      if (!norm.isValid) {
        return res.status(400).json({ error: 'Invalid WhatsApp phone number format. Please check the country code and number.' });
      }
      normalizedWhatsApp = norm.normalized;
      user.whatsappNumber = normalizedWhatsApp;
      user.whatsappCountryCode = whatsappCountryCode || '+1';
      user.whatsappLocalNumber = whatsappLocalNumber.trim();
    } else {
      // User removed WhatsApp number
      user.whatsappNumber = null;
      user.whatsappLocalNumber = '';
      user.whatsappContactEnabled = false;
    }

    if (typeof whatsappContactEnabled === 'boolean') {
      user.whatsappContactEnabled = Boolean(whatsappContactEnabled && user.whatsappNumber);
    }
    if (typeof whatsappNumberPublic === 'boolean') {
      user.whatsappNumberPublic = whatsappNumberPublic;
    }
    if (whatsappContactPreference === 'direct_chat' || whatsappContactPreference === 'on_request') {
      user.whatsappContactPreference = whatsappContactPreference;
    }
    if (typeof whatsappOnStorefront === 'boolean') {
      user.whatsappOnStorefront = whatsappOnStorefront;
    }
    if (typeof whatsappOnListings === 'boolean') {
      user.whatsappOnListings = whatsappOnListings;
    }
    if (typeof isDifferentPhone === 'boolean') {
      user.isDifferentPhone = isDifferentPhone;
    }
    if (typeof phoneNumber === 'string') {
      user.phoneNumber = phoneNumber.trim() || null;
    }
    if (typeof phoneCallEnabled === 'boolean') {
      user.phoneCallEnabled = phoneCallEnabled;
    }

    user.updatedAt = new Date().toISOString();

    // If seller disabled WhatsApp contact globally, update existing listings
    if (!user.whatsappContactEnabled) {
      for (const p of db.products) {
        if (p.sellerId === user.id) {
          p.whatsappContactEnabled = false;
          p.contactPreferenceUpdatedAt = user.updatedAt;
        }
      }
    }

    saveDb(db);
    return res.json({
      message: 'WhatsApp and contact preferences updated successfully',
      user: sanitizeUser(user)
    });
  } catch (err: any) {
    console.error('WhatsApp settings update error:', err);
    return res.status(500).json({ error: 'Failed to update WhatsApp settings' });
  }
});

app.delete('/api/auth/account', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.id;

    // Archive or remove user listings
    db.products = db.products.filter(p => p.sellerId !== userId);
    // Remove user
    db.users = db.users.filter(u => u.id !== userId);

    saveDb(db);
    return res.json({ message: 'Account deactivated and listings removed successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to deactivate account' });
  }
});

// --------------------------------------------------------------------------
// 2. PRODUCT LISTING ROUTES
// --------------------------------------------------------------------------

app.get('/api/products', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      category,
      subcategory,
      search,
      minPrice,
      maxPrice,
      condition,
      sort = 'newest',
      sellerId,
      status = 'active',
      tab
    } = req.query;

    const db = getDb();
    let results = [...db.products];

    // Filter by seller or public status
    if (sellerId) {
      results = results.filter(p => p.sellerId === sellerId);
      if (req.user?.id !== sellerId) {
        results = results.filter(p => p.status === 'active' || p.status === 'out_of_stock' || p.status === 'sold');
      }
    } else {
      // By default public feed only shows active listings (or out_of_stock clearly badged)
      if (status === 'all' && req.user) {
        // user's own items if in seller dashboard
      } else {
        results = results.filter(p => p.status === 'active' || p.status === 'out_of_stock');
      }
    }

    // Tabs filter: following, saved
    if (tab === 'following' && req.user) {
      const followingSellerIds = db.follows
        .filter(f => f.followerId === req.user!.id)
        .map(f => f.sellerId);
      results = results.filter(p => followingSellerIds.includes(p.sellerId));
    } else if (tab === 'saved' && req.user) {
      const savedProductIds = db.savedListings
        .filter(s => s.userId === req.user!.id)
        .map(s => s.productId);
      results = results.filter(p => savedProductIds.includes(p.id));
    }

    // Category filter
    if (category && category !== 'All') {
      results = results.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }

    // Subcategory filter
    if (subcategory) {
      results = results.filter(p => p.subcategory?.toLowerCase() === String(subcategory).toLowerCase());
    }

    // Condition filter
    if (condition && condition !== 'all') {
      results = results.filter(p => p.condition === condition);
    }

    // Price range
    if (minPrice && !isNaN(Number(minPrice))) {
      results = results.filter(p => p.price >= Number(minPrice));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      results = results.filter(p => p.price <= Number(maxPrice));
    }

    // Search keyword
    if (search && typeof search === 'string' && search.trim()) {
      const query = search.trim().toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query)
      );
    }

    // Sorting
    if (sort === 'newest') {
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'price_asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      results.sort((a, b) => b.price - a.price);
    } else if (sort === 'popular') {
      results.sort((a, b) => (b.viewsCount + b.savesCount * 2) - (a.viewsCount + a.savesCount * 2));
    }

    // Attach sponsored flag if there's an active campaign
    const activeCampaignProductIds = new Set(
      db.campaigns.filter(c => c.status === 'active').map(c => c.productId)
    );

    // Attach saved flag for current user
    const userSavedIds = new Set(
      req.user ? db.savedListings.filter(s => s.userId === req.user!.id).map(s => s.productId) : []
    );

    const safeResults = results.map(product => {
      const seller = db.users.find(u => u.id === product.sellerId);
      const isWhatsAppAvailable = Boolean(
        product.whatsappContactEnabled &&
        seller &&
        seller.whatsappContactEnabled &&
        seller.whatsappNumber &&
        seller.whatsappOnListings
      );

      return {
        ...product,
        isSponsored: activeCampaignProductIds.has(product.id),
        isSaved: userSavedIds.has(product.id),
        sellerWhatsApp: isWhatsAppAvailable && seller ? {
          normalizedNumber: seller.whatsappNumber,
          countryCode: seller.whatsappCountryCode,
          contactPreference: seller.whatsappContactPreference
        } : null
      };
    });

    return res.json({ products: safeResults, total: safeResults.length });
  } catch (err: any) {
    console.error('Products fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const product = db.products.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Atomically increment views count
    product.viewsCount = (product.viewsCount || 0) + 1;
    saveDb(db);

    const seller = db.users.find(u => u.id === product.sellerId);
    const isSaved = req.user
      ? db.savedListings.some(s => s.userId === req.user!.id && s.productId === product.id)
      : false;

    const isFollowingSeller = req.user && seller
      ? db.follows.some(f => f.followerId === req.user!.id && f.sellerId === seller.id)
      : false;

    // Contact availability
    const isWhatsAppAvailable = Boolean(
      product.whatsappContactEnabled &&
      seller &&
      seller.whatsappContactEnabled &&
      seller.whatsappNumber &&
      seller.whatsappOnListings
    );

    const isPhoneCallAvailable = Boolean(
      seller && seller.phoneCallEnabled && seller.phoneNumber
    );

    const sellerProductCount = db.products.filter(p => p.sellerId === product.sellerId && p.status === 'active').length;

    return res.json({
      product: {
        ...product,
        isSaved
      },
      seller: seller ? {
        id: seller.id,
        name: seller.name,
        avatarUrl: seller.avatarUrl,
        bio: seller.bio,
        city: seller.city,
        createdAt: seller.createdAt,
        isVerified: seller.isVerified,
        activeListingsCount: sellerProductCount,
        isFollowing: isFollowingSeller,
        whatsappContactEnabled: isWhatsAppAvailable,
        whatsappNumber: isWhatsAppAvailable ? seller.whatsappNumber : null,
        phoneCallEnabled: isPhoneCallAvailable,
        phoneNumber: isPhoneCallAvailable ? seller.phoneNumber : null
      } : null
    });
  } catch (err: any) {
    console.error('Product detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

app.post('/api/products', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      price,
      currency = 'USD',
      category,
      subcategory = '',
      condition = 'good',
      quantity = 1,
      images = [],
      location,
      deliveryOptions = ['local_pickup'],
      whatsappContactEnabled
    } = req.body;

    if (!title || !description || price === undefined || !category || !location) {
      return res.status(400).json({ error: 'Title, description, price, category, and location are required' });
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Price must be a valid non-negative number' });
    }

    const parsedQty = Math.max(0, parseInt(quantity, 10) || 1);
    const db = getDb();
    const user = req.user!;

    // Inherit from seller's WhatsApp preference if not explicitly provided
    const shouldEnableWhatsApp = typeof whatsappContactEnabled === 'boolean'
      ? whatsappContactEnabled
      : Boolean(user.whatsappContactEnabled && user.whatsappNumber && user.whatsappOnListings);

    const now = new Date().toISOString();
    const newProduct: Product = {
      id: crypto.randomUUID(),
      sellerId: user.id,
      sellerName: user.name,
      sellerAvatar: user.avatarUrl,
      title: title.trim(),
      description: description.trim(),
      price: parsedPrice,
      currency,
      category,
      subcategory: subcategory.trim(),
      condition,
      quantity: parsedQty,
      initialQuantity: parsedQty,
      images: Array.isArray(images) ? images : [],
      location: location.trim(),
      deliveryOptions: Array.isArray(deliveryOptions) && deliveryOptions.length > 0 ? deliveryOptions : ['local_pickup'],
      whatsappContactEnabled: shouldEnableWhatsApp,
      status: parsedQty === 0 ? 'out_of_stock' : 'active',
      viewsCount: 0,
      savesCount: 0,
      inquiriesCount: 0,
      createdAt: now,
      updatedAt: now,
      contactPreferenceUpdatedAt: now
    };

    db.products.unshift(newProduct);
    saveDb(db);

    return res.status(201).json({ product: newProduct });
  } catch (err: any) {
    console.error('Product create error:', err);
    return res.status(500).json({ error: 'Failed to create product listing' });
  }
});

app.put('/api/products/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const product = db.products.find(p => p.id === id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const requestingUser = req.user!;
    const sellerUser = db.users.find(u => u.id === product.sellerId);
    const isOwnerById = product.sellerId === requestingUser.id;
    const isOwnerByEmail = sellerUser && sellerUser.email.toLowerCase() === requestingUser.email.toLowerCase();
    const isAdmin = requestingUser.role === 'admin';

    if (!isOwnerById && !isOwnerByEmail && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to modify this listing' });
    }

    const {
      title,
      description,
      price,
      currency,
      category,
      subcategory,
      condition,
      quantity,
      images,
      location,
      deliveryOptions,
      whatsappContactEnabled,
      status
    } = req.body;

    if (title) product.title = title.trim();
    if (description) product.description = description.trim();
    if (price !== undefined && !isNaN(Number(price))) product.price = Number(price);
    if (currency) product.currency = currency;
    if (category) product.category = category;
    if (typeof subcategory === 'string') product.subcategory = subcategory.trim();
    if (condition) product.condition = condition;
    if (location) product.location = location.trim();
    if (Array.isArray(images)) product.images = images;
    if (Array.isArray(deliveryOptions)) product.deliveryOptions = deliveryOptions;

    // Concurrency-safe atomic inventory restocking & status transition
    if (quantity !== undefined && !isNaN(parseInt(quantity, 10))) {
      const newQty = Math.max(0, parseInt(quantity, 10));
      const previousQty = product.quantity;
      product.quantity = newQty;

      if (newQty === 0) {
        product.status = 'out_of_stock';
      } else if (previousQty === 0 && newQty > 0 && product.status === 'out_of_stock') {
        product.status = 'active';
      }
    }

    if (status && ['active', 'draft', 'paused', 'sold', 'out_of_stock'].includes(status)) {
      product.status = status;
    }

    if (typeof whatsappContactEnabled === 'boolean') {
      product.whatsappContactEnabled = whatsappContactEnabled;
      product.contactPreferenceUpdatedAt = new Date().toISOString();
    }

    product.updatedAt = new Date().toISOString();
    saveDb(db);

    return res.json({ product });
  } catch (err: any) {
    console.error('Product update error:', err);
    return res.status(500).json({ error: 'Failed to update product listing' });
  }
});

app.delete('/api/products/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const productIndex = db.products.findIndex(p => p.id === id);
    if (productIndex === -1) return res.status(404).json({ error: 'Product not found' });

    const product = db.products[productIndex];
    const requestingUser = req.user!;
    
    // Check if requester is seller by ID, by email (e.g. Firebase vs local ID sync), or an admin
    const sellerUser = db.users.find(u => u.id === product.sellerId);
    const isOwnerById = product.sellerId === requestingUser.id;
    const isOwnerByEmail = sellerUser && sellerUser.email.toLowerCase() === requestingUser.email.toLowerCase();
    const isAdmin = requestingUser.role === 'admin';

    if (!isOwnerById && !isOwnerByEmail && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this listing' });
    }

    db.products.splice(productIndex, 1);
    // Remove from saved listings
    db.savedListings = db.savedListings.filter(s => s.productId !== id);
    saveDb(db);

    return res.json({ message: 'Listing deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// Toggle save/favorite
app.post('/api/products/:id/save', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const product = db.products.find(p => p.id === id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const userId = req.user!.id;
    const existingIndex = db.savedListings.findIndex(s => s.userId === userId && s.productId === id);

    let saved = false;
    if (existingIndex >= 0) {
      db.savedListings.splice(existingIndex, 1);
      product.savesCount = Math.max(0, (product.savesCount || 1) - 1);
      saved = false;
    } else {
      db.savedListings.push({ userId, productId: id, savedAt: new Date().toISOString() });
      product.savesCount = (product.savesCount || 0) + 1;
      saved = true;
    }

    saveDb(db);
    return res.json({ saved, savesCount: product.savesCount });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to toggle saved status' });
  }
});

// --------------------------------------------------------------------------
// 3. IMAGE UPLOAD ROUTE
// --------------------------------------------------------------------------

app.post('/api/upload', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dataUrl, filename = 'photo.jpg' } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'Invalid upload payload: dataUrl is required' });
    }

    // Match data:image/png;base64,....
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // 10MB limit
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image file size exceeds the 10MB limit' });
    }

    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const uniqueFilename = `${crypto.randomUUID()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${uniqueFilename}`;

    return res.status(201).json({ url: publicUrl, filename: uniqueFilename, size: buffer.length });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

// --------------------------------------------------------------------------
// 4. SELLER STOREFRONT & FOLLOW ROUTES
// --------------------------------------------------------------------------

app.get('/api/users/:id/storefront', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const seller = db.users.find(u => u.id === id);
    if (!seller) return res.status(404).json({ error: 'Seller profile not found' });

    const activeListings = db.products.filter(p => p.sellerId === id && (p.status === 'active' || p.status === 'out_of_stock'));
    const isFollowing = req.user
      ? db.follows.some(f => f.followerId === req.user!.id && f.sellerId === id)
      : false;

    const followersCount = db.follows.filter(f => f.sellerId === id).length;
    const sellerReviews = db.reviews.filter(r => r.sellerId === id);
    const avgRating = sellerReviews.length > 0
      ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
      : 0;

    // WhatsApp options on storefront
    const isWhatsAppAvailable = Boolean(
      seller.whatsappContactEnabled &&
      seller.whatsappNumber &&
      seller.whatsappOnStorefront
    );

    const isPhoneCallAvailable = Boolean(
      seller.phoneCallEnabled && seller.phoneNumber
    );

    return res.json({
      seller: {
        id: seller.id,
        name: seller.name,
        avatarUrl: seller.avatarUrl,
        bio: seller.bio,
        city: seller.city,
        createdAt: seller.createdAt,
        isVerified: seller.isVerified,
        followersCount,
        isFollowing,
        rating: Math.round(avgRating * 10) / 10,
        reviewsCount: sellerReviews.length,
        whatsappContactEnabled: isWhatsAppAvailable,
        whatsappNumber: isWhatsAppAvailable ? seller.whatsappNumber : null,
        phoneCallEnabled: isPhoneCallAvailable,
        phoneNumber: isPhoneCallAvailable ? seller.phoneNumber : null
      },
      listings: activeListings,
      reviews: sellerReviews
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch seller storefront' });
  }
});

app.post('/api/users/:id/follow', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: sellerId } = req.params;
    const followerId = req.user!.id;
    if (sellerId === followerId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const db = getDb();
    const existingIndex = db.follows.findIndex(f => f.followerId === followerId && f.sellerId === sellerId);

    let isFollowing = false;
    if (existingIndex >= 0) {
      db.follows.splice(existingIndex, 1);
      isFollowing = false;
    } else {
      db.follows.push({ followerId, sellerId, createdAt: new Date().toISOString() });
      isFollowing = true;

      // Notify seller
      db.notifications.push({
        id: crypto.randomUUID(),
        userId: sellerId,
        title: 'New Follower',
        message: `${req.user!.name} started following your storefront.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'inquiry'
      });
    }

    saveDb(db);
    const followersCount = db.follows.filter(f => f.sellerId === sellerId).length;
    return res.json({ isFollowing, followersCount });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update follow status' });
  }
});

app.post('/api/users/:id/reviews', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: sellerId } = req.params;
    const reviewerId = req.user!.id;
    const { rating, comment } = req.body;

    if (sellerId === reviewerId) {
      return res.status(400).json({ error: 'You cannot review yourself' });
    }

    const parsedRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Review comment cannot be empty' });
    }

    const db = getDb();
    const newReview: Review = {
      id: crypto.randomUUID(),
      sellerId,
      reviewerId,
      reviewerName: req.user!.name,
      rating: parsedRating,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    db.reviews.push(newReview);

    // Notify seller
    db.notifications.push({
      id: crypto.randomUUID(),
      userId: sellerId,
      title: 'New Seller Review',
      message: `${req.user!.name} left a ${parsedRating}★ review for your store.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      type: 'system'
    });

    saveDb(db);
    return res.status(201).json({ review: newReview });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to submit review' });
  }
});

// --------------------------------------------------------------------------
// 5. DIRECT BUYER-SELLER MESSAGING ROUTES (Real-time with product link)
// --------------------------------------------------------------------------

app.get('/api/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = getDb();

    // Check if user is blocked or has blocked
    const blockedUserIds = new Set(
      db.blockedUsers
        .filter(b => b.userId === userId || b.blockedUserId === userId)
        .map(b => (b.userId === userId ? b.blockedUserId : b.userId))
    );

    const userConversations = db.conversations
      .filter(c => (c.buyerId === userId || c.sellerId === userId))
      .filter(c => {
        const otherPartyId = c.buyerId === userId ? c.sellerId : c.buyerId;
        return !blockedUserIds.has(otherPartyId);
      })
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    // Calculate unread message counts per conversation
    const result = userConversations.map(c => {
      const unreadCount = db.messages.filter(m =>
        m.conversationId === c.id &&
        m.senderId !== userId &&
        !m.readBy.includes(userId)
      ).length;

      return {
        ...c,
        unreadCount
      };
    });

    return res.json({ conversations: result });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const db = getDb();

    const conversation = db.conversations.find(c => c.id === id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    if (conversation.buyerId !== userId && conversation.sellerId !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    const messages = db.messages
      .filter(m => m.conversationId === id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Mark messages as read for this user
    let changed = false;
    for (const msg of messages) {
      if (!msg.readBy.includes(userId)) {
        msg.readBy.push(userId);
        changed = true;
      }
    }
    if (changed) saveDb(db);

    const product = db.products.find(p => p.id === conversation.productId);

    return res.json({
      conversation,
      messages,
      product
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, messageText, imageUrl } = req.body;
    if (!productId || (!messageText && !imageUrl)) {
      return res.status(400).json({ error: 'Product ID and message content are required' });
    }

    const db = getDb();
    const product = db.products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const buyerId = req.user!.id;
    const sellerId = product.sellerId;

    if (buyerId === sellerId) {
      return res.status(400).json({ error: 'You cannot initiate a conversation with yourself' });
    }

    // Check block list
    const isBlocked = db.blockedUsers.some(b =>
      (b.userId === buyerId && b.blockedUserId === sellerId) ||
      (b.userId === sellerId && b.blockedUserId === buyerId)
    );
    if (isBlocked) {
      return res.status(403).json({ error: 'Unable to message this user due to communication restrictions' });
    }

    const now = new Date().toISOString();

    // Check if an existing conversation exists between this buyer and seller for this product
    let conversation = db.conversations.find(c =>
      c.productId === productId &&
      c.buyerId === buyerId &&
      c.sellerId === sellerId
    );

    const isNew = !conversation;
    if (!conversation) {
      conversation = {
        id: crypto.randomUUID(),
        productId,
        productTitle: product.title,
        productPrice: product.price,
        productCurrency: product.currency,
        productImage: product.images[0] || '',
        sellerId,
        buyerId,
        buyerName: req.user!.name,
        sellerName: product.sellerName,
        lastMessageText: messageText || 'Sent an image attachment',
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now
      };
      db.conversations.push(conversation);

      // Increment inquiry count on the product atomically
      product.inquiriesCount = (product.inquiriesCount || 0) + 1;
    } else {
      conversation.lastMessageText = messageText || 'Sent an image attachment';
      conversation.lastMessageAt = now;
      conversation.updatedAt = now;
    }

    // Create the message
    const newMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: conversation.id,
      senderId: buyerId,
      senderName: req.user!.name,
      text: messageText || '',
      imageUrl: imageUrl || undefined,
      createdAt: now,
      readBy: [buyerId]
    };
    db.messages.push(newMessage);

    // Notify seller
    db.notifications.push({
      id: crypto.randomUUID(),
      userId: sellerId,
      title: `Inquiry on "${product.title}"`,
      message: `${req.user!.name}: ${messageText?.substring(0, 80) || 'Sent an attachment'}`,
      link: `/inbox/${conversation.id}`,
      isRead: false,
      createdAt: now,
      type: 'message'
    });

    saveDb(db);
    return res.status(201).json({ conversation, message: newMessage, isNew });
  } catch (err: any) {
    console.error('Conversation create error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

app.post('/api/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text, imageUrl } = req.body;
    if (!text && !imageUrl) {
      return res.status(400).json({ error: 'Message text or image attachment required' });
    }

    const userId = req.user!.id;
    const db = getDb();
    const conversation = db.conversations.find(c => c.id === id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const recipientId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;

    // Check block list
    const isBlocked = db.blockedUsers.some(b =>
      (b.userId === userId && b.blockedUserId === recipientId) ||
      (b.userId === recipientId && b.blockedUserId === userId)
    );
    if (isBlocked) {
      return res.status(403).json({ error: 'Message could not be sent due to block settings' });
    }

    const now = new Date().toISOString();
    const newMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: id,
      senderId: userId,
      senderName: req.user!.name,
      text: text?.trim() || '',
      imageUrl: imageUrl || undefined,
      createdAt: now,
      readBy: [userId]
    };

    db.messages.push(newMessage);
    conversation.lastMessageText = text?.trim() || 'Sent an image attachment';
    conversation.lastMessageAt = now;
    conversation.updatedAt = now;

    // Real notification for recipient
    db.notifications.push({
      id: crypto.randomUUID(),
      userId: recipientId,
      title: `New message from ${req.user!.name}`,
      message: text?.substring(0, 80) || 'Sent an attachment',
      link: `/inbox/${conversation.id}`,
      isRead: false,
      createdAt: now,
      type: 'message'
    });

    saveDb(db);
    return res.status(201).json({ message: newMessage });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

app.put('/api/conversations/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const db = getDb();

    let updatedCount = 0;
    for (const msg of db.messages) {
      if (msg.conversationId === id && !msg.readBy.includes(userId)) {
        msg.readBy.push(userId);
        updatedCount++;
      }
    }

    if (updatedCount > 0) saveDb(db);
    return res.json({ success: true, markedRead: updatedCount });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// --------------------------------------------------------------------------
// 6. ADVERTISING & PROMOTED LISTINGS ROUTES
// --------------------------------------------------------------------------

app.get('/api/campaigns', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = getDb();
    const userCampaigns = db.campaigns
      .filter(c => c.sellerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ campaigns: userCampaigns });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

app.post('/api/campaigns', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, planName, budgetUSD, durationDays } = req.body;
    if (!productId || !planName || !budgetUSD || !durationDays) {
      return res.status(400).json({ error: 'Listing, promotion plan, budget, and duration are required' });
    }

    const db = getDb();
    const product = db.products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only promote your own listings' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000);

    const newCampaign: AdCampaign = {
      id: crypto.randomUUID(),
      sellerId: req.user!.id,
      productId,
      productTitle: product.title,
      productImage: product.images[0] || '',
      planName,
      budgetUSD: Number(budgetUSD),
      durationDays: Number(durationDays),
      // Honest state: pending_payment until verified payment gateway is hooked up
      status: 'pending_payment',
      impressions: 0,
      clicks: 0,
      spendUSD: 0,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    db.campaigns.push(newCampaign);

    db.notifications.push({
      id: crypto.randomUUID(),
      userId: req.user!.id,
      title: 'Ad Campaign Created',
      message: `Your "${planName}" campaign for "${product.title}" has been created as an unpaid draft.`,
      isRead: false,
      createdAt: now.toISOString(),
      type: 'campaign'
    });

    saveDb(db);
    return res.status(201).json({ campaign: newCampaign });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
});

app.put('/api/campaigns/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDb();
    const campaign = db.campaigns.find(c => c.id === id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    if (campaign.sellerId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (status && ['pending_payment', 'active', 'paused', 'ended'].includes(status)) {
      campaign.status = status;
      saveDb(db);
    }

    return res.json({ campaign });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update campaign status' });
  }
});

// --------------------------------------------------------------------------
// 7. TRUST, SAFETY, REPORTS & BLOCKING ROUTES
// --------------------------------------------------------------------------

app.post('/api/reports', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetType, targetId, targetTitleOrName, reason, details } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: 'Target type, target ID, and reason are required' });
    }

    const db = getDb();
    const newReport: Report = {
      id: crypto.randomUUID(),
      reporterId: req.user!.id,
      reporterName: req.user!.name,
      targetType,
      targetId,
      targetTitleOrName: targetTitleOrName || targetId,
      reason,
      details: details?.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    db.reports.push(newReport);
    saveDb(db);

    return res.status(201).json({ message: 'Thank you for your report. Our trust & safety team has received it.', report: newReport });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to submit report' });
  }
});

app.post('/api/users/block', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { blockedUserId } = req.body;
    const userId = req.user!.id;
    if (!blockedUserId || blockedUserId === userId) {
      return res.status(400).json({ error: 'Invalid user to block' });
    }

    const db = getDb();
    const existingIndex = db.blockedUsers.findIndex(b => b.userId === userId && b.blockedUserId === blockedUserId);

    let isBlocked = false;
    if (existingIndex >= 0) {
      db.blockedUsers.splice(existingIndex, 1);
      isBlocked = false;
    } else {
      db.blockedUsers.push({ userId, blockedUserId, createdAt: new Date().toISOString() });
      isBlocked = true;
    }

    saveDb(db);
    return res.json({ isBlocked });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update block state' });
  }
});

// --------------------------------------------------------------------------
// 8. NOTIFICATIONS
// --------------------------------------------------------------------------

app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = getDb();
    const userNotifications = db.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    const unreadCount = userNotifications.filter(n => !n.isRead).length;
    return res.json({ notifications: userNotifications, unreadCount });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const db = getDb();

    if (id === 'all') {
      for (const n of db.notifications) {
        if (n.userId === userId) n.isRead = true;
      }
    } else {
      const notification = db.notifications.find(n => n.id === id && n.userId === userId);
      if (notification) notification.isRead = true;
    }

    saveDb(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// --------------------------------------------------------------------------
// 8.5 E-COMMERCE ORDERS & CHECKOUT
// --------------------------------------------------------------------------

app.post('/api/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { items, shippingAddress, paymentMethod = 'card' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({ error: 'Complete shipping address is required' });
    }

    const db = getDb();
    if (!db.orders) db.orders = [];

    // Atomic stock verification and deduction
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = db.products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }
      const buyQty = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (product.quantity < buyQty) {
        return res.status(400).json({ error: `Not enough stock for "${product.title}". Currently in stock: ${product.quantity}` });
      }

      product.quantity -= buyQty;
      product.salesCount = (product.salesCount || 0) + buyQty;
      if (product.quantity === 0) {
        product.status = 'out_of_stock';
      }
      product.updatedAt = new Date().toISOString();

      subtotal += product.price * buyQty;
      validatedItems.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity: buyQty,
        currency: product.currency,
        image: product.images[0] || '',
        sellerId: product.sellerId,
        brand: product.brand || 'BazaarLoop Brand Store'
      });
    }

    // Delivery arrangement note: For delivery, contact your seller (no automated shipping fee added)
    const shippingCost = 0;
    const total = subtotal;
    const now = new Date();
    const orderNumber = `BL-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackingNumber = `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const estDelivery = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber,
      buyerId: user.id,
      buyerName: user.name,
      buyerEmail: user.email,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state?.trim() || '',
        postalCode: shippingAddress.postalCode.trim(),
        phone: shippingAddress.phone?.trim() || user.phoneNumber || user.whatsappNumber || ''
      },
      items: validatedItems,
      subtotal,
      shippingCost,
      total,
      currency: validatedItems[0]?.currency || 'USD',
      status: 'processing',
      trackingNumber,
      carrier: 'BazaarLoop Direct Dispatch',
      estimatedDelivery: estDelivery,
      paymentMethod,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    db.orders.unshift(newOrder);

    // --------------------------------------------------------------------------
    // AUTOMATIC BIZMANAGER MONEY FLOW INTEGRATION:
    // "make it so it can automatically add money someone buys from you and takes out money if you buy something"
    // --------------------------------------------------------------------------
    if (!db.bizTransactions) db.bizTransactions = [];

    // 1. Group items by seller and credit each seller with an Income record
    const sellerSalesMap: Record<string, { total: number; itemNames: string[] }> = {};
    for (const vItem of validatedItems) {
      if (!sellerSalesMap[vItem.sellerId]) {
        sellerSalesMap[vItem.sellerId] = { total: 0, itemNames: [] };
      }
      sellerSalesMap[vItem.sellerId].total += vItem.price * vItem.quantity;
      sellerSalesMap[vItem.sellerId].itemNames.push(`${vItem.title} (x${vItem.quantity})`);
    }

    for (const [sellerId, saleData] of Object.entries(sellerSalesMap)) {
      const sellerSettings = db.bizSettings?.find(s => s.userId === sellerId);
      const isWajebaat = sellerSettings?.wajebaatEnabled ?? false;
      const wajebaatAmt = isWajebaat ? Math.round(saleData.total * 0.025 * 100) / 100 : 0;

      const incomeTx: BizTransaction = {
        id: crypto.randomUUID(),
        userId: sellerId,
        type: 'income',
        amount: saleData.total,
        currency: newOrder.currency,
        category: 'BazaarLoop Sales',
        title: `Order #${orderNumber} — Sale: ${saleData.itemNames.join(', ')}`,
        description: `Purchased by ${user.name} (${user.email}) via ${paymentMethod.toUpperCase()}`,
        date: now.toISOString(),
        paymentMode: (['upi', 'gpay', 'apple_pay', 'paypal', 'card'].includes(paymentMethod) ? paymentMethod : 'card') as any,
        referenceId: orderNumber,
        wajebaatAmount: wajebaatAmt,
        source: 'auto_order',
        createdAt: now.toISOString()
      };
      db.bizTransactions.unshift(incomeTx);

      // Notify seller
      db.notifications.unshift({
        id: crypto.randomUUID(),
        userId: sellerId,
        title: `💰 Payment Received: Order #${orderNumber}`,
        message: `You earned $${saleData.total.toFixed(2)} from ${user.name}. Money automatically credited to your BizManager ledger.`,
        link: '/seller-dashboard',
        isRead: false,
        createdAt: now.toISOString(),
        type: 'order'
      });
    }

    // 2. Debit the buyer with an Expense record ("takes out money if you buy something")
    const expenseTx: BizTransaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: 'expense',
      amount: total,
      currency: newOrder.currency,
      category: 'Product Purchase',
      title: `Order #${orderNumber} — BazaarLoop Purchase (${validatedItems.length} item${validatedItems.length > 1 ? 's' : ''})`,
      description: `Payment authorized via ${paymentMethod.toUpperCase()}`,
      date: now.toISOString(),
      paymentMode: (['upi', 'gpay', 'apple_pay', 'paypal', 'card'].includes(paymentMethod) ? paymentMethod : 'card') as any,
      referenceId: orderNumber,
      wajebaatAmount: 0,
      source: 'auto_order',
      createdAt: now.toISOString()
    };
    db.bizTransactions.unshift(expenseTx);

    // Confirmation notification to buyer
    db.notifications.unshift({
      id: crypto.randomUUID(),
      userId: user.id,
      title: `Order Confirmed: #${orderNumber}`,
      message: `Your brand new items order has been placed. $${total.toFixed(2)} recorded in your BizManager ledger. For delivery, contact your seller.`,
      link: '/buyer-hub',
      isRead: false,
      createdAt: now.toISOString(),
      type: 'order'
    });

    saveDb(db);
    return res.status(201).json({ order: newOrder });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return res.status(500).json({ error: 'Failed to process order checkout' });
  }
});

app.get('/api/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    if (!db.orders) db.orders = [];
    const userOrders = db.orders.filter(o => o.buyerId === req.user!.id);
    return res.json({ orders: userOrders });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

app.get('/api/orders/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    if (!db.orders) db.orders = [];
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyerId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this order' });
    }
    return res.json({ order });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

// --------------------------------------------------------------------------
// 9. ADMIN & MODERATION ROUTES
// --------------------------------------------------------------------------

app.get('/api/admin/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }

    const db = getDb();
    return res.json({
      stats: {
        totalUsers: db.users.length,
        totalProducts: db.products.length,
        activeProducts: db.products.filter(p => p.status === 'active').length,
        soldProducts: db.products.filter(p => p.status === 'sold').length,
        totalConversations: db.conversations.length,
        totalMessages: db.messages.length,
        totalReports: db.reports.length,
        pendingReports: db.reports.filter(r => r.status === 'pending').length,
        activeCampaigns: db.campaigns.filter(c => c.status === 'active').length
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

app.get('/api/admin/reports', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }

    const db = getDb();
    return res.json({ reports: db.reports });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.put('/api/admin/reports/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }

    const { id } = req.params;
    const { status } = req.body;
    const db = getDb();
    const report = db.reports.find(r => r.id === id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    report.status = status;
    saveDb(db);
    return res.json({ report });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update report' });
  }
});

// --------------------------------------------------------------------------
// 9.5 BIZMANAGER FINANCIAL & BUSINESS MANAGEMENT API
// --------------------------------------------------------------------------

app.get('/api/bizmanager/data', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = getDb();

    if (!db.bizTransactions) db.bizTransactions = [];
    if (!db.bizBusinesses) db.bizBusinesses = [];
    if (!db.bizPeople) db.bizPeople = [];
    if (!db.bizInvoices) db.bizInvoices = [];
    if (!db.bizNotes) db.bizNotes = [];
    if (!db.bizSettings) db.bizSettings = [];

    // Ensure user has at least 1 default business profile
    let userBusinesses = db.bizBusinesses.filter(b => b.userId === userId);
    if (userBusinesses.length === 0) {
      const defaultBiz: BizBusiness = {
        id: crypto.randomUUID(),
        userId,
        name: `${req.user!.name}'s BazaarLoop Store`,
        tagline: 'Verified Brand Direct Merchant Storefront',
        category: 'Brand Retail & E-Commerce',
        currency: 'USD',
        createdAt: new Date().toISOString()
      };
      db.bizBusinesses.push(defaultBiz);
      userBusinesses = [defaultBiz];
      saveDb(db);
    }

    // Ensure user has settings
    let userSettings = db.bizSettings.find(s => s.userId === userId);
    if (!userSettings) {
      userSettings = {
        userId,
        defaultCurrency: 'USD',
        wajebaatEnabled: false,
        wajebaatRate: 0.025, // 1/40th
        khumusRate: 0.20, // 20%
        invoiceWatermarkText: 'BazaarLoop Verified Merchant',
        invoiceBusinessName: userBusinesses[0]?.name || req.user!.name,
        invoicePhone: req.user!.whatsappNumber ? `+${req.user!.whatsappNumber}` : '',
        invoiceAddress: req.user!.city || 'Merchant Headquarters',
        upiId: req.user!.bankingDetails?.upiId || '',
        bankName: req.user!.bankingDetails?.bankName || '',
        accountNumber: req.user!.bankingDetails?.accountNumber || ''
      };
      db.bizSettings.push(userSettings);
      saveDb(db);
    }

    const transactions = db.bizTransactions.filter(t => t.userId === userId);
    const people = db.bizPeople.filter(p => p.userId === userId);
    const invoices = db.bizInvoices.filter(i => i.userId === userId);
    const notes = db.bizNotes.filter(n => n.userId === userId);
    const merchantProducts = (db.products || []).filter(p => p.sellerId === userId);

    return res.json({
      transactions,
      businesses: userBusinesses,
      people,
      invoices,
      notes,
      settings: userSettings,
      products: merchantProducts
    });
  } catch (err: any) {
    console.error('Error fetching BizManager data:', err);
    return res.status(500).json({ error: 'Failed to fetch BizManager data' });
  }
});

app.post('/api/bizmanager/transactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      type,
      amount,
      currency = 'USD',
      category,
      title,
      description = '',
      date = new Date().toISOString(),
      paymentMode = 'card',
      referenceId = '',
      businessId,
      wajebaatAmount
    } = req.body;

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Transaction type must be income or expense' });
    }
    const parsedAmount = Math.abs(parseFloat(amount) || 0);
    if (parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Transaction title is required' });
    }

    const db = getDb();
    if (!db.bizTransactions) db.bizTransactions = [];

    const newTx: BizTransaction = {
      id: crypto.randomUUID(),
      userId,
      businessId,
      type,
      amount: parsedAmount,
      currency,
      category: category?.trim() || (type === 'income' ? 'Sales Revenue' : 'Operating Expense'),
      title: title.trim(),
      description: description?.trim() || '',
      date,
      paymentMode,
      referenceId: referenceId?.trim() || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      wajebaatAmount: typeof wajebaatAmount === 'number' ? wajebaatAmount : 0,
      source: 'manual',
      createdAt: new Date().toISOString()
    };

    db.bizTransactions.unshift(newTx);
    saveDb(db);
    return res.status(201).json({ transaction: newTx });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record transaction' });
  }
});

app.delete('/api/bizmanager/transactions/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const db = getDb();
    if (!db.bizTransactions) db.bizTransactions = [];

    const idx = db.bizTransactions.findIndex(t => t.id === id && t.userId === userId);
    if (idx === -1) return res.status(404).json({ error: 'Transaction not found' });

    db.bizTransactions.splice(idx, 1);
    saveDb(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

app.post('/api/bizmanager/businesses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, tagline = '', category = 'Retail', currency = 'USD' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Business name is required' });

    const db = getDb();
    if (!db.bizBusinesses) db.bizBusinesses = [];

    const newBiz: BizBusiness = {
      id: crypto.randomUUID(),
      userId,
      name: name.trim(),
      tagline: tagline.trim(),
      category: category.trim(),
      currency,
      createdAt: new Date().toISOString()
    };

    db.bizBusinesses.push(newBiz);
    saveDb(db);
    return res.status(201).json({ business: newBiz });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create business profile' });
  }
});

app.delete('/api/bizmanager/businesses/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const db = getDb();
    if (!db.bizBusinesses) db.bizBusinesses = [];

    const idx = db.bizBusinesses.findIndex(b => b.id === id && b.userId === userId);
    if (idx === -1) return res.status(404).json({ error: 'Business not found' });

    db.bizBusinesses.splice(idx, 1);
    saveDb(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete business' });
  }
});

app.post('/api/bizmanager/people', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, name, phone = '', email = '', role = 'customer', balance = 0, notes = '' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

    const db = getDb();
    if (!db.bizPeople) db.bizPeople = [];

    if (id) {
      const existing = db.bizPeople.find(p => p.id === id && p.userId === userId);
      if (existing) {
        existing.name = name.trim();
        existing.phone = phone.trim();
        existing.email = email.trim();
        existing.role = role;
        existing.balance = Number(balance) || 0;
        existing.notes = notes.trim();
        saveDb(db);
        return res.json({ person: existing });
      }
    }

    const newPerson: BizPerson = {
      id: crypto.randomUUID(),
      userId,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      role,
      balance: Number(balance) || 0,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    db.bizPeople.push(newPerson);
    saveDb(db);
    return res.status(201).json({ person: newPerson });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save person' });
  }
});

app.delete('/api/bizmanager/people/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const db = getDb();
    if (!db.bizPeople) db.bizPeople = [];

    const idx = db.bizPeople.findIndex(p => p.id === id && p.userId === userId);
    if (idx === -1) return res.status(404).json({ error: 'Person not found' });

    db.bizPeople.splice(idx, 1);
    saveDb(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete person' });
  }
});

app.post('/api/bizmanager/invoices', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      id,
      customerName,
      customerPhone = '',
      customerEmail = '',
      items = [],
      taxRate = 0,
      discount = 0,
      currency = 'USD',
      status = 'issued',
      dueDate = '',
      notes = ''
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invoice must contain at least one item' });
    }

    let subtotal = 0;
    const validatedItems = items.map(it => {
      const q = Math.max(1, parseInt(it.quantity, 10) || 1);
      const p = Math.max(0, parseFloat(it.price) || 0);
      const itemTotal = q * p;
      subtotal += itemTotal;
      return {
        title: (it.title || 'Item').trim(),
        quantity: q,
        price: p,
        total: itemTotal
      };
    });

    const parsedTaxRate = Math.max(0, parseFloat(taxRate) || 0);
    const parsedDiscount = Math.max(0, parseFloat(discount) || 0);
    const taxAmount = (subtotal - parsedDiscount) * (parsedTaxRate / 100);
    const total = Math.max(0, subtotal - parsedDiscount + taxAmount);

    const db = getDb();
    if (!db.bizInvoices) db.bizInvoices = [];

    if (id) {
      const existing = db.bizInvoices.find(inv => inv.id === id && inv.userId === userId);
      if (existing) {
        existing.customerName = customerName.trim();
        existing.customerPhone = customerPhone.trim();
        existing.customerEmail = customerEmail.trim();
        existing.items = validatedItems;
        existing.subtotal = subtotal;
        existing.taxRate = parsedTaxRate;
        existing.taxAmount = taxAmount;
        existing.discount = parsedDiscount;
        existing.total = total;
        existing.currency = currency;
        existing.status = status;
        existing.dueDate = dueDate;
        existing.notes = notes.trim();
        saveDb(db);
        return res.json({ invoice: existing });
      }
    }

    const newInvoice: BizInvoice = {
      id: crypto.randomUUID(),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      userId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      items: validatedItems,
      subtotal,
      taxRate: parsedTaxRate,
      taxAmount,
      discount: parsedDiscount,
      total,
      currency,
      status,
      dueDate,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    db.bizInvoices.unshift(newInvoice);
    saveDb(db);
    return res.status(201).json({ invoice: newInvoice });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save invoice' });
  }
});

app.delete('/api/bizmanager/invoices/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const db = getDb();
    if (!db.bizInvoices) db.bizInvoices = [];

    const idx = db.bizInvoices.findIndex(inv => inv.id === id && inv.userId === userId);
    if (idx === -1) return res.status(404).json({ error: 'Invoice not found' });

    db.bizInvoices.splice(idx, 1);
    saveDb(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

app.post('/api/bizmanager/notes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, content, color = 'amber' } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Note title is required' });

    const db = getDb();
    if (!db.bizNotes) db.bizNotes = [];

    const newNote: BizNote = {
      id: crypto.randomUUID(),
      userId,
      title: title.trim(),
      content: content?.trim() || '',
      color,
      createdAt: new Date().toISOString()
    };

    db.bizNotes.unshift(newNote);
    saveDb(db);
    return res.status(201).json({ note: newNote });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save note' });
  }
});

app.delete('/api/bizmanager/notes/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const db = getDb();
    if (!db.bizNotes) db.bizNotes = [];

    const idx = db.bizNotes.findIndex(n => n.id === id && n.userId === userId);
    if (idx === -1) return res.status(404).json({ error: 'Note not found' });

    db.bizNotes.splice(idx, 1);
    saveDb(db);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete note' });
  }
});

app.put('/api/bizmanager/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = getDb();
    if (!db.bizSettings) db.bizSettings = [];

    let current = db.bizSettings.find(s => s.userId === userId);
    if (!current) {
      current = {
        userId,
        defaultCurrency: 'USD',
        wajebaatEnabled: false,
        wajebaatRate: 0.025,
        khumusRate: 0.20,
        invoiceWatermarkText: 'BazaarLoop Verified Merchant',
        invoiceBusinessName: req.user!.name,
        invoicePhone: req.user!.whatsappNumber ? `+${req.user!.whatsappNumber}` : '',
        invoiceAddress: req.user!.city || ''
      };
      db.bizSettings.push(current);
    }

    const {
      defaultCurrency,
      wajebaatEnabled,
      wajebaatRate,
      khumusRate,
      invoiceWatermarkText,
      invoiceBusinessName,
      invoicePhone,
      invoiceAddress,
      bankName,
      accountNumber,
      upiId
    } = req.body;

    if (defaultCurrency) current.defaultCurrency = defaultCurrency;
    if (typeof wajebaatEnabled === 'boolean') current.wajebaatEnabled = wajebaatEnabled;
    if (typeof wajebaatRate === 'number') current.wajebaatRate = wajebaatRate;
    if (typeof khumusRate === 'number') current.khumusRate = khumusRate;
    if (invoiceWatermarkText !== undefined) current.invoiceWatermarkText = invoiceWatermarkText.trim();
    if (invoiceBusinessName !== undefined) current.invoiceBusinessName = invoiceBusinessName.trim();
    if (invoicePhone !== undefined) current.invoicePhone = invoicePhone.trim();
    if (invoiceAddress !== undefined) current.invoiceAddress = invoiceAddress.trim();
    if (bankName !== undefined) current.bankName = bankName.trim();
    if (accountNumber !== undefined) current.accountNumber = accountNumber.trim();
    if (upiId !== undefined) current.upiId = upiId.trim();

    saveDb(db);
    return res.json({ settings: current });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update BizManager settings' });
  }
});

// --------------------------------------------------------------------------
// 10. VITE INTEGRATION & SERVER STARTUP
// --------------------------------------------------------------------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BazaarLoop server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
