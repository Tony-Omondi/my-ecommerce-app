import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
  FlatList,
  Animated,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { getProducts, getCategories, getCart } from '../api/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Category {
  id: number | null;
  name: string;
}

interface Product {
  id: number;
  seller: { id: number; username: string; email: string };
  title: string;
  description: string;
  price: string;
  image?: string;
  category?: Category;
  created_at: string;
}

interface Cart {
  id: number;
  items: { id: number; product: Product; quantity: number; total_price: string }[];
  total_price: string;
  total_price_after_coupon: string;
  coupon?: { id: number; coupon_code: string; discount_amount: string };
}

const MarketplaceScreen = () => {
  const navigation = useNavigation();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [activeTab, setActiveTab] = useState('marketplace');

  useEffect(() => {
    loadFonts();
    fetchData();
  }, []);

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
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse, cartResponse] = await Promise.all([
        getProducts(),
        getCategories(),
        getCart(),
      ]);
      setProducts(productsResponse.data);
      setCategories([{ id: null, name: 'All' }, ...categoriesResponse.data]);
      setCart(cartResponse.data.length > 0 ? cartResponse.data[0] : null);
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filterProducts = () => {
    if (selectedCategory === null) return products;
    return products.filter(product => product.category?.id === selectedCategory);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 80],
    extrapolate: 'clamp',
  });

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryContainer}
    >
      {categories.map(category => (
        <TouchableOpacity
          key={category.id || 'all'}
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.categoryButtonActive,
          ]}
          onPress={() => setSelectedCategory(category.id)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive,
            ]}
            numberOfLines={1}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <TouchableOpacity
      style={[
        styles.productContainer,
        { marginLeft: index % 2 === 0 ? 0 : 10 }
      ]}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      activeOpacity={0.9}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={item.image ? { uri: item.image } : require('../../assets/placeholder-product.png')}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productBadge}>
          <Ionicons name="flash" size={14} color="white" />
          <Text style={styles.badgeText}>Trending</Text>
        </View>
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>${item.price}</Text>
          {parseFloat(item.price) > 50 && (
            <Text style={styles.originalPrice}>${(parseFloat(item.price) * 1.2).toFixed(2)}</Text>
          )}
        </View>
        
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>4.8</Text>
          <Text style={styles.reviewCount}>(128)</Text>
        </View>
        
        <View style={styles.sellerContainer}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerInitial}>
              {item.seller.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.productSeller}>{item.seller.username}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={(e) => {
            e.stopPropagation();
            // Add to cart logic here
          }}
        >
          <Ionicons name="cart" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading marketplace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.searchInput}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search products...</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerBottom}>
          <Text style={styles.headerTitle}>Discover Products</Text>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart', { cartId: cart?.id })}
          >
            <Ionicons name="cart-outline" size={24} color="#4CAF50" />
            {cart && cart.items.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.items.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {renderCategoryFilter()}

      <FlatList
        data={filterProducts()}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#888" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try a different category or search term</Text>
          </View>
        }
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'marketplace' && styles.activeNavButton]}
          onPress={() => {
            setActiveTab('marketplace');
            navigation.navigate('Marketplace');
          }}
        >
          <Ionicons 
            name="home" 
            size={24} 
            color={activeTab === 'marketplace' ? '#4CAF50' : '#888'} 
          />
          <Text style={[styles.navText, activeTab === 'marketplace' && styles.activeNavText]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'orders' && styles.activeNavButton]}
          onPress={() => {
            setActiveTab('orders');
            navigation.navigate('Orders');
          }}
        >
          <Ionicons 
            name="receipt" 
            size={24} 
            color={activeTab === 'orders' ? '#4CAF50' : '#888'} 
          />
          <Text style={[styles.navText, activeTab === 'orders' && styles.activeNavText]}>
            Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'cart' && styles.activeNavButton]}
          onPress={() => {
            setActiveTab('cart');
            navigation.navigate('Cart', { cartId: cart?.id });
          }}
        >
          <View style={styles.cartNavIcon}>
            <Ionicons 
              name="cart" 
              size={24} 
              color={activeTab === 'cart' ? '#4CAF50' : '#888'} 
            />
            {cart && cart.items.length > 0 && (
              <View style={styles.navCartBadge}>
                <Text style={styles.navCartBadgeText}>{cart.items.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navText, activeTab === 'cart' && styles.activeNavText]}>
            Cart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'account' && styles.activeNavButton]}
          onPress={() => {
            setActiveTab('account');
            navigation.navigate('Account');
          }}
        >
          <Ionicons 
            name="person" 
            size={24} 
            color={activeTab === 'account' ? '#4CAF50' : '#888'} 
          />
          <Text style={[styles.navText, activeTab === 'account' && styles.activeNavText]}>
            Account
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('Filters')}
      >
        <Ionicons name="options" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#333',
    fontSize: 22,
    fontFamily: 'NotoSans-Bold',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
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
  categoryContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'NotoSans-SemiBold',
  },
  categoryTextActive: {
    color: 'white',
  },
  productList: {
    padding: 16,
    paddingBottom: 80, // Add padding to accommodate bottom nav
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productContainer: {
    width: (SCREEN_WIDTH - 40) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImageContainer: {
    width: '100%',
    height: (SCREEN_WIDTH - 40) / 2,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF5722',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'NotoSans-SemiBold',
    marginLeft: 4,
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'NotoSans-SemiBold',
    marginBottom: 8,
    lineHeight: 18,
    height: 36,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  productPrice: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
  },
  originalPrice: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    color: '#333',
    fontSize: 12,
    fontFamily: 'NotoSans-SemiBold',
    marginLeft: 4,
  },
  reviewCount: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
    marginLeft: 4,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  sellerInitial: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'NotoSans-Bold',
  },
  productSeller: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#333',
    fontSize: 18,
    fontFamily: 'NotoSans-SemiBold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    marginTop: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 90, // Adjusted to appear above bottom nav
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },
  // Bottom Navigation Styles
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
  },
  activeNavButton: {
    // backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  navText: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'NotoSans-SemiBold',
    marginTop: 4,
  },
  activeNavText: {
    color: '#4CAF50',
  },
  cartNavIcon: {
    position: 'relative',
  },
  navCartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF5722',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'NotoSans-Bold',
  },
});

export default MarketplaceScreen;