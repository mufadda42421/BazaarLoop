import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  unreadNotifications: number;
  unreadMessages: number;
  authModalOpen: boolean;
  authModalMode: 'signin' | 'register';
  openAuthModal: (mode?: 'signin' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  updateWhatsAppSettings: (settings: any) => Promise<void>;
  fetchCounters: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');

  const fetchCounters = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const [notifsRes, convosRes] = await Promise.allSettled([
        api.getNotifications(),
        api.getConversations()
      ]);

      if (notifsRes.status === 'fulfilled') {
        setUnreadNotifications(notifsRes.value.unreadCount || 0);
      }
      if (convosRes.status === 'fulfilled') {
        const totalUnread = convosRes.value.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadMessages(totalUnread);
      }
    } catch {}
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const { user: fetchedUser } = await api.getMe();
      setUser(fetchedUser);
      fetchCounters();
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCounters]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Periodic polling for badges & messages
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchCounters();
    }, 12000);
    return () => clearInterval(interval);
  }, [user, fetchCounters]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    fetchCounters();
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    fetchCounters();
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setUnreadNotifications(0);
    setUnreadMessages(0);
  };

  const updateProfile = async (profileData: Partial<User>) => {
    const res = await api.updateProfile(profileData);
    setUser(res.user);
  };

  const updateWhatsAppSettings = async (settings: any) => {
    const res = await api.updateWhatsAppSettings(settings);
    setUser(res.user);
  };

  const openAuthModal = (mode: 'signin' | 'register' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        unreadNotifications,
        unreadMessages,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        updateWhatsAppSettings,
        fetchCounters
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
