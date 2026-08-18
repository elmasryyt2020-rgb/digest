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
import { useColorScheme } from 'nativewind';

type ModalMode = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';

export function SupabaseSignUpModal() {
  const isOpen = useDiaryStore((state) => state.isSignUpModalOpen);
  const setOpen = useDiaryStore((state) => state.setSignUpModalOpen);
  const language = useDiaryStore((state) => state.profile?.language) || 'ar';
  const isRtl = language === 'ar';
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const signUp = useAuthStore((state) => state.signUp);
  const signIn = useAuthStore((state) => state.signIn);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset);
  const verifyResetOtp = useAuthStore((state) => state.verifyResetOtp);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  const [mode, setMode] = useState<ModalMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleClose = () => {
    setError('');
    setInfo('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setOtpToken('');
    setMode('signup');
    setOpen(false);
  };

  const handleSignIn = async () => {
    setError('');
    setInfo('');
    if (!email.trim() || !password.trim()) {
      setError(isRtl ? 'يرجى ملء جميع الحقول.' : 'Please fill in all fields.');
      return;
    }
    try {
      const success = await signIn(email.trim(), password.trim());
      if (success) {
        handleClose();
      } else {
        setError(isRtl ? 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.' : 'Sign in failed. Please check your credentials.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred.');
    }
  };

  const handleSignUp = async () => {
    setError('');
    setInfo('');
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError(isRtl ? 'يرجى ملء جميع الحقول.' : 'Please fill in all fields.');
      return;
    }
    try {
      const success = await signUp(email.trim(), password.trim(), firstName.trim(), lastName.trim());
      if (success) {
        handleClose();
      } else {
        setError(isRtl ? 'فشل إنشاء الحساب.' : 'Sign up failed.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setInfo('');
    if (!otpToken.trim()) {
      setError(isRtl ? 'يرجى إدخال رمز التحقق.' : 'Please enter the verification code.');
      return;
    }
    try {
      const success = await verifyOtp(email.trim(), otpToken.trim());
      if (success) {
        handleClose();
      } else {
        setError(isRtl ? 'رمز التحقق غير صالح.' : 'Invalid verification code.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred.');
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError(isRtl ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email.');
      return;
    }
    try {
      const success = await sendPasswordReset(email.trim());
      if (success) {
        setInfo(isRtl ? 'تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني.' : 'Reset code sent to your email.');
        setMode('reset');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred.');
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setInfo('');
    if (!otpToken.trim() || !password.trim()) {
      setError(isRtl ? 'يرجى ملء جميع الحقول.' : 'Please fill in all fields.');
      return;
    }
    try {
      const verified = await verifyResetOtp(email.trim(), otpToken.trim());
      if (verified) {
        const success = await updatePassword(password.trim());
        if (success) {
          setInfo(isRtl ? 'تم تحديث كلمة المرور بنجاح. تم تسجيل دخولك.' : 'Password updated successfully. You are signed in.');
          handleClose();
        }
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred.');
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose} 
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={[styles.sheet, { backgroundColor: isDark ? '#161B18' : '#F8F9F8', borderColor: isDark ? '#242C28' : '#EAECEB' }]}>
            <View style={[styles.handle, { backgroundColor: isDark ? '#242C28' : '#EAECEB' }]} />

            {/* Title & Subtitle based on mode */}
            <Text style={[styles.title, { color: isDark ? '#ECF1EE' : '#1A1E1C' }]}>
              {mode === 'signup' && (isRtl ? 'أنشئ حسابك المجاني' : 'Create Your Free Account')}
              {mode === 'signin' && (isRtl ? 'تسجيل الدخول' : 'Sign In')}
              {mode === 'verify' && (isRtl ? 'تأكيد الحساب' : 'Verify Email')}
              {mode === 'forgot' && (isRtl ? 'نسيت كلمة المرور' : 'Forgot Password')}
              {mode === 'reset' && (isRtl ? 'تعيين كلمة المرور الجديدة' : 'Reset Password')}
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#8A9690' : '#626A66' }]}>
              {mode === 'signup' && (isRtl ? 'احفظ سجلاتك الصحية اليومية سحابياً ومزامنتها عبر جميع أجهزتك.' : 'Save your daily health history to the cloud and sync it across all your devices.')}
              {mode === 'signin' && (isRtl ? 'مرحبًا بك مجددًا! يرجى تسجيل الدخول لمتابعة تقدمك.' : 'Welcome back! Please sign in to resume your progress.')}
              {mode === 'verify' && (isRtl ? 'يرجى إدخال الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني.' : 'Please enter the 6-digit code sent to your email address.')}
              {mode === 'forgot' && (isRtl ? 'أدخل بريدك الإلكتروني لتلقي رمز التحقق لإعادة تعيين كلمة المرور.' : 'Enter your email to receive a password reset verification code.')}
              {mode === 'reset' && (isRtl ? 'أدخل الرمز المرسل وكلمة المرور الجديدة لتحديث حسابك.' : 'Enter the sent code and your new password to update your account.')}
            </Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Info Message */}
            {info ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{info}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              {/* Sign Up Mode Fields */}
              {mode === 'signup' && (
                <>
                  <View style={styles.row}>
                    <View style={styles.col}>
                      <Text style={[styles.label, { textAlign: isRtl ? 'right' : 'left', color: isDark ? '#ECF1EE' : '#1A1E1C' }]}>
                        {isRtl ? 'الاسم الأول' : 'First Name'}
                      </Text>
                      <TextInput
                        style={[styles.input, { textAlign: isRtl ? 'right' : 'left', backgroundColor: isDark ? '#101412' : '#FFFFFF', borderColor: isDark ? '#242C28' : '#EAECEB', color: isDark ? '#ECF1EE' : '#1A1E1C' }]}
                        placeholder={isRtl ? 'أحمد' : 'John'}
                        placeholderTextColor="#9CA19E"
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="words"
                      />
                    </View>
                    <View style={styles.col}>
                      <Text style={[styles.label, { textAlign: isRtl ? 'right' : 'left', color: isDark ? '#ECF1EE' : '#1A1E1C' }]}>
                        {isRtl ? 'اسم العائلة' : 'Last Name'}
                      </Text>
                      <TextInput
                        style={[styles.input, { textAlign: isRtl ? 'right' : 'left', backgroundColor: isDark ? '#101412' : '#FFFFFF', borderColor: isDark ? '#242C28' : '#EAECEB', color: isDark ? '#ECF1EE' : '#1A1E1C' }]}
                        placeholder={isRtl ? 'محمد' : 'Doe'}
                        placeholderTextColor="#9CA19E"
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Email (for signup, signin, forgot, reset) */}
              {(mode === 'signup' || mode === 'signin' || mode === 'forgot' || mode === 'reset') && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign: isRtl ? 'right' : 'left', color: isDark ? '#ECF1EE' : '#1A1E1C' }]}>
                    {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                  </Text>
                  <TextInput
                    style={[styles.input, { textAlign: isRtl ? 'right' : 'left', backgroundColor: isDark ? '#101412' : '#FFFFFF', borderColor: isDark ? '#242C28' : '#EAECEB', color: isDark ? '#ECF1EE' : '#1A1E1C' }]}
                    placeholder="name@example.com"
                    placeholderTextColor="#9CA19E"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={mode !== 'reset'}
                  />
                </View>
              )}

              {/* Password (for signup, signin, reset) */}
              {(mode === 'signup' || mode === 'signin' || mode === 'reset') && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign: isRtl ? 'right' : 'left', color: isDark ? '#ECF1EE' : '#1A1E1C' }]}>
                    {mode === 'reset' ? (isRtl ? 'كلمة المرور الجديدة' : 'New Password') : (isRtl ? 'كلمة المرور' : 'Password')}
                  </Text>
                  <TextInput
                    style={[styles.input, { textAlign: isRtl ? 'right' : 'left', backgroundColor: isDark ? '#101412' : '#FFFFFF', borderColor: isDark ? '#242C28' : '#EAECEB', color: isDark ? '#ECF1EE' : '#1A1E1C' }]}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA19E"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              {/* Verification Code / OTP (for verify, reset) */}
              {(mode === 'verify' || mode === 'reset') && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign: isRtl ? 'right' : 'left', color: isDark ? '#ECF1EE' : '#1A1E1C' }]}>
                    {isRtl ? 'رمز التحقق (OTP)' : 'Verification Code (OTP)'}
                  </Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'center', fontSize: 18, letterSpacing: 4, backgroundColor: isDark ? '#101412' : '#FFFFFF', borderColor: isDark ? '#242C28' : '#EAECEB', color: isDark ? '#ECF1EE' : '#1A1E1C' }]}
                    placeholder="123456"
                    placeholderTextColor="#9CA19E"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otpToken}
                    onChangeText={setOtpToken}
                  />
                </View>
              )}

              {/* Submit Buttons */}
              <PresstoButton 
                onPress={() => {
                  if (mode === 'signup') handleSignUp();
                  if (mode === 'signin') handleSignIn();
                  if (mode === 'verify') handleVerifyOtp();
                  if (mode === 'forgot') handleForgotPassword();
                  if (mode === 'reset') handleResetPassword();
                }} 
                disabled={isAuthLoading}
                style={[styles.submitBtn, { backgroundColor: '#4C6E58' }]}
              >
                {isAuthLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === 'signup' && (isRtl ? 'إنشاء حساب' : 'Create Account')}
                    {mode === 'signin' && (isRtl ? 'تسجيل الدخول' : 'Sign In')}
                    {mode === 'verify' && (isRtl ? 'تأكيد الرمز' : 'Verify Code')}
                    {mode === 'forgot' && (isRtl ? 'إرسال رمز التعيين' : 'Send Reset Code')}
                    {mode === 'reset' && (isRtl ? 'تعيين كلمة المرور' : 'Update Password')}
                  </Text>
                )}
              </PresstoButton>

              {/* Links */}
              <View style={styles.linksContainer}>
                {mode === 'signin' && (
                  <TouchableOpacity onPress={() => setMode('forgot')} style={styles.toggleLink}>
                    <Text style={styles.toggleText}>
                      {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                    </Text>
                  </TouchableOpacity>
                )}

                {mode === 'signup' && (
                  <TouchableOpacity onPress={() => setMode('signin')} style={styles.toggleLink}>
                    <Text style={styles.toggleText}>
                      {isRtl ? 'لديك حساب بالفعل؟ سجل دخولك' : 'Already have an account? Sign In'}
                    </Text>
                  </TouchableOpacity>
                )}

                {mode === 'signin' && (
                  <TouchableOpacity onPress={() => setMode('signup')} style={styles.toggleLink}>
                    <Text style={styles.toggleText}>
                      {isRtl ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' : "Don't have an account? Sign Up"}
                    </Text>
                  </TouchableOpacity>
                )}

                {mode === 'verify' && (
                  <TouchableOpacity onPress={handleSignUp} disabled={isAuthLoading} style={styles.toggleLink}>
                    <Text style={styles.toggleText}>
                      {isRtl ? 'إعادة إرسال الرمز' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                )}

                {(mode === 'forgot' || mode === 'reset' || mode === 'verify') && (
                  <TouchableOpacity onPress={() => setMode('signin')} style={styles.toggleLink}>
                    <Text style={styles.toggleText}>
                      {isRtl ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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
    backgroundColor: 'rgba(26, 30, 28, 0.45)',
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
    color: '#E58C73',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#EBF5FF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D0E7FF',
  },
  infoText: {
    color: '#4C8EF2',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  col: {
    flex: 1,
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
  linksContainer: {
    marginTop: 16,
    gap: 8,
    alignItems: 'center',
  },
  toggleLink: {
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#4C6E58',
  },
});
