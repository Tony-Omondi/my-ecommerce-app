import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { login } from '../api/api';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    let isValid = true;
    const newErrors = { email: false, password: false };

    if (!email) {
      newErrors.email = true;
      Alert.alert('Error', 'Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = true;
      Alert.alert('Error', 'Invalid email address');
      isValid = false;
    }

    if (!password || password.length < 8) {
      newErrors.password = true;
      Alert.alert('Error', 'Password must be at least 8 characters');
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await login({ email, password });
      await AsyncStorage.setItem('access_token', res.data.access);
      await AsyncStorage.setItem('refresh_token', res.data.refresh);
      await AsyncStorage.setItem('user_id', res.data.user.id.toString());
      Alert.alert('Success', 'Logged in successfully!');
      navigation.replace('Home');
    } catch (err) {
      console.error(err.response?.data || err.message);
      let errorMessage = 'Check your credentials';
      if (err.response?.data?.detail) errorMessage = err.response.data.detail;
      Alert.alert('Login Failed', errorMessage);
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
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

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
          placeholder="Password"
          placeholderTextColor="#9bbfaa"
          style={[styles.input, errors.password && styles.inputError]}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors({ ...errors, password: false });
          }}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signupLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginBottom: 32,
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
  button: {
    backgroundColor: '#1971e5',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'NotoSans-Regular',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    color: '#4e6e97',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#4e6e97',
    fontFamily: 'NotoSans-Regular',
  },
  signupLink: {
    color: '#1971e5',
    fontWeight: 'bold',
    fontFamily: 'NotoSans-Regular',
  },
});

export default LoginScreen;