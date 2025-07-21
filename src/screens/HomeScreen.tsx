import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import api, { getPosts, getAds, getProfileByUserId, toggleLike, getNotifications } from '../api/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

interface Post {
  id: number;
  author: Author;
  created_at: string;
  image?: string;
  content?: string;
  likes_count?: number;
  comments_count?: number;
  is_ad?: boolean;
  liked_by_user?: boolean;
}

interface Notification {
  id: number;
  is_read: boolean;
}

const HomeScreen = () => {
  const navigation = useNavigation();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Post[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<number, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    loadFonts();
    fetchData();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadFonts = async () => {
    try {
      await Font.loadAsync({
        'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
        'NotoSans-SemiBold': require('../../assets/fonts/NotoSans-Regular.ttf'),
      });
      setFontsLoaded(true);
    } catch (error) {
      console.error('Error loading fonts:', error);
    }
  };

  const fetchUserProfile = async (userId: number) => {
    try {
      const response = await getProfileByUserId(userId);
      console.log(`Profile for user ${userId}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      return {
        id: userId,
        user: {
          id: userId,
          username: `Unknown User ${userId}`,
          email: '',
        },
        profile_image: undefined,
        bio: '',
      };
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      const [postsResponse, adsResponse, likesResponse, notificationsResponse] = await Promise.all([
        getPosts().catch(() => ({ data: [] })),
        getAds().catch(() => ({ data: [] })),
        api.get('posts/likes/').catch(() => ({ data: [] })),
        token ? getNotifications().catch(() => ({ data: [] })) : { data: [] },
      ]);

      console.log('Posts Response:', postsResponse.data);
      console.log('Ads Response:', adsResponse.data);
      console.log('Likes Response:', likesResponse.data);
      console.log('Notifications Response:', notificationsResponse.data);

      const postsData = Array.isArray(postsResponse.data) ? postsResponse.data : [];
      const adsData = Array.isArray(adsResponse.data) ? adsResponse.data : [];
      const notificationsData = Array.isArray(notificationsResponse.data) ? notificationsResponse.data : [];

      const updatedPosts = postsData.map(post => ({
        ...post,
        liked_by_user: likesResponse.data.some(like => like.post === post.id),
      }));
      const updatedAds = adsData.map(ad => ({
        ...ad,
        is_ad: true,
        liked_by_user: likesResponse.data.some(like => like.post === ad.id),
      }));

      setPosts(updatedPosts);
      setAds(updatedAds);
      setUnreadCount(notificationsData.filter((notification: Notification) => !notification.is_read).length);

      const uniqueUserIds = new Set<number>();
      updatedPosts.forEach(post => post.author?.id && uniqueUserIds.add(post.author.id));
      updatedAds.forEach(ad => ad.author?.id && uniqueUserIds.add(ad.author.id));

      const profiles: Record<number, UserProfile> = {};
      const profilePromises = Array.from(uniqueUserIds).map(async userId => {
        const profile = await fetchUserProfile(userId);
        profiles[userId] = profile;
      });

      await Promise.all(profilePromises);
      console.log('User Profiles:', profiles);
      setUserProfiles(profiles);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load posts, ads, or notifications');
      setPosts([]);
      setAds([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLikePost = async (postId: number, liked: boolean) => {
    try {
      const response = await toggleLike(postId);
      const status = response.data.status;
      setPosts(posts.map(post => post.id === postId ? { 
        ...post, 
        liked_by_user: status === 'liked', 
        likes_count: (post.likes_count || 0) + (status === 'liked' ? 1 : -1) 
      } : post));
      setAds(ads.map(ad => ad.id === postId ? { 
        ...ad, 
        liked_by_user: status === 'liked', 
        likes_count: (ad.likes_count || 0) + (status === 'liked' ? 1 : -1) 
      } : ad));
      await fetchData();
    } catch (error) {
      console.error('Error toggling like for post', postId, ':', error);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      Alert.alert('Logged out', 'You have been logged out.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to log out.');
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

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#94e0b2" />
        </View>
      );
    }

    const mergedContent = [];
    let postIndex = 0;
    let adIndex = 0;

    while (postIndex < posts.length || adIndex < ads.length) {
      if (postIndex < posts.length) {
        mergedContent.push(renderPost(posts[postIndex], false));
        postIndex++;
      }
      if (postIndex < posts.length) {
        mergedContent.push(renderPost(posts[postIndex], false));
        postIndex++;
      }
      if (adIndex < ads.length) {
        mergedContent.push(renderPost({ ...ads[adIndex], is_ad: true }, true));
        adIndex++;
      }
    }

    return mergedContent.length > 0 ? mergedContent : (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No posts available</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#94e0b2" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPost = (post: Post, isAd: boolean) => {
    if (!post || !post.author || !post.author.id) {
      console.log('Skipping post due to missing author:', post);
      return null;
    }

    const userProfile = userProfiles[post.author.id] || {
      id: post.author.id,
      user: {
        id: post.author.id,
        username: post.author.username || `Unknown User ${post.author.id}`,
        email: post.author.email || '',
      },
      profile_image: undefined,
      bio: '',
    };

    const profileUser = userProfile.user_data || userProfile.user;
    const profileImage = userProfile.profile_picture || userProfile.profile_image;

    console.log(`Rendering post ${post.id}, author ID: ${post.author.id}, profile:`, userProfile);

    return (
      <View key={`${isAd ? 'ad' : 'post'}-${post.id}`} style={styles.postContainer}>
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={() => navigation.navigate('Profile', { userId: post.author.id })}
          >
            <Image 
              source={profileImage 
                ? { uri: profileImage } 
                : require('../../assets/_.jpeg')
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <View style={styles.postHeaderText}>
            <Text style={styles.username}>
              {profileUser?.username || post.author.username || `Unknown User ${post.author.id}`}
            </Text>
            <Text style={styles.postTime}>{formatTime(post.created_at)}</Text>
          </View>
          {isAd && (
            <View style={styles.sponsoredBadge}>
              <Text style={styles.sponsoredText}>Sponsored</Text>
            </View>
          )}
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#94e0b2" />
          </TouchableOpacity>
        </View>

        {post.image && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: post.image }}
              style={styles.postImage}
              resizeMode="cover"
            />
            {isAd && (
              <View style={styles.adLabel}>
                <Text style={styles.adLabelText}>Ad</Text>
              </View>
            )}
          </View>
        )}

        {post.content && (
          <Text style={styles.postContent} numberOfLines={3} ellipsizeMode="tail">
            {post.content}
          </Text>
        )}

        <View style={styles.postActions}>
          <View style={styles.actionButtonsLeft}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleLikePost(post.id, post.liked_by_user || false)}
            >
              <Ionicons 
                name={post.liked_by_user ? "heart" : "heart-outline"} 
                size={28} 
                color={post.liked_by_user ? "#ff4d4d" : "#94e0b2"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Comments', { postId: post.id })}
            >
              <Ionicons name="chatbubble-outline" size={26} color="#94e0b2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={26} color="#94e0b2" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.postStats}>
          <Text style={styles.statText}>{post.likes_count || 0} likes</Text>
          <Text style={styles.statText}>{post.comments_count || 0} comments</Text>
        </View>
      </View>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#94e0b2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity>
          <Ionicons name="menu" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kibra</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.postsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#94e0b2']}
            tintColor="#94e0b2"
          />
        }
      >
        {renderContent()}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButtonActive}>
          <Ionicons name="home" size={26} color="white" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Marketplace')}>
          <Ionicons name="cart-outline" size={26} color="#94e0b2" />
          <Text style={styles.navText}>Marketplace</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('CreatePost')}>
          <Ionicons name="add-circle-outline" size={26} color="#94e0b2" />
          <Text style={styles.navText}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications-outline" size={26} color="#94e0b2" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={26} color="#94e0b2" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141f18',
  },
  container: {
    flex: 1,
    backgroundColor: '#141f18',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyStateText: {
    color: '#94e0b2',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    marginBottom: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#94e0b2',
  },
  refreshButtonText: {
    color: '#94e0b2',
    marginLeft: 5,
    fontFamily: 'NotoSans-Regular',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#122118',
    borderBottomWidth: 0.5,
    borderBottomColor: '#264532',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'NotoSans-SemiBold',
  },
  postsContainer: {
    flex: 1,
    marginBottom: 60,
  },
  postContainer: {
    marginBottom: 20,
    backgroundColor: '#122118',
    borderBottomWidth: 0.5,
    borderBottomColor: '#264532',
    borderTopWidth: 0.5,
    borderTopColor: '#264532',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  profileImageContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#94e0b2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2a4133',
  },
  postHeaderText: {
    flex: 1,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'NotoSans-SemiBold',
  },
  postTime: {
    color: '#94e0b2',
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
    marginTop: 2,
  },
  moreButton: {
    padding: 5,
  },
  sponsoredBadge: {
    backgroundColor: '#2a4133',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  sponsoredText: {
    color: '#94e0b2',
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#2a4133',
  },
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  adLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 10,
    borderRadius: 4,
    top: 0,
    left: 0,
  },
  adLabelText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
  },
  postContent: {
    color: 'white',
    fontSize: 15,
    padding: 12,
    paddingTop: 8,
    fontFamily: 'NotoSans-Regular',
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  actionButtonsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 8,
  },
  postStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statText: {
    color: '#94e0b2',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
    marginRight: 15,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1b3124',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 0.5,
    borderTopColor: '#264532',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  navButtonActive: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  navText: {
    color: '#94e0b2',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
  navTextActive: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4d4d',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'NotoSans-SemiBold',
    textAlign: 'center',
  },
});

export default HomeScreen;