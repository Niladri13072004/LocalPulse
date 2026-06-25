import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function SkeletonLoader() {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.header}>
        <View style={styles.badge} />
        <View style={styles.badge} />
      </View>
      <View style={styles.line1} />
      <View style={styles.line2} />
      <View style={styles.imagePlaceholder} />
      <View style={styles.footer}>
        <View style={styles.smallLine} />
        <View style={styles.buttonPlaceholder} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    width: 60,
    height: 18,
    backgroundColor: '#334155',
    borderRadius: 4,
  },
  line1: {
    width: '70%',
    height: 20,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginBottom: 8,
  },
  line2: {
    width: '90%',
    height: 14,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#334155',
    borderRadius: 12,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallLine: {
    width: '40%',
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 4,
  },
  buttonPlaceholder: {
    width: 60,
    height: 28,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
});
