import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';

interface Slide {
  title: string;
  subtitle: string;
  description: string;
}

const slides: Slide[] = [
  {
    title: 'Report Instantly',
    subtitle: 'HYPERLOCAL REPORTING',
    description: 'Pinpoint civic complaints (potholes, garbage, waterlogging) directly to your local ward with geo-tags and photo capture.',
  },
  {
    title: 'Community Power',
    subtitle: 'VOTE & ENGAGE',
    description: 'Upvote nearby issues reported by neighbors to raise priority. Track resolution progress directly from local authorities.',
  },
  {
    title: 'Always Connected',
    subtitle: 'OFFLINE FIRST',
    description: 'No network? No worries. Create issues entirely offline. LocalPulse automatically saves and syncs them once you reconnect.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  const currentSlide = slides[activeIndex];

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Skip button */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Slide Content */}
        <View style={styles.slideContent}>
          <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </View>

        {/* Footer controls */}
        <View style={styles.footer}>
          {/* Dot Indicators */}
          <View style={styles.dotRow}>
            {slides.map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  { backgroundColor: i === activeIndex ? '#0284C7' : '#334155' }
                ]} 
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>
              {activeIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  skipText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  subtitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    marginBottom: 16,
  },
  description: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  nextText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
