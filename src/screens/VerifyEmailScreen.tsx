// === 📁 src/screens/VerifyEmailScreen.tsx ===
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
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import { verifyEmail, resendVerificationCode } from '../api/api';

const VerifyEmailScreen = () => {
  const navigation = useNavigation();
  const [verificationCode, setVerificationCode] = useState('');
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
    if (!verificationCode) {
      setError('Verification code is required');
      return;
    }

    try {
      setLoading(true);
      const response = await verifyEmail({
        verification_code: verificationCode,
      });
      setLoading(false);
      Alert.alert(
        'Success',
        response.data.message || 'Email verified successfully!'
      );
      navigation.navigate('Login');
    } catch (err) {
      setLoading(false);
      console.error(err.response?.data || err.message);
      let errorMessage = 'Verification failed. Please check the code.';
      const data = err.response?.data;
      if (data?.error) {
        errorMessage = data.error;
      } else if (data?.detail) {
        errorMessage = data.detail;
      } else if (typeof data === 'object') {
        errorMessage = Object.values(data).flat().join('\n');
      }
      setError(errorMessage);
      Alert.alert('Verification Failed', errorMessage);
    }
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      await resendVerificationCode();
      setLoading(false);
      Alert.alert('Success', 'A new code has been sent to your email.');
    } catch (err) {
      setLoading(false);
      console.error(err.response?.data || err.message);
      Alert.alert(
        'Error',
        'Could not resend verification code. Try again.'
      );
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
        Please enter the verification code sent to your email.
      </Text>

      <TextInput
        placeholder="Verification Code"
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#9bbfaa"
        value={verificationCode}
        onChangeText={(text) => {
          setVerificationCode(text);
          setError('');
        }}
        keyboardType="numeric"
        maxLength={6}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[
          styles.button,
          (!verificationCode || loading) && { opacity: 0.5 },
        ]}
        disabled={!verificationCode || loading}
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
        disabled={loading}
      >
        <Text style={styles.linkText}>Resend Code</Text>
      </TouchableOpacity>
    </View>
  );
};

export default VerifyEmailScreen;

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
