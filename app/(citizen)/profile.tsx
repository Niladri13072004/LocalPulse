import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import AppHeader from '../../components/AppHeader';
import OfflineBanner from '../../components/OfflineBanner';
import IssueCard from '../../components/IssueCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useDraftStore, IssueDraft } from '../../store/useDraftStore';
import { useIssueStore } from '../../store/useIssueStore';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useSyncStore } from '../../store/useSyncStore';

export default function CitizenProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { drafts, deleteDraft } = useDraftStore();
  const { issues } = useIssueStore();
  const { isOnline } = useOfflineSync();
  const { addToQueue } = useSyncStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // Sync a single draft manually if online
  const handleSyncDraft = (draft: IssueDraft) => {
    if (!isOnline) {
      alert('You must be online to sync a draft.');
      return;
    }

    addToQueue('create_issue', {
      title: draft.title,
      description: draft.description,
      category: draft.category,
      images: draft.images,
      latitude: draft.latitude,
      longitude: draft.longitude,
      wardName: draft.wardName,
      city: 'Indore', // default city mock
      isAnonymous: draft.isAnonymous,
    });

    deleteDraft(draft.id);
    alert('Draft queued for upload sync.');
  };

  // Find issues reported by current user
  const userIssues = issues.filter(
    (issue) => issue.reporterName === user?.fullName || (issue.isAnonymous && user?.fullName === 'Aarav Mehta')
  );

  return (
    <ScreenWrapper>
      <AppHeader />
      <OfflineBanner />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.fullName ? user.fullName.split(' ').map(n=>n[0]).join('') : 'C'}</Text>
          </View>
          <Text style={styles.userName}>{user?.fullName || 'Citizen Profile'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'citizen@localpulse.org'}</Text>
          
          {/* Badge Display */}
          {user?.badges && user.badges.length > 0 && (
            <View style={styles.badgeRow}>
              {user.badges.map((badge, index) => (
                <View key={index} style={styles.badgeLabel}>
                  <Text style={styles.badgeLabelText}>🏆 {badge}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Offline Drafts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Offline Drafts ({drafts.length})</Text>
          {drafts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyBoxText}>No saved drafts. Offline reports will appear here.</Text>
            </View>
          ) : (
            drafts.map((draft) => (
              <View key={draft.id} style={styles.draftCard}>
                <View>
                  <Text style={styles.draftTitle}>{draft.title}</Text>
                  <Text style={styles.draftDesc} numberOfLines={1}>{draft.description}</Text>
                  <Text style={styles.draftWard}>📍 {draft.wardName}</Text>
                </View>
                <View style={styles.draftActions}>
                  <TouchableOpacity 
                    onPress={() => deleteDraft(draft.id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleSyncDraft(draft)}
                    style={[styles.syncBtn, { backgroundColor: isOnline ? '#0284C7' : '#1E293B' }]}
                  >
                    <Text style={[styles.syncBtnText, { color: isOnline ? '#FFFFFF' : '#64748B' }]}>
                      Submit
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* My Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📣 My Reported Issues ({userIssues.length})</Text>
          {userIssues.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyBoxText}>You haven't reported any issues yet.</Text>
            </View>
          ) : (
            userIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  userEmail: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  badgeLabel: {
    backgroundColor: '#0284C720',
    borderWidth: 1,
    borderColor: '#0284C780',
    borderRadius: 99,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  badgeLabelText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: '#1E293B40',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyBoxText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  draftCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  draftTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  draftDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  draftWard: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  draftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteBtn: {
    backgroundColor: '#EF444410',
    borderWidth: 1,
    borderColor: '#EF444440',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  syncBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#EF444410',
    borderWidth: 1,
    borderColor: '#EF444460',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  logoutText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 15,
  },
});
