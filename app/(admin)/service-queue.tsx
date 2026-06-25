import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useServiceStore } from '../../store/useServiceStore';

export default function AdminServiceQueueScreen() {
  const { providers, verifyProvider } = useServiceStore();

  // Filter only unverified listings
  const unverifiedProviders = providers.filter((p) => p.status === 'unverified');

  const handleVerify = (id: string, name: string) => {
    verifyProvider(id);
    Alert.alert('Listing Verified', `"${name}" has been successfully verified and published to the citizen directory.`);
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Service Listings Moderation</Text>
        <Text style={styles.subtitle}>{unverifiedProviders.length} listings awaiting check</Text>
      </View>

      <FlatList
        data={unverifiedProviders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.providerName}>{item.name}</Text>
                <Text style={styles.providerType}>{item.type.toUpperCase()}</Text>
              </View>
              <View style={styles.unverifiedBadge}>
                <Text style={styles.unverifiedText}>AWAITING REVIEW</Text>
              </View>
            </View>

            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.phoneText}>📞 Phone: {item.phone}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
                style={styles.callBtn}
              >
                <Text style={styles.callBtnText}>Call to Inspect</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleVerify(item.id, item.name)}
                style={styles.verifyBtn}
              >
                <Text style={styles.verifyBtnText}>Approve & Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🎉 Directory Moderation Inbox Clear!</Text>
            <Text style={styles.emptySub}>All crowdsourced service listings are verified.</Text>
          </View>
        }
      />
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
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  providerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  providerType: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  unverifiedBadge: {
    backgroundColor: '#D9770620',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  unverifiedText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '800',
  },
  description: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  phoneText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  callBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  verifyBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
