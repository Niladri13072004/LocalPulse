import { create } from 'zustand';

export interface SyncItem {
  id: string;
  type: 'create_issue' | 'upvote_issue' | 'comment_issue';
  payload: any;
  createdAt: string;
  attempts: number;
}

interface SyncState {
  queue: SyncItem[];
  isSyncing: boolean;
  isOnline: boolean;
  addToQueue: (type: SyncItem['type'], payload: any) => void;
  removeFromQueue: (id: string) => void;
  setOnlineStatus: (status: boolean) => void;
  processQueue: (executeSync: (item: SyncItem) => Promise<boolean>) => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  queue: [],
  isSyncing: false,
  isOnline: true,
  addToQueue: (type, payload) => set((state) => {
    const newItem: SyncItem = {
      id: 'sync-' + Math.random().toString(36).substr(2, 9),
      type,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    return { queue: [...state.queue, newItem] };
  }),
  removeFromQueue: (id) => set((state) => ({
    queue: state.queue.filter((item) => item.id !== id),
  })),
  setOnlineStatus: (status) => set({ isOnline: status }),
  processQueue: async (executeSync) => {
    const { queue, isSyncing, isOnline } = get();
    if (isSyncing || !isOnline || queue.length === 0) return;

    set({ isSyncing: true });

    // Process items in FIFO order
    for (const item of queue) {
      let success = false;
      try {
        set((state) => ({
          queue: state.queue.map((q) => q.id === item.id ? { ...q, attempts: q.attempts + 1 } : q)
        }));
        success = await executeSync(item);
      } catch (err) {
        console.error('Offline sync execution failed for item:', item.id, err);
      }

      if (success) {
        set((state) => ({
          queue: state.queue.filter((q) => q.id !== item.id)
        }));
      } else {
        // If an item fails, we pause the queue to prevent out-of-order failures
        break;
      }
    }

    set({ isSyncing: false });
  },
}));
