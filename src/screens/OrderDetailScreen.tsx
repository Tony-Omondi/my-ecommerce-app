import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import moment from 'moment';
import { PaperProvider } from 'react-native-paper';
import { useFonts } from 'expo-font';
import { getOrderDetail } from '../api/api';

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fontsLoaded] = useFonts({
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const response = await getOrderDetail(orderId);
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Order Detail Fetch Error:', err.response?.data || err);
        setError(err.response?.data?.detail || 'Failed to fetch order details');
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [orderId]);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1971e5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#0e141b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order #{order.order_id}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <Text style={styles.detailText}>Order ID: {order.order_id}</Text>
            <Text style={styles.detailText}>
              Date: {moment(order.created_at).format('MMMM D, YYYY, h:mm A')}
            </Text>
            <Text style={styles.detailText}>Total: KSh {parseFloat(order.total_amount).toFixed(2)}</Text>
            <Text style={styles.detailText}>Status: {order.status}</Text>
            <Text style={styles.detailText}>Payment Status: {order.payment_status}</Text>
          </View>

          {order.shipping_address && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
              <Text style={styles.detailText}>{order.shipping_address.address}</Text>
              <Text style={styles.detailText}>
                {order.shipping_address.city}, {order.shipping_address.county}
              </Text>
            </View>
          )}

          {order.coupon && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Coupon</Text>
              <Text style={styles.detailText}>Code: {order.coupon.coupon_code}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <View key={index} style={styles.itemContainer}>
                  <Text style={styles.itemText}>
                    {item.product.name} (Qty: {item.quantity})
                  </Text>
                  <Text style={styles.itemPrice}>
                    KSh {parseFloat(item.product_price).toFixed(2)} each
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No items in this order</Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Home')}
          >
            <MaterialCommunityIcons name="home-outline" size={24} color="#4e6e97" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Cart')}
          >
            <MaterialCommunityIcons name="cart-outline" size={24} color="#4e6e97" />
            <Text style={styles.navText}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Orders')}
          >
            <MaterialCommunityIcons name="clipboard-list" size={24} color="#0e141b" />
            <Text style={[styles.navText, { color: '#0e141b' }]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Profile')}
          >
            <FontAwesome name="user-o" size={20} color="#4e6e97" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    fontFamily: 'NotoSans-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0e141b',
    textAlign: 'center',
    flex: 1,
    marginRight: 24,
    fontFamily: 'NotoSans-Regular',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e7ecf3',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0e141b',
    marginBottom: 8,
    fontFamily: 'NotoSans-Regular',
  },
  detailText: {
    fontSize: 16,
    color: '#4e6e97',
    marginBottom: 4,
    fontFamily: 'NotoSans-Regular',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemText: {
    fontSize: 16,
    color: '#0e141b',
    fontFamily: 'NotoSans-Regular',
  },
  itemPrice: {
    fontSize: 16,
    color: '#4e6e97',
    fontFamily: 'NotoSans-Regular',
  },
  emptyText: {
    fontSize: 16,
    color: '#4e6e97',
    textAlign: 'center',
    padding: 16,
    fontFamily: 'NotoSans-Regular',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4d4f',
    textAlign: 'center',
    padding: 16,
    fontFamily: 'NotoSans-Regular',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e7ecf3',
    backgroundColor: '#f8fafc',
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4e6e97',
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
});

export default OrderDetailScreen;