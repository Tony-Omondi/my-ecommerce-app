import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Alert,
} from 'react-native';
import { useFonts } from 'expo-font';
import { FontAwesome } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getProducts } from '../api/api';

const IMAGE_BASE_URL = 'http://192.168.100.40:8000';
const placeholderImage = 'https://via.placeholder.com/150';

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [fontsLoaded] = useFonts({
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  const handleSearch = async (query) => {
    try {
      console.log('Searching for:', query); // Debug: Log the search query
      setLoading(true);
      setError(null);
      const response = await getProducts(query);
      console.log('API Response:', response.data); // Debug: Log API response
      const fixedProducts = response.data.map((product) => ({
        ...product,
        images: product.images.map((img) => ({
          ...img,
          image: img.image.startsWith('/media')
            ? `${IMAGE_BASE_URL}${img.image}`
            : img.image,
        })),
      }));
      setProducts(fixedProducts);
      setLoading(false);
      if (fixedProducts.length === 0 && query.trim()) {
        Alert.alert('No Results', 'No products found for your search.');
      }
    } catch (err) {
      console.error('Search Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError('Failed to load search results. Please try again.');
      setLoading(false);
      Alert.alert('Error', 'Failed to load search results. Please check your connection.');
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setProducts([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1971e5" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={24} color="#0e141b" />
          </TouchableOpacity>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <FontAwesome name="times-circle" size={20} color="#4e6e97" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1971e5" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => handleSearch(searchQuery)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.resultsContainer}>
            {products.length === 0 && searchQuery.trim() ? (
              <Text style={styles.noResultsText}>No products found.</Text>
            ) : (
              <View style={styles.productsContainer}>
                {products.map((product) => (
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
                ))}
              </View>
            )}
          </ScrollView>
        )}
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
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e7ecf3',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0dae7',
    fontFamily: 'NotoSans-Regular',
  },
  clearButton: {
    position: 'absolute',
    right: 8,
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
  resultsContainer: {
    flex: 1,
  },
  noResultsText: {
    fontSize: 16,
    color: '#4e6e97',
    textAlign: 'center',
    marginTop: 20,
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
});

export default SearchScreen;