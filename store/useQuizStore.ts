import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export interface Lesson {
  id: string;
  title: string;
  category: 'Rights' | 'Waste Management' | 'Municipal Structure' | 'Safety';
  readTime: string;
  content: string;
  isBookmarked: boolean;
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctIndex: number;
  xpValue: number;
}

export interface Quiz {
  lessonId: string;
  questions: QuizQuestion[];
}

interface QuizState {
  lessons: Lesson[];
  quizzes: Record<string, Quiz>;
  streak: number;
  completedQuizzes: string[];
  toggleBookmark: (id: string) => void;
  completeQuiz: (lessonId: string) => void;
  incrementStreak: () => void;
}

const initialLessons: Lesson[] = [
  {
    id: 'l-1',
    title: 'Understanding Your Municipal Ward structure',
    category: 'Municipal Structure',
    readTime: '3 min read',
    content: 'Every city in India is divided into geographic subdivisions called Wards. Wards are represented by elected Ward Councillors (Parshads). The municipal administrative wing, led by Ward Officers and engineers, is responsible for maintaining civic infrastructure like roads, drainage, lighting, and waste management. LocalPulse uses spatial geofencing to direct your complaints directly to the respective ward engineer.',
    isBookmarked: false,
  },
  {
    id: 'l-2',
    title: 'Effective Waste Sorting: Wet vs Dry Waste',
    category: 'Waste Management',
    readTime: '4 min read',
    content: 'India generates over 62 million tons of municipal solid waste annually. Effective waste segregation at source is critical. Wet waste includes organic waste (food remains, fruit peels, tea leaves) which can be composted. Dry waste includes recyclables (paper, plastic, glass, cardboard). E-waste and hazard waste must be sorted separately. Sorting waste reduces landfill dump burdens by up to 70%.',
    isBookmarked: false,
  },
  {
    id: 'l-3',
    title: 'Civic Rights & Article 21: Right to Clean Roads',
    category: 'Rights',
    readTime: '5 min read',
    content: 'The Supreme Court of India has held that the right to clean, safe roads and sanitation is an integral part of the Right to Life under Article 21 of the Indian Constitution. Municipal bodies have a mandatory statutory duty to keep roads and public passages clear of debris, garbage, and potholes. Citizens have the right to request swift resolution of civic complaints.',
    isBookmarked: false,
  }
];

const initialQuizzes: Record<string, Quiz> = {
  'l-1': {
    lessonId: 'l-1',
    questions: [
      {
        questionText: 'Who represents a Ward in a municipal corporation?',
        options: ['District Magistrate', 'Ward Councillor (Parshad)', 'State MLA', 'Mayor'],
        correctIndex: 1,
        xpValue: 15,
      },
      {
        questionText: 'What is the primary role of a Ward Councillor?',
        options: ['Taxes collection', 'Drafting constitution laws', 'Representing ward problems & voting on local budgets', 'Policing'],
        correctIndex: 2,
        xpValue: 15,
      }
    ]
  },
  'l-2': {
    lessonId: 'l-2',
    questions: [
      {
        questionText: 'Which item belongs to Wet Waste?',
        options: ['Plastic water bottles', 'Banana peels and food remains', 'Cardboard boxes', 'Used dry-cell batteries'],
        correctIndex: 1,
        xpValue: 15,
      },
      {
        questionText: 'By how much can sorting waste reduce landfill loads?',
        options: ['10%', '30%', '50%', 'Up to 70%'],
        correctIndex: 3,
        xpValue: 15,
      }
    ]
  }
};

export const useQuizStore = create<QuizState>((set, get) => ({
  lessons: initialLessons,
  quizzes: initialQuizzes,
  streak: 3, // start with a nice mock streak of 3 days
  completedQuizzes: [],
  toggleBookmark: (id) => set((state) => ({
    lessons: state.lessons.map((l) => l.id === id ? { ...l, isBookmarked: !l.isBookmarked } : l),
  })),
  completeQuiz: (lessonId) => {
    const { completedQuizzes } = get();
    if (completedQuizzes.includes(lessonId)) return;

    set((state) => ({
      completedQuizzes: [...state.completedQuizzes, lessonId],
    }));

    // Award XP to Auth Store
    const { addXP, addBadge } = useAuthStore.getState();
    addXP(30); // 30 XP for completing a quiz

    // Milestone Badge triggers
    const updatedCount = get().completedQuizzes.length;
    if (updatedCount === 1) {
      addBadge('Awareness Leader');
    } else if (updatedCount === 3) {
      addBadge('Community Champion');
    }
  },
  incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),
}));
