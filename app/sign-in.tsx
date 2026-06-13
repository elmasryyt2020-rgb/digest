import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
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
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const setProfile = useDiaryStore((state) => state.setProfile);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const success = await signIn(email.trim());
      if (success) {
        // Mark as onboarded and sync biometrics
        setProfile({ onboarded: true });
        router.replace('/(tabs)');
      } else {
        setError('Sign in failed. Please check your credentials.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred during sign in.');
    }
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
            <Text className="font-outfit-bold text-2xl text-text-primary mt-2">
              Sign In to digest
            </Text>
            <Text className="font-inter text-xs text-text-muted text-center mt-1 max-w-[280px]">
              Access your daily health logs, custom AI recipes, and nutrient reports.
            </Text>
          </View>

          {error ? (
            <View className="bg-[#FFF2EE] border border-[#FBD5D5] p-4 rounded-2xl mb-4">
              <Text className="text-xs font-inter-semibold text-nutrient-calories text-center">
                {error}
              </Text>
            </View>
          ) : null}

          {/* Form */}
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

          {/* Submit */}
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

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-[1px] bg-[#EAECEB]" />
            <Text className="font-inter-semibold text-[10px] text-text-muted px-3 uppercase tracking-wider">
              Or continue with
            </Text>
            <View className="flex-1 h-[1px] bg-[#EAECEB]" />
          </View>

          {/* Social login buttons */}
          <View className="flex-row gap-4 mb-6">
            <TouchableOpacity className="flex-1 flex-row items-center justify-center p-3 border border-border-muted rounded-2xl bg-white">
              <Ionicons name="logo-google" size={18} color="#1A1E1C" />
              <Text className="font-outfit-bold text-xs text-text-primary ml-2">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 flex-row items-center justify-center p-3 border border-border-muted rounded-2xl bg-white">
              <Ionicons name="logo-apple" size={18} color="#1A1E1C" />
              <Text className="font-outfit-bold text-xs text-text-primary ml-2">Apple</Text>
            </TouchableOpacity>
          </View>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
