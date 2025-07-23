import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getCartItems, updateCartItem, deleteCartItem } from '../api/api';

// Base URL for images (match api.ts)
const IMAGE_BASE_URL = 'http://192.168.88.85:8000'; // Use http://10.0.2.2:8000 for Android Emulator

const CartScreen = () => {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subtotal, setSubtotal] = useState(0);

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setLoading(true);
        const response = await getCartItems();
        console.log('Cart Items Response:', response.data);
        // Fix image URLs
        const fixedItems = response.data.map((item) => ({
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
        // Calculate subtotal
        const total = fixedItems.reduce(
          (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
          0
        );
        setSubtotal(total);
        setLoading(false);
      } catch (err) {
        console.error('Fetch Cart Error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError('Failed to load cart. Please try again.');
        setLoading(false);
        Alert.alert('Error', 'Failed to load cart. Please check your connection.');
      }
    };
    fetchCartItems();
  }, []);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const item = cartItems.find((item) => item.id === itemId);
      if (!item) {
        throw new Error('Cart item not found');
      }
      const availableStock = item.variant?.stock || item.product.stock;
      if (newQuantity > availableStock) {
        Alert.alert('Error', `Cannot add more. Only ${availableStock} in stock.`);
        return;
      }
      await updateCartItem(itemId, { quantity: newQuantity });
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
      // Recalculate subtotal
      const total = cartItems.reduce(
        (sum, item) =>
          sum +
          parseFloat(item.product.price) *
          (item.id === itemId ? newQuantity : item.quantity),
        0
      );
      setSubtotal(total);
    } catch (err) {
      console.error('Update Cart Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMessage =
        err.response?.data?.quantity ||
        err.response?.data?.detail ||
        'Failed to update quantity. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await deleteCartItem(itemId);
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      // Recalculate subtotal
      const total = cartItems
        .filter((item) => item.id !== itemId)
        .reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
      setSubtotal(total);
    } catch (err) {
      console.error('Delete Cart Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMessage =
        err.response?.data?.detail || 'Failed to remove item. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

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
            // Re-run fetchCartItems
            const fetchCartItems = async () => {
              try {
                const response = await getCartItems();
                const fixedItems = response.data.map((item) => ({
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
                setLoading(false);
              } catch (err) {
                console.error('Fetch Cart Error:', {
                  message: err.message,
                  response: err.response?.data,
                  status: err.response?.status,
                });
                setError('Failed to load cart. Please try again.');
                setLoading(false);
                Alert.alert('Error', 'Failed to load cart. Please check your connection.');
              }
            };
            fetchCartItems();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.product.images[0]?.image || 'https://via.placeholder.com/80' }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        <Text style={styles.itemVariant}>
          Size: {item.variant?.size || 'N/A'}, Color: {item.variant?.color || 'N/A'}
        </Text>
        <Text style={styles.itemPrice}>
          ${parseFloat(item.product.price).toFixed(2)} x {item.quantity} = $
          {(parseFloat(item.product.price) * item.quantity).toFixed(2)}
        </Text>
        <Text style={styles.itemStock}>
          {item.variant?.stock > 0 || item.product.stock > 0
            ? `${item.variant?.stock || item.product.stock} in stock`
            : 'Out of stock'}
        </Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]}
            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              item.quantity >= (item.variant?.stock || item.product.stock) &&
                styles.disabledButton,
            ]}
            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= (item.variant?.stock || item.product.stock)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <PaperProvider>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#0d0f1c" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Your cart is empty.</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.shopButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.cartList}
            />
            <View style={styles.subtotalContainer}>
              <Text style={styles.subtotalText}>
                Subtotal: ${subtotal.toFixed(2)}
              </Text>
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => navigation.navigate('Checkout')}
                disabled={cartItems.length === 0}
              >
                <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Home')}
          >
            <MaterialCommunityIcons name="home" size={24} color="#4e6e97" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Cart')}
          >
            <MaterialCommunityIcons name="cart-outline" size={24} color="#0d0f1c" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialIcons name="notifications-none" size={24} color="#4e6e97" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Profile')}
          >
            <FontAwesome name="user-o" size={20} color="#4e6e97" />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#0d0f1c',
    marginBottom: 16,
    fontFamily: 'NotoSans-Regular',
  },
  shopButton: {
    backgroundColor: '#607afb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#f8f9fc',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  cartList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
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
  itemStock: {
    fontSize: 14,
    color: '#0d0f1c',
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6e9f4',
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 18,
    color: '#0d0f1c',
    fontFamily: 'NotoSans-Regular',
  },
  quantityText: {
    fontSize: 16,
    color: '#0d0f1c',
    marginHorizontal: 12,
    fontFamily: 'NotoSans-Regular',
  },
  removeButton: {
    marginTop: 8,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#ff4d4f',
    fontFamily: 'NotoSans-Regular',
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
  checkoutButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#607afb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8f9fc',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e7ecf3',
    backgroundColor: '#f8f9fc',
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
});

export default CartScreen;