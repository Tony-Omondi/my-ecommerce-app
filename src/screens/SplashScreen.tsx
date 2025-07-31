import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import LottieView from 'lottie-react-native';

const SplashScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lottieRef = useRef(null);

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': require('../../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-Medium': require('../../assets/fonts/PlusJakartaSans-Bold.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    lottieRef.current?.play();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start(),
    ]).start();

    Animated.loop(
      Animated.timing(gradientAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    const checkLogin = async () => {
      try {
        const [token] = await Promise.all([
          AsyncStorage.getItem('access_token'),
          AsyncStorage.getItem('user_data'),
        ]);
        navigation.replace(token ? 'Home' : 'Login');
      } catch (error) {
        console.error('Auth check error:', error);
        navigation.replace('Onboarding');
      }
    };

    const timeout = setTimeout(checkLogin, 3000);
    return () => clearTimeout(timeout);
  }, [fadeAnim, scaleAnim, navigation, fontsLoaded]);

  const translateX = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 400],
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundCircles}>
        <Animated.View style={[styles.circleLarge, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.circleMedium, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.circleSmall, { opacity: fadeAnim }]} />
      </View>

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        {/* Lottie animation only */}
        <View style={styles.logoContainer}>
          <LottieView
            ref={lottieRef}
            source={require('../../assets/animations/wave.json')}
            style={styles.lottieBackground}
            loop
            autoPlay
          />
        </View>

        <View style={styles.textContainer}>
          <MaskedView
            maskElement={
              <View style={styles.mask}>
                <Text style={styles.maskedText}>AfriMarket</Text>
                <Text style={styles.subtitle}>Connecting African Markets</Text>
              </View>
            }
          >
            <Animated.View style={{ transform: [{ translateX }] }}>
              <LinearGradient
                colors={['#4F46E5', '#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              />
            </Animated.View>
          </MaskedView>
        </View>
      </Animated.View>

      <Animated.View style={[styles.loaderContainer, { opacity: fadeAnim }]}>
        <ActivityIndicator size="small" color="#4F46E5" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  backgroundCircles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circleLarge: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    top: -200,
    right: -150,
  },
  circleMedium: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    bottom: -100,
    left: -100,
  },
  circleSmall: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(30, 41, 59, 0.2)',
    top: '30%',
    left: '20%',
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 160,
    height: 160,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieBackground: {
    width: 200,
    height: 200,
  },
  textContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  maskedText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 32,
    letterSpacing: 1.5,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  mask: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: 1000,
    height: 80,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 60,
  },
});

export default SplashScreen;
