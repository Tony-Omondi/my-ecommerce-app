// === 📁 src/screens/SignUpScreen.tsx ===
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { register, googleLogin } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import * as AuthSession from 'expo-auth-session';
import { GOOGLE_CLIENT_ID } from '../utils/constants';

const SignUpScreen = () => {
  const navigation = useNavigation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [errors, setErrors] = useState({
    username: false,
    email: false,
    password1: false,
    password2: false,
  });

  const loadFonts = async () => {
    await Font.loadAsync({
      'NotoSans-Regular': require('../../assets/fonts/SpaceMono-Regular.ttf'),
    });
    setFontsLoaded(true);
  };

  useEffect(() => {
    loadFonts();
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

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
      validationErrors.push('Username is required.');
      isValid = false;
    } else if (username.length < 4) {
      newErrors.username = true;
      validationErrors.push('Username must be at least 4 characters.');
      isValid = false;
    }

    if (!email) {
      newErrors.email = true;
      validationErrors.push('Email is required.');
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = true;
      validationErrors.push('Please enter a valid email address.');
      isValid = false;
    }

    if (!password1) {
      newErrors.password1 = true;
      validationErrors.push('Password is required.');
      isValid = false;
    } else if (!validatePassword(password1)) {
      newErrors.password1 = true;
      validationErrors.push('Password must be at least 8 characters.');
      isValid = false;
    }

    if (password1 !== password2) {
      newErrors.password2 = true;
      validationErrors.push('Passwords do not match.');
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }

    try {
      setLoading(true);
      await register(username, email, password1, password2);
      setLoading(false);
      Alert.alert('Success', 'Account created! Check your email to verify.');
      navigation.navigate('VerifyEmail');
    } catch (err) {
      console.error(err.response?.data || err.message);
      setLoading(false);

      let errorMessages = [];

      if (err.response?.data) {
        const data = err.response.data;
        if (data.username) {
          errorMessages.push(`Username: ${data.username.join(' ')}`);
        }
        if (data.email) {
          errorMessages.push(`Email: ${data.email.join(' ')}`);
        }
        if (data.password1) {
          errorMessages.push(`Password: ${data.password1.join(' ')}`);
        }
        if (data.non_field_errors) {
          errorMessages.push(data.non_field_errors.join('\n'));
        }
      }

      if (errorMessages.length === 0) {
        errorMessages.push('Registration failed. Please check your details.');
      }

      Alert.alert('Registration Failed', errorMessages.join('\n'));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=profile email`;

      const result = await AuthSession.startAsync({ authUrl });

      if (result.type === 'success') {
        const idToken = result.params.access_token;
        const res = await googleLogin(idToken);

        await AsyncStorage.setItem('access_token', res.data.access);
        await AsyncStorage.setItem('refresh_token', res.data.refresh);
        await AsyncStorage.setItem('user_id', res.data.user.id.toString());

        setLoading(false);
        Alert.alert('Success', 'Logged in with Google!');
        navigation.replace('Profile');
      } else {
        setLoading(false);
        Alert.alert('Google Login Cancelled');
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      setLoading(false);
      Alert.alert('Google Login Failed', 'Try again.');
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
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <TextInput
        placeholder="Username"
        style={[styles.input, errors.username && styles.inputError]}
        placeholderTextColor="#9bbfaa"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          setErrors({ ...errors, username: false });
        }}
        autoCapitalize="none"
      />

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

      <TextInput
        placeholder="Password"
        style={[styles.input, errors.password1 && styles.inputError]}
        placeholderTextColor="#9bbfaa"
        secureTextEntry
        value={password1}
        onChangeText={(text) => {
          setPassword1(text);
          setErrors({ ...errors, password1: false });
        }}
      />

      <TextInput
        placeholder="Confirm Password"
        style={[styles.input, errors.password2 && styles.inputError]}
        placeholderTextColor="#9bbfaa"
        secureTextEntry
        value={password2}
        onChangeText={(text) => {
          setPassword2(text);
          setErrors({ ...errors, password2: false });
        }}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#94e0b2" style={{ marginVertical: 16 }} />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <Text style={styles.buttonText}>Continue with Google</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default SignUpScreen;

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
  googleButton: {
    backgroundColor: '#2a4133',
    width: '100%',
    maxWidth: 480,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.15,
    fontFamily: 'NotoSans-Regular',
  },
});
