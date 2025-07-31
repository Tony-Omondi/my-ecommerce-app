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
import { registerUser } from '../api/api';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';

const SignUpScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: false,
    email: false,
    password1: false,
    password2: false,
  });

  const [fontsLoaded] = useFonts({
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
    'NotoSans-Bold': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 8;

  const handleRegister = async () => {
    let isValid = true;
    const newErrors = {
      username: false,
      email: false,
      password1: false,
      password2: false,
    };
    let validationErrors = [];

    if (!username) {
      newErrors.username = true;
      validationErrors.push('• Username is required');
      isValid = false;
    } else if (username.length < 4) {
      newErrors.username = true;
      validationErrors.push('• Username must be at least 4 characters');
      isValid = false;
    }

    if (!email) {
      newErrors.email = true;
      validationErrors.push('• Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = true;
      validationErrors.push('• Please enter a valid email address');
      isValid = false;
    }

    if (!password1) {
      newErrors.password1 = true;
      validationErrors.push('• Password is required');
      isValid = false;
    } else if (!validatePassword(password1)) {
      newErrors.password1 = true;
      validationErrors.push('• Password must be at least 8 characters');
      isValid = false;
    }

    if (password1 !== password2) {
      newErrors.password2 = true;
      validationErrors.push('• Passwords do not match');
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      Alert.alert('Please fix these issues:', validationErrors.join('\n'));
      return;
    }

    try {
      setLoading(true);
      const res = await registerUser({ 
        username, 
        email, 
        password: password1, 
        password2 
      });
      Alert.alert('Success', 'Account created! Please check your email to verify your account.');
      navigation.navigate('VerifyEmail', { email });
    } catch (err) {
      console.error('Registration Error:', err);
      const errorMessage = err.response?.data?.error || 
                         Object.values(err.response?.data || {}).flat().join('\n') || 
                         'Registration failed. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
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

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us to start shopping</Text>

        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={20} color="#4e6e97" style={styles.inputIcon} />
          <TextInput
            placeholder="Username (min 4 characters)"
            placeholderTextColor="#9bbfaa"
            style={[styles.input, errors.username && styles.inputError]}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setErrors({ ...errors, username: false });
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

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
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="#4e6e97" style={styles.inputIcon} />
          <TextInput
            placeholder="Password (min 8 characters)"
            placeholderTextColor="#9bbfaa"
            style={[styles.input, errors.password1 && styles.inputError]}
            secureTextEntry
            value={password1}
            onChangeText={(text) => {
              setPassword1(text);
              setErrors({ ...errors, password1: false });
            }}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock-outline" size={20} color="#4e6e97" style={styles.inputIcon} />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#9bbfaa"
            style={[styles.input, errors.password2 && styles.inputError]}
            secureTextEntry
            value={password2}
            onChangeText={(text) => {
              setPassword2(text);
              setErrors({ ...errors, password2: false });
            }}
          />
        </View>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginPrompt}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 16,
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'NotoSans-Regular',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#4e6e97',
    fontFamily: 'NotoSans-Regular',
  },
  loginLink: {
    color: '#1971e5',
    fontWeight: 'bold',
    fontFamily: 'NotoSans-Regular',
  },
});

export default SignUpScreen;