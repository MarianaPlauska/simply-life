// slice de auth — login, logout, perfil, token
// Sprint B: cookies httpOnly — token não fica mais no localStorage
import type { StateCreator } from 'zustand';
import type { UserProfile } from '../storeTypes';
import { API, setAuthToken } from '../api';

export interface AuthSlice {
  isLoggedIn: boolean;
  userProfile: UserProfile;
  authToken: string;
  login: (email: string, nome: string, token?: string) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set) => ({
  isLoggedIn: false,
  userProfile: { nome: '', email: '', avatar: '' },
  authToken: '',

  login: (email, nome, token) =>
  {
    const t = token || '';
    setAuthToken(t);
    set({
      isLoggedIn: true,
      userProfile: { nome: nome || email.split('@')[0], email, avatar: '' },
      authToken: t,
    });
  },

  logout: () =>
  {
    // B3: chama endpoint de logout para invalidar tokens no backend
    fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    setAuthToken('');
    set({
      isLoggedIn: false,
      userProfile: { nome: '', email: '', avatar: '' },
      authToken: '',
    });
  },

  updateProfile: (profile) =>
  {
    set((state) => ({
      userProfile: { ...state.userProfile, ...profile },
    }));
  },
});
