import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Font from 'expo-font';
import { verifyEmail, resendVerificationCode } from '../api/api';

const VerifyEmailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'NotoSans-Regular': require('../../assets/fonts/SpaceMono-Regular.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  const handleVerifyEmail = async () => {
    if (!email) {
      setError('Email is required. Please go back and try again.');
      Alert.alert('Error', 'Email is required. Please go back and try again.');
      return;
    }
    if (!code) {
      setError('Verification code is required');
      Alert.alert('Error', 'Verification code is required');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyEmail({ email, code });
      console.log('Verify Email Response:', res);
      setLoading(false);
      Alert.alert('Success', res.message || 'Email verified successfully!');
      navigation.navigate('Login');
    } catch (err) {
      setLoading(false);
      console.error('Verify Email Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      let errorMessage = 'Verification failed. Please check the code.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data) {
        errorMessage = Object.values(err.response.data).flat().join(' ');
      } else if (err.detail) {
        errorMessage = err.detail;
      }
      setError(errorMessage);
      Alert.alert('Verification Failed', errorMessage);
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
      console.log('Resend Code Response:', res);
      setLoading(false);
      Alert.alert('Success', res.message || 'A new code has been sent to your email.');
    } catch (err) {
      setLoading(false);
      console.error('Resend Code Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      let errorMessage = 'Could not resend verification code. Try again.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data) {
        errorMessage = Object.values(err.response.data).flat().join(' ');
      }
      Alert.alert('Error', errorMessage);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#94e0b2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.instruction}>
        Please enter the verification code sent to {email || 'your email'}.
      </Text>

      <TextInput
        placeholder="Verification Code"
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#9bbfaa"
        value={code}
        onChangeText={(text) => {
          setCode(text);
          setError('');
        }}
        keyboardType="numeric"
        maxLength={6}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[
          styles.button,
          (!code || loading || !email) && { opacity: 0.5 },
        ]}
        disabled={!code || loading || !email}
        onPress={handleVerifyEmail}
      >
        {loading ? (
          <ActivityIndicator color="#141f18" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={handleResendCode}
        disabled={loading || !email}
      >
        <Text style={styles.linkText}>Resend Code</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141f18',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141f18',
  },
  title: {
    color: '#94e0b2',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'NotoSans-Regular',
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'NotoSans-Regular',
  },
  input: {
    width: '100%',
    maxWidth: 480,
    height: 56,
    backgroundColor: '#2a4133',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontFamily: 'NotoSans-Regular',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4d4f',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'NotoSans-Regular',
  },
  button: {
    backgroundColor: '#94e0b2',
    width: '100%',
    maxWidth: 480,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginBottom: 12,
  },
  buttonText: {
    color: '#141f18',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.15,
    fontFamily: 'NotoSans-Regular',
  },
  linkButton: {
    marginTop: 16,
  },
  linkText: {
    color: '#94e0b2',
    fontSize: 16,
    textDecorationLine: 'underline',
    fontFamily: 'NotoSans-Regular',
  },
});

export default VerifyEmailScreen;