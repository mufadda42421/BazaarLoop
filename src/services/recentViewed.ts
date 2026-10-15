const RECENT_VIEWED_KEY = 'bazaarloop_recently_viewed';

export interface RecentItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  category: string;
  location: string;
  condition: string;
  viewedAt: string;
  hasWhatsApp?: boolean;
}

export function getRecentlyViewed(): RecentItem[] {
  try {
    const raw = localStorage.getItem(RECENT_VIEWED_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addRecentlyViewed(item: Omit<RecentItem, 'viewedAt'>): void {
  try {
    const existing = getRecentlyViewed().filter(i => i.id !== item.id);
    const updated = [
      { ...item, viewedAt: new Date().toISOString() },
      ...existing
    ].slice(0, 15); // keep last 15
    localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearRecentlyViewed(): void {
  try {
    localStorage.removeItem(RECENT_VIEWED_KEY);
  } catch {}
}
