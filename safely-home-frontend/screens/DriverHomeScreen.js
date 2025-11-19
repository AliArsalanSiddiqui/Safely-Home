import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { updateDriverStatus, getAvailableRides, acceptRide, getDriverEarnings, logout } from '../services/api';
import socketService from '../services/socket';

export default function DriverHomeScreen({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState([]);
  const [earnings, setEarnings] = useState({ totalEarnings: '0.00', todayEarnings: '0.00', todayRides: 0 });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

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

  const loadAvailableRides = async () => {
    try {
      const data = await getAvailableRides();
      setAvailableRides(data.rides || []);
    } catch (error) {
      console.error('Failed to load rides:', error);
    }
  };

  const setupSocketListeners = () => {
    // FIXED: Real-time ride request notification
    socketService.on('newRideRequest', (rideData) => {
      console.log('🚗 New ride request received:', rideData);
      
      // Add to available rides list
      loadAvailableRides();
      
      Alert.alert(
        '🚗 New Ride Request!',
        `Pickup: ${rideData.pickup}\nFare: $${rideData.fare}`,
        [
          { text: 'Ignore', style: 'cancel' },
          { text: 'View', onPress: () => loadAvailableRides() },
          { text: 'Accept', onPress: () => handleAcceptRide(rideData.rideId, rideData) }
        ]
      );
    });

    // FIXED: Navigate to tracking when ride is accepted
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
      
      Alert.alert('Ride Accepted!', 'Navigate to pickup location', [
        { 
          text: 'Start Navigation', 
          onPress: () => {
            // Navigate to driver tracking screen
            navigation.navigate('DriverTracking', {
              rideId: rideId,
              rider: rideData.riderName ? { name: rideData.riderName, phone: rideData.riderPhone } : response.ride?.riderId,
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
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
          <Text style={styles.cardTitle}>Today's Earnings</Text>
          <Text style={styles.earningsAmount}>${earnings.todayEarnings}</Text>
          <View style={styles.earningsStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{earnings.todayRides}</Text>
              <Text style={styles.statLabel}>Rides Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>${earnings.totalEarnings}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
          </View>
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
                  <Text style={styles.rideFare}>${ride.fare}</Text>
                  <Text style={styles.fareLabel}>Fare</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
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
});