import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { verifyEmail, resendVerificationCode } from '../api/api';
import { MaterialIcons } from '@expo/vector-icons';

const VerifyEmailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
    'NotoSans-Bold': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  const handleVerifyEmail = async () => {
    if (!email) {
      const errorMsg = 'Email is required. Please go back and try again.';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      return;
    }
    if (!code) {
      const errorMsg = 'Verification code is required';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      return;
    }

    try {
      setLoading(true);
      const res = await verifyEmail({ email, code });
      Alert.alert('Success', res.message || 'Email verified successfully!');
      navigation.navigate('Login');
    } catch (err) {
      console.error('Verify Email Error:', err);
      const errorMessage = err.response?.data?.error || 
                         Object.values(err.response?.data || {}).flat().join('\n') || 
                         'Verification failed. Please check the code.';
      setError(errorMessage);
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Email is required. Please go back and try again.');
      return;
    }
    try {
      setLoading(true);
      const res = await resendVerificationCode({ email });
      Alert.alert('Success', res.message || 'A new code has been sent to your email.');
    } catch (err) {
      console.error('Resend Code Error:', err);
      const errorMessage = err.response?.data?.error || 
                         Object.values(err.response?.data || {}).flat().join('\n') || 
                         'Could not resend verification code. Try again.';
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
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to {'\n'}
          <Text style={styles.emailText}>{email || 'your email'}</Text>
        </Text>

        <View style={styles.inputContainer}>
          <MaterialIcons name="verified-user" size={20} color="#4e6e97" style={styles.inputIcon} />
          <TextInput
            placeholder="Enter verification code"
            placeholderTextColor="#9bbfaa"
            style={[styles.input, error && styles.inputError]}
            value={code}
            onChangeText={(text) => {
              setCode(text);
              setError('');
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, (!code || loading) && styles.disabledButton]}
          disabled={!code || loading}
          onPress={handleVerifyEmail}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Verify Email</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive a code? </Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={loading}
          >
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0e141b',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'NotoSans-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#4e6e97',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'NotoSans-Regular',
  },
  emailText: {
    fontWeight: 'bold',
    color: '#1971e5',
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
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4d4f',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'NotoSans-Regular',
  },
  primaryButton: {
    backgroundColor: '#1971e5',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'NotoSans-Regular',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  resendText: {
    color: '#4e6e97',
    fontFamily: 'NotoSans-Regular',
  },
  resendLink: {
    color: '#1971e5',
    fontWeight: 'bold',
    fontFamily: 'NotoSans-Regular',
  },
});

export default VerifyEmailScreen;