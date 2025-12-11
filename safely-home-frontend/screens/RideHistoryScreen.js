// safely-home-frontend/screens/RideHistoryScreen.js
// ✅ COMPLETE - SHOWS ALL COMPLETED/CANCELLED RIDES

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_URL } from '../config';
import ProfileAvatar from '../components/ProfileAvatar';

export default function RideHistoryScreen({ navigation }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(null);
  const [userType, setUserType] = useState('rider');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tokenData = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
       if (userData) {
      const user = JSON.parse(userData);
      console.log('🔍 Current User:', {
        id: user.id,
        name: user.name,
        userType: user.userType
      });
      setUserType(user.userType);
    }
    // ✅ END DEBUG CODE
    
    if (tokenData) setToken(tokenData);

      await fetchRideHistory(tokenData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRideHistory = async (authToken) => {
  try {
    console.log('📜 Fetching ride history...');
    console.log('🔑 Token:', authToken ? 'Present' : 'Missing');
    
    const response = await fetch(`${API_URL}/rides/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response data:', data);
      console.log(`📊 Loaded ${data.rides?.length || 0} historical rides`);
      setRides(data.rides || []);
    } else {
      const errorData = await response.text();
      console.error('❌ Failed to fetch history:', response.status, errorData);
    }
  } catch (error) {
    console.error('❌ Failed to fetch ride history:', error);
  }
};

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRideHistory(token);
    setRefreshing(false);
  };

  const RideCard = ({ ride }) => {
    const otherUser = userType === 'rider' ? ride.driverId : ride.riderId;
  return (
    <View style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={[
          styles.statusBadge,
          ride.status === 'completed' ? styles.statusCompleted : styles.statusCancelled
        ]}>
          <Text style={styles.statusText}>
            {ride.status === 'completed' ? '✓ Completed' : '✗ Cancelled'}
          </Text>
        </View>
        <Text style={styles.rideDate}>
          {new Date(ride.createdAt).toLocaleDateString()} </Text>
      </View>

      <View style={styles.locationRow}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText} numberOfLines={1}>
          {ride.pickup?.address || 'Pickup location'}
        </Text>
      </View>

      <View style={styles.locationRow}>
        <Text style={styles.locationIcon}>🎯</Text>
        <Text style={styles.locationText} numberOfLines={1}>
          {ride.destination?.address || 'Destination'}
        </Text>
      </View>

      <View style={styles.rideFooter}>
        <View style={styles.personInfo}>
          <ProfileAvatar 
            user={otherUser} 
            size={40} 
            fontSize={16} 
            style={{ marginRight: 10 }}
          />
          <Text style={styles.personName}>
            {otherUser?.name || (userType === 'rider' ? 'Driver' : 'Rider')}
          </Text>
        </View>
        
        <View style={styles.fareContainer}>
          <Text style={styles.fareAmount}>{ride.fare?.toFixed(2) || '0.00'} pkr</Text>
          {ride.distance && (
            <Text style={styles.fareSubtext}>{ride.distance.toFixed(1)} km </Text>
          )}
        </View>
      </View>

      {ride.feedback?.rating && (
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Rating:</Text>
          <Text style={styles.ratingStars}>{'⭐'.repeat(ride.feedback.rating)}</Text>
        </View>
      )}
    </View>
  );
 }
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ride History</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride History</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={rides}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <RideCard ride={item} />}
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
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyText}>No ride history yet</Text>
            <Text style={styles.emptySubtext}>
              Your completed rides will appear here
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.text },
  listContent: { padding: 20, paddingBottom: 100 },
  rideCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statusCompleted: {
    backgroundColor: COLORS.accent + '30'
  },
  statusCancelled: {
    backgroundColor: COLORS.light + '30'
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.accent
  },
  rideDate: {
    fontSize: 13,
    color: COLORS.text,
    opacity: 0.7
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 10
  },
  locationIcon: { fontSize: 18, marginRight: 10 },
  locationText: { 
    flex: 1, 
    fontSize: 14, 
    color: COLORS.text 
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  personIcon: { fontSize: 20, marginRight: 8 },
  personName: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  fareContainer: { alignItems: 'flex-end' },
  fareAmount: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.accent 
  },
  fareSubtext: { 
    fontSize: 12, 
    color: COLORS.text, 
    opacity: 0.7,
    marginTop: 2
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary
  },
  ratingLabel: {
    fontSize: 13,
    color: COLORS.text,
    marginRight: 8
  },
  ratingStars: { fontSize: 14 },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100
  },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
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
    textAlign: 'center'
  }
});