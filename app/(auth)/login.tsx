import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuthStore, SUPPORTED_CITIES, CityOption } from '../../store/useAuthStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

const isWeb = typeof window !== 'undefined';

const CITY_ICONS: Record<CityOption, string> = {
  Indore: '🏛️',
  Patna: '🌊',
  Jaipur: '🏰',
  Lucknow: '🕌',
  Nagpur: '🍊',
  Kolkata: '🌉',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [selectedCity, setSelectedCity] = useState<CityOption>('Indore');
  const [cityError, setCityError] = useState(false);

  // Remember last selected city from localStorage
  useEffect(() => {
    if (isWeb) {
      try {
        const lastCity = localStorage.getItem('localpulse_last_city') as CityOption | null;
        if (lastCity && SUPPORTED_CITIES.includes(lastCity)) {
          setSelectedCity(lastCity);
        }
      } catch (e) {}
    }
  }, []);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginSchemaType) => {
    if (!selectedCity) {
      setCityError(true);
      return;
    }
    setCityError(false);
    const success = await login(data.email, role, selectedCity);
    if (success) {
      if (role === 'citizen') {
        router.replace('/(citizen)/home');
      } else {
        router.replace('/(admin)/issue-queue');
      }
    }
  };

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to LocalPulse</Text>
          <Text style={styles.subtitle}>Sign in to coordinate civic improvement</Text>
        </View>

        {/* Role Selection Switch */}
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'citizen' && styles.activeTab]}
            onPress={() => setRole('citizen')}
          >
            <Text style={[styles.roleText, role === 'citizen' && styles.activeRoleText]}>
              Citizen Portal
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
            <Text style={styles.label}>📍 Your City</Text>
            <View style={styles.cityGrid}>
              {SUPPORTED_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityCard,
                    selectedCity === city && styles.activeCityCard,
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
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                Log In as {role === 'citizen' ? 'Citizen' : 'Officer'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer links */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.signupText}>Sign Up</Text>
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
    minHeight: 500,
  },
  header: {
    marginBottom: 32,
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
    marginBottom: 28,
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
    gap: 16,
  },
  inputWrapper: {
    gap: 6,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
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
  signupText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
});
