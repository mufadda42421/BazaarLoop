import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateFirebaseProfile,
  firebaseSignOut,
  onAuthStateChanged,
  db,
  doc,
  setDoc
} from '../firebase';

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
  loginWithGoogle: () => Promise<void>;
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

  // Sync Firebase Auth states smoothly
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email && !getStoredToken()) {
        try {
          const res = await api.loginWithFirebase({
            email: fbUser.email,
            name: fbUser.displayName || undefined,
            avatarUrl: fbUser.photoURL || undefined,
            firebaseUid: fbUser.uid
          });
          setStoredToken(res.token);
          setToken(res.token);
          setUser(res.user);
          fetchCounters();
        } catch (err) {
          console.warn('Auto Firebase auth sync notice:', err);
        }
      }
    });

    return () => unsubscribe();
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

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (!fbUser.email) throw new Error('No email associated with Google account');

      // Attempt to save Firestore profile
      try {
        await setDoc(doc(db, 'users', fbUser.uid), {
          id: fbUser.uid,
          name: fbUser.displayName || 'Google Shopper',
          email: fbUser.email,
          avatarUrl: fbUser.photoURL || '',
          role: fbUser.email === 'admin@bazaarloop.com' || fbUser.email === 'jaorawalamufaddal7@gmail.com' ? 'admin' : 'user',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore profile sync note:', fsErr);
      }

      // Sync backend session
      const res = await api.loginWithFirebase({
        email: fbUser.email,
        name: fbUser.displayName || undefined,
        avatarUrl: fbUser.photoURL || undefined,
        firebaseUid: fbUser.uid
      });

      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      fetchCounters();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in was cancelled by closing the window.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        throw new Error('A sign-in window is already active.');
      } else if (err.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by browser. Please allow popups.');
      }
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Sign into Firebase Auth in background
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (fbErr: any) {
      console.warn('Firebase email sign-in note:', fbErr.code);
    }

    const res = await api.login({ email: cleanEmail, password });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    fetchCounters();
  };

  const register = async (data: any) => {
    const cleanEmail = (data.email || '').trim().toLowerCase();
    let fbUid: string | undefined = undefined;

    // Create account in Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      fbUid = cred.user.uid;
      if (data.name) {
        try {
          await updateFirebaseProfile(cred.user, { displayName: data.name });
        } catch {}
      }
    } catch (fbErr: any) {
      console.warn('Firebase account creation note:', fbErr.code);
      if (fbErr.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, data.password);
          fbUid = cred.user.uid;
        } catch {}
      }
    }

    const res = await api.register({ ...data, email: cleanEmail, firebaseUid: fbUid });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);

    // Save profile to Firestore if Firebase user is authenticated
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          id: auth.currentUser.uid,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          avatarUrl: res.user.avatarUrl || '',
          whatsappNumber: res.user.whatsappNumber || null,
          createdAt: res.user.createdAt || new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore user doc sync note:', fsErr);
      }
    }

    setAuthModalOpen(false);
    fetchCounters();
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
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
        loginWithGoogle,
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
