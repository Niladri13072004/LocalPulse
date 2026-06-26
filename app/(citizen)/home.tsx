import React, { useState, useEffect, useMemo } from 'react';
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
import { useAuthStore } from '../../store/useAuthStore';

const CATEGORIES = ['All', 'Pothole', 'Water Logging', 'Garbage', 'Electricity', 'Safety', 'Others'];
const RADII = [1, 3, 5, 10]; // in km

// Radius-to-max-issue-count mapping for density simulation
const RADIUS_LIMITS: Record<number, number> = {
  1: 5,
  3: 12,
  5: 20,
  10: 999, // show all
};

export default function CitizenHomeScreen() {
  const router = useRouter();
  const { issues, fetchIssues } = useIssueStore();
  const { drafts } = useDraftStore();
  const { isOnline } = useOfflineSync();
  const { location } = useLocation();
  const { user } = useAuthStore();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRadius, setSelectedRadius] = useState(5); // 5km default
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');

  const userCity = user?.city || 'Indore';

  useEffect(() => {
    fetchIssues({
      status: statusFilter,
      category: selectedCategory,
      radius: selectedRadius,
      latitude: location?.coords?.latitude,
      longitude: location?.coords?.longitude,
    });
  }, [statusFilter, selectedCategory, selectedRadius, location?.coords?.latitude, location?.coords?.longitude, fetchIssues]);

  // Filter by user's city, apply radius density, then sort
  const filteredAndSortedIssues = useMemo(() => {
    // Step 1: Filter by user's city
    let cityFiltered = issues.filter((issue) => issue.city === userCity);

    // Step 2: Apply category filter (if not already handled by backend)
    if (selectedCategory !== 'All') {
      cityFiltered = cityFiltered.filter((issue) => issue.category === selectedCategory);
    }

    // Step 3: Apply status filter
    if (statusFilter !== 'all') {
      cityFiltered = cityFiltered.filter((issue) => issue.status === statusFilter);
    }

    // Step 4: Sort
    const sorted = [...cityFiltered].sort((a, b) => {
      if (sortBy === 'trending') {
        const getScore = (item: Issue) => {
          const hours = Math.max(0, (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60));
          return (item.upvotes + item.comments.length * 2) / Math.pow(hours + 2, 1.5);
        };
        return getScore(b) - getScore(a);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // Step 5: Apply radius-based density limiting
    const maxIssues = RADIUS_LIMITS[selectedRadius] || 999;
    return sorted.slice(0, maxIssues);
  }, [issues, userCity, selectedCategory, statusFilter, sortBy, selectedRadius]);

  return (
    <ScreenWrapper>
      <AppHeader />
      <OfflineBanner />

      <FlatList
        data={filteredAndSortedIssues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <IssueCard issue={item} />}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* City Badge */}
            <View style={styles.cityBadgeRow}>
              <View style={styles.cityBadge}>
                <Text style={styles.cityBadgeText}>📍 {userCity}</Text>
              </View>
              <Text style={styles.cityBadgeHint}>
                Showing issues near you
              </Text>
            </View>

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
              accessibilityRole="button"
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
              <Text style={styles.radiusCountHint}>
                {filteredAndSortedIssues.length} issue{filteredAndSortedIssues.length !== 1 ? 's' : ''} within {selectedRadius} km
              </Text>
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
            <Text style={styles.emptyText}>No reports found in {userCity}.</Text>
            <Text style={styles.emptySubtext}>Try increasing the search radius or be the first to report!</Text>
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
  cityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  cityBadge: {
    backgroundColor: '#0C4A6E',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  cityBadgeText: {
    color: '#7DD3FC',
    fontSize: 13,
    fontWeight: '700',
  },
  cityBadgeHint: {
    color: '#64748B',
    fontSize: 12,
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
  radiusCountHint: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
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
