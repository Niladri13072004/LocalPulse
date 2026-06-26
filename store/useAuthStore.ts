import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CityOption = 'Indore' | 'Patna' | 'Jaipur' | 'Lucknow' | 'Nagpur' | 'Kolkata';

export const SUPPORTED_CITIES: CityOption[] = ['Indore', 'Patna', 'Jaipur', 'Lucknow', 'Nagpur', 'Kolkata'];

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'citizen' | 'admin';
  wardId: string | null;
  xp: number;
  badges: string[];
  preferredLanguage: string;
  city: CityOption;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, role: 'citizen' | 'admin', city: CityOption) => Promise<boolean>;
  signup: (fullName: string, email: string, role: 'citizen' | 'admin', city: CityOption) => Promise<boolean>;
  loginWithGoogle: (googleProfile: { name: string; email: string }) => Promise<{ success: boolean; needsRole: boolean }>;
  completeGoogleSignup: (googleProfile: { name: string; email: string }, role: 'citizen' | 'admin', city: CityOption) => Promise<boolean>;
  logout: () => Promise<void>;
  addXP: (amount: number) => void;
  addBadge: (badgeName: string) => void;
  changeLanguage: (lang: string) => void;
  setCity: (city: CityOption) => void;
}

const STORAGE_KEY = 'localpulse_user';
const CITY_KEY = 'localpulse_last_city';

// Cross-platform storage helpers
const storageGet = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  try { return await AsyncStorage.getItem(key); } catch { return null; }
};

const storageSet = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, value); } catch {}
  } else {
    try { await AsyncStorage.setItem(key, value); } catch {}
  }
};

const storageRemove = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(key); } catch {}
  } else {
    try { await AsyncStorage.removeItem(key); } catch {}
  }
};

const persistUser = async (user: UserProfile) => {
  await storageSet(STORAGE_KEY, JSON.stringify(user));
  await storageSet(CITY_KEY, user.city);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const stored = await storageGet(STORAGE_KEY);
      if (stored) {
        const user: UserProfile = JSON.parse(stored);
        set({ user, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  login: async (email, role, city) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 800));
    const mockUser: UserProfile = {
      id: role === 'citizen' ? 'usr-citizen-123' : 'usr-admin-456',
      email,
      fullName: role === 'citizen' ? 'Aarav Mehta' : 'Officer Vikram Singh',
      role,
      wardId: 'w1111111-1111-1111-1111-111111111111',
      xp: 120,
      badges: ['Civic Reporter'],
      preferredLanguage: 'en',
      city,
    };
    await persistUser(mockUser);
    set({ user: mockUser, isLoading: false });
    return true;
  },

  signup: async (fullName, email, role, city) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const mockUser: UserProfile = {
      id: role === 'citizen' ? 'usr-citizen-' + Math.random().toString(36).substr(2, 9) : 'usr-admin-789',
      email,
      fullName,
      role,
      wardId: null,
      xp: 0,
      badges: [],
      preferredLanguage: 'en',
      city,
    };
    await persistUser(mockUser);
    set({ user: mockUser, isLoading: false });
    return true;
  },

  loginWithGoogle: async (googleProfile) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Check if existing user with same email
    const stored = await storageGet(STORAGE_KEY);
    if (stored) {
      try {
        const existingUser: UserProfile = JSON.parse(stored);
        if (existingUser.email === googleProfile.email) {
          set({ user: existingUser, isLoading: false });
          return { success: true, needsRole: false };
        }
      } catch {}
    }
    // New Google user — needs role & city selection
    set({ isLoading: false });
    return { success: true, needsRole: true };
  },

  completeGoogleSignup: async (googleProfile, role, city) => {
    set({ isLoading: true });
    const newUser: UserProfile = {
      id: 'usr-google-' + Math.random().toString(36).substr(2, 9),
      email: googleProfile.email,
      fullName: googleProfile.name,
      role,
      wardId: null,
      xp: 0,
      badges: ['Google Citizen'],
      preferredLanguage: 'en',
      city,
    };
    await persistUser(newUser);
    set({ user: newUser, isLoading: false });
    return true;
  },

  logout: async () => {
    await storageRemove(STORAGE_KEY);
    set({ user: null });
  },

  addXP: (amount) => set((state) => {
    if (!state.user) return {};
    const updatedUser = { ...state.user, xp: state.user.xp + amount };
    persistUser(updatedUser);
    return { user: updatedUser };
  }),

  addBadge: (badgeName) => set((state) => {
    if (!state.user || state.user.badges.includes(badgeName)) return {};
    const updatedUser = { ...state.user, badges: [...state.user.badges, badgeName] };
    persistUser(updatedUser);
    return { user: updatedUser };
  }),

  changeLanguage: (lang) => set((state) => {
    if (!state.user) return {};
    const updatedUser = { ...state.user, preferredLanguage: lang };
    persistUser(updatedUser);
    return { user: updatedUser };
  }),

  setCity: (city) => set((state) => {
    if (!state.user) return {};
    const updatedUser = { ...state.user, city };
    persistUser(updatedUser);
    return { user: updatedUser };
  }),
}));
