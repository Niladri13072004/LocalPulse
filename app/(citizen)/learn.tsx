import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import AppHeader from '../../components/AppHeader';
import OfflineBanner from '../../components/OfflineBanner';
import { useQuizStore, Lesson } from '../../store/useQuizStore';

export default function CivicAcademyScreen() {
  const router = useRouter();
  const { lessons, streak, completedQuizzes, toggleBookmark } = useQuizStore();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Bookmarked'>('All');

  const filteredLessons = lessons.filter((l) => {
    if (activeFilter === 'Bookmarked') return l.isBookmarked;
    return true;
  });

  return (
    <ScreenWrapper>
      <AppHeader />
      <OfflineBanner />

      <FlatList
        data={filteredLessons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isFinished = completedQuizzes.includes(item.id);
          return (
            <View style={styles.lessonCard}>
              <View style={styles.lessonHeader}>
                <View>
                  <Text style={styles.category}>{item.category.toUpperCase()}</Text>
                  <Text style={styles.readTime}>{item.readTime}</Text>
                </View>
                
                <TouchableOpacity 
                  onPress={() => toggleBookmark(item.id)}
                  style={styles.bookmarkBtn}
                >
                  <Text style={styles.bookmarkEmoji}>
                    {item.isBookmarked ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.lessonTitle}>{item.title}</Text>
              <Text style={styles.lessonContent}>{item.content}</Text>

              <View style={styles.footerRow}>
                {isFinished ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>Completed ✓ (+30 XP)</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push(`/quiz/${item.id}`)}
                    style={styles.quizBtn}
                  >
                    <Text style={styles.quizBtnText}>✍ Take Lesson Quiz</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.pageTitle}>Civic Academy</Text>
                <Text style={styles.pageSubtitle}>Empower yourself through knowledge</Text>
              </View>
              
              <View style={styles.streakIndicator}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakNum}>{streak} Day Streak</Text>
              </View>
            </View>

            {/* Filter Toggle */}
            <View style={styles.filterRow}>
              {(['All', 'Bookmarked'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
                >
                  <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No lessons in this folder.</Text>
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
  titleBlock: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9770620',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9770660',
    gap: 6,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakNum: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterTabActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  lessonCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  category: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  readTime: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  bookmarkBtn: {
    padding: 4,
  },
  bookmarkEmoji: {
    fontSize: 18,
    color: '#FBBF24',
  },
  lessonTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  lessonContent: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  quizBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  quizBtnText: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 12,
  },
  completedBadge: {
    backgroundColor: '#10B98120',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B98180',
  },
  completedText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748B',
  },
});
