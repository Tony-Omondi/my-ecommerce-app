import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getUser } from '../api/api';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: number;
  username: string;
  email: string;
}

const CreatePostScreen = () => {
  const navigation = useNavigation();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          Alert.alert('Error', 'You must be logged in to create a post.');
          navigation.navigate('Login');
          return;
        }
        if (userId) {
          const response = await getUser(Number(userId));
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        Alert.alert('Error', 'Failed to load user information.');
      }
    };
    fetchCurrentUser();
  }, [navigation]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !image) {
      Alert.alert('Error', 'Please add content or an image to create a post.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const formData = new FormData();
      if (content.trim()) {
        formData.append('content', content);
      }
      if (image) {
        const uriParts = image.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) {
          throw new Error('Unsupported image format. Use JPG, PNG, or GIF.');
        }
        formData.append('image', {
          uri: image,
          name: `post_image.${fileType}`,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        } as any);
      }

      const response = await api.post('posts/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`, // Explicitly include token
        },
      });

      Alert.alert('Success', 'Post created successfully!');
      setContent('');
      setImage(null);
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating post:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.author_id?.[0] ||
        error.message ||
        'Failed to create post. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity onPress={handleCreatePost} disabled={loading}>
          <Text style={styles.postButtonText}>{loading ? 'Posting...' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.authorContainer}>
        <Text style={styles.authorLabel}>Author:</Text>
        <Text style={styles.authorText}>
          {user ? user.username : 'Loading...'}
        </Text>
      </View>

      <Text style={styles.label}>Content:</Text>
      <TextInput
        style={styles.textInput}
        placeholder="What's on your mind?"
        placeholderTextColor="#94e0b2"
        multiline
        value={content}
        onChangeText={setContent}
      />

      <Text style={styles.label}>Image:</Text>
      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <TouchableOpacity style={styles.removeImageButton} onPress={() => setImage(null)}>
            <Ionicons name="close-circle" size={24} color="#ff4d4d" />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
        <Ionicons name="image-outline" size={28} color="#94e0b2" />
        <Text style={styles.imagePickerText}>Add Image</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#94e0b2" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141f18',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#264532',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'NotoSans-SemiBold',
  },
  postButtonText: {
    color: '#94e0b2',
    fontSize: 16,
    fontFamily: 'NotoSans-SemiBold',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  authorLabel: {
    color: '#94e0b2',
    fontSize: 16,
    fontFamily: 'NotoSans-SemiBold',
    marginRight: 10,
  },
  authorText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
  },
  label: {
    color: '#94e0b2',
    fontSize: 16,
    fontFamily: 'NotoSans-SemiBold',
    marginTop: 15,
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: '#122118',
    color: 'white',
    fontFamily: 'NotoSans-Regular',
    fontSize: 16,
    padding: 15,
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#94e0b2',
    borderRadius: 8,
    justifyContent: 'center',
  },
  imagePickerText: {
    color: '#94e0b2',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    marginLeft: 10,
  },
  imageContainer: {
    marginTop: 10,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default CreatePostScreen;