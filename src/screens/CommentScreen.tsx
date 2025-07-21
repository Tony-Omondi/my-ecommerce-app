import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getCommentsForPost, addCommentToPost, getProfileByUserId } from '../api/api';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: number;
  username: string;
  email: string;
}

interface UserProfile {
  id: number;
  user?: User;
  user_data?: User;
  profile_image?: string;
  profile_picture?: string;
  bio?: string;
}

interface Author {
  id: number;
  username: string;
  email: string;
  is_email_verified: boolean;
  role: string;
  verification_code: string | null;
}

interface Comment {
  id: number;
  user: Author;
  text: string;
  created_at: string;
  post: number;
}

const CommentScreen = () => {
  const route = useRoute();
  const { postId } = route.params as { postId: number };
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [profiles, setProfiles] = useState<Record<number, UserProfile>>({});

  useEffect(() => {
    console.log('Fetching comments for postId:', postId);
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await getCommentsForPost(postId);
      const commentsData = Array.isArray(response.data) ? response.data : [];
      console.log(`Comments Response for post ${postId}:`, commentsData);
      setComments(commentsData);

      const uniqueUserIds = [
        ...new Set(commentsData.map((c: Comment) => c.user?.id).filter(id => typeof id === 'number')),
      ];

      const profs: Record<number, UserProfile> = {};
      const profilePromises = uniqueUserIds.map(async (userId: number) => {
        try {
          const profileRes = await getProfileByUserId(userId);
          console.log(`Profile for user ${userId} in comments:`, profileRes.data);
          profs[userId] = profileRes.data;
        } catch (error) {
          console.error(`Error fetching profile for user ${userId} in comments:`, error);
          profs[userId] = {
            id: userId,
            user: { id: userId, username: `Unknown User ${userId}`, email: '' },
            profile_image: undefined,
            bio: '',
          };
        }
      });
      await Promise.all(profilePromises);
      console.log('Comment Profiles:', profs);
      setProfiles(profs);
    } catch (error) {
      console.error(`Error loading comments for post ${postId}:`, error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }
    try {
      const response = await addCommentToPost(postId, text.trim());
      console.log('Comment Creation Response:', {
        status: response.status,
        data: response.data,
      });
      setText('');
      fetchComments();
      Alert.alert('Success', 'Comment added successfully');
    } catch (error: any) {
      console.error('Error adding comment for post', postId, ':', {
        message: error.message,
        response: error.response
          ? {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers,
            }
          : 'No response',
      });
      // Only show error if the response status is not 201 (Created)
      if (error.response?.status !== 201) {
        const errorMessage = error.response?.data
          ? typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data)
          : 'Failed to add comment, please try again';
        Alert.alert('Error', errorMessage);
      } else {
        // Handle case where comment is created but network error occurs
        setText('');
        fetchComments();
        Alert.alert('Success', 'Comment added, but network issue detected. Please refresh.');
      }
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    if (!item.user || !item.user.id) {
      console.log('Skipping comment due to missing user:', item);
      return null;
    }

    const profile = profiles[item.user.id] || {
      id: item.user.id,
      user: {
        id: item.user.id,
        username: item.user.username || `Unknown User ${item.user.id}`,
        email: item.user.email || '',
      },
      profile_image: undefined,
      bio: '',
    };

    const profileUser = profile.user_data || profile.user;
    const profileImage = profile.profile_picture || profile.profile_image;

    console.log(`Rendering comment ${item.id} for post ${item.post}, user:`, profileUser);

    return (
      <View style={styles.commentContainer}>
        <Image
          source={
            profileImage
              ? { uri: profileImage }
              : require('../../assets/_.jpeg')
          }
          style={styles.avatar}
        />
        <View style={styles.commentContent}>
          <Text style={styles.username}>
            {profileUser?.username || item.user.username || `Unknown User ${item.user.id}`}
          </Text>
          <Text style={styles.text}>{item.text}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#94e0b2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderComment}
        contentContainerStyle={{ padding: 10 }}
      />
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Write a comment..."
          placeholderTextColor="#aaa"
          value={text}
          onChangeText={setText}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleAddComment}>
          <Ionicons name="send" size={26} color="#94e0b2" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#141f18' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  commentContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    backgroundColor: '#122118',
    padding: 10,
    borderRadius: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  commentContent: { flex: 1 },
  username: { color: '#94e0b2', fontWeight: 'bold', fontFamily: 'NotoSans-SemiBold' },
  text: { color: 'white', marginTop: 4, fontFamily: 'NotoSans-Regular' },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#122118',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a4133',
    borderRadius: 20,
    paddingHorizontal: 15,
    color: 'white',
    height: 40,
    marginRight: 10,
    fontFamily: 'NotoSans-Regular',
  },
});

export default CommentScreen;