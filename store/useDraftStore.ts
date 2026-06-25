import { create } from 'zustand';

export interface IssueDraft {
  id: string;
  title: string;
  description: string;
  category: string;
  images: string[]; // local file paths
  latitude: number;
  longitude: number;
  wardName: string;
  isAnonymous: boolean;
  createdAt: string;
}

interface DraftState {
  drafts: IssueDraft[];
  saveDraft: (draft: Omit<IssueDraft, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteDraft: (id: string) => void;
  clearDrafts: () => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  drafts: [],
  saveDraft: (draftData) => set((state) => {
    const isEditing = !!draftData.id;
    const id = draftData.id || 'draft-' + Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();

    const newDraft: IssueDraft = {
      id,
      title: draftData.title,
      description: draftData.description,
      category: draftData.category,
      images: draftData.images,
      latitude: draftData.latitude,
      longitude: draftData.longitude,
      wardName: draftData.wardName,
      isAnonymous: draftData.isAnonymous,
      createdAt,
    };

    if (isEditing) {
      return {
        drafts: state.drafts.map((d) => (d.id === id ? newDraft : d)),
      };
    } else {
      return {
        drafts: [newDraft, ...state.drafts],
      };
    }
  }),
  deleteDraft: (id) => set((state) => ({
    drafts: state.drafts.filter((d) => d.id !== id),
  })),
  clearDrafts: () => set({ drafts: [] }),
}));
