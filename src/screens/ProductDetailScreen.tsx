import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProduct, addToCart } from '../api/api';

// Base URL for images (match api.ts)
const IMAGE_BASE_URL = 'http://192.168.88.85:8000'; // Use http://10.0.2.2:8000 for Android Emulator

const { width: screenWidth } = Dimensions.get('window');

const ProductDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const carouselRef = useRef(null);

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await getProduct(productId);
        console.log('Product Detail Response:', response.data);
        // Fix image URLs
        const fixedProduct = {
          ...response.data,
          images: response.data.images?.map((img) => ({
            ...img,
            image: img.image.startsWith('/media')
              ? `${IMAGE_BASE_URL}${img.image}`
              : img.image,
          })) || [],
        };
        setProduct(fixedProduct);
        // Set default variant, size, and color
        if (fixedProduct.variants?.length > 0) {
          const firstVariant = fixedProduct.variants[0];
          setSelectedVariant(firstVariant);
          setSelectedSize(firstVariant.size);
          setSelectedColor(firstVariant.color);
        }
        setLoading(false);
      } catch (err) {
        console.error('Fetch Error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError('Failed to load product details. Please try again.');
        setLoading(false);
        Alert.alert('Error', 'Failed to load product. Please check your connection.');
      }
    };
    fetchProduct();
  }, [productId]);

  // Auto-scroll carousel
  useEffect(() => {
    if (product && product.images?.length > 1) {
      const interval = setInterval(() => {
        if (carouselRef.current) {
          const nextSlide = (activeSlide + 1) % product.images.length;
          carouselRef.current.scrollToIndex({
            index: nextSlide,
            animated: true,
          });
          setActiveSlide(nextSlide);
        }
      }, 3000); // Auto-scroll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [activeSlide, product]);

  // Update selected variant when size or color changes
  useEffect(() => {
    if (product && selectedSize && selectedColor) {
      const variant = product.variants.find(
        (v) => v.size === selectedSize && v.color === selectedColor
      );
      setSelectedVariant(variant || null);
    }
  }, [selectedSize, selectedColor, product]);

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      Alert.alert('Error', 'Please select a size and color.');
      return;
    }
    try {
      await addToCart({
        product_id: product.id,
        variant_id: selectedVariant.id,
        quantity: 1,
      });
      Alert.alert('Success', 'Product added to cart!');
      navigation.navigate('Cart');
    } catch (err) {
      console.error('Add to Cart Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      Alert.alert('Error', 'Failed to add product to cart.');
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#607afb" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Product not found.'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchProduct();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const placeholderImage = 'https://via.placeholder.com/150';

  // Get unique sizes and colors
  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.map((v) => v.color))];

  const renderCarouselItem = ({ item }) => (
    <View style={styles.carouselItem}>
      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
        resizeMode="cover"
      />
    </View>
  );

  const renderPagination = () => {
    if (product.images.length <= 1) return null;
    return (
      <View style={styles.paginationContainer}>
        {product.images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeSlide === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#0d0f1c" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{product.name}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Product Images Carousel */}
          <View style={styles.imageContainer}>
            {product.images.length > 0 ? (
              <>
                <FlatList
                  ref={carouselRef}
                  data={product.images}
                  renderItem={renderCarouselItem}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const slideIndex = Math.round(
                      event.nativeEvent.contentOffset.x / (screenWidth - 32)
                    );
                    setActiveSlide(slideIndex);
                  }}
                  keyExtractor={(item) => item.id.toString()}
                  getItemLayout={(data, index) => ({
                    length: screenWidth - 32,
                    offset: (screenWidth - 32) * index,
                    index,
                  })}
                />
                {renderPagination()}
              </>
            ) : (
              <Image
                source={{ uri: placeholderImage }}
                style={styles.productImage}
                resizeMode="cover"
              />
            )}
          </View>

          {/* Product Details */}
          <Text style={styles.productTitle}>{product.name}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>

          {/* Price */}
          <Text style={styles.sectionTitle}>Price</Text>
          <Text style={styles.sectionContent}>${parseFloat(product.price).toFixed(2)}</Text>

          {/* Category */}
          <Text style={styles.sectionTitle}>Category</Text>
          <Text style={styles.sectionContent}>{product.category.name}</Text>

          {/* Brand */}
          <Text style={styles.sectionTitle}>Brand</Text>
          <Text style={styles.sectionContent}>{product.brand}</Text>

          {/* Size Selection */}
          <Text style={styles.sectionTitle}>Select Size</Text>
          <View style={styles.selectionContainer}>
            {sizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.selectionButton,
                  selectedSize === size && styles.selectedButton,
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text style={styles.selectionText}>{size}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Color Selection */}
          <Text style={styles.sectionTitle}>Select Color</Text>
          <View style={styles.selectionContainer}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.selectionButton,
                  selectedColor === color && styles.selectedButton,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                <Text style={styles.selectionText}>{color}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stock */}
          <Text style={styles.sectionTitle}>Stock</Text>
          <Text style={styles.sectionContent}>
            {selectedVariant
              ? selectedVariant.stock > 0
                ? `${selectedVariant.stock} in stock`
                : 'Out of stock'
              : 'Please select a size and color'}
          </Text>

          {/* SKU */}
          <Text style={styles.sectionTitle}>SKU</Text>
          <Text style={styles.sectionContent}>{product.sku}</Text>
        </ScrollView>

        {/* Add to Cart Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              !selectedVariant || selectedVariant.stock === 0
                ? styles.disabledButton
                : null,
            ]}
            onPress={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stock === 0}
          >
            <Text style={styles.buttonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Home')}
          >
            <MaterialCommunityIcons name="home" size={24} color="#0d0f1c" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Cart')}
          >
            <MaterialCommunityIcons name="cart-outline" size={24} color="#4e6e97" />
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
    width: 24, // Matches arrow-back icon size
  },
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
  imageContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  carouselItem: {
    width: screenWidth - 32,
    height: 320,
  },
  productImage: {
    width: '100%',
    height: 320,
    borderRadius: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#0d0f1c',
  },
  inactiveDot: {
    backgroundColor: '#0d0f1c',
    opacity: 0.5,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0d0f1c',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 20,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  productDescription: {
    fontSize: 16,
    color: '#0d0f1c',
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 24,
    fontFamily: 'NotoSans-Regular',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d0f1c',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 16,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  sectionContent: {
    fontSize: 16,
    color: '#0d0f1c',
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontFamily: 'NotoSans-Regular',
  },
  selectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  selectionButton: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#e6e9f4',
    paddingHorizontal: 16,
  },
  selectedButton: {
    backgroundColor: '#607afb',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0d0f1c',
    fontFamily: 'NotoSans-Regular',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fc',
  },
  addToCartButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#607afb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#b0b0b0',
  },
  buttonText: {
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

export default ProductDetail;