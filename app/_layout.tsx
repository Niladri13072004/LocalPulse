import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { user, isLoading, isHydrated, hydrate } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Restore persisted session on app launch
  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    // Wait until storage is hydrated before making routing decisions
    if (!isHydrated || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user) {
      // If not logged in, force go to splash/auth flow
      if (!inAuthGroup) {
        router.replace('/(auth)/splash');
      }
    } else {
      // If logged in, redirect based on roles
      if (user.role === 'citizen') {
        if (inAuthGroup || segments[0] === '(admin)') {
          router.replace('/(citizen)/home');
        }
      } else if (user.role === 'admin') {
        if (inAuthGroup || segments[0] === '(citizen)') {
          router.replace('/(admin)/issue-queue');
        }
      }
    }
  }, [user, segments, isLoading, isHydrated]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(citizen)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="issue/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="quiz/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}
