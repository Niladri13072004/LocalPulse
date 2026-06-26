import { create } from 'zustand';

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
  login: (email: string, role: 'citizen' | 'admin', city: CityOption) => Promise<boolean>;
  signup: (fullName: string, email: string, role: 'citizen' | 'admin', city: CityOption) => Promise<boolean>;
  logout: () => void;
  addXP: (amount: number) => void;
  addBadge: (badgeName: string) => void;
  changeLanguage: (lang: string) => void;
  setCity: (city: CityOption) => void;
}

const isWeb = typeof window !== 'undefined';

const getInitialUser = (): UserProfile | null => {
  if (isWeb) {
    try {
      const stored = localStorage.getItem('localpulse_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isLoading: false,
  login: async (email, role, city) => {
    set({ isLoading: true });
    // Mock login delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    const mockUser: UserProfile = {
      id: role === 'citizen' ? 'usr-citizen-123' : 'usr-admin-456',
      email,
      fullName: role === 'citizen' ? 'Aarav Mehta' : 'Officer Vikram Singh',
      role,
      wardId: 'w1111111-1111-1111-1111-111111111111', // default Rajwada Ward
      xp: 120,
      badges: ['Civic Reporter'],
      preferredLanguage: 'en',
      city,
    };
    if (isWeb) {
      try {
        localStorage.setItem('localpulse_user', JSON.stringify(mockUser));
        localStorage.setItem('localpulse_last_city', city);
      } catch (e) {}
    }
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
    if (isWeb) {
      try {
        localStorage.setItem('localpulse_user', JSON.stringify(mockUser));
        localStorage.setItem('localpulse_last_city', city);
      } catch (e) {}
    }
    set({ user: mockUser, isLoading: false });
    return true;
  },
  logout: () => {
    if (isWeb) {
      try {
        localStorage.removeItem('localpulse_user');
      } catch (e) {}
    }
    set({ user: null });
  },
  addXP: (amount) => set((state) => {
    if (!state.user) return {};
    const newXP = state.user.xp + amount;
    const updatedUser = {
      ...state.user,
      xp: newXP,
    };
    if (isWeb) {
      try {
        localStorage.setItem('localpulse_user', JSON.stringify(updatedUser));
      } catch (e) {}
    }
    return { user: updatedUser };
  }),
  addBadge: (badgeName) => set((state) => {
    if (!state.user || state.user.badges.includes(badgeName)) return {};
    const updatedUser = {
      ...state.user,
      badges: [...state.user.badges, badgeName],
    };
    if (isWeb) {
      try {
        localStorage.setItem('localpulse_user', JSON.stringify(updatedUser));
      } catch (e) {}
    }
    return { user: updatedUser };
  }),
  changeLanguage: (lang) => set((state) => {
    if (!state.user) return {};
    const updatedUser = {
      ...state.user,
      preferredLanguage: lang,
    };
    if (isWeb) {
      try {
        localStorage.setItem('localpulse_user', JSON.stringify(updatedUser));
      } catch (e) {}
    }
    return { user: updatedUser };
  }),
  setCity: (city) => set((state) => {
    if (!state.user) return {};
    const updatedUser = {
      ...state.user,
      city,
    };
    if (isWeb) {
      try {
        localStorage.setItem('localpulse_user', JSON.stringify(updatedUser));
      } catch (e) {}
    }
    return { user: updatedUser };
  }),
}));
