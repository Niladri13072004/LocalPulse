import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import AppHeader from '../../components/AppHeader';
import OfflineBanner from '../../components/OfflineBanner';
import IssueCard from '../../components/IssueCard';
import { useIssueStore, Issue } from '../../store/useIssueStore';
import { useDraftStore } from '../../store/useDraftStore';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useLocation } from '../../hooks/useLocation';

const CATEGORIES = ['All', 'Pothole', 'Water Logging', 'Garbage', 'Electricity', 'Safety', 'Others'];
const RADII = [1, 3, 5, 10]; // in km

// Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CitizenHomeScreen() {
  const router = useRouter();
  const { issues } = useIssueStore();
  const { drafts } = useDraftStore();
  const { isOnline } = useOfflineSync();
  const { location } = useLocation();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRadius, setSelectedRadius] = useState(5); // 5km default
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');

  // Filter issues based on criteria
  const filteredIssues = issues.filter((issue) => {
    // 1. Filter Category
    if (selectedCategory !== 'All' && issue.category !== selectedCategory) {
      return false;
    }
    // 2. Filter Status
    if (statusFilter !== 'all') {
      if (statusFilter === 'in_progress' && (issue.status !== 'in_progress' && issue.status !== 'under_review')) {
        return false;
      }
      if (statusFilter !== 'in_progress' && issue.status !== statusFilter) {
        return false;
      }
    }
    // 3. Proximity Radius check using user's GPS
    if (location) {
      const dist = getDistance(
        location.coords.latitude,
        location.coords.longitude,
        issue.latitude,
        issue.longitude
      );
      if (dist > selectedRadius) {
        return false;
      }
    }
    return true;
  });

  // Calculate trending scores and sort
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === 'trending') {
      const getScore = (item: Issue) => {
        const hours = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
        return (item.upvotes + item.comments.length * 2) / Math.pow(hours + 2, 1.5);
      };
      return getScore(b) - getScore(a);
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <ScreenWrapper>
      <AppHeader />
      <OfflineBanner />

      <FlatList
        data={sortedIssues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <IssueCard issue={item} />}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Drafts Alert section */}
            {!isOnline && drafts.length > 0 && (
              <View style={styles.draftContainer}>
                <Text style={styles.draftTitle}>📝 You have {drafts.length} unsaved draft(s)</Text>
                <Text style={styles.draftSubtitle}>These will sync automatically when you get online.</Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(citizen)/profile')}
                  style={styles.viewDraftsBtn}
                >
                  <Text style={styles.viewDraftsBtnText}>View Drafts in Profile</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Civic Academy Banner */}
            <TouchableOpacity
              onPress={() => router.push('/(citizen)/learn')}
              style={styles.academyBanner}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.academyTitle}>🎓 Civic Academy</Text>
                <Text style={styles.academySubtitle}>Learn municipal structure & earn XP rewards!</Text>
              </View>
              <View style={styles.streakIndicator}>
                <Text style={styles.streakText}>🔥 3</Text>
              </View>
            </TouchableOpacity>

            {/* Proximity Radius Selector */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>🔍 Search Radius</Text>
              <View style={styles.radiusRow}>
                {RADII.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setSelectedRadius(r)}
                    style={[
                      styles.radiusTab,
                      selectedRadius === r && styles.activeRadiusTab
                    ]}
                  >
                    <Text style={[styles.radiusText, selectedRadius === r && styles.activeRadiusText]}>
                      {r} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Filter */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>📁 Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.categoryTab,
                      selectedCategory === cat && styles.activeCategoryTab
                    ]}
                  >
                    <Text style={[styles.categoryText, selectedCategory === cat && styles.activeCategoryText]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Status Tabs */}
            <View style={styles.statusTabsRow}>
              {(['all', 'open', 'in_progress', 'resolved'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  style={[
                    styles.statusTab,
                    statusFilter === status && styles.activeStatusTab
                  ]}
                >
                  <Text style={[styles.statusTabText, statusFilter === status && styles.activeStatusTabText]}>
                    {status === 'all' ? 'FEED' : status.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sort Toggle Row */}
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>SORT BY</Text>
              <View style={styles.sortRow}>
                <TouchableOpacity
                  onPress={() => setSortBy('recent')}
                  style={[styles.sortBtn, sortBy === 'recent' && styles.sortBtnActive]}
                >
                  <Text style={[styles.sortBtnText, sortBy === 'recent' && styles.sortBtnTextActive]}>
                    Recent
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortBy('trending')}
                  style={[styles.sortBtn, sortBy === 'trending' && styles.sortBtnActive]}
                >
                  <Text style={[styles.sortBtnText, sortBy === 'trending' && styles.sortBtnTextActive]}>
                    🔥 Trending
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No reports found in this radius.</Text>
            <Text style={styles.emptySubtext}>Be the first to report issues in this category!</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  headerSection: {
    marginBottom: 16,
  },
  draftContainer: {
    backgroundColor: '#3F2D06',
    borderWidth: 1,
    borderColor: '#7F5F0D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  draftTitle: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
  },
  draftSubtitle: {
    color: '#D97706',
    fontSize: 12,
    marginTop: 2,
  },
  viewDraftsBtn: {
    marginTop: 8,
    backgroundColor: '#FBBF24',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewDraftsBtnText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 12,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  radiusRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  radiusTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeRadiusTab: {
    backgroundColor: '#0284C7',
  },
  radiusText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  activeRadiusText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryScroll: {
    gap: 8,
  },
  categoryTab: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeCategoryTab: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  categoryText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 8,
    marginTop: 4,
  },
  statusTab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeStatusTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#38BDF8',
  },
  statusTabText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeStatusTabText: {
    color: '#38BDF8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#1E293B40',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sortLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sortBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sortBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  sortBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  sortBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  academyBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#0284C740',
    marginBottom: 16,
  },
  academyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  academySubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },
  streakIndicator: {
    backgroundColor: '#D9770620',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9770680',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
  },
});
