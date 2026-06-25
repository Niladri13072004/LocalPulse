import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import IssueCard from '../../components/IssueCard';
import { useIssueStore } from '../../store/useIssueStore';

export default function SearchScreen() {
  const router = useRouter();
  const { issues } = useIssueStore();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Pothole', 'Water Logging', 'Garbage', 'Electricity', 'Safety', 'Others'];

  const results = issues.filter((issue) => {
    const matchesQuery = 
      issue.title.toLowerCase().includes(query.toLowerCase()) ||
      issue.description.toLowerCase().includes(query.toLowerCase()) ||
      issue.wardName.toLowerCase().includes(query.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>➔ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Reports</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search keywords, landmarks, wards..."
          placeholderTextColor="#64748B"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />

        <ScrollViewHorizontal categories={categories} active={selectedCategory} onSelect={setSelectedCategory} />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <IssueCard issue={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No matching reports found.</Text>
            <Text style={styles.emptySub}>Try searching for "Rajwada", "waterlogging", or "streetlights".</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

// Simple horizontal scroll helper inside same file
function ScrollViewHorizontal({ categories, active, onSelect }: any) {
  return (
    <View style={styles.scrollContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item)}
            style={[styles.tagTab, active === item && styles.tagTabActive]}
          >
            <Text style={[styles.tagText, active === item && styles.tagTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ gap: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    padding: 6,
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  searchBox: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 12,
  },
  searchInput: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 15,
  },
  scrollContainer: {
    height: 36,
  },
  tagTab: {
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    height: 32,
  },
  tagTabActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  tagText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
