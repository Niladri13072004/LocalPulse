import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Run introductory animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Route to onboarding after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace('/(auth)/onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.pulseRing} />
          <Text style={styles.logoTitle}>Local<Text style={styles.highlight}>Pulse</Text></Text>
          <Text style={styles.tagline}>Hyperlocal Civic Operating System</Text>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  logoContainer: {
    alignItems: 'center',
  },
  pulseRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0284C7',
    opacity: 0.15,
    position: 'absolute',
    top: -20,
  },
  logoTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  highlight: {
    color: '#0284C7',
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
    letterSpacing: 1,
  },
});
