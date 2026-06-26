import { create } from 'zustand';
import { useSyncStore } from './useSyncStore';
import { seedIssues as importedSeedIssues } from './seedIssues';

export interface Comment {
  id: string;
  userName: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  statusFrom: string | null;
  statusTo: 'open' | 'under_review' | 'in_progress' | 'resolved';
  changedBy: string;
  comment: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: 'Pothole' | 'Water Logging' | 'Garbage' | 'Electricity' | 'Safety' | 'Others';
  imageUrls: string[];
  latitude: number;
  longitude: number;
  wardName: string;
  city: string;
  isAnonymous: boolean;
  reporterName: string;
  status: 'open' | 'under_review' | 'in_progress' | 'resolved';
  priority: 'critical' | 'high' | 'medium' | 'low';
  departmentName: string;
  createdAt: string;
  upvotes: number;
  upvotedByUser: boolean;
  comments: Comment[];
  statusHistory: StatusHistory[];
}

interface IssueState {
  issues: Issue[];
  fetchIssues: (params?: {
    status?: string;
    category?: string;
    radius?: number;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  addIssue: (issue: Omit<Issue, 'id' | 'upvotes' | 'upvotedByUser' | 'comments' | 'statusHistory' | 'createdAt'>) => Promise<Issue>;
  upvoteIssue: (id: string, userId: string) => Promise<void>;
  addComment: (issueId: string, content: string, userName: string, isAnonymous: boolean) => Promise<void>;
  updateStatus: (issueId: string, newStatus: Issue['status'], changedBy: string, comment: string) => Promise<void>;
}

export const useIssueStore = create<IssueState>((set, get) => ({
  issues: importedSeedIssues as Issue[],
  fetchIssues: async (params) => {
    try {
      const queryParts: string[] = [];
      if (params) {
        if (params.status && params.status !== 'all') {
          queryParts.push(`status=${encodeURIComponent(params.status)}`);
        }
        if (params.category && params.category !== 'All') {
          queryParts.push(`category=${encodeURIComponent(params.category)}`);
        }
        if (params.radius !== undefined) {
          queryParts.push(`radius=${params.radius}`);
        }
        if (params.latitude !== undefined) {
          queryParts.push(`latitude=${params.latitude}`);
        }
        if (params.longitude !== undefined) {
          queryParts.push(`longitude=${params.longitude}`);
        }
      }
      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const res = await fetch(`http://localhost:5000/api/issues${queryString}`);
      if (res.ok) {
        const issuesData: Issue[] = await res.json();
        set({ issues: issuesData });
      }
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    }
  },
  addIssue: async (issueData) => {
    const isOnline = useSyncStore.getState().isOnline;
    if (isOnline) {
      try {
        const res = await fetch('http://localhost:5000/api/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(issueData),
        });
        if (res.ok) {
          const newIssue: Issue = await res.json();
          set((state) => ({
            issues: [newIssue, ...state.issues]
          }));
          return newIssue;
        }
      } catch (err) {
        console.error('Failed to add issue on backend:', err);
      }
    }

    // Offline / Fallback local insert
    const id = 'issue-' + Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();
    const newIssue: Issue = {
      ...issueData,
      id,
      createdAt,
      upvotes: 0,
      upvotedByUser: false,
      comments: [],
      statusHistory: [
        {
          id: 'sh-new-' + Math.random().toString(36).substr(2, 5),
          statusFrom: null,
          statusTo: 'open',
          changedBy: 'System',
          comment: `Issue registered in ${issueData.wardName}.`,
          createdAt,
        }
      ]
    };
    set((state) => ({
      issues: [newIssue, ...state.issues]
    }));
    return newIssue;
  },
  upvoteIssue: async (id, userId) => {
    const isOnline = useSyncStore.getState().isOnline;
    if (isOnline) {
      try {
        const res = await fetch(`http://localhost:5000/api/issues/${id}/upvote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (res.ok) {
          const data = await res.json(); // { upvotes: number, upvotedByUser: boolean }
          set((state) => ({
            issues: state.issues.map((issue) =>
              issue.id === id
                ? { ...issue, upvotes: data.upvotes, upvotedByUser: data.upvotedByUser }
                : issue
            ),
          }));
          return;
        }
      } catch (err) {
        console.error('Failed to upvote issue on backend:', err);
      }
    }

    // Offline / Fallback optimistic update
    set((state) => ({
      issues: state.issues.map((issue) => {
        if (issue.id === id) {
          const upvoted = !issue.upvotedByUser;
          return {
            ...issue,
            upvotedByUser: upvoted,
            upvotes: upvoted ? issue.upvotes + 1 : issue.upvotes - 1,
          };
        }
        return issue;
      })
    }));
  },
  addComment: async (issueId, content, userName, isAnonymous) => {
    const isOnline = useSyncStore.getState().isOnline;
    if (isOnline) {
      try {
        const res = await fetch(`http://localhost:5000/api/issues/${issueId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, userName, isAnonymous }),
        });
        if (res.ok) {
          const newComment: Comment = await res.json();
          set((state) => ({
            issues: state.issues.map((issue) => {
              if (issue.id !== issueId) return issue;
              // Prevent duplicate comments if optimistically added
              const tempIndex = issue.comments.findIndex(
                (c) => c.id.startsWith('c-') && c.content === newComment.content && c.userName === newComment.userName
              );
              const updatedComments = [...issue.comments];
              if (tempIndex !== -1) {
                updatedComments[tempIndex] = newComment;
              } else {
                updatedComments.push(newComment);
              }
              return { ...issue, comments: updatedComments };
            })
          }));
          return;
        }
      } catch (err) {
        console.error('Failed to add comment on backend:', err);
      }
    }

    // Offline / Fallback local update (optimistic)
    const newComment: Comment = {
      id: 'c-' + Math.random().toString(36).substr(2, 9),
      userName: isAnonymous ? 'Anonymous' : userName,
      content,
      isAnonymous,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === issueId
          ? { ...issue, comments: [...issue.comments, newComment] }
          : issue
      )
    }));
  },
  updateStatus: async (issueId, newStatus, changedBy, comment) => {
    const isOnline = useSyncStore.getState().isOnline;
    if (isOnline) {
      try {
        const res = await fetch(`http://localhost:5000/api/issues/${issueId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, changedBy, comment }),
        });
        if (res.ok) {
          set((state) => ({
            issues: state.issues.map((issue) => {
              if (issue.id === issueId) {
                const newHistory: StatusHistory = {
                  id: 'sh-' + Math.random().toString(36).substr(2, 9),
                  statusFrom: issue.status,
                  statusTo: newStatus,
                  changedBy,
                  comment,
                  createdAt: new Date().toISOString(),
                };
                return {
                  ...issue,
                  status: newStatus,
                  statusHistory: [...issue.statusHistory, newHistory],
                };
              }
              return issue;
            })
          }));
          return;
        }
      } catch (err) {
        console.error('Failed to update status on backend:', err);
      }
    }

    // Offline / Fallback local update
    set((state) => ({
      issues: state.issues.map((issue) => {
        if (issue.id === issueId) {
          const newHistory: StatusHistory = {
            id: 'sh-' + Math.random().toString(36).substr(2, 9),
            statusFrom: issue.status,
            statusTo: newStatus,
            changedBy,
            comment,
            createdAt: new Date().toISOString(),
          };
          return {
            ...issue,
            status: newStatus,
            statusHistory: [...issue.statusHistory, newHistory],
          };
        }
        return issue;
      })
    }));
  },
}));
