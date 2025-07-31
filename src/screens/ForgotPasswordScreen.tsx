import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { forgotPassword, resetPassword } from '../api/api';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: false,
    verificationCode: false,
    newPassword: false,
  });

  const [fontsLoaded] = useFonts({
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
    'NotoSans-Bold': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 8;

  const handleSendCode = async () => {
    if (!email || !validateEmail(email)) {
      setErrors({ ...errors, email: true });
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword({ email });
      Alert.alert('Code Sent', 'Reset code has been sent to your email!');
      setStep(2);
    } catch (err) {
      console.error('Forgot Password Error:', err);
      const errorMessage = err.response?.data?.error || 
                         Object.values(err.response?.data || {}).flat().join('\n') || 
                         'Failed to send reset code. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    let isValid = true;
    const newErrors = { verificationCode: false, newPassword: false };

    if (!verificationCode) {
      newErrors.verificationCode = true;
      Alert.alert('Missing Code', 'Verification code is required');
      isValid = false;
    }

    if (!validatePassword(newPassword)) {
      newErrors.newPassword = true;
      Alert.alert('Weak Password', 'Password must be at least 8 characters');
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword({
        email,
        verification_code: verificationCode,
        new_password: newPassword,
      });
      Alert.alert('Success', 'Password reset successfully!');
      navigation.navigate('Login');
    } catch (err) {
      console.error('Reset Password Error:', err);
      const errorMessage = err.response?.data?.error || 
                         Object.values(err.response?.data || {}).flat().join('\n') || 
                         'Failed to reset password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1971e5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          {step === 1 ? 'Reset Password' : 'Create New Password'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1 
            ? 'Enter your email to receive a verification code' 
            : 'Enter the code sent to your email and your new password'}
        </Text>

        {step === 1 ? (
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#4e6e97" style={styles.inputIcon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9bbfaa"
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: false });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#4e6e97" style={styles.inputIcon} />
              <TextInput
                placeholder="Verification Code"
                placeholderTextColor="#9bbfaa"
                style={[styles.input, errors.verificationCode && styles.inputError]}
                value={verificationCode}
                onChangeText={(text) => {
                  setVerificationCode(text);
                  setErrors({ ...errors, verificationCode: false });
                }}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="vpn-key" size={20} color="#4e6e97" style={styles.inputIcon} />
              <TextInput
                placeholder="New Password (min 8 characters)"
                placeholderTextColor="#9bbfaa"
                style={[styles.input, errors.newPassword && styles.inputError]}
                secureTextEntry
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setErrors({ ...errors, newPassword: false });
                }}
              />
            </View>
          </>
        )}

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={step === 1 ? handleSendCode : handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {step === 1 ? 'Send Verification Code' : 'Reset Password'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Back to Login</Text>
        </TouchableOpacity>

        {step === 2 && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setStep(1)}
            disabled={loading}
          >
            <Text style={styles.linkText}>Resend Verification Code</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0e141b',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'NotoSans-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#4e6e97',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'NotoSans-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e7ecf3',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#0e141b',
    fontFamily: 'NotoSans-Regular',
  },
  inputError: {
    borderColor: '#ff4d4f',
  },
  primaryButton: {
    backgroundColor: '#1971e5',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'NotoSans-Regular',
  },
  secondaryButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e7ecf3',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#1971e5',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'NotoSans-Regular',
  },
  linkButton: {
    alignSelf: 'center',
    padding: 8,
  },
  linkText: {
    color: '#4e6e97',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen;