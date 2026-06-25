import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useIssueStore } from '../../store/useIssueStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { issues } = useIssueStore();
  const { user, logout } = useAuthStore();

  const totalIssues = issues.length;
  const openIssues = issues.filter((i) => i.status === 'open').length;
  const inProgressIssues = issues.filter((i) => i.status === 'in_progress' || i.status === 'under_review').length;
  const resolvedIssues = issues.filter((i) => i.status === 'resolved').length;

  const resolutionRate = totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(0) : '0';

  // Compute average response/resolution times in hours
  let totalResponseHours = 0;
  let responseCount = 0;
  let totalResolutionHours = 0;
  let resolutionCount = 0;

  issues.forEach((issue) => {
    const createdTime = new Date(issue.createdAt).getTime();

    // Response = time to get under review, in progress, or resolved
    const firstAction = issue.statusHistory.find(
      (h) => h.statusTo === 'under_review' || h.statusTo === 'in_progress' || h.statusTo === 'resolved'
    );
    if (firstAction) {
      const hours = (new Date(firstAction.createdAt).getTime() - createdTime) / (1000 * 60 * 60);
      totalResponseHours += hours;
      responseCount++;
    }

    // Resolution = time to get resolved
    const resolveAction = issue.statusHistory.find((h) => h.statusTo === 'resolved');
    if (resolveAction) {
      const hours = (new Date(resolveAction.createdAt).getTime() - createdTime) / (1000 * 60 * 60);
      totalResolutionHours += hours;
      resolutionCount++;
    }
  });

  const avgResponse = responseCount > 0 ? (totalResponseHours / responseCount).toFixed(1) : '2.4'; // default mock if no logs
  const avgResolution = resolutionCount > 0 ? (totalResolutionHours / resolutionCount).toFixed(1) : '18.5';

  return (
    <ScreenWrapper scrollable>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>{user?.fullName || 'Ward Officer'}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            logout();
            router.replace('/(auth)/login');
          }}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>📈 Ward Performance Metrics</Text>

        {/* Stats Grid */}
        <View style={styles.grid}>
          <View style={[styles.gridCard, { borderLeftColor: '#EF4444' }]}>
            <Text style={styles.gridVal}>{openIssues}</Text>
            <Text style={styles.gridLabel}>New / Open</Text>
          </View>
          <View style={[styles.gridCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.gridVal}>{inProgressIssues}</Text>
            <Text style={styles.gridLabel}>In Progress</Text>
          </View>
          <View style={[styles.gridCard, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.gridVal}>{resolvedIssues}</Text>
            <Text style={styles.gridLabel}>Resolved</Text>
          </View>
          <View style={[styles.gridCard, { borderLeftColor: '#38BDF8' }]}>
            <Text style={styles.gridVal}>{resolutionRate}%</Text>
            <Text style={styles.gridLabel}>Resolution Rate</Text>
          </View>
          <View style={[styles.gridCard, { borderLeftColor: '#EC4899' }]}>
            <Text style={styles.gridVal}>{avgResponse}h</Text>
            <Text style={styles.gridLabel}>Avg Response</Text>
          </View>
          <View style={[styles.gridCard, { borderLeftColor: '#84CC16' }]}>
            <Text style={styles.gridVal}>{avgResolution}h</Text>
            <Text style={styles.gridLabel}>Avg Resolution</Text>
          </View>
        </View>

        {/* Charts Mock */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Top Complaint Categories</Text>
          
          <View style={styles.chartBarRow}>
            <Text style={styles.chartBarLabel}>Potholes</Text>
            <View style={styles.chartBarBg}>
              <View style={[styles.chartBarFill, { width: '80%', backgroundColor: '#EF4444' }]} />
            </View>
            <Text style={styles.chartBarVal}>80%</Text>
          </View>

          <View style={styles.chartBarRow}>
            <Text style={styles.chartBarLabel}>Water Logging</Text>
            <View style={styles.chartBarBg}>
              <View style={[styles.chartBarFill, { width: '50%', backgroundColor: '#F59E0B' }]} />
            </View>
            <Text style={styles.chartBarVal}>50%</Text>
          </View>

          <View style={styles.chartBarRow}>
            <Text style={styles.chartBarLabel}>Garbage</Text>
            <View style={styles.chartBarBg}>
              <View style={[styles.chartBarFill, { width: '35%', backgroundColor: '#EAB308' }]} />
            </View>
            <Text style={styles.chartBarVal}>35%</Text>
          </View>
        </View>

        {/* Recent Queue Actions Call */}
        <TouchableOpacity 
          onPress={() => router.push('/(admin)/issue-queue')}
          style={styles.actionCard}
        >
          <Text style={styles.actionCardTitle}>Go to Moderation Queue</Text>
          <Text style={styles.actionCardSub}>Review new citizen reports and update statuses.</Text>
        </TouchableOpacity>

        {/* Ward Reports Call */}
        <TouchableOpacity 
          onPress={() => router.push('/(admin)/ward-detail')}
          style={[styles.actionCard, { backgroundColor: '#3B82F610', borderColor: '#3B82F630', marginTop: 12 }]}
        >
          <Text style={[styles.actionCardTitle, { color: '#60A5FA' }]}>View Detailed Ward Reports</Text>
          <Text style={styles.actionCardSub}>Inspect resolution times and category breakdowns per ward.</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 12,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF444480',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  container: {
    padding: 16,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '850',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  gridVal: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  gridLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    marginBottom: 24,
  },
  chartTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  chartBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  chartBarLabel: {
    color: '#94A3B8',
    fontSize: 12,
    width: 80,
    fontWeight: '600',
  },
  chartBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#0F172A',
    borderRadius: 5,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
  },
  chartBarVal: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    width: 30,
    textAlign: 'right',
  },
  actionCard: {
    backgroundColor: '#EF444410',
    borderWidth: 1,
    borderColor: '#EF444430',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionCardTitle: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 15,
  },
  actionCardSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
});
