import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useNotificationStore } from '../store/useNotificationStore';

export default function AppHeader() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isOnline, queueLength, toggleOnline } = useOfflineSync();
  const { notifications } = useNotificationStore();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Calculate Level based on XP (e.g. 100 XP per level)
  const xp = user?.xp || 0;
  const level = Math.floor(xp / 100) + 1;
  const nextLevelXp = level * 100;
  const prevLevelXp = (level - 1) * 100;
  const progressPercent = Math.min(100, Math.max(0, ((xp - prevLevelXp) / 100) * 100));

  return (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.logoText}>Local<Text style={styles.pulseText}>Pulse</Text></Text>
        <Text style={styles.wardText}>{user?.wardId ? 'Rajwada Ward, Indore' : 'Detecting Ward...'}</Text>
      </View>

      <View style={styles.rightContainer}>
        {/* Search & Notifications for Citizen */}
        {user?.role === 'citizen' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              onPress={() => router.push('/(citizen)/search')}
              style={styles.actionIconBtn}
            >
              <Text style={styles.actionEmoji}>🔍</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/(citizen)/notifications')}
              style={styles.actionIconBtn}
            >
              <Text style={styles.actionEmoji}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadgeDot} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Network status toggler */}
        <TouchableOpacity
          onPress={toggleOnline}
          style={[
            styles.networkBadge,
            { backgroundColor: isOnline ? '#1E293B' : '#7F1D1D' }
          ]}
        >
          <View style={[styles.dot, { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }]} />
          <Text style={styles.networkText}>
            {isOnline ? 'Online' : `Offline (${queueLength})`}
          </Text>
        </TouchableOpacity>

        {/* User XP and Level badge */}
        {user && (
          <View style={styles.xpBadge}>
            <View style={styles.levelCircle}>
              <Text style={styles.levelText}>{level}</Text>
            </View>
            <View style={styles.xpInfo}>
              <Text style={styles.xpLabel}>Level {level}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pulseText: {
    color: '#0284C7',
  },
  wardText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 4,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionEmoji: {
    fontSize: 14,
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 99,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  networkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 8,
  },
  levelCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  xpInfo: {
    justifyContent: 'center',
  },
  xpLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  progressBarBg: {
    width: 50,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },
});
