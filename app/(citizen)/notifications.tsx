import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useNotificationStore, AppNotification } from '../../store/useNotificationStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();

  const handleNotificationPress = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.relatedId) {
      router.push(`/issue/${item.relatedId}`);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>➔ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
          <Text style={styles.markAllText}>Read All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleNotificationPress(item)}
            style={[styles.notifCard, !item.isRead && styles.unreadCard]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, !item.isRead && styles.unreadText]}>
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.cardBody}>{item.body}</Text>
            <Text style={styles.cardTime}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySub}>We will notify you here when your issues get resolved or commented on.</Text>
          </View>
        }
        ListFooterComponent={
          notifications.length > 0 ? (
            <TouchableOpacity onPress={clearNotifications} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear All Notifications</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </ScreenWrapper>
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
  markAllBtn: {
    padding: 6,
  },
  markAllText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  notifCard: {
    backgroundColor: '#1E293B60',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#33415520',
    marginBottom: 10,
  },
  unreadCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  unreadText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  cardBody: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 18,
  },
  cardTime: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  clearBtn: {
    alignItems: 'center',
    padding: 12,
    marginTop: 20,
  },
  clearText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
