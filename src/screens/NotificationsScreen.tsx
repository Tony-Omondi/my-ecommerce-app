import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api/api';
import * as Font from 'expo-font';

interface Sender {
  id: number;
  username: string;
  email: string;
}

interface Notification {
  id: number;
  sender: Sender;
  notification_type: 'like' | 'comment' | 'follow' | 'campaign_support' | 'order' | 'general';
  content_type_name?: string;
  object_id?: number;
  message: string;
  is_read: boolean;
  timestamp: string;
}

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const initialize = async () => {
        if (!fontsLoaded) {
          await Font.loadAsync({
            'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
            'NotoSans-SemiBold': require('../../assets/fonts/NotoSans-Regular.ttf'),
          });
          setFontsLoaded(true);
        }
        await fetchNotifications();
      };
      initialize();
      return () => {}; // Cleanup
    }, [fontsLoaded])
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('user_id');
      console.log('Fetching notifications for user ID:', userId, 'Token:', token ? 'Valid' : 'Missing');
      if (!token) {
        Alert.alert('Error', 'You must be logged in to view notifications.');
        navigation.navigate('Login');
        return;
      }
      const response = await getNotifications();
      console.log('✅ Notifications API response:', response.data);
      setNotifications(response.data);
      if (response.data.length === 0) {
        console.log('No notifications found for user ID:', userId);
      }
    } catch (err: any) {
      console.error('Fetch notifications error:', err?.response || err);
      setError(err.response?.data?.error || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
    } catch (err: any) {
      console.error('Mark as read error:', err?.response || err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to mark notification as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      Alert.alert('Success', 'All notifications marked as read.');
    } catch (err: any) {
      console.error('Mark all as read error:', err?.response || err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to mark all notifications as read.');
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    console.log('Notification pressed:', notification);
    if (notification.notification_type === 'follow') {
      navigation.navigate('Profile', { userId: notification.sender.id });
    } else if (['like', 'comment'].includes(notification.notification_type) && notification.content_type_name === 'post' && notification.object_id) {
      navigation.navigate('PostDetail', { postId: notification.object_id });
    } else {
      Alert.alert('Info', `Navigation for ${notification.notification_type} not yet implemented.`);
    }
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
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

  if (!fontsLoaded || loading) {
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
        <TouchableOpacity style={styles.button} onPress={fetchNotifications}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some(notif => !notif.is_read) && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.buttonText}>Mark All as Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#94e0b2"
          />
        }
      >
        {notifications.length === 0 ? (
          <Text style={styles.noNotificationsText}>No notifications available.</Text>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationContainer,
                notification.is_read ? styles.readNotification : styles.unreadNotification,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationContent}>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                  {formatTime(notification.timestamp)}
                </Text>
                <Text style={styles.notificationType}>
                  {notification.notification_type.charAt(0).toUpperCase() +
                    notification.notification_type.slice(1)}
                </Text>
              </View>
              {!notification.is_read && (
                <Ionicons name="ellipse" size={10} color="#94e0b2" style={styles.unreadIndicator} />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141f18',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#264532',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'NotoSans-SemiBold',
  },
  markAllButton: {
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'NotoSans-SemiBold',
  },
  scrollContent: {
    padding: 15,
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  readNotification: {
    backgroundColor: '#122118',
  },
  unreadNotification: {
    backgroundColor: '#1e2b22',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
    marginBottom: 5,
  },
  notificationTime: {
    color: '#94e0b2',
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
  },
  notificationType: {
    color: '#94e0b2',
    fontSize: 12,
    fontFamily: 'NotoSans-SemiBold',
    marginTop: 5,
  },
  unreadIndicator: {
    marginLeft: 10,
  },
  noNotificationsText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141f18',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'NotoSans-Regular',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#94e0b2',
    alignItems: 'center',
  },
});

export default NotificationsScreen;