import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function OfflineBanner() {
  const { isOnline, queueLength, syncNow } = useOfflineSync();
  const { isSyncing } = useOfflineSync() as any; // Safe cast if state changes

  if (isOnline) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>⚠️ Offline Mode Active</Text>
        <Text style={styles.bodyText}>
          {queueLength === 0 
            ? 'Your actions will be saved locally.' 
            : `${queueLength} report(s)/vote(s) queued for sync.`}
        </Text>
      </View>
      {queueLength > 0 && (
        <TouchableOpacity 
          onPress={syncNow} 
          disabled={isSyncing}
          style={styles.syncButton}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : (
            <Text style={styles.syncText}>Sync Now</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#D97706', // Premium Amber
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  titleText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
  bodyText: {
    color: '#3F2D06',
    fontSize: 12,
    marginTop: 1,
  },
  syncButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  syncText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
});
