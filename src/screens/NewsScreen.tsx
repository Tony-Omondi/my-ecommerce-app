// === 📁 src/screens/NewsScreen.tsx ===
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { getPosts } from '../api/api';
import * as Font from 'expo-font';

const NewsScreen = ({ navigation }: any) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadResources = async () => {
      await Font.loadAsync({
        'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
      });
      setFontsLoaded(true);
      fetchPosts();
    };

    loadResources();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await getPosts();
      console.log('API Response:', JSON.stringify(response.data, null, 2));
      setPosts(response.data);
      setLoading(false);
    } catch (err: any) {
      console.error('API Error:', err.message, err.response?.data);
      setError('Failed to load news. Please try again.');
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.postContainer}>
      <Text style={styles.postTitle}>{item.title || 'No Title'}</Text>
      <Text style={styles.postContent}>{item.content || 'No Content'}</Text>
    </View>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#94e0b2" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#94e0b2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Kibra Community News</Text>
        <Text style={styles.error}>{error}</Text>
        <Button title="Retry" onPress={fetchPosts} color="#94e0b2" />
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Login to Post</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Kibra Community News</Text>
        <Text style={styles.empty}>No posts available</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Login to Post</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kibra Community News</Text>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) =>
          item.id ? item.id.toString() : Math.random().toString()
        }
        style={styles.list}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Login to Post</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NewsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141f18',
    padding: 16,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#141f18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#94e0b2',
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'NotoSans-Regular',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: '#2a4133',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  postTitle: {
    color: '#94e0b2',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'NotoSans-Regular',
  },
  postContent: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
  },
  error: {
    color: '#ff4d4f',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'NotoSans-Regular',
  },
  empty: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'NotoSans-Regular',
  },
  button: {
    backgroundColor: '#94e0b2',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    marginTop: 16,
  },
  buttonText: {
    color: '#141f18',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.15,
    fontFamily: 'NotoSans-Regular',
  },
});
