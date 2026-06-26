import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';

export default function CitizenLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 18, fontWeight: focused ? '900' : '400' }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 18, fontWeight: focused ? '900' : '400' }}>🗺️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.createButtonContainer}>
              <Text style={styles.createButtonIcon}>➕</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 18, fontWeight: focused ? '900' : '400' }}>📅</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 18, fontWeight: focused ? '900' : '400' }}>🛠️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 18, fontWeight: focused ? '900' : '400' }}>👤</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="learn"
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
  createButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  createButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});
