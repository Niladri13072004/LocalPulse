import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#EF4444', // Red accent for Admin authority
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 18, fontWeight: focused ? '950' : '400' }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="issue-queue"
        options={{
          title: 'Issue Queue',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 18, fontWeight: focused ? '950' : '400' }}>📥</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="heatmap"
        options={{
          title: 'Heatmap',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 18, fontWeight: focused ? '950' : '400' }}>🔥</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="service-queue"
        options={{
          title: 'Verify Services',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 18, fontWeight: focused ? '950' : '400' }}>🛠️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="ward-detail"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0F172A',
    borderTopColor: '#1E293B',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
