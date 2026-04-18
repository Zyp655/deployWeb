import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '@/lib/api/client';

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  isAdmin: boolean;

  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'login' | 'register') => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthModalOpen: false,
      authModalMode: 'login',
      isAdmin: false,

      setAuth: (user, token) => set({ user, token, isAuthModalOpen: false, isAdmin: user.role === 'ADMIN' }),

      logout: () => set({ user: null, token: null, isAdmin: false }),

      openAuthModal: (mode = 'login') =>
        set({ isAuthModalOpen: true, authModalMode: mode }),

      closeAuthModal: () => set({ isAuthModalOpen: false }),

      setAuthModalMode: (mode) => set({ authModalMode: mode }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
