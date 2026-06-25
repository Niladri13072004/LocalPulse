import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuthStore } from '../../store/useAuthStore';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupSchemaType = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const router = useRouter();
  const { signup, isLoading } = useAuthStore();
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');

  const { control, handleSubmit, formState: { errors } } = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: SignupSchemaType) => {
    const success = await signup(data.fullName, data.email, role);
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

          {/* Submit button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Sign Up</Text>
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
  loginLinkText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
});
