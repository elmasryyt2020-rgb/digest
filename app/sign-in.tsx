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

import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PresstoButton } from '@/components/PresstoButton';

export default function SignInScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset);
  const verifyResetOtp = useAuthStore((state) => state.verifyResetOtp);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const setProfile = useDiaryStore((state) => state.setProfile);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: request reset, 2: verify reset & set new pass
  
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSignIn = async () => {
    setError('');
    setInfo('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const success = await signIn(email.trim(), password.trim());
      if (success) {
        setProfile({ onboarded: true });
        router.replace('/(tabs)');
      } else {
        setError('Sign in failed. Please check your credentials.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred during sign in.');
    }
  };

  const handleSendReset = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      const success = await sendPasswordReset(email.trim());
      if (success) {
        setInfo('A password reset code has been sent to your email.');
        setForgotStep(2);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to send reset email.');
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setInfo('');
    if (!otpToken.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const verified = await verifyResetOtp(email.trim(), otpToken.trim());
      if (verified) {
        const success = await updatePassword(password.trim());
        if (success) {
          setInfo('Password successfully updated! You are now logged in.');
          setProfile({ onboarded: true });
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 1500);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Password reset failed.');
    }
  };

  const handleBackToSignIn = () => {
    setError('');
    setInfo('');
    setIsForgotPassword(false);
    setForgotStep(1);
    setPassword('');
    setOtpToken('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>
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
            <Ionicons name="heart" size={40} color="#4C6E58" />
            <Text className="font-outfit-bold text-2xl text-text-primary mt-2 text-center">
              {isForgotPassword
                ? (forgotStep === 1 ? 'Reset Your Password' : 'Enter New Password')
                : 'Sign In to digest'}
            </Text>
            <Text className="font-inter text-xs text-text-muted text-center mt-1 max-w-[280px]">
              {isForgotPassword
                ? (forgotStep === 1
                    ? 'Enter your email address and we will send you a verification code.'
                    : 'Enter the code sent to your email and choose a new secure password.')
                : 'Access your daily health logs, custom AI recipes, and nutrient reports.'}
            </Text>
          </View>

          {error ? (
            <View className="bg-[#FFF2EE] border border-[#FBD5D5] p-4 rounded-2xl mb-4">
              <Text className="text-xs font-inter-semibold text-nutrient-calories text-center">
                {error}
              </Text>
            </View>
          ) : null}

          {info ? (
            <View className="bg-accent-mint border border-[#C3D9B6] p-4 rounded-2xl mb-4">
              <Text className="text-xs font-inter-semibold text-accent-sage text-center">
                {info}
              </Text>
            </View>
          ) : null}

          {/* Form Flows */}
          {!isForgotPassword ? (
            <>
              {/* Sign In Form */}
              <View className="gap-4 mb-6">
                <View>
                  <Text className="font-outfit-semibold text-xs text-text-primary mb-1.5">
                    Email Address
                  </Text>
                  <TextInput
                    className="bg-white border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-sm"
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
                    className="bg-white border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-sm"
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

              {/* Forgot Password Link */}
              <TouchableOpacity
                onPress={() => setIsForgotPassword(true)}
                className="self-end mb-6"
              >
                <Text className="font-inter-medium text-xs text-accent-sage underline">
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Submit Sign In */}
              <PresstoButton
                disabled={isAuthLoading}
                onPress={handleSignIn}
                className="bg-accent-sage rounded-2xl py-4 items-center justify-center mb-6"
              >
                {isAuthLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white font-outfit-bold text-sm">Sign In</Text>
                )}
              </PresstoButton>

              <PresstoButton
                onPress={() => router.push('/sign-up')}
                className="items-center py-2"
              >
                <Text className="font-inter text-xs text-text-muted">
                  Don't have an account?{' '}
                  <Text className="text-accent-sage font-inter-bold underline">
                    Sign Up
                  </Text>
                </Text>
              </PresstoButton>
            </>
          ) : (
            <>
              {/* Forgot Password Form */}
              <View className="gap-4 mb-6">
                <View>
                  <Text className="font-outfit-semibold text-xs text-text-primary mb-1.5">
                    Email Address
                  </Text>
                  <TextInput
                    className="bg-white border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-sm"
                    placeholder="name@example.com"
                    placeholderTextColor="#9CA19E"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    editable={forgotStep === 1}
                  />
                </View>

                {forgotStep === 2 && (
                  <>
                    <View>
                      <Text className="font-outfit-semibold text-xs text-text-primary mb-1.5">
                        Verification Code (OTP)
                      </Text>
                      <TextInput
                        className="bg-white border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-lg text-center"
                        placeholder="123456"
                        placeholderTextColor="#9CA19E"
                        keyboardType="number-pad"
                        maxLength={6}
                        style={{ letterSpacing: 4 }}
                        value={otpToken}
                        onChangeText={setOtpToken}
                      />
                    </View>

                    <View>
                      <Text className="font-outfit-semibold text-xs text-text-primary mb-1.5">
                        New Password
                      </Text>
                      <TextInput
                        className="bg-white border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-sm"
                        placeholder="••••••••"
                        placeholderTextColor="#9CA19E"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* Submit Action */}
              <PresstoButton
                disabled={isAuthLoading}
                onPress={forgotStep === 1 ? handleSendReset : handleResetPassword}
                className="bg-accent-sage rounded-2xl py-4 items-center justify-center mb-6"
              >
                {isAuthLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white font-outfit-bold text-sm">
                    {forgotStep === 1 ? 'Send Reset Code' : 'Update Password'}
                  </Text>
                )}
              </PresstoButton>

              <TouchableOpacity
                onPress={handleBackToSignIn}
                className="items-center py-2"
              >
                <Text className="font-inter text-xs text-text-muted underline">
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
