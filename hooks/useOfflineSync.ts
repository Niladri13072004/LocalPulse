import { useEffect } from 'react';
import { useSyncStore, SyncItem } from '../store/useSyncStore';
import { useIssueStore } from '../store/useIssueStore';
import { useAuthStore } from '../store/useAuthStore';

// Simple mock network checker plugin (simulate toggle connection)
export function useOfflineSync() {
  const { queue, isOnline, processQueue, setOnlineStatus } = useSyncStore();
  const { addIssue, upvoteIssue, addComment } = useIssueStore();
  const { user, addXP } = useAuthStore();

  // Helper function to mock upload file to Cloudinary
  const mockImageUpload = async (localUri: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate networking delay
    // Returns a mock URL on Cloudinary
    const randomId = Math.random().toString(36).substr(2, 9);
    return `https://res.cloudinary.com/localpulse/image/upload/v1700000000/issues/${randomId}.jpg`;
  };

  // Sync execution routing
  const executeSyncItem = async (item: SyncItem): Promise<boolean> => {
    console.log(`[Sync Engine] Processing task ${item.id} of type: ${item.type}`);
    
    switch (item.type) {
      case 'create_issue': {
        const { title, description, category, images, latitude, longitude, wardName, city, isAnonymous } = item.payload;
        
        // 1. Upload images to Cloudinary (simulated)
        const uploadedUrls: string[] = [];
        for (const img of images) {
          try {
            const url = await mockImageUpload(img);
            uploadedUrls.push(url);
          } catch (err) {
            console.error('Image upload failed during sync:', img, err);
            return false; // Retry later
          }
        }

        // 2. Add issue to the main store
        await addIssue({
          title,
          description,
          category,
          imageUrls: uploadedUrls.length > 0 ? uploadedUrls : ['https://images.unsplash.com/photo-1599740831114-17186f567646?q=80&w=600'],
          latitude,
          longitude,
          wardName,
          city,
          isAnonymous,
          reporterName: isAnonymous ? 'Anonymous' : (user?.fullName || 'Citizen'),
          status: 'open',
          priority: 'medium',
          departmentName: 'Municipality', // Default department resolver
        });

        // 3. Award gamification XP
        addXP(20); // 20 XP for successfully reporting an issue
        return true;
      }

      case 'upvote_issue': {
        const { issueId, userId } = item.payload;
        await upvoteIssue(issueId, userId);
        return true;
      }

      case 'comment_issue': {
        const { issueId, content, userName, isAnonymous } = item.payload;
        await addComment(issueId, content, userName, isAnonymous);
        addXP(5); // 5 XP for commenting and participating
        return true;
      }

      default:
        return false;
    }
  };

  // Process queue automatically when online status changes to true, or queue updates
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue(executeSyncItem);
    }
  }, [isOnline, queue.length]);

  return {
    isOnline,
    queueLength: queue.length,
    toggleOnline: () => setOnlineStatus(!isOnline),
    syncNow: () => processQueue(executeSyncItem),
  };
}
