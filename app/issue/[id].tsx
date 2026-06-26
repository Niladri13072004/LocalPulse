import React, { useState, Component } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import OfflineBanner from '../../components/OfflineBanner';
import { useIssueStore, Issue } from '../../store/useIssueStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSyncStore } from '../../store/useSyncStore';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useNotificationStore } from '../../store/useNotificationStore';

// Error Boundary to prevent full app crash
class IssueErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ Something went wrong loading this issue.</Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false })} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// Safe image component with fallback placeholder
function SafeImage({ uri, style }: { uri: string; style: any }) {
  const [error, setError] = useState(false);
  if (error || !uri) {
    return (
      <View style={[style, styles.imageFallback]}>
        <Text style={styles.imageFallbackText}>📷 Image unavailable</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={style}
      onError={() => setError(true)}
    />
  );
}

function IssueDetailsContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { issues, upvoteIssue, addComment } = useIssueStore();
  const { user } = useAuthStore();
  const { isOnline, addToQueue } = useSyncStore();
  const { addNotification } = useNotificationStore();

  const [commentText, setCommentText] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const issue = issues.find((i) => i.id === id);

  if (!issue) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Issue report not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const handleUpvote = () => {
    if (!user) return;
    if (isOnline) {
      upvoteIssue(issue.id, user.id);
    } else {
      addToQueue('upvote_issue', { issueId: issue.id, userId: user.id });
      upvoteIssue(issue.id, user.id);
    }
  };

  const handlePostComment = () => {
    if (!commentText.trim() || !user) return;

    setPostingComment(true);

    const payload = {
      issueId: issue.id,
      content: commentText,
      userName: user.fullName,
      isAnonymous: commentAnonymous,
    };

    if (isOnline) {
      addComment(issue.id, payload.content, payload.userName, payload.isAnonymous);
    } else {
      addToQueue('comment_issue', payload);
      addComment(issue.id, payload.content, payload.userName, payload.isAnonymous);
    }

    addNotification({
      title: '💬 New Comment Added',
      body: `${payload.isAnonymous ? 'Anonymous' : payload.userName} commented on "${issue.title}".`,
      type: 'comment',
      relatedId: issue.id,
    });

    setCommentText('');
    setCommentAnonymous(false);
    setPostingComment(false);
  };

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'open': return '#3B82F6';
      case 'under_review': return '#F59E0B';
      case 'in_progress': return '#8B5CF6';
      case 'resolved': return '#10B981';
      default: return '#64748B';
    }
  };

  const firstImageUrl = issue.imageUrls && issue.imageUrls.length > 0 ? issue.imageUrls[0] : null;

  return (
    <ScreenWrapper scrollable>
      <OfflineBanner />

      {/* Back Button Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>➔ Close Modal</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Details</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Main Image — safe with fallback */}
      {firstImageUrl ? (
        <SafeImage uri={firstImageUrl} style={styles.mainImage} />
      ) : null}

      <View style={styles.contentContainer}>
        {/* Category & Status Badges */}
        <View style={styles.badgeRow}>
          <Text style={styles.categoryTag}>{issue.category}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) + '1B' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(issue.status) }]}>
              {issue.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <View style={styles.priorityBox}>
            <Text style={styles.priorityText}>PRIORITY: {(issue.priority || 'medium').toUpperCase()}</Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>{issue.title}</Text>
        <Text style={styles.metaText}>
          Reported by {issue.isAnonymous ? 'Anonymous Citizen' : issue.reporterName} in {issue.wardName}, {issue.city}
        </Text>
        <Text style={styles.description}>{issue.description}</Text>

        {/* Map Location Preview Block */}
        <View style={styles.locationContainer}>
          <Text style={styles.blockTitle}>📍 Geotag Coordinate</Text>
          <View style={styles.mapMock}>
            <Text style={styles.mapText}>Map Preview</Text>
            <Text style={styles.coordLabel}>
              Lat: {issue.latitude?.toFixed(5) ?? '—'}, Lng: {issue.longitude?.toFixed(5) ?? '—'}
            </Text>
          </View>
        </View>

        {/* Status Timeline resolution stepper */}
        {issue.statusHistory && issue.statusHistory.length > 0 && (
          <View style={styles.timelineContainer}>
            <Text style={styles.blockTitle}>📈 Resolution Timeline</Text>
            <View style={styles.timeline}>
              {issue.statusHistory.map((history, index) => (
                <View key={history.id} style={styles.timelineItem}>
                  <View style={styles.stepperCol}>
                    <View style={[styles.stepperDot, { backgroundColor: getStatusColor(history.statusTo) }]} />
                    {index < issue.statusHistory.length - 1 && <View style={styles.stepperLine} />}
                  </View>
                  <View style={styles.stepperBody}>
                    <Text style={styles.stepTitle}>
                      Status changed to {history.statusTo.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.stepComment}>"{history.comment}"</Text>
                    <Text style={styles.stepAuthor}>
                      By {history.changedBy} | {new Date(history.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Upvotes block */}
        <View style={styles.upvoteContainer}>
          <Text style={styles.upvoteLabel}>{issue.upvotes} Citizens upvoted this report</Text>
          <TouchableOpacity
            onPress={handleUpvote}
            style={[styles.upvoteBtn, issue.upvotedByUser && styles.upvoteBtnActive]}
          >
            <Text style={[styles.upvoteBtnText, issue.upvotedByUser && styles.upvoteBtnTextActive]}>
              {issue.upvotedByUser ? '▲ Upvoted' : '▲ Upvote Issue'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.blockTitle}>💬 Comments ({issue.comments?.length ?? 0})</Text>

          {/* Comment List */}
          <View style={styles.commentList}>
            {(issue.comments ?? []).map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <Text style={styles.commentUser}>
                  {c.isAnonymous ? 'Anonymous' : c.userName}
                </Text>
                <Text style={styles.commentContent}>{c.content}</Text>
                <Text style={styles.commentDate}>
                  {new Date(c.createdAt).toLocaleDateString('en-IN')}
                </Text>
              </View>
            ))}
          </View>

          {/* Write comment */}
          {user && (
            <View style={styles.writeCommentBox}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a supportive comment..."
                placeholderTextColor="#64748B"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <View style={styles.commentActions}>
                <View style={styles.anonToggleRow}>
                  <Text style={styles.anonToggleLabel}>Post Anonymously</Text>
                  <Switch
                    value={commentAnonymous}
                    onValueChange={setCommentAnonymous}
                    trackColor={{ false: '#334155', true: '#0284C7' }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handlePostComment}
                  style={styles.postCommentBtn}
                  disabled={postingComment}
                >
                  <Text style={styles.postCommentText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

export default function IssueDetailsScreen() {
  return (
    <IssueErrorBoundary>
      <IssueDetailsContent />
    </IssueErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0F172A',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  imageFallback: {
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFallbackText: {
    color: '#64748B',
    fontSize: 14,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  headerBackBtn: {
    padding: 8,
  },
  headerBackText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  mainImage: {
    width: '100%',
    height: 240,
  },
  contentContainer: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#334155',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priorityBox: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  priorityText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 6,
  },
  metaText: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 16,
  },
  description: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  locationContainer: {
    marginBottom: 24,
  },
  blockTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  mapMock: {
    height: 120,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 14,
  },
  coordLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  timelineContainer: {
    marginBottom: 24,
  },
  timeline: {
    backgroundColor: '#1E293B40',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  stepperCol: {
    alignItems: 'center',
  },
  stepperDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  stepperLine: {
    width: 2,
    height: 50,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  stepperBody: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepComment: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  stepAuthor: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  upvoteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  upvoteLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    paddingRight: 12,
  },
  upvoteBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  upvoteBtnActive: {
    backgroundColor: '#0284C7',
  },
  upvoteBtnText: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 13,
  },
  upvoteBtnTextActive: {
    color: '#FFFFFF',
  },
  commentsSection: {
    marginBottom: 24,
  },
  commentList: {
    gap: 10,
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: '#1E293B60',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#33415520',
  },
  commentUser: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 12,
  },
  commentContent: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 4,
  },
  commentDate: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 6,
    textAlign: 'right',
  },
  writeCommentBox: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
  },
  commentInput: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlignVertical: 'top',
    height: 50,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 8,
  },
  anonToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anonToggleLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  postCommentBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  postCommentText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
