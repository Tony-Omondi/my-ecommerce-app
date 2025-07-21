import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  Platform,
  Share,
  SafeAreaView,
  Easing
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getProductById, getCart, addToCart } from '../api/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Product {
  id: number;
  seller: { id: number; username: string; email: string };
  title: string;
  description: string;
  price: string;
  image?: string;
  category?: { id: number; name: string };
  created_at: string;
  rating?: number;
  reviewCount?: number;
  images?: string[];
}

const ProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const productId = route.params?.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [cartId, setCartId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadFonts();
    fetchData();
    
    // Start floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.02,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
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
      const [productResponse, cartResponse] = await Promise.all([
        getProductById(productId),
        getCart(),
      ]);
      
      // Enhance product with sample data
      const enhancedProduct = {
        ...productResponse.data,
        rating: Math.random() * 1 + 4, // 4-5 stars
        reviewCount: Math.floor(Math.random() * 500),
        images: [
          productResponse.data.image,
          'https://via.placeholder.com/600x600/2a4133/94e0b2?text=Product+2',
          'https://via.placeholder.com/600x600/1a2a20/94e0b2?text=Product+3'
        ].filter(Boolean)
      };
      
      setProduct(enhancedProduct);
      setCartId(cartResponse.data.length > 0 ? cartResponse.data[0].id : null);
    } catch (error) {
      console.error('Error fetching product or cart:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      if (!cartId) {
        Alert.alert('Error', 'Cart not found. Please try again.');
        return;
      }
      
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        const impactMedium = require('expo-haptics').ImpactFeedbackStyle.Medium;
        require('expo-haptics').impactAsync(impactMedium);
      }
      
      await addToCart(cartId, { product_id: productId, quantity });
      
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 3,
          tension: 40,
          useNativeDriver: true
        })
      ]).start();
      
      Alert.alert('Success', 'Product added to cart!', [
        { 
          text: 'View Cart', 
          onPress: () => navigation.navigate('Cart', { cartId }),
          style: 'default'
        },
        { 
          text: 'Continue Shopping', 
          onPress: () => {},
          style: 'cancel'
        },
      ]);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart');
    }
  };

  const handleBuyNow = async () => {
    try {
      if (!cartId) {
        Alert.alert('Error', 'Cart not found. Please try again.');
        return;
      }
      
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        const impactHeavy = require('expo-haptics').ImpactFeedbackStyle.Heavy;
        require('expo-haptics').impactAsync(impactHeavy);
      }
      
      await addToCart(cartId, { product_id: productId, quantity });
      navigation.navigate('Cart', { cartId });
    } catch (error) {
      console.error('Error during buy now:', error);
      Alert.alert('Error', 'Failed to process buy now');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      const impactLight = require('expo-haptics').ImpactFeedbackStyle.Light;
      require('expo-haptics').impactAsync(impactLight);
    }
  };

  const shareProduct = async () => {
    try {
      await Share.share({
        message: `Check out this amazing product: ${product?.title} for $${product?.price}`,
        url: product?.image,
        title: product?.title
      });
    } catch (error) {
      console.error('Error sharing:', error);
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

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  if (!fontsLoaded || loading || !product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Floating Header */}
      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={shareProduct}
            style={styles.headerActionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social" size={20} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={toggleFavorite}
            style={styles.headerActionButton}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={20} 
              color={isFavorite ? "#FF4081" : "white"} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scrollContainer}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <Animated.Image
            source={{ uri: product.images[currentImageIndex] }}
            style={[styles.productImage, { transform: [{ scale: scaleValue }] }]}
            resizeMode="cover"
          />
          
          {/* Image Pagination */}
          <View style={styles.pagination}>
            {product.images.map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentImageIndex && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productDetails}>
          <View style={styles.priceRatingContainer}>
            <Text style={styles.productPrice}>${product.price}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{product.rating?.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({product.reviewCount} reviews)</Text>
            </View>
          </View>
          
          <Text style={styles.productTitle}>{product.title}</Text>
          
          <View style={styles.sellerContainer}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerInitial}>
                {product.seller.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.sellerLabel}>Sold by</Text>
              <Text style={styles.sellerName}>{product.seller.username}</Text>
            </View>
          </View>
          
          {product.category && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryLabel}>Category:</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category.name}</Text>
              </View>
            </View>
          )}
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#4CAF50" />
              <Text style={styles.detailText}>Posted: {formatTime(product.created_at)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
              <Text style={styles.detailText}>Authenticity Guaranteed</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="return-down-back-outline" size={20} color="#4CAF50" />
              <Text style={styles.detailText}>7-Day Returns</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="car-outline" size={20} color="#4CAF50" />
              <Text style={styles.detailText}>Free Shipping</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <Animated.View 
        style={[
          styles.footer,
          { transform: [{ translateY }] }
        ]}
      >
        <View style={styles.quantitySelector}>
          <TouchableOpacity 
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            style={styles.quantityButton}
            disabled={quantity <= 1}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={20} color={quantity <= 1 ? "#AAA" : "#4CAF50"} />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{quantity}</Text>
          
          <TouchableOpacity 
            onPress={() => setQuantity(quantity + 1)}
            style={styles.quantityButton}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={20} color="white" />
            <Text style={styles.cartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.buyButton}
            onPress={handleBuyNow}
            activeOpacity={0.8}
          >
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 100, // Space for fixed footer
  },
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#4CAF50',
    width: 12,
  },
  productDetails: {
    padding: 20,
  },
  priceRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  productPrice: {
    color: '#4CAF50',
    fontSize: 24,
    fontFamily: 'NotoSans-Bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'NotoSans-SemiBold',
    marginLeft: 4,
    marginRight: 4,
  },
  reviewCount: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
  },
  productTitle: {
    color: '#333',
    fontSize: 22,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 15,
    lineHeight: 28,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerInitial: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
  },
  sellerLabel: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
  },
  sellerName: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'NotoSans-SemiBold',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryLabel: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'NotoSans-SemiBold',
  },
  sectionTitle: {
    color: '#333',
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 10,
  },
  productDescription: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  detailItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
  },
  detailText: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 15,
    alignSelf: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: '#333',
    fontSize: 18,
    fontFamily: 'NotoSans-SemiBold',
    marginHorizontal: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  cartButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'NotoSans-SemiBold',
    marginLeft: 8,
  },
  buyButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
  },
  buyButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'NotoSans-SemiBold',
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
    marginTop: 15,
  },
});

export default ProductDetailScreen;