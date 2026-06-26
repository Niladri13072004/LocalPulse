import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useIssueStore, Issue } from '../../store/useIssueStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useRouter } from 'expo-router';

export default function AdminIssueQueueScreen() {
  const router = useRouter();
  const { issues, updateStatus } = useIssueStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [statusTarget, setStatusTarget] = useState<Issue['status']>('open');

  const openStatusModal = (issue: Issue, target: Issue['status']) => {
    setSelectedIssue(issue);
    setStatusTarget(target);
    setCommentText('');
    setModalVisible(true);
  };

  const handleStatusChange = () => {
    if (!selectedIssue || !commentText.trim()) {
      Alert.alert('Required', 'Please add a comment explaining this status transition.');
      return;
    }

    updateStatus(
      selectedIssue.id,
      statusTarget,
      user?.fullName || 'Officer Vikram Singh',
      commentText
    );

    // Trigger Notification for the citizen
    addNotification({
      title: '🛠️ Report Status Updated',
      body: `Your report "${selectedIssue.title}" status has changed to ${statusTarget.toUpperCase()} by ${user?.fullName || 'Officer'}.`,
      type: 'status_change',
      relatedId: selectedIssue.id,
    });

    setModalVisible(false);
    setSelectedIssue(null);
    Alert.alert('Success', `Status updated to ${statusTarget.toUpperCase()}`);
  };

  // Only show non-resolved issues in the active queue
  const queueIssues = issues.filter((i) => i.status !== 'resolved');

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Moderation Queue</Text>
        <Text style={styles.subtitle}>{queueIssues.length} pending issues</Text>
      </View>

      <FlatList
        data={queueIssues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{item.category.toUpperCase()}</Text>
              <Text style={styles.priority}>PRIORITY: {item.priority.toUpperCase()}</Text>
            </View>

            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => router.push(`/issue/${item.id}`)}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.location}>📍 {item.wardName}, {item.city}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Stepper actions */}
            <View style={styles.stepperActions}>
              {item.status === 'open' && (
                <TouchableOpacity
                  onPress={() => openStatusModal(item, 'under_review')}
                  style={[styles.actionBtn, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}
                >
                  <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>Review</Text>
                </TouchableOpacity>
              )}

              {(item.status === 'open' || item.status === 'under_review') && (
                <TouchableOpacity
                  onPress={() => openStatusModal(item, 'in_progress')}
                  style={[styles.actionBtn, { backgroundColor: '#8B5CF620', borderColor: '#8B5CF6' }]}
                >
                  <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>Start Work</Text>
                </TouchableOpacity>
              )}

              {item.status === 'in_progress' && (
                <TouchableOpacity
                  onPress={() => openStatusModal(item, 'resolved')}
                  style={[styles.actionBtn, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}
                >
                  <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Resolve</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🎉 Inbox Clear!</Text>
            <Text style={styles.emptySub}>All reported issues in your ward have been resolved.</Text>
          </View>
        }
      />

      {/* Status Transition Comment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Update Status to {statusTarget.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.modalSub}>
              Provide comments/instructions for this update. Citizens will see this in their timeline.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Dispatched sewage truck to clear blockage near Hazratganj..."
              placeholderTextColor="#64748B"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStatusChange}
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmBtnText}>Submit Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  priority: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '700',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  location: {
    color: '#64748B',
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  stepperActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalSub: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: '800',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
