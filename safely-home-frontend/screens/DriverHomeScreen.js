// ============================================
// DriverHomeScreen.js - WITH SIDEBAR
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Switch, 
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { updateDriverStatus, getAvailableRides, acceptRide, getDriverEarnings, getDriverStats, logout } from '../services/api';
import socketService from '../services/socket';
import Sidebar from '../components/Sidebar'; // ✅ Import sidebar

export default function DriverHomeScreen({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState([]);
  const [earnings, setEarnings] = useState({ totalEarnings: '0.00', todayEarnings: '0.00', todayRides: 0 });
  const [driverStats, setDriverStats] = useState({ totalRides: 0, averageRating: 0, reviews: [] });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false); // ✅ Sidebar state

  useEffect(() => {
    loadData();
    setupSocketListeners();

    return () => {
      socketService.off('newRideRequest');
      socketService.off('rideAcceptedByYou');
    };
  }, []);

  const loadData = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      socketService.connect(parsed.id);
    }

    await loadEarnings();
    await loadStats(); // ✅ NEW: Load driver stats
    if (isOnline) {
      await loadAvailableRides();
    }
  };

  const loadEarnings = async () => {
    try {
      const data = await getDriverEarnings();
      setEarnings(data);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    }
  };

  // ✅ NEW: Load driver stats including reviews
  const loadStats = async () => {
    try {
      const data = await getDriverStats();
      if (data.success) {
        setDriverStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load driver stats:', error);
    }
  };

  const loadAvailableRides = async () => {
    try {
      const data = await getAvailableRides();
      setAvailableRides(data.rides || []);
    } catch (error) {
      console.error('Failed to load rides:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('newRideRequest', (rideData) => {
      console.log('🚗 New ride request received:', rideData);
      
      loadAvailableRides();
      
      Alert.alert(
        '🚗 New Ride Request!',
        `Pickup: ${rideData.pickup}\nFare: ${rideData.fare} pkr`,
        [
          { text: 'Ignore', style: 'cancel' },
          { text: 'View', onPress: () => loadAvailableRides() },
          { text: 'Accept', onPress: () => handleAcceptRide(rideData.rideId, rideData) }
        ]
      );
    });

    socketService.on('rideAcceptedByYou', (data) => {
      console.log('✅ Ride accepted by you:', data);
      navigation.navigate('DriverTracking', {
        rideId: data.rideId,
        rider: data.rider,
        pickup: data.pickup || 'Pickup Location',
        destination: data.destination || 'Destination'
      });
    });
  };

  const handleToggleOnline = async () => {
    try {
      await updateDriverStatus(!isOnline);
      setIsOnline(!isOnline);
      if (!isOnline) {
        Alert.alert('You are now online', 'You will receive ride requests');
        loadAvailableRides();
      } else {
        Alert.alert('You are now offline', 'You will not receive ride requests');
        setAvailableRides([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleAcceptRide = async (rideId, rideData) => {
    try {
      const response = await acceptRide(rideId);

      const rider =
        rideData?.riderName && rideData?.riderPhone
          ? { name: rideData.riderName, phone: rideData.riderPhone }
          : response?.ride?.rider
          ? { name: response.ride.rider.name, phone: response.ride.rider.phone }
          : null;

      Alert.alert('Ride Accepted!', 'Navigate to pickup location', [
        {
          text: 'Start Navigation',
          onPress: () => {
            navigation.navigate('DriverTracking', {
              rideId: rideId,
              rider: rider,
              pickup: rideData.pickup,
              destination: rideData.destination
            });
          }
        }
      ]);

      loadAvailableRides();

    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to accept ride');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          if (isOnline) await updateDriverStatus(false);
          await logout();
          socketService.disconnect();
          navigation.replace('Login');
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* ✅ Menu button to open sidebar */}
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <Text style={styles.menuButton}>☰</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Sidebar component */}
      <Sidebar 
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
        userType="driver"
      />

      {/* Rest of the screen content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} tintColor={COLORS.accent} />
        }
      >
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[styles.statusValue, isOnline && styles.statusOnline]}>
                {isOnline ? '● Online' : '● Offline'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#767577', true: COLORS.accent }}
              thumbColor={isOnline ? COLORS.accent : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.cardTitle}>Today's Earnings </Text>
          <Text style={styles.earningsAmount}>{earnings.todayEarnings} pkr</Text>
          <View style={styles.earningsStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{earnings.todayRides}</Text>
              <Text style={styles.statLabel}>Rides Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{earnings.totalEarnings} pkr</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
          </View>
        </View>

        {/* ✅ NEW: Driver Stats Card with Reviews */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Your Performance</Text>
          <View style={styles.performanceStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{driverStats.totalRides}</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>⭐ {driverStats.averageRating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating </Text>
            </View>
          </View>

          {/* ✅ NEW: Display recent reviews */}
          {driverStats.reviews && driverStats.reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.reviewsTitle}>Recent Reviews</Text>
              {driverStats.reviews.slice(0, 3).map((review, index) => (
                <View key={index} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.riderName}</Text>
                    <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.ridesSection}>
          <Text style={styles.sectionTitle}>
            {isOnline ? `Available Rides (${availableRides.length})` : 'Go online to see rides'}
          </Text>

          {!isOnline && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🚗</Text>
              <Text style={styles.emptyText}>Turn online to receive ride requests</Text>
            </View>
          )}

          {isOnline && availableRides.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>⏳</Text>
              <Text style={styles.emptyText}>No rides available right now</Text>
              <Text style={styles.emptySubtext}>Pull down to refresh</Text>
            </View>
          )}

          {availableRides.map((ride, index) => (
            <View key={ride.id || index} style={styles.rideCard}>
              <View style={styles.rideHeader}>
                <View>
                  <Text style={styles.riderName}>👤 {ride.riderName}</Text>
                  <Text style={styles.rideTime}>📞 {ride.riderPhone}</Text>
                  <Text style={styles.rideTime}>
                    🕐 {new Date(ride.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.fareContainer}>
                  <Text style={styles.rideFare}>{ride.fare.toFixed(2)} pkr</Text>
                  <Text style={styles.fareLabel}>Fare </Text>
                </View>
              </View>

              <View style={styles.rideDetails}>
                <View style={styles.rideLocation}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText} numberOfLines={2}>{ride.pickup}</Text>
                </View>
                <View style={styles.rideLocation}>
                  <Text style={styles.locationIcon}>🎯</Text>
                  <Text style={styles.locationText} numberOfLines={2}>{ride.destination}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptRide(ride.id, ride)}
              >
                <Text style={styles.acceptButtonText}>✓ Accept Ride</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.primary 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 10 // ✅ Adjusted for SafeAreaView
  },
  menuButton: { // ✅ NEW
    fontSize: 30,
    color: COLORS.accent,
    fontWeight: 'bold'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  logoutButton: { backgroundColor: COLORS.light, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  logoutText: { fontSize: 14, color: COLORS.textDark, fontWeight: '600' },
  scrollView: { flex: 1 },
  statusCard: { backgroundColor: COLORS.secondary, margin: 20, marginTop: 10, padding: 20, borderRadius: 15 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontSize: 14, color: COLORS.text, marginBottom: 5 },
  statusValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  statusOnline: { color: COLORS.accent },
  earningsCard: { backgroundColor: COLORS.secondary, marginHorizontal: 20, marginBottom: 20, padding: 25, borderRadius: 15, alignItems: 'center' },
  // ✅ NEW: Stats card styling
  statsCard: { backgroundColor: COLORS.secondary, marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 15 },
  performanceStats: { flexDirection: 'row', width: '100%', marginBottom: 15 },
  reviewsSection: { marginTop: 15, borderTopWidth: 1, borderTopColor: COLORS.primary, paddingTop: 15 },
  reviewsTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  reviewItem: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  reviewerName: { fontSize: 13, fontWeight: 'bold', color: COLORS.text },
  reviewRating: { fontSize: 13, color: COLORS.accent },
  reviewComment: { fontSize: 12, color: COLORS.text, opacity: 0.8 },
  cardTitle: { fontSize: 16, color: COLORS.text, marginBottom: 10 },
  earningsAmount: { fontSize: 42, fontWeight: 'bold', color: COLORS.accent, marginBottom: 20 },
  earningsStats: { flexDirection: 'row', width: '100%' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  statLabel: { fontSize: 12, color: COLORS.text, opacity: 0.7 },
  statDivider: { width: 1, backgroundColor: COLORS.primary, marginHorizontal: 20 },
  ridesSection: { marginHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  emptyContainer: { backgroundColor: COLORS.secondary, borderRadius: 15, padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyText: { fontSize: 16, color: COLORS.text, textAlign: 'center', marginBottom: 5 },
  emptySubtext: { fontSize: 14, color: COLORS.text, opacity: 0.6, textAlign: 'center' },
  rideCard: { backgroundColor: COLORS.secondary, borderRadius: 15, padding: 20, marginBottom: 15 },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  riderName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  rideTime: { fontSize: 13, color: COLORS.text,opacity: 0.7, marginTop: 3 },
  rideTime: { fontSize: 13, color: COLORS.text, opacity: 0.7, marginTop: 3 },
  fareContainer: { alignItems: 'flex-end' },
  rideFare: { fontSize: 28, fontWeight: 'bold', color: COLORS.accent },
  fareLabel: { fontSize: 12, color: COLORS.text, opacity: 0.7 },
  rideDetails: { marginBottom: 15 },
  rideLocation: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 },
  locationIcon: { fontSize: 18, marginRight: 10, marginTop: 2 },
  locationText: { flex: 1, fontSize: 14, color: COLORS.text },
  acceptButton: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  acceptButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  scrollContent: {
    paddingBottom: 100 // ✅ Extra padding for Android nav buttons
  }
});