import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { forgotPassword, resetPassword } from '../api/api';
import * as Font from 'expo-font';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [errors, setErrors] = useState({
    email: false,
    verificationCode: false,
    newPassword: false,
  });

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'NotoSans-Regular': require('../../assets/fonts/SpaceMono-Regular.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleSendCode = async () => {
    if (!email || !validateEmail(email)) {
      setErrors({ ...errors, email: true });
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const res = await forgotPassword({ email });
      console.log('Forgot Password Response:', res.data);
      Alert.alert('Success', 'Reset code sent to your email!');
      setStep(2);
    } catch (err) {
      console.error('Forgot Password Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      let errorMessage = 'Failed to send reset code.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data) {
        errorMessage = Object.values(err.response.data).flat().join(' ');
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const handleResetPassword = async () => {
    let isValid = true;
    const newErrors = { verificationCode: false, newPassword: false };

    if (!verificationCode) {
      newErrors.verificationCode = true;
      Alert.alert('Error', 'Verification code is required');
      isValid = false;
    }

    if (!newPassword || !validatePassword(newPassword)) {
      newErrors.newPassword = true;
      Alert.alert('Error', 'Password must be at least 8 characters');
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await resetPassword({
        email,
        verification_code: verificationCode,
        new_password: newPassword,
      });
      console.log('Reset Password Response:', res.data);
      Alert.alert('Success', 'Password reset successfully!');
      navigation.navigate('Login');
    } catch (err) {
      console.error('Reset Password Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      let errorMessage = 'Failed to reset password.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data) {
        errorMessage = Object.values(err.response.data).flat().join(' ');
      }
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {step === 1 ? (
        <>
          <TextInput
            placeholder="Email"
            style={[styles.input, errors.email && styles.inputError]}
            placeholderTextColor="#9bbfaa"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors({ ...errors, email: false });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handleSendCode}>
            <Text style={styles.buttonText}>Send Reset Code</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            placeholder="Verification Code"
            style={[styles.input, errors.verificationCode && styles.inputError]}
            placeholderTextColor="#9bbfaa"
            value={verificationCode}
            onChangeText={(text) => {
              setVerificationCode(text);
              setErrors({ ...errors, verificationCode: false });
            }}
          />
          <TextInput
            placeholder="New Password"
            style={[styles.input, errors.newPassword && styles.inputError]}
            placeholderTextColor="#9bbfaa"
            secureTextEntry
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setErrors({ ...errors, newPassword: false });
            }}
          />
          <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Back to Login</Text>
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
  logo: {
    width: 160,
    height: 160,
    marginBottom: 24,
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
  },
});

export default ForgotPasswordScreen;