import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuthStore, SUPPORTED_CITIES, CityOption } from '../../store/useAuthStore';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupSchemaType = z.infer<typeof signupSchema>;

const CITY_ICONS: Record<CityOption, string> = {
  Indore: '🏛️',
  Patna: '🌊',
  Jaipur: '🏰',
  Lucknow: '🕌',
  Nagpur: '🍊',
  Kolkata: '🌉',
};

export default function SignupScreen() {
  const router = useRouter();
  const { signup, loginWithGoogle, completeGoogleSignup, isLoading } = useAuthStore();
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [cityError, setCityError] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: SignupSchemaType) => {
    if (!selectedCity) {
      setCityError(true);
      return;
    }
    setCityError(false);
    const success = await signup(data.fullName, data.email, role, selectedCity);
    if (success) {
      if (role === 'citizen') {
        router.replace('/(citizen)/home');
      } else {
        router.replace('/(admin)/issue-queue');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const mockProfile = { name: 'Google User', email: 'user@gmail.com' };
      const result = await loginWithGoogle(mockProfile);
      if (result.success && !result.needsRole) {
        const { user } = useAuthStore.getState();
        router.replace(user?.role === 'citizen' ? '/(citizen)/home' : '/(admin)/issue-queue');
      } else if (result.success && result.needsRole) {
        // Redirect to login page which has the full setup modal
        router.replace('/(auth)/login');
      }
    } catch {
      Alert.alert('Error', 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join LocalPulse to resolve civic problems</Text>
        </View>

        {/* Role Selection Switch */}
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'citizen' && styles.activeTab]}
            onPress={() => setRole('citizen')}
          >
            <Text style={[styles.roleText, role === 'citizen' && styles.activeRoleText]}>
              Citizen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleTab, role === 'admin' && styles.activeTab]}
            onPress={() => setRole('admin')}
          >
            <Text style={[styles.roleText, role === 'admin' && styles.activeRoleText]}>
              Authority Admin
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          {/* Full Name input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Full Name</Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder="Rahul Verma"
                  placeholderTextColor="#64748B"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}
          </View>

          {/* Email input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email Address</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="name@example.com"
                  placeholderTextColor="#64748B"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          {/* Password input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          {/* City Selection */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>📍 Select Your City</Text>
            <Text style={styles.cityHint}>You'll see issues and events from this city</Text>
            <View style={styles.cityGrid}>
              {SUPPORTED_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityCard,
                    selectedCity === city && styles.activeCityCard,
                    cityError && !selectedCity && styles.cityCardError,
                  ]}
                  onPress={() => {
                    setSelectedCity(city);
                    setCityError(false);
                  }}
                >
                  <Text style={styles.cityIcon}>{CITY_ICONS[city]}</Text>
                  <Text style={[
                    styles.cityName,
                    selectedCity === city && styles.activeCityName,
                  ]}>
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {cityError && <Text style={styles.errorText}>Please select your city</Text>}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitButton, !selectedCity && styles.submitButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Google Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || isLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer links */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLinkText}>Log In</Text>
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
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    minHeight: 550,
  },
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 4,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#0284C7',
  },
  roleText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  activeRoleText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formContainer: {
    gap: 14,
  },
  inputWrapper: {
    gap: 6,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  cityHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: -2,
  },
  input: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 15,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 2,
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  cityCard: {
    width: '30%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
    minWidth: 90,
    flexGrow: 1,
    flexBasis: '28%',
  },
  activeCityCard: {
    backgroundColor: '#0C4A6E',
    borderColor: '#0EA5E9',
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  cityCardError: {
    borderColor: '#EF444480',
  },
  cityIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  cityName: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeCityName: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  loginLinkText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 13,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#4285F4',
    borderRadius: 10,
    paddingVertical: 13,
    gap: 10,
    marginTop: 12,
  },
  googleIcon: {
    color: '#4285F4',
    fontSize: 18,
    fontWeight: '900',
  },
  googleButtonText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 15,
  },
});
