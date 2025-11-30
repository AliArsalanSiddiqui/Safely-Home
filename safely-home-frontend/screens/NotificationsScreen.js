// safely-home-frontend/screens/NotificationsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // In a real app, fetch from API
      // For now, use mock data
      const mockNotifications = [
        {
          id: '1',
          type: 'ride',
          title: 'Ride Completed',
          message: 'Your ride to Downtown was completed successfully',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          read: false,
          icon: '✅'
        },
        {
          id: '2',
          type: 'rating',
          title: 'New Rating Received',
          message: 'You received a 5-star rating from your last ride',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          read: true,
          icon: '⭐'
        },
        {
          id: '3',
          type: 'promo',
          title: 'Special Offer',
          message: 'Get 20% off your next 3 rides! Limited time only',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          read: true,
          icon: '🎉'
        },
        {
          id: '4',
          type: 'system',
          title: 'Profile Updated',
          message: 'Your profile information was updated successfully',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          read: true,
          icon: '👤'
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const NotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {notifications.length > 0 && (
        <View style={styles.actionsBar}>
          <Text style={styles.unreadCount}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </Text>
          <View style={styles.actionsButtons}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={markAllAsRead}
              >
                <Text style={styles.actionButtonText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={clearAll}
            >
              <Text style={styles.actionButtonText}>Clear all</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationItem item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You'll see updates about your rides and account here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10
  },
  backButton: { fontSize: 30, color: COLORS.accent },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },

  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.secondary,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12
  },
  unreadCount: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600'
  },
  actionsButtons: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primary
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600'
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30
  },

  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    borderRadius: 15,
    padding: 15,
    marginBottom: 12
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent
  },
  notificationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  iconText: {
    fontSize: 24
  },
  notificationContent: {
    flex: 1
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginLeft: 8
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 4
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.5
  },

  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 40
  }
});