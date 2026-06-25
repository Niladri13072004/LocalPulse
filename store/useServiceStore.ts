import { create } from 'zustand';

export interface ServiceProvider {
  id: string;
  name: string;
  type: 'Plumber' | 'Electrician' | 'Tutor' | 'Mechanic';
  phone: string;
  description: string;
  rating: number;
  status: 'unverified' | 'verified';
  createdAt: string;
}

interface ServiceState {
  providers: ServiceProvider[];
  addProvider: (provider: Omit<ServiceProvider, 'id' | 'rating' | 'status' | 'createdAt'>) => void;
  verifyProvider: (id: string) => void;
  rateProvider: (id: string, stars: number) => void;
}

const mockProviders: ServiceProvider[] = [
  {
    id: 's-1',
    name: 'Ramesh Kumar',
    type: 'Plumber',
    phone: '+919876543210',
    description: 'Expert in leaking pipe repairs, drainage cleaning, and washroom fittings. Over 8 years of local experience.',
    rating: 4.8,
    status: 'verified',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 's-2',
    name: 'Suresh Sharma',
    type: 'Electrician',
    phone: '+919876543211',
    description: 'Home electrical wiring, circuit boards, inverter setups, and lighting installations.',
    rating: 4.5,
    status: 'verified',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 's-3',
    name: 'Sunita Sen',
    type: 'Tutor',
    phone: '+919876543212',
    description: 'Science and Math tuition for classes 8-10. Batch and personal coaching.',
    rating: 4.9,
    status: 'verified',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 's-4',
    name: 'Amit Patel',
    type: 'Mechanic',
    phone: '+919876543213',
    description: 'Two-wheeler puncture repairs, engine tuning, and oil replacements. Home pick-up available.',
    rating: 4.1,
    status: 'unverified',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const useServiceStore = create<ServiceState>((set) => ({
  providers: mockProviders,
  addProvider: (data) => set((state) => {
    const newProvider: ServiceProvider = {
      ...data,
      id: 's-' + Math.random().toString(36).substr(2, 9),
      rating: 0.0,
      status: 'unverified',
      createdAt: new Date().toISOString(),
    };
    return {
      providers: [newProvider, ...state.providers],
    };
  }),
  verifyProvider: (id) => set((state) => ({
    providers: state.providers.map((p) => p.id === id ? { ...p, status: 'verified' } : p),
  })),
  rateProvider: (id, stars) => set((state) => ({
    providers: state.providers.map((p) => {
      if (p.id === id) {
        // Simple average calculate mock (assume 5 reviews exist)
        const newRating = (p.rating * 5 + stars) / 6;
        return {
          ...p,
          rating: parseFloat(newRating.toFixed(1)),
        };
      }
      return p;
    }),
  })),
}));
