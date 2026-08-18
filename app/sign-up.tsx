import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PresstoButton } from '@/components/PresstoButton';

export default function SignUpScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const signUp = useAuthStore((state) => state.signUp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const draftProfile = useDiaryStore((state) => state.profile);
  const setProfile = useDiaryStore((state) => state.setProfile);

  const draftName = draftProfile?.name || '';
  const isGuest = draftName.toLowerCase() === 'guest' || draftName === 'زائر';
  const initialNameParts = isGuest ? [] : draftName.split(' ');
  const [firstName, setFirstName] = useState(initialNameParts[0] || '');
  const [lastName, setLastName] = useState(initialNameParts[1] || '');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSignUp = async () => {
    setError('');
    setInfo('');
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const success = await signUp(email.trim(), password.trim(), firstName.trim(), lastName.trim());
      if (success) {
        setProfile({ onboarded: true });
        router.replace('/(tabs)');
      } else {
        setError('Sign up failed. Please try again.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred during sign up.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setInfo('');
    if (!otpToken.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    try {
      const success = await verifyOtp(email.trim(), otpToken.trim());
      if (success) {
        setProfile({ onboarded: true });
        router.replace('/(tabs)');
      } else {
        setError('Verification failed. Please check the code.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred during verification.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="items-center mb-8">
            <Ionicons name="heart" size={40} color={isDark ? '#5C856C' : '#4C6E58'} />
            <Text className="font-outfit-bold text-2xl text-text-primary mt-2">
              {isVerifyingOtp ? 'Verify Your Email' : 'Create Your Account'}
            </Text>
            <Text className="font-inter text-xs text-text-muted text-center mt-1 max-w-[280px]">
              {isVerifyingOtp
                ? 'Verify your account using the 6-digit OTP code sent to your email.'
                : 'Lock in your biometrics plan, localized recipes, and start tracking your health.'}
            </Text>
          </View>

          {error ? (
            <View className="bg-[#FFF2EE] dark:bg-[#2C1A16] border border-[#FBD5D5] dark:border-[#52251D] p-4 rounded-2xl mb-4">
              <Text className="text-xs font-inter-semibold text-nutrient-calories text-center">
                {error}
              </Text>
            </View>
          ) : null}

          {info ? (
            <View className="bg-accent-mint border border-[#C3D9B6] dark:border-[#243E2C] p-4 rounded-2xl mb-4">
              <Text className="text-xs font-inter-semibold text-accent-sage text-center">
                {info}
              </Text>
            </View>
          ) : null}

          {!isVerifyingOtp ? (
            <>
              {/* Registration Form */}
              <View className="gap-4 mb-6">
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="font-outfit-semibold text-xs text-text-primary mb-1.5">
                      First Name
                    </Text>
                    <TextInput
                      className="bg-bg-card border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-sm"
                      placeholder="e.g., Jane"
                      placeholderTextColor="#9CA19E"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-outfit-semibold text-xs text-text-primary mb-1.5">
                      Last Name
                    </Text>
                    <TextInput
                      className="bg-bg-card border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-sm"
                      placeholder="e.g., Doe"
                      placeholderTextColor="#9CA19E"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View>
                  <Text className="font-outfit-semibold text-xs text-text-primary mb-1.5">
                    Email Address
                  </Text>
                  <TextInput
                    className="bg-bg-card border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-sm"
                    placeholder="name@example.com"
                    placeholderTextColor="#9CA19E"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View>
                  <Text className="font-outfit-semibold text-xs text-text-primary mb-1.5">
                    Password
                  </Text>
                  <TextInput
                    className="bg-bg-card border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-sm"
                    placeholder="••••••••"
                    placeholderTextColor="#9CA19E"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              {/* Submit Sign Up */}
              <PresstoButton
                disabled={isAuthLoading}
                onPress={handleSignUp}
                className="bg-accent-sage rounded-2xl py-4 items-center justify-center mb-6"
              >
                {isAuthLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white font-outfit-bold text-sm">Create Account</Text>
                )}
              </PresstoButton>

              <PresstoButton
                onPress={() => router.push('/sign-in')}
                className="items-center py-2"
              >
                <Text className="font-inter text-xs text-text-muted">
                  Already have an account?{' '}
                  <Text className="text-accent-sage font-inter-bold underline">
                    Sign In
                  </Text>
                </Text>
              </PresstoButton>
            </>
          ) : (
            <>
              {/* Verification OTP Form */}
              <View className="gap-4 mb-6">
                <View>
                  <Text className="font-outfit-semibold text-xs text-text-primary mb-1.5">
                    Verification Code (OTP)
                  </Text>
                  <TextInput
                    className="bg-bg-card border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-lg text-center"
                    placeholder="123456"
                    placeholderTextColor="#9CA19E"
                    keyboardType="number-pad"
                    maxLength={6}
                    style={{ letterSpacing: 4 }}
                    value={otpToken}
                    onChangeText={setOtpToken}
                  />
                </View>
              </View>

              {/* Submit Verification */}
              <PresstoButton
                disabled={isAuthLoading}
                onPress={handleVerifyOtp}
                className="bg-accent-sage rounded-2xl py-4 items-center justify-center mb-6"
              >
                {isAuthLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white font-outfit-bold text-sm">Verify Email</Text>
                )}
              </PresstoButton>

              <View className="items-center gap-4">
                <TouchableOpacity onPress={handleSignUp} disabled={isAuthLoading}>
                  <Text className="font-inter text-xs text-accent-sage font-inter-bold underline">
                    Resend Code
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsVerifyingOtp(false)}>
                  <Text className="font-inter text-xs text-text-muted">
                    Back to Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
