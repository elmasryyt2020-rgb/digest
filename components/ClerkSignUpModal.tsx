import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PresstoButton } from './PresstoButton';

export function ClerkSignUpModal() {
  const isOpen = useDiaryStore((state) => state.isSignUpModalOpen);
  const setOpen = useDiaryStore((state) => state.setSignUpModalOpen);
  
  const signUp = useAuthStore((state) => state.signUp);
  const signIn = useAuthStore((state) => state.signIn);
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setOpen(false);
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!email || !password || (isSignUp && !name)) {
      setError(useDiaryStore.getState().profile?.language === 'ar' 
        ? 'يرجى ملء جميع الحقول المطلوبة.' 
        : 'Please fill in all required fields.');
      return;
    }

    try {
      let success = false;
      if (isSignUp) {
        success = await signUp(email, name);
      } else {
        success = await signIn(email);
      }

      if (success) {
        handleClose();
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred during authentication.');
    }
  };

  const language = useDiaryStore((state) => state.profile?.language) || 'ar';
  const isRtl = language === 'ar';

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Click outside to close */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose} 
        />

        {/* Modal Sheet Container */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.sheet}>
            {/* Grab Handle Indicator */}
            <View style={styles.handle} />

            {/* Header */}
            <Text style={styles.title}>
              {isSignUp 
                ? (isRtl ? 'أنشئ حسابك المجاني' : 'Create Your Free Account')
                : (isRtl ? 'تسجيل الدخول' : 'Sign In')}
            </Text>
            <Text style={styles.subtitle}>
              {isRtl 
                ? 'احفظ سجلاتك الصحية اليومية وافتح ميزات التصدير والوصفات المدعومة بالذكاء الاصطناعي.'
                : 'Save your daily health history, unlock PDF reports, and generate custom AI recipes.'}
            </Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.form}>
              {isSignUp && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign: isRtl ? 'right' : 'left' }]}>
                    {isRtl ? 'الاسم بالكامل' : 'Full Name'}
                  </Text>
                  <TextInput
                    style={[styles.input, { textAlign: isRtl ? 'right' : 'left' }]}
                    placeholder={isRtl ? 'مثال: أحمد محمد' : 'e.g., John Doe'}
                    placeholderTextColor="#9CA19E"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign: isRtl ? 'right' : 'left' }]}>
                  {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: isRtl ? 'right' : 'left' }]}
                  placeholder={isRtl ? 'name@example.com' : 'name@example.com'}
                  placeholderTextColor="#9CA19E"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign: isRtl ? 'right' : 'left' }]}>
                  {isRtl ? 'كلمة المرور' : 'Password'}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: isRtl ? 'right' : 'left' }]}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA19E"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Submit Button */}
              <PresstoButton 
                onPress={handleSubmit} 
                disabled={isAuthLoading}
                style={[styles.submitBtn, { backgroundColor: '#4C6E58' }]}
              >
                {isAuthLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>
                    {isSignUp 
                      ? (isRtl ? 'ابدأ الاستخدام مجاناً' : 'Get Started Free')
                      : (isRtl ? 'تسجيل دخول' : 'Sign In')}
                  </Text>
                )}
              </PresstoButton>

              {/* Toggle Form Mode */}
              <TouchableOpacity
                onPress={() => {
                  setError('');
                  setIsSignUp(!isSignUp);
                }}
                style={styles.toggleLink}
              >
                <Text style={styles.toggleText}>
                  {isSignUp
                    ? (isRtl ? 'لديك حساب بالفعل؟ سجل دخولك' : 'Already have an account? Sign In')
                    : (isRtl ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' : "Don't have an account? Sign Up")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(26, 30, 28, 0.45)', // Tinted forest background mask
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  keyboardAvoid: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#F8F9F8',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    borderWidth: 1,
    borderColor: '#EAECEB',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#EAECEB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#1A1E1C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#626A66',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  errorBox: {
    backgroundColor: '#FDE8E8',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FBD5D5',
  },
  errorText: {
    color: '#E58C73', // Terracotta warning color
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    color: '#1A1E1C',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECEB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14,
    color: '#1A1E1C',
    fontFamily: 'Inter-Regular',
  },
  submitBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#4C6E58',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
  },
  toggleLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#4C6E58',
  },
});
