import { create } from 'zustand';

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
  addIssue: (issue: Omit<Issue, 'id' | 'upvotes' | 'upvotedByUser' | 'comments' | 'statusHistory' | 'createdAt'>) => Issue;
  upvoteIssue: (id: string, userId: string) => void;
  addComment: (issueId: string, content: string, userName: string, isAnonymous: boolean) => void;
  updateStatus: (issueId: string, newStatus: Issue['status'], changedBy: string, comment: string) => void;
}

// Rich seed data for the 6 demo cities
const seedIssues: Issue[] = [
  {
    id: 'issue-indore-1',
    title: 'Major Potholes near Rajwada Gate',
    description: 'Multiple deep potholes right in front of the main entrance to Rajwada palace. It is causing extreme traffic congestion and posing a hazard to two-wheeler riders.',
    category: 'Pothole',
    imageUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600'],
    latitude: 22.7196,
    longitude: 75.8577,
    wardName: 'Rajwada Ward',
    city: 'Indore',
    isAnonymous: false,
    reporterName: 'Aman Verma',
    status: 'under_review',
    priority: 'high',
    departmentName: 'Road Department',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    upvotes: 45,
    upvotedByUser: false,
    comments: [
      {
        id: 'c1',
        userName: 'Siddharth Jain',
        content: 'Almost slipped here yesterday on my scooty. Glad this has been reported!',
        isAnonymous: false,
        createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ],
    statusHistory: [
      {
        id: 'sh1',
        statusFrom: null,
        statusTo: 'open',
        changedBy: 'System',
        comment: 'Issue reported and mapped to Rajwada Ward.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sh2',
        statusFrom: 'open',
        statusTo: 'under_review',
        changedBy: 'Officer Vikram Singh',
        comment: 'Assigned to the road maintenance inspection team.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]
  },
  {
    id: 'issue-patna-1',
    title: 'Severe Water Logging in Kankarbagh Sector-H',
    description: 'Following yesterday\'s moderate rainfall, the main road of Sector-H is completely submerged under 2 feet of water. Drains appear to be completely choked with trash.',
    category: 'Water Logging',
    imageUrls: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600'],
    latitude: 25.5940,
    longitude: 85.1560,
    wardName: 'Kankarbagh Ward',
    city: 'Patna',
    isAnonymous: true,
    reporterName: 'Anonymous Citizen',
    status: 'open',
    priority: 'critical',
    departmentName: 'Drainage & Water Team',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    upvotes: 82,
    upvotedByUser: false,
    comments: [],
    statusHistory: [
      {
        id: 'sh-patna-1',
        statusFrom: null,
        statusTo: 'open',
        changedBy: 'System',
        comment: 'Issue reported and mapped to Kankarbagh Ward.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]
  },
  {
    id: 'issue-jaipur-1',
    title: 'Overflowing Waste Bin in Johri Bazar',
    description: 'The community garbage bin is overflowing. Garbage is scattered all over the road, creating an intolerable smell and attracting stray animals.',
    category: 'Garbage',
    imageUrls: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600'],
    latitude: 26.9215,
    longitude: 75.8242,
    wardName: 'Pink City Ward',
    city: 'Jaipur',
    isAnonymous: false,
    reporterName: 'Neha Sharma',
    status: 'in_progress',
    priority: 'medium',
    departmentName: 'Sanitation & Waste Dept',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    upvotes: 21,
    upvotedByUser: false,
    comments: [],
    statusHistory: [
      {
        id: 'sh-jaipur-1',
        statusFrom: null,
        statusTo: 'open',
        changedBy: 'System',
        comment: 'Issue reported and mapped to Pink City Ward.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sh-jaipur-2',
        statusFrom: 'open',
        statusTo: 'under_review',
        changedBy: 'Officer Rahul Gupta',
        comment: 'Reviewing waste collection schedule for Johri Bazar.',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sh-jaipur-3',
        statusFrom: 'under_review',
        statusTo: 'in_progress',
        changedBy: 'Officer Rahul Gupta',
        comment: 'Sanitation truck dispatched for clearance and clean-up.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]
  },
  {
    id: 'issue-lucknow-1',
    title: 'Broken Streetlights causing dark spot near Hazratganj Metro',
    description: 'Three consecutive streetlights on the side street near Hazratganj metro station exit are non-functional. The lane becomes pitch dark after 7 PM, creating a safety hazard, especially for women.',
    category: 'Electricity',
    imageUrls: ['https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=600'],
    latitude: 26.8510,
    longitude: 80.9425,
    wardName: 'Hazratganj Ward',
    city: 'Lucknow',
    isAnonymous: false,
    reporterName: 'Divya Rastogi',
    status: 'resolved',
    priority: 'high',
    departmentName: 'Electricity Board',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    upvotes: 94,
    upvotedByUser: false,
    comments: [
      {
        id: 'lc1',
        userName: 'Rakesh Yadav',
        content: 'Yes, this was really scary. Thanks to the team for fixing it!',
        isAnonymous: false,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ],
    statusHistory: [
      {
        id: 'sh-luck-1',
        statusFrom: null,
        statusTo: 'open',
        changedBy: 'System',
        comment: 'Issue reported and mapped to Hazratganj Ward.',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sh-luck-2',
        statusFrom: 'open',
        statusTo: 'in_progress',
        changedBy: 'Officer Alok Mishra',
        comment: 'Repair order raised with electrical contractor.',
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sh-luck-3',
        statusFrom: 'in_progress',
        statusTo: 'resolved',
        changedBy: 'Officer Alok Mishra',
        comment: 'Bulbs and wiring replaced. All streetlights are working fine now.',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]
  }
];

export const useIssueStore = create<IssueState>((set) => ({
  issues: seedIssues,
  addIssue: (issueData) => {
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
  upvoteIssue: (id, userId) => set((state) => ({
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
  })),
  addComment: (issueId, content, userName, isAnonymous) => set((state) => ({
    issues: state.issues.map((issue) => {
      if (issue.id === issueId) {
        const newComment: Comment = {
          id: 'c-' + Math.random().toString(36).substr(2, 9),
          userName: isAnonymous ? 'Anonymous' : userName,
          content,
          isAnonymous,
          createdAt: new Date().toISOString(),
        };
        return {
          ...issue,
          comments: [...issue.comments, newComment],
        };
      }
      return issue;
    })
  })),
  updateStatus: (issueId, newStatus, changedBy, comment) => set((state) => ({
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
  })),
}));
