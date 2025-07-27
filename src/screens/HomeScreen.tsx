import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getProducts, getCategories } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IMAGE_BASE_URL = 'http://192.168.100.40:8000'; // Match api.tsx

const HomeScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user_id');
      navigation.replace('Login');
      Alert.alert('Logged out', 'You have been successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      console.log('Products Response:', JSON.stringify(productsRes.data, null, 2));
      console.log('Categories Response:', categoriesRes.data);

      const fixedProducts = productsRes.data.map((product) => ({
        ...product,
        images: product.images.map((img) => ({
          ...img,
          image: img.image.startsWith('/media')
            ? `${IMAGE_BASE_URL}${img.image}`
            : img.image,
        })),
      }));
      setProducts(fixedProducts);

      // Ensure categoriesRes.data is an array of strings
      const categoryNames = Array.isArray(categoriesRes.data)
        ? categoriesRes.data.filter((name) => typeof name === 'string' && name)
        : [];
      console.log('Extracted Category Names:', categoryNames);
      setCategories(['All', ...categoryNames]);

      if (categoryNames.length === 0) {
        console.warn('No categories found in response. Check product category data.');
        Alert.alert('Warning', 'No categories available. Displaying all products.');
      }

      setLoading(false);
    } catch (err) {
      console.error('Fetch Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError('Failed to load products or categories. Please try again.');
      setLoading(false);
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1971e5" />
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

  const placeholderImage = 'https://via.placeholder.com/150';

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((product) => product.category?.name === selectedCategory);

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialIcons name="menu" size={24} color="#0e141b" />
          <Text style={styles.headerTitle}>Hey Tony 👋🏾, Ready to Shop?</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <FontAwesome name="search" size={20} color="#0e141b" style={styles.searchIcon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#0e141b" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1971e5']} />
          }
        >
          <View style={styles.bannerContainer}>
            <ImageBackground
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGiF4z26bHoFkObBf1GL03PhN9etOYAujiak-UABu5wpIajMsST9g8YaqzDWvrBddZItzDYIkXb6NB3vZy2LmZui2WpqfRR_DdQMd7wy-gpmb03Wy54jIHNul0s6Hes7mBHMiMDlo9C1AwVUtxOT_xZItC5hv2phpriChO9Az7FdMdFBJxRM4VQdhJWMI1dTky-7v1JqkUbOvUfpN-iEDBpWZ6O_xFwkwg-bwcmtM1YyMoZngKT6Olzw6bldM8ZjhjNg5xNDpw25Xy',
              }}
              style={styles.bannerImage}
            />
          </View>

          {categories.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.categoryItem, selectedCategory === category && styles.activeCategory]}
                  onPress={() => {
                    console.log('Selected category:', category);
                    setSelectedCategory(category);
                  }}
                >
                  <Text style={[styles.categoryText, selectedCategory === category && styles.activeCategoryText]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noCategoriesText}>No categories available</Text>
          )}

          <View style={styles.productsContainer}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                >
                  <ImageBackground
                    source={{ uri: product.images.length > 0 ? product.images[0].image : placeholderImage }}
                    style={styles.productImage}
                  />
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>${parseFloat(product.price).toFixed(2)}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noProductsText}>No products available</Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
            <MaterialCommunityIcons name="home" size={24} color="#0e141b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Cart')}>
            <MaterialCommunityIcons name="cart-outline" size={24} color="#4e6e97" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Orders')}>
            <MaterialIcons name="list-alt" size={24} color="#4e6e97" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
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
    backgroundColor: '#f8fafc',
    fontFamily: 'NotoSans-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#1971e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#fff',
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
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0e141b',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'NotoSans-Regular',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 218,
  },
  categoriesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d0dae7',
  },
  categoryItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginRight: 32,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeCategory: {
    borderBottomColor: '#1971e5',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4e6e97',
    fontFamily: 'NotoSans-Regular',
  },
  activeCategoryText: {
    color: '#0e141b',
  },
  noCategoriesText: {
    fontSize: 16,
    color: '#4e6e97',
    textAlign: 'center',
    padding: 16,
    fontFamily: 'NotoSans-Regular',
  },
  productsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0e141b',
    marginBottom: 4,
    fontFamily: 'NotoSans-Regular',
  },
  productPrice: {
    fontSize: 14,
    color: '#4e6e97',
    fontFamily: 'NotoSans-Regular',
  },
  noProductsText: {
    fontSize: 16,
    color: '#4e6e97',
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
    borderBottomColor: '#e7ecf3',
    backgroundColor: '#f8fafc',
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
});

export default HomeScreen;