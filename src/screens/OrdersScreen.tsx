import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { getOrders } from '../api/api';
import { LinearGradient } from 'expo-linear-gradient';

interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  buyer: { id: number; username: string; email: string };
  product: { id: number; title: string; price: string; image?: string };
  ordered_at: string;
  total_amount: string;
}

const OrderCard = ({ item, navigation }: { item: Order, navigation: any }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleDelete = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'processing': return '#ffc107';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
      if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        return `${Math.floor(diffInHours / 24)}d ago`;
      }
    } catch {
      return 'Just now';
    }
  };

  return (
    <Animated.View 
      style={[
        styles.orderContainer,
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }] 
        }
      ]}
    >
      <LinearGradient
        colors={['#f8f9fa', '#ffffff']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.orderIdContainer}>
            <Ionicons name="receipt" size={18} color="#6c757d" />
            <Text style={styles.orderId}>Order #{item.id}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Ionicons 
              name={
                item.status === 'completed' ? 'checkmark-circle' :
                item.status === 'processing' ? 'time' :
                item.status === 'cancelled' ? 'close-circle' : 'hourglass'
              } 
              size={14} 
              color={getStatusColor(item.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Product:</Text>
            <Text style={styles.value}>{item.product.title}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Price:</Text>
            <Text style={styles.value}>${item.product.price}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Order Info */}
        <View style={styles.section}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Ordered:</Text>
            <Text style={styles.priceValue}>{formatTime(item.ordered_at)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Buyer:</Text>
            <Text style={styles.priceValue}>{item.buyer.username}</Text>
          </View>
        </View>

        {/* Grand Total */}
        <View style={styles.grandTotalContainer}>
          <Text style={styles.grandTotalLabel}>Total:</Text>
          <Text style={styles.grandTotalValue}>${item.total_amount}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.trackButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.product.id })}
          >
            <Text style={styles.trackButtonText}>View Product</Text>
            <Ionicons name="eye" size={18} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={18} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const OrdersScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadFonts();
    fetchOrders();
  }, []);

  const loadFonts = async () => {
    try {
      await Font.loadAsync({
        'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
        'NotoSans-SemiBold': require('../../assets/fonts/NotoSans-Regular.ttf'),
      });
      setFontsLoaded(true);
    } catch (error) {
      console.error('Error loading fonts:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      // Transform the data to match our new Order interface
      const formattedOrders = response.data.map(order => ({
        ...order,
        order_number: `ORD-${order.id}`,
        status: 'completed', // Default status, adjust as needed
        total_amount: order.product.price // Using product price as total for compatibility
      }));
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <OrderCard item={item} navigation={navigation} />
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.screenLoadingContainer}>
        <ActivityIndicator size="large" color="#94e0b2" />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#94e0b2" />
        </TouchableOpacity>
        <Text style={styles.screenHeaderTitle}>Your Orders</Text>
      </View>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.screenOrderList}
        ListEmptyComponent={
          <Text style={styles.screenEmptyText}>No orders found</Text>
        }
      />
    </View>
  );
};

// Combined styles
const styles = StyleSheet.create({
  // Screen styles (original)
  screenContainer: {
    flex: 1,
    backgroundColor: '#141f18',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#122118',
    borderBottomWidth: 0.5,
    borderBottomColor: '#264532',
  },
  screenHeaderTitle: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'NotoSans-SemiBold',
    marginLeft: 10,
  },
  screenOrderList: {
    padding: 15,
  },
  screenEmptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    textAlign: 'center',
    marginTop: 20,
  },
  screenLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141f18',
  },

  // OrderCard styles (new)
  orderContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontFamily: 'NotoSans-Regular',
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'NotoSans-SemiBold',
    fontSize: 12,
    marginLeft: 5,
  },
  section: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontFamily: 'NotoSans-Regular',
    fontSize: 14,
    color: '#6c757d',
  },
  value: {
    fontFamily: 'NotoSans-SemiBold',
    fontSize: 14,
    color: '#495057',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  priceLabel: {
    fontFamily: 'NotoSans-Regular',
    fontSize: 14,
    color: '#6c757d',
  },
  priceValue: {
    fontFamily: 'NotoSans-SemiBold',
    fontSize: 14,
    color: '#495057',
  },
  grandTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  grandTotalLabel: {
    fontFamily: 'NotoSans-SemiBold',
    fontSize: 16,
    color: '#212529',
  },
  grandTotalValue: {
    fontFamily: 'NotoSans-Bold',
    fontSize: 18,
    color: '#6A11CB',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  trackButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6A11CB',
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 10,
  },
  trackButtonText: {
    fontFamily: 'NotoSans-SemiBold',
    fontSize: 14,
    color: '#ffffff',
    marginRight: 8,
  },
  deleteButton: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dc354510',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dc354520',
  },
});

export default OrdersScreen;