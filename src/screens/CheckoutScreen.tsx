import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getCartItems, initiatePayment, getShippingAddresses } from '../api/api';
import WebView from 'react-native-webview';

const IMAGE_BASE_URL = 'http://192.168.88.85:8000'; // Use http://10.0.2.2:8000 for Android Emulator

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [error, setError] = useState(null);

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch cart items
      const cartResponse = await getCartItems();
      const fixedItems = cartResponse.data.map((item) => ({
        ...item,
        product: {
          ...item.product,
          images: item.product.images?.map((img) => ({
            ...img,
            image: img.image.startsWith('/media')
              ? `${IMAGE_BASE_URL}${img.image}`
              : img.image,
          })) || [],
        },
      }));
      setCartItems(fixedItems);
      const total = fixedItems.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
        0
      );
      setSubtotal(total);

      // Fetch shipping addresses
      const addressResponse = await getShippingAddresses();
      setShippingAddresses(addressResponse.data);
      const defaultAddress = addressResponse.data.find((addr) => addr.is_default);
      setSelectedAddress(defaultAddress || addressResponse.data[0] || null);

      setLoading(false);
    } catch (err) {
      console.error('Checkout Fetch Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError('Failed to load checkout data. Please try again.');
      setLoading(false);
      Alert.alert('Error', 'Failed to load checkout data. Please check your connection.');
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data when navigating back to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleInitiatePayment = async () => {
    if (!cartItems.length) {
      Alert.alert('Error', 'Your cart is empty. Add items to proceed.');
      return;
    }
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a shipping address.');
      return;
    }
    try {
      setPaymentLoading(true);
      const response = await initiatePayment({ shipping_address_id: selectedAddress.id });
      if (response.authorization_url) {
        setPaymentUrl(response.authorization_url);
      } else {
        throw new Error(response.message || 'Payment initialization failed.');
      }
    } catch (err) {
      const errorMessage = err.detail || err.message || 'Failed to initiate payment. Please try again.';
      console.error('Payment Initiation Error:', {
        message: err.message,
        detail: err.detail,
        response: err.response?.data,
        status: err.response?.status,
      });
      Alert.alert('Error', errorMessage);
      setPaymentLoading(false);
    }
  };

  const handleWebViewNavigation = (navState) => {
    const { url } = navState;
    if (url.includes('/api/orders/payment/callback/')) {
      const reference = new URL(url).searchParams.get('reference');
      if (reference) {
        navigation.navigate('OrderConfirmation', { reference });
        setPaymentUrl(null);
      }
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Text style={styles.itemName}>{item.product.name}</Text>
      <Text style={styles.itemVariant}>
        Size: {item.variant?.size || 'N/A'}, Color: {item.variant?.color || 'N/A'}
      </Text>
      <Text style={styles.itemPrice}>
        ${parseFloat(item.product.price).toFixed(2)} x {item.quantity} = $
        {(parseFloat(item.product.price) * item.quantity).toFixed(2)}
      </Text>
    </View>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#607afb" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchData();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (paymentUrl) {
    return (
      <WebView
        source={{ uri: paymentUrl }}
        style={styles.webview}
        onNavigationStateChange={handleWebViewNavigation}
        startInLoadingState
        scalesPageToFit
      />
    );
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#0d0f1c" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.scrollContainer}>
          {/* Order Summary */}
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.cartList}
          />

          {/* Shipping Address */}
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          {shippingAddresses.length === 0 ? (
            <View style={styles.emptyAddressContainer}>
              <Text style={styles.emptyText}>No addresses found.</Text>
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => navigation.navigate('AddShippingAddress')}
              >
                <Text style={styles.addAddressButtonText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressContainer}>
              {selectedAddress ? (
                <View style={styles.selectedAddressCard}>
                  <Text style={styles.addressTitle}>
                    {selectedAddress.title} {selectedAddress.is_default && '(Default)'}
                  </Text>
                  <Text style={styles.addressText}>
                    {selectedAddress.street_address}, {selectedAddress.city}
                  </Text>
                  <Text style={styles.addressText}>
                    {selectedAddress.county} {selectedAddress.postal_code}
                  </Text>
                  <Text style={styles.addressText}>
                    Phone: {selectedAddress.phone_number}
                  </Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>No address selected</Text>
              )}
              <TouchableOpacity
                style={styles.changeAddressButton}
                onPress={() => navigation.navigate('AddShippingAddress')}
              >
                <Text style={styles.changeAddressButtonText}>
                  {selectedAddress ? 'Change Address' : 'Select Address'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Subtotal and Pay Button */}
          <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalText}>Subtotal: ${subtotal.toFixed(2)}</Text>
            <TouchableOpacity
              style={[styles.payButton, paymentLoading && styles.disabledButton]}
              onPress={handleInitiatePayment}
              disabled={paymentLoading || !selectedAddress}
            >
              {paymentLoading ? (
                <ActivityIndicator size="small" color="#f8f9fc" />
              ) : (
                <Text style={styles.payButtonText}>Pay Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Home')}
          >
            <MaterialCommunityIcons name="home-outline" size={24} color="#47569e" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Cart')}
          >
            <MaterialCommunityIcons name="cart-outline" size={24} color="#47569e" />
            <Text style={styles.navText}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialIcons name="notifications-none" size={24} color="#47569e" />
            <Text style={styles.navText}>Notification</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <FontAwesome name="user" size={20} color="#0d0f1c" />
            <Text style={[styles.navText, { color: '#0d0f1c' }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  scrollContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'NotoSans-Regular',
  },
  retryButton: {
    backgroundColor: '#607afb',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#f8f9fc',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f8f9fc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d0f1c',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  headerPlaceholder: {
    width: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d0f1c',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  cartList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cartItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e9f4',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d0f1c',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  itemVariant: {
    fontSize: 14,
    color: '#47569e',
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
  itemPrice: {
    fontSize: 14,
    color: '#0d0f1c',
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
  addressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  selectedAddressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#607afb',
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d0f1c',
    marginBottom: 4,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  addressText: {
    fontSize: 14,
    color: '#47569e',
    marginBottom: 2,
    fontFamily: 'NotoSans-Regular',
  },
  changeAddressButton: {
    backgroundColor: '#607afb',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  changeAddressButtonText: {
    color: '#f8f9fc',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  emptyAddressContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#47569e',
    marginBottom: 16,
    fontFamily: 'NotoSans-Regular',
  },
  addAddressButton: {
    backgroundColor: '#607afb',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  addAddressButtonText: {
    color: '#f8f9fc',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  subtotalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fc',
    borderTopWidth: 1,
    borderTopColor: '#e6e9f4',
  },
  subtotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d0f1c',
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  payButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#607afb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8f9fc',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  disabledButton: {
    backgroundColor: '#a0b4ff',
    opacity: 0.7,
  },
  webview: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e6e9f4',
    backgroundColor: '#f8f9fc',
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#47569e',
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
});

export default CheckoutScreen;