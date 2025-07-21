import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileByUserId, toggleFollow } from '../api/api';

interface User {
  id: number;
  username: string;
  email: string;
}

interface Profile {
  id: number;
  user?: User;
  user_data?: User;
  bio?: string;
  location?: string;
  profile_picture?: string;
  followers_count?: number;
  following_count?: number;
  posts?: any[];
  is_following?: boolean;
}

export default function ProfileViewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Safely access userId from route.params
  const userId = route.params && 'userId' in route.params ? (route.params as { userId: number }).userId : null;

  useEffect(() => {
    const initialize = async () => {
      if (!userId) {
        setError('No user ID provided.');
        setLoading(false);
        return;
      }

      await checkUserAndFetchProfile();
    };

    initialize();
  }, [userId]);

  const checkUserAndFetchProfile = async () => {
    try {
      setLoading(true);
      const userIdStr = await AsyncStorage.getItem('user_id');
      const loggedInUserId = userIdStr ? parseInt(userIdStr, 10) : null;
      if (loggedInUserId === userId) {
        setIsOwnProfile(true);
        navigation.replace('Profile');
        return;
      }
      setIsOwnProfile(false);
      await fetchUserProfile();
    } catch (err: any) {
      console.error('Check user error:', err);
      setError('Failed to check user.');
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      if (!userId) throw new Error('No user ID provided.');
      const res = await getProfileByUserId(userId);
      console.log('✅ Profile API response for user', userId, ':', res.data);

      setProfile({
        ...res.data,
        user: res.data.user_data || res.data.user,
        is_following: res.data.is_following || false,
      });
    } catch (err: any) {
      console.error('Fetch profile error for user', userId, ':', err);
      if (err?.response?.status === 404) {
        setProfile(null);
        setError('Profile not found.');
      } else {
        setError(err.message || 'Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!profile || !userId) return;
    try {
      setLoading(true);
      const res = await toggleFollow(userId);
      console.log('✅ Toggle follow response for user', userId, ':', res.data);
      setProfile({
        ...profile,
        is_following: res.data.is_following,
        followers_count: res.data.followers_count,
      });
      Alert.alert('Success', res.data.is_following ? 'Followed user!' : 'Unfollowed user!');
    } catch (err: any) {
      console.error('Toggle follow error for user', userId, ':', err);
      Alert.alert('Error', 'Failed to toggle follow status.');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={checkUserAndFetchProfile}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Profile Not Available</Text>
        <Text style={styles.sectionContent}>
          This user has not created a profile yet.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={
            profile.profile_picture
              ? { uri: profile.profile_picture }
              : require('../../assets/_.jpeg')
          }
          style={styles.profileImage}
        />
        <Text style={styles.username}>
          {profile.user?.username || 'Unknown User'}
        </Text>
        <Text style={styles.email}>{profile.user?.email || 'No email'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {profile.followers_count ?? 0}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {profile.following_count ?? 0}
            </Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {profile.posts?.length ?? 0}
            </Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {!isOwnProfile && (
          <TouchableOpacity
            style={[
              styles.button,
              profile.is_following ? styles.unfollowButton : styles.followButton,
            ]}
            onPress={handleToggleFollow}
          >
            <Text style={styles.buttonText}>
              {profile.is_following ? 'Unfollow' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <Text style={styles.sectionContent}>
          {profile.bio || 'No bio added yet.'}
        </Text>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.sectionContent}>
          {profile.location || 'No location added yet.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141f18',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#141f18',
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#94e0b2',
  },
  username: {
    color: '#94e0b2',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  email: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#94e0b2',
    fontSize: 14,
  },
  profileSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#94e0b2',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionContent: {
    color: '#ffffff',
    fontSize: 16,
    padding: 10,
    backgroundColor: '#1e2b22',
    borderRadius: 8,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  followButton: {
    backgroundColor: '#94e0b2',
  },
  unfollowButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});