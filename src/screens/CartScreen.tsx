import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
  Easing,
  Image,
  ScrollView,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  applyCoupon,
  removeCoupon,
  getShippingAddresses,
  createShippingAddress,
  updateShippingAddress,
  initiatePayment,
} from '../api/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CartItem {
  id: number;
  product: {
    id: number;
    title: string;
    price: string;
    image?: string;
  };
  quantity: number;
  total_price: string;
}

interface Cart {
  id: number;
  items: CartItem[];
  total_price: string;
  total_price_after_coupon: string;
  coupon?: { id: number; coupon_code: string; discount_amount: string };
}

interface ShippingAddress {
  id: number;
  address: string;
  current_address: boolean;
}

const CartScreen = () => {
  const navigation = useNavigation();
  const [cart, setCart] = useState<Cart | null>(null);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1));
  const [itemRemoveAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    loadFonts();
    fetchData();
  }, []);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateItemRemove = (callback) => {
    Animated.timing(itemRemoveAnimation, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      callback();
      itemRemoveAnimation.setValue(1);
    });
  };

  const loadFonts = async () => {
    try {
      await Font.loadAsync({
        'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
        'NotoSans-SemiBold': require('../../assets/fonts/NotoSans-Regular.ttf'),
        'NotoSans-Bold': require('../../assets/fonts/NotoSans-Regular.ttf'),
      });
      setFontsLoaded(true);
    } catch (error) {
      console.error('Error loading fonts:', error);
      Alert.alert('Error', 'Failed to load fonts');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cartResponse, addressesResponse] = await Promise.all([
        getCart(),
        getShippingAddresses(),
      ]);
      setCart(cartResponse.data.length > 0 ? cartResponse.data[0] : null);
      setShippingAddresses(addressesResponse.data);
      const currentAddress = addressesResponse.data.find(addr => addr.current_address);
      setSelectedAddressId(currentAddress ? currentAddress.id : null);
    } catch (error) {
      console.error('Error fetching cart or addresses:', error);
      Alert.alert('Error', 'Failed to load cart or shipping addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId, change) => {
    if (!cart) return;
    try {
      const item = cart.items.find(i => i.id === itemId);
      if (!item) return;
      const newQuantity = item.quantity + change;
      
      if (newQuantity < 1) {
        animateItemRemove(() => handleRemoveItem(item.product.id));
        return;
      }
      
      animateButton();
      await updateCartItemQuantity(cart.id, { item_id: itemId, quantity: newQuantity });
      setCart({
        ...cart,
        items: cart.items.map(i =>
          i.id === itemId ? { ...i, quantity: newQuantity } : i
        ),
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update item quantity');
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!cart) return;
    try {
      await removeFromCart(cart.id, { product_id: productId });
      setCart({
        ...cart,
        items: cart.items.filter(item => item.product.id !== productId),
      });
      Alert.alert('Success', 'Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item from cart');
    }
  };

  const handleApplyCoupon = async () => {
    if (!cart || !cart.id || !couponCode) {
      Alert.alert('Error', 'Please enter a coupon code and ensure cart is loaded');
      return;
    }
    try {
      animateButton();
      const response = await applyCoupon(couponCode, cart.id); // Pass cart.id
      setCart(response.data);
      setCouponCode('');
      Alert.alert('Success', 'Coupon applied successfully');
    } catch (error) {
      console.error('Error applying coupon:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to apply coupon');
    }
  };

  const handleRemoveCoupon = async () => {
    if (!cart || !cart.coupon) return;
    try {
      animateButton();
      const response = await removeCoupon(cart.coupon.id);
      setCart(response.data);
      Alert.alert('Success', 'Coupon removed successfully');
    } catch (error) {
      console.error('Error removing coupon:', error);
      Alert.alert('Error', 'Failed to remove coupon');
    }
  };

  const handleSelectAddress = async (addressId) => {
    try {
      animateButton();
      await updateShippingAddress(addressId, { current_address: true });
      setShippingAddresses(
        shippingAddresses.map(addr =>
          addr.id === addressId
            ? { ...addr, current_address: true }
            : { ...addr, current_address: false }
        )
      );
      setSelectedAddressId(addressId);
      Alert.alert('Success', 'Shipping address updated');
    } catch (error) {
      console.error('Error updating address:', error);
      Alert.alert('Error', 'Failed to update shipping address');
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    if (!selectedAddressId) {
      Alert.alert('Error', 'Please select a shipping address');
      navigation.navigate('ShippingAddress', { fromCheckout: true });
      return;
    }
    try {
      animateButton();
      const selectedAddress = shippingAddresses.find(addr => addr.id === selectedAddressId)?.address;
      if (!selectedAddress) {
        Alert.alert('Error', 'Selected shipping address not found');
        return;
      }
      setLoading(true);
      const response = await initiatePayment(cart.id, { shipping_address: selectedAddress });
      console.log('Initiate payment response (full):', response.data);
      navigation.navigate('Checkout', {
        authorizationUrl: response.data.authorization_url,
        reference: response.data.reference,
        cartId: cart.id,
        total: parseFloat(cart.total_price_after_coupon),
        callbackUrl: response.data.callback_url,
      });
    } catch (error) {
      console.error('Error initiating payment:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <Animated.View 
      style={[
        styles.cartItemContainer,
        { transform: [{ scale: itemRemoveAnimation }] }
      ]}
    >
      <View style={styles.imageContainer}>
        {item.product.image ? (
          <Image 
            source={{ uri: item.product.image }} 
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={24} color="#6b8c7d" />
          </View>
        )}
      </View>
      
      <View style={styles.itemCenterSection}>
        <Text style={styles.itemTitle} numberOfLines={2} ellipsizeMode="tail">
          {item.product.title}
        </Text>
        <Text style={styles.itemPrice}>${item.product.price} each</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => handleQuantityChange(item.id, -1)}
            style={styles.quantityButton}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={16} color="#94e0b2" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => handleQuantityChange(item.id, 1)}
            style={styles.quantityButton}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color="#94e0b2" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.itemRightSection}>
        <Text style={styles.itemTotalPrice}>${item.total_price}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => animateItemRemove(() => handleRemoveItem(item.product.id))}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderShippingAddressSelector = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <Ionicons name="location-outline" size={20} color="#94e0b2" />
      </View>
      {shippingAddresses.length > 0 ? (
        <FlatList
          data={shippingAddresses}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.addressItem,
                item.id === selectedAddressId && styles.addressItemSelected,
              ]}
              onPress={() => handleSelectAddress(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={item.current_address ? "checkmark-circle" : "location-outline"} 
                size={18} 
                color={item.current_address ? "#94e0b2" : "#6b8c7d"} 
                style={styles.addressIcon}
              />
              <Text style={styles.addressText} numberOfLines={2}>
                {item.address || 'No address provided'}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.addressList}
        />
      ) : (
        <Text style={styles.emptyText}>No shipping addresses available</Text>
      )}
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          style={styles.addAddressButton}
          onPress={() => navigation.navigate('AddShippingAddress')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#94e0b2" />
          <Text style={styles.addAddressButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  const renderCouponSection = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Apply Coupon</Text>
        <Ionicons name="pricetag-outline" size={20} color="#94e0b2" />
      </View>
      <View style={styles.couponContainer}>
        <TextInput
          style={styles.couponInput}
          value={couponCode}
          onChangeText={setCouponCode}
          placeholder="Enter coupon code"
          placeholderTextColor="#6b8c7d"
        />
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.applyCouponButton}
            onPress={handleApplyCoupon}
            activeOpacity={0.8}
          >
            <Text style={styles.applyCouponButtonText}>Apply</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      {cart?.coupon && (
        <View style={styles.couponInfo}>
          <View style={styles.couponBadge}>
            <Ionicons name="pricetag" size={16} color="#94e0b2" />
            <Text style={styles.couponText}>
              {cart.coupon.coupon_code} (-${cart.coupon.discount_amount})
            </Text>
          </View>
          <TouchableOpacity 
            onPress={handleRemoveCoupon}
            style={styles.removeCouponButton}
            activeOpacity={0.8}
          >
            <Text style={styles.removeCouponText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#94e0b2" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#94e0b2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={styles.cartIconContainer}>
          <Ionicons name="cart-outline" size={22} color="#94e0b2" />
          {cart?.items && cart.items.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.items.length}</Text>
            </View>
          )}
        </View>
      </View>

      {cart && cart.items.length > 0 ? (
        <ScrollView 
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <FlatList
            data={cart.items}
            renderItem={renderCartItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.cartList}
            scrollEnabled={false}
          />
          
          {renderCouponSection()}
          {renderShippingAddressSelector()}
          
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalAmount}>${cart.total_price}</Text>
            </View>
            {cart.coupon && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={[styles.totalAmount, styles.discountText]}>
                  -${cart.coupon.discount_amount}
                </Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={[styles.totalAmount, styles.finalTotal]}>
                ${cart.total_price_after_coupon}
              </Text>
            </View>
            
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity 
                style={styles.checkoutButton} 
                onPress={handleCheckout}
                activeOpacity={0.8}
              >
                <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                <Ionicons name="arrow-forward" size={18} color="#0e1611" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyCartContainer}>
          <View style={styles.emptyCartIcon}>
            <Ionicons name="cart-outline" size={72} color="#6b8c7d" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some items to get started</Text>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity 
              style={styles.shopButton}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Text style={styles.shopButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e1611',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#122118',
    borderBottomWidth: 1,
    borderBottomColor: '#1a2a20',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    letterSpacing: 0.3,
  },
  cartIconContainer: {
    position: 'relative',
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'NotoSans-Bold',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  cartList: {
    padding: 12,
  },
  cartItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#122118',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#1a2a20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCenterSection: {
    flex: 1,
    marginRight: 8,
  },
  itemRightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'NotoSans-SemiBold',
    marginBottom: 4,
    lineHeight: 20,
  },
  itemPrice: {
    color: '#6b8c7d',
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
    marginBottom: 8,
  },
  itemTotalPrice: {
    color: '#94e0b2',
    fontSize: 14,
    fontFamily: 'NotoSans-SemiBold',
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a20',
    borderRadius: 6,
    padding: 2,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    padding: 4,
    borderRadius: 4,
  },
  quantityText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'NotoSans-SemiBold',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 6,
  },
  sectionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a2a20',
    backgroundColor: '#122118',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: 'NotoSans-Bold',
    letterSpacing: 0.3,
  },
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#1a2a20',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    fontFamily: 'NotoSans-Regular',
    borderWidth: 1,
    borderColor: '#264532',
    fontSize: 14,
  },
  applyCouponButton: {
    backgroundColor: '#94e0b2',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    shadowColor: '#94e0b2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  applyCouponButtonText: {
    color: '#0e1611',
    fontSize: 14,
    fontFamily: 'NotoSans-Bold',
  },
  couponInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#1a2a20',
    padding: 12,
    borderRadius: 8,
  },
  couponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponText: {
    color: '#94e0b2',
    fontSize: 13,
    fontFamily: 'NotoSans-SemiBold',
    marginLeft: 6,
  },
  removeCouponButton: {
    backgroundColor: '#2a1a1a',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  removeCouponText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontFamily: 'NotoSans-SemiBold',
  },
  addressList: {
    paddingBottom: 4,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a20',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    width: SCREEN_WIDTH * 0.7,
    borderWidth: 1,
    borderColor: '#264532',
  },
  addressItemSelected: {
    borderColor: '#94e0b2',
    backgroundColor: '#1a2a20',
  },
  addressIcon: {
    marginRight: 8,
  },
  addressText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'NotoSans-Regular',
    flex: 1,
    lineHeight: 18,
  },
  addAddressButton: {
    backgroundColor: '#1a2a20',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#264532',
  },
  addAddressButtonText: {
    color: '#94e0b2',
    fontSize: 14,
    fontFamily: 'NotoSans-SemiBold',
    marginLeft: 8,
  },
  totalContainer: {
    padding: 16,
    backgroundColor: '#122118',
    borderTopWidth: 1,
    borderTopColor: '#1a2a20',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    color: '#6b8c7d',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
  },
  totalAmount: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'NotoSans-SemiBold',
  },
  discountText: {
    color: '#94e0b2',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#1a2a20',
    marginVertical: 10,
  },
  finalTotal: {
    fontSize: 16,
    color: '#94e0b2',
    fontFamily: 'NotoSans-Bold',
  },
  checkoutButton: {
    backgroundColor: '#94e0b2',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#94e0b2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  checkoutButtonText: {
    color: '#0e1611',
    fontSize: 15,
    fontFamily: 'NotoSans-Bold',
    marginRight: 8,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCartIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#6b8c7d',
    fontSize: 15,
    fontFamily: 'NotoSans-Regular',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  shopButton: {
    backgroundColor: '#94e0b2',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    shadowColor: '#94e0b2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  shopButtonText: {
    color: '#0e1611',
    fontSize: 15,
    fontFamily: 'NotoSans-Bold',
  },
  emptyText: {
    color: '#6b8c7d',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0e1611',
  },
  loadingText: {
    color: '#6b8c7d',
    fontSize: 15,
    fontFamily: 'NotoSans-Regular',
    marginTop: 16,
  },
});

export default CartScreen;