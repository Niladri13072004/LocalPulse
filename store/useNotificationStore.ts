import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'status_change' | 'comment' | 'nearby_issue' | 'event';
  isRead: boolean;
  createdAt: string;
  relatedId?: string; // e.g. issueId
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const mockNotifications: AppNotification[] = [
  {
    id: 'n-1',
    title: '🛠️ Issue Status Updated',
    body: 'Your report "Broken Streetlights Hazratganj" has been updated to RESOLVED by Officer Alok Mishra.',
    type: 'status_change',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    relatedId: 'issue-lucknow-1',
  },
  {
    id: 'n-2',
    title: '💬 New Comment on Report',
    body: 'Siddharth Jain left a comment on your report "Potholes near Rajwada Gate".',
    type: 'comment',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    relatedId: 'issue-indore-1',
  }
];

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: mockNotifications,
  addNotification: (notifData) => set((state) => {
    const newNotif: AppNotification = {
      ...notifData,
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    return {
      notifications: [newNotif, ...state.notifications],
    };
  }),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
  })),
  clearNotifications: () => set({ notifications: [] }),
}));
