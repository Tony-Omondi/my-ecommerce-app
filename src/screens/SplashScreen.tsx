import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';

const SplashScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': require('../../assets/fonts/PlusJakartaSans-Bold.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(gradientAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();

    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('access_token');
      navigation.replace(token ? 'Home' : 'Login');
    };

    const timeout = setTimeout(checkLogin, 2500);
    return () => clearTimeout(timeout);
  }, [fadeAnim, scaleAnim, navigation, fontsLoaded]);

  const translateX = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 400],
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <MaskedView
          maskElement={
            <View style={styles.mask}>
              <Text 
                style={styles.maskedText}
                variant="displayMedium"
              >
                AfriMarket
              </Text>
            </View>
          }
        >
          <Animated.View style={{ transform: [{ translateX }] }}>
            <LinearGradient
              colors={['#3b82f6', '#60a5fa', '#3b82f6']} // Blue gradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            />
          </Animated.View>
        </MaskedView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 140,
    height: 140,
    marginBottom: 32,
    backgroundColor: '#1e293b', // Dark blue container
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    elevation: 8,
    shadowColor: '#3b82f6', // Blue shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  maskedText: {
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 1.5,
    color: '#ffffff', // White text
    textAlign: 'center',
  },
  mask: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: 1000,
    height: 56,
  },
});

export default SplashScreen;