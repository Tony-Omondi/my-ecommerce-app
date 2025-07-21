import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { verifyPayment } from '../api/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { 
    authorizationUrl, 
    reference, 
    cartId, 
    total, 
    callbackUrl 
  } = route.params || {};

  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [webViewError, setWebViewError] = useState(null);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation for header
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
          'NotoSans-SemiBold': require('../../assets/fonts/NotoSans-Regular.ttf'),
          'NotoSans-Bold': require('../../assets/fonts/NotoSans-Regular.ttf'),
        });
        
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        setFontsLoaded(true);
        setWebViewVisible(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        showErrorAlert('Failed to load fonts');
        setFontsLoaded(true);
      }
    };

    loadFonts();
  }, []);

  const showErrorAlert = (message) => {
    Alert.alert(
      'Payment Error',
      message,
      [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack(),
          style: 'cancel'
        }
      ],
      { cancelable: false }
    );
  };

  const showSuccessAlert = (orderId) => {
    Alert.alert(
      '🎉 Payment Successful',
      'Your payment was processed successfully!',
      [
        { 
          text: 'Continue Shopping', 
          onPress: () => navigation.replace('Home'),
          style: 'cancel'
        },
        { 
          text: 'View Order', 
          onPress: () => navigation.replace('OrderDetail', { orderId }),
          style: 'default'
        }
      ]
    );
  };

  const handleNavigationStateChange = async (navState) => {
    const { url, loading } = navState;

    // Update progress bar based on loading state
    if (loading) {
      setProgress(0.3);
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      setProgress(1);
      setTimeout(() => setProgress(0), 500);
    }

    // Handle payment success callback
    if (isPaymentSuccessUrl(url)) {
      setWebViewVisible(false);
      
      try {
        const referenceId = extractReferenceFromUrl(url) || reference;
        if (!referenceId) throw new Error('No reference found in callback URL');
        
        const response = await verifyPayment(referenceId);
        
        if (response.data?.status === 'success') {
          showSuccessAlert(response.data.order_id);
        } else {
          showErrorAlert(response.data?.error || 'Payment failed. Please try again.');
        }
      } catch (error) {
        console.error('Payment verification failed:', error);
        showErrorAlert(error.message || 'Payment verification failed');
      }
    }
  };

  const isPaymentSuccessUrl = (url) => {
    const successPatterns = [
      'kibraconnect://payment-callback',
      'success=true',
      '/api/marketplace/payments/callback/',
      'paystack.co/success',
      'payment/success'
    ];
    return successPatterns.some(pattern => url.includes(pattern));
  };

  const extractReferenceFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('reference') || 
             urlObj.searchParams.get('transaction_id') || 
             reference;
    } catch {
      return url.split('reference=')[1]?.split('&')[0] || reference;
    }
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    
    setWebViewError(nativeEvent.description);
    setProgress(0);

    if (nativeEvent.url.includes('/api/marketplace/payments/callback/')) {
      const referenceId = extractReferenceFromUrl(nativeEvent.url);
      if (referenceId) {
        handleNavigationStateChange({ url: nativeEvent.url });
        return;
      }
    }

    showErrorAlert(nativeEvent.description || 'Failed to load payment page');
  };

  const renderLoading = () => (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.loadingText}>Securely connecting to payment gateway...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF5252" />
      </View>
      <Text style={styles.errorTitle}>Payment Failed</Text>
      <Text style={styles.errorMessage}>
        {webViewError || 'We encountered an issue processing your payment'}
      </Text>
      
      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => setWebViewVisible(true)}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Back to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!authorizationUrl || !authorizationUrl.startsWith('https')) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.invalidContainer}>
          <View style={styles.invalidIconContainer}>
            <MaterialIcons name="payment" size={64} color="#FF5252" />
          </View>
          <Text style={styles.invalidTitle}>Invalid Payment Link</Text>
          <Text style={styles.invalidMessage}>
            The payment URL provided is not valid or secure
          </Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Back to Cart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1F17" />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            transform: [{ translateY: headerTranslateY }],
            height: headerHeight 
          }
        ]}
      >
        <LinearGradient
          colors={['#0D1F17', '#1A3A2A']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <View style={styles.securityIcons}>
            <Ionicons name="lock-closed" size={18} color="#94e0b2" />
            <Ionicons 
              name="shield-checkmark" 
              size={18} 
              color="#94e0b2" 
              style={styles.securityIconSpacing} 
            />
          </View>
        </View>
      </Animated.View>

      {/* Progress Bar */}
      {progress > 0 && (
        <Animated.View 
          style={[
            styles.progressBar,
            { 
              width: SCREEN_WIDTH * progress,
              opacity: progress > 0 ? 1 : 0
            }
          ]}
        />
      )}

      {/* Payment Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>Order Total</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currency}>KSh</Text>
          <Text style={styles.summaryAmount}>{total.toLocaleString()}</Text>
        </View>
      </View>

      {/* Payment Gateway */}
      {webViewVisible ? (
        <WebView
          source={{ uri: authorizationUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleWebViewError}
          onHttpError={handleWebViewError}
          startInLoadingState={true}
          renderLoading={renderLoading}
          allowsBackForwardNavigationGestures={false}
          injectedJavaScript={`
            const meta = document.createElement('meta'); 
            meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            meta.setAttribute('name', 'viewport');
            document.getElementsByTagName('head')[0].appendChild(meta);
            true;
          `}
        />
      ) : (
        webViewError ? renderError() : renderLoading()
      )}

      {/* Footer with Security Info */}
      <View style={styles.footer}>
        <View style={styles.securityBadge}>
          <Ionicons name="lock-closed" size={16} color="#4CAF50" />
          <Text style={styles.securityText}>Secure SSL Encryption • 256-bit Security</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 12,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'NotoSans-SemiBold',
    letterSpacing: 0.5,
  },
  securityIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityIconSpacing: {
    marginLeft: 12,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#4CAF50',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 88 : 68,
    left: 0,
    zIndex: 11,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginTop: Platform.OS === 'ios' ? 80 : 60,
  },
  summaryLabel: {
    color: '#555',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
    marginRight: 4,
  },
  summaryAmount: {
    color: '#2E7D32',
    fontSize: 22,
    fontFamily: 'NotoSans-Bold',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 5,
  },
  loadingText: {
    color: '#555',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    color: '#FF5252',
    fontSize: 24,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  invalidContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  invalidIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  invalidTitle: {
    color: '#FF5252',
    fontSize: 24,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  invalidMessage: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  buttonGroup: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  actionButton: {
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'NotoSans-SemiBold',
  },
  secondaryButtonText: {
    color: '#4CAF50',
  },
  footer: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  securityBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  securityText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
    marginLeft: 6,
  },
});

export default CheckoutScreen;