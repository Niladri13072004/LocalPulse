import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Issue } from '../store/useIssueStore';
import { useAuthStore } from '../store/useAuthStore';
import { useIssueStore } from '../store/useIssueStore';
import { useSyncStore } from '../store/useSyncStore';

interface IssueCardProps {
  issue: Issue;
}

export default function IssueCard({ issue }: IssueCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { upvoteIssue } = useIssueStore();
  const { isOnline, addToQueue } = useSyncStore();

  const handleUpvote = (e: any) => {
    e.stopPropagation(); // Avoid triggering card navigation
    if (!user) return;
    
    if (isOnline) {
      upvoteIssue(issue.id, user.id);
    } else {
      // Queue upvote request offline
      addToQueue('upvote_issue', { issueId: issue.id, userId: user.id });
      // Optimistically update locally
      upvoteIssue(issue.id, user.id);
    }
  };

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'open':
        return { bg: '#3B82F61A', text: '#3B82F6' };
      case 'under_review':
        return { bg: '#F59E0B1A', text: '#F59E0B' };
      case 'in_progress':
        return { bg: '#8B5CF61A', text: '#8B5CF6' };
      case 'resolved':
        return { bg: '#10B9811A', text: '#10B981' };
    }
  };

  const getPriorityColor = (priority: Issue['priority']) => {
    switch (priority) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F97316';
      case 'medium':
        return '#EAB308';
      case 'low':
        return '#64748B';
    }
  };

  const statusStyle = getStatusColor(issue.status);
  const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/issue/${issue.id}`)}
      style={styles.cardContainer}
    >
      <View style={styles.header}>
        <View style={styles.badgeContainer}>
          <Text style={styles.categoryBadge}>{issue.category}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {issue.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.priorityContainer}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(issue.priority) }]} />
          <Text style={styles.priorityText}>{issue.priority.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.title}>{issue.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {issue.description}
      </Text>

      {issue.imageUrls && issue.imageUrls.length > 0 && (
        <Image source={{ uri: issue.imageUrls[0] }} style={styles.image} />
      )}

      <View style={styles.footer}>
        <View>
          <Text style={styles.locationText}>📍 {issue.wardName}, {issue.city}</Text>
          <Text style={styles.dateText}>Reported: {formattedDate}</Text>
        </View>

        <View style={styles.actionRow}>
          {/* Comments count */}
          <View style={styles.statItem}>
            <Text style={styles.statText}>💬 {issue.comments.length}</Text>
          </View>

          {/* Upvote button */}
          <TouchableOpacity
            onPress={handleUpvote}
            style={[
              styles.upvoteButton,
              { backgroundColor: issue.upvotedByUser ? '#0284C7' : '#1E293B' }
            ]}
          >
            <Text style={[styles.upvoteText, { color: issue.upvotedByUser ? '#FFFFFF' : '#38BDF8' }]}>
              ▲ {issue.upvotes}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#334155',
    color: '#F1F5F9',
    fontSize: 10,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
    marginTop: 4,
  },
  locationText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  upvoteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  upvoteText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
