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
import { MaterialIcons } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getCartItems, initiatePayment, getShippingAddresses } from '../api/api';
import WebView from 'react-native-webview';

// Base URL for images
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
      const defaultAddress = addressResponse.data.find((addr) => addr.current_address);
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
  }, []);

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
      if (response.status && response.authorization_url) {
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
        stack: err.stack,
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

  const renderAddressItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.addressItem, selectedAddress?.id === item.id && styles.selectedAddress]}
      onPress={() => setSelectedAddress(item)}
    >
      <Text style={styles.addressText}>
        {item.address}, {item.city}, {item.country}
      </Text>
      {item.current_address && <Text style={styles.defaultText}>Default</Text>}
    </TouchableOpacity>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
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

        {/* Cart Items */}
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
              onPress={() => navigation.navigate('AddAddress')}
            >
              <Text style={styles.addAddressButtonText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={shippingAddresses}
            renderItem={renderAddressItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.addressList}
          />
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
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
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
    color: '#ff4d4f',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'NotoSans-Regular',
  },
  retryButton: {
    backgroundColor: '#607afb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#f8f9fc',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'NotoSans-Regular',
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
    paddingVertical: 8,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  cartList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d0f1c',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  itemVariant: {
    fontSize: 14,
    color: '#0d0f1c',
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
  itemPrice: {
    fontSize: 14,
    color: '#0d0f1c',
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
  addressList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  addressItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  selectedAddress: {
    borderWidth: 2,
    borderColor: '#607afb',
  },
  addressText: {
    fontSize: 14,
    color: '#0d0f1c',
    fontFamily: 'NotoSans-Regular',
  },
  defaultText: {
    fontSize: 12,
    color: '#607afb',
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
  emptyAddressContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#0d0f1c',
    marginBottom: 16,
    fontFamily: 'NotoSans-Regular',
  },
  addAddressButton: {
    backgroundColor: '#607afb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addAddressButtonText: {
    color: '#f8f9fc',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  subtotalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fc',
    borderTopWidth: 1,
    borderTopColor: '#e7ecf3',
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
    borderRadius: 12,
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
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  webview: {
    flex: 1,
  },
});

export default CheckoutScreen;