// safely-home-frontend/screens/RiderTrackingScreen.js
// ✅ WITH CUSTOM ALERTS

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_URL } from '../config';
import { cancelRide } from '../services/api';
import socketService from '../services/socket';
import { makePhoneCall, makeEmergencyCall } from '../services/phoneUtils';
import { showAlert } from '../components/CustomAlert';
import ProfileAvatar from '../components/ProfileAvatar';

export default function RiderTrackingScreen({ navigation, route }) {
  const params = route.params || {};
  const rideId = params.rideId;
  const driver = params.driver || {};
  
  const [pickupLocation, setPickupLocation] = useState(params.pickup || '');
  const [destinationLocation, setDestinationLocation] = useState(params.destination || '');
  
  const [status, setStatus] = useState('Driver is on the way');
  const [arrivalTime, setArrivalTime] = useState('driver on his way');
  const [userId, setUserId] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [token, setToken] = useState(null);
  const [rideDetails, setRideDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('✅ RiderTrackingScreen loaded with:', {
      rideId,
      pickup: pickupLocation,
      destination: destinationLocation,
      driver: driver?.name
    });

    loadUser();
    setupSocketListeners();
    fetchRideDetails();
    
    return () => {
      socketService.off('rideCompleted');
      socketService.off('rideCancelled');
      socketService.off('rideStatusUpdate');
      socketService.off('newMessage');
    };
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const tokenData = await AsyncStorage.getItem('token');
      
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        socketService.connect(user.id);
      }
      
      if (tokenData) {
        setToken(tokenData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const fetchRideDetails = async () => {
    if (!rideId) {
      setLoading(false);
      return;
    }

    try {
      const tokenData = await AsyncStorage.getItem('token');
      
      if (!tokenData) {
        setLoading(false);
        return;
      }

      console.log('📡 Fetching ride details for:', rideId);
      
      const response = await fetch(`${API_URL}/rides/${rideId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const ride = data.ride || data;
        
        console.log('✅ Ride details fetched:', ride);
        
        setRideDetails(ride);
        
        if (!pickupLocation && ride?.pickup?.address) {
          setPickupLocation(ride.pickup.address);
        }
        if (!destinationLocation && ride?.destination?.address) {
          setDestinationLocation(ride.destination.address);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch ride details:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('rideCompleted', (data) => {
      showAlert(
        'Trip Completed! 🎉',
        'Thank you for riding with Safely Home. How was your experience?',
        [
          { 
            text: 'Rate Trip', 
            onPress: () => navigation.replace('Rating', { rideId, driver }) 
          }
        ],
        { type: 'success', cancelable: false }
      );
    });

    socketService.on('rideCancelled', (data) => {
      showAlert(
        'Ride Cancelled',
        'The driver has cancelled this ride. We apologize for the inconvenience.',
        [
          { 
            text: 'Find Another Ride', 
            onPress: () => navigation.goBack() 
          }
        ],
        { type: 'warning', cancelable: false }
      );
    });

    socketService.on('rideStatusUpdate', (data) => {
      if (data.status === 'arrived') {
        setStatus('🎯 Driver has arrived!');
        setArrivalTime('around the corner');
        showAlert(
          'Driver Arrived',
          'Your driver is waiting at the pickup location',
          [{ text: 'OK' }],
          { type: 'success' }
        );
      } else if (data.status === 'started') {
        setStatus('🚀 Trip in progress');
        setArrivalTime('heading to destination');
        showAlert(
          'Trip Started',
          'You are now on your way to the destination. Have a safe trip!',
          [{ text: 'OK' }],
          { type: 'success' }
        );
      }
    });

    socketService.on('newMessage', (message) => {
      if (message.rideId === rideId && message.senderId !== userId) {
        setUnreadMessages(prev => prev + 1);
      }
    });
  };

  const handleCallDriver = () => {
    makePhoneCall(driver?.phone, driver?.name || 'Driver');
  };

  const handleEmergency = () => {
    makeEmergencyCall();
  };

  const handleOpenChat = () => {
    setUnreadMessages(0);
    navigation.navigate('Chat', {
      rideId: rideId,
      otherUser: driver,
      userType: 'rider'
    });
  };

  const handleCancelRide = () => {
    showAlert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? This may affect your rider rating.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRide(rideId);
              showAlert(
                'Ride Cancelled',
                'Your ride has been cancelled successfully',
                [{ text: 'OK', onPress: () => navigation.goBack() }],
                { type: 'info' }
              );
            } catch (error) {
              showAlert(
                'Cancellation Failed',
                'Failed to cancel ride. Please try again or contact support.',
                [{ text: 'OK' }],
                { type: 'error' }
              );
            }
          }
        }
      ],
      { type: 'warning' }
    );
  };

  const handleReportIssue = () => {
    navigation.navigate('ReportIssue', { rideId, driver });
  };

  const handleBackPress = () => {
    showAlert(
      'Ride in Progress',
      'You have an active ride. Please complete or cancel the ride before leaving this screen.',
      [{ text: 'OK' }],
      { type: 'info' }
    );
  };

  if (loading && !pickupLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Your Ride</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Your Ride</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusContainer}>
          <Text style={styles.arrivalTime}>{arrivalTime} </Text>
          <View style={styles.navigationIcon}>
            <Text style={styles.navigationIconText}>🧭</Text>
          </View>
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <ProfileAvatar user={driver} size={70} fontSize={28} />
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingStar}>⭐</Text>
                <Text style={styles.ratingText}>
                  {driver?.rating ? Number(driver.rating).toFixed(1) : '0.0'} • ({driver?.totalRides || 0}) rides
                </Text>
              </View>
              <Text style={styles.genderText}>
                {driver?.gender === 'female' ? '👩 Female Driver' : '👨 Male Driver'}
              </Text>
            </View>
          </View>

          <View style={styles.vehicleInfoCard}>
            <Text style={styles.vehicleIcon}>🚗</Text>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleText}>{driver?.vehicleInfo?.model || 'Vehicle'}</Text>
              <Text style={styles.vehiclePlate}>{driver?.vehicleInfo?.licensePlate || 'License'}</Text>
            </View>
          </View>

          <View style={styles.driverActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCallDriver}>
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionLabel}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenChat}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionLabel}>Message</Text>
              {unreadMessages > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => showAlert('Share Ride', 'Share ride details with your contacts for safety', [{ text: 'OK' }], { type: 'info' })}
            >
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tripInfo}>
            <View style={styles.tripRow}>
              <Text style={styles.tripIcon}>📍</Text>
              <View style={styles.tripTextContainer}>
                <Text style={styles.tripLabel}>Pickup Location</Text>
                <Text style={styles.tripValue}>{pickupLocation || 'Loading...'}</Text>
              </View>
            </View>
            <View style={styles.tripDivider} />
            <View style={styles.tripRow}>
              <Text style={styles.tripIcon}>🎯</Text>
              <View style={styles.tripTextContainer}>
                <Text style={styles.tripLabel}>Destination</Text>
                <Text style={styles.tripValue}>{destinationLocation || 'Loading...'}</Text>
              </View>
            </View>
          </View>

          {rideDetails && (
            <View style={styles.rideDetailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>💰 Fare</Text>
                <Text style={styles.detailValue}>{rideDetails.fare?.toFixed(2) || '0.00'} pkr</Text>
              </View>
              {rideDetails.distance && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>📍 Distance</Text>
                  <Text style={styles.detailValue}>{rideDetails.distance.toFixed(2)} km</Text>
                </View>
              )}
              {rideDetails.estimatedTime && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>⏱️ ETA</Text>
                  <Text style={styles.detailValue}>{rideDetails.estimatedTime} mins</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.buttonSection}>
            <TouchableOpacity style={styles.reportButton} onPress={handleReportIssue}>
              <Text style={styles.reportButtonText}>🚨 Report Safety Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.text },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  backButton: { fontSize: 30, color: COLORS.accent },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  scrollContent: { paddingBottom: 30 },
  statusContainer: { alignItems: 'center', padding: 30 },
  arrivalTime: { fontSize: 28, fontWeight: 'bold', color: COLORS.accent },
  navigationIcon: { marginVertical: 20 },
  navigationIconText: { fontSize: 80 },
  statusText: { fontSize: 18, color: COLORS.text, textAlign: 'center' },
  driverCard: { backgroundColor: COLORS.secondary, marginHorizontal: 20, borderRadius: 20, padding: 25 },
  driverInfo: { flexDirection: 'row', marginBottom: 20 },
  driverAvatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  driverAvatarText: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },
  driverDetails: { flex: 1, justifyContent: 'center', marginLeft: 15 },
  driverName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  ratingStar: { fontSize: 16, marginRight: 5 },
  ratingText: { fontSize: 14, color: COLORS.text },
  genderText: { fontSize: 14, color: COLORS.accent, marginTop: 3 },
  vehicleInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, marginBottom: 20 },
  vehicleIcon: { fontSize: 30, marginRight: 15 },
  vehicleDetails: { flex: 1 },
  vehicleText: { fontSize: 16, color: COLORS.text, fontWeight: 'bold', marginBottom: 3 },
  vehiclePlate: { fontSize: 14, color: COLORS.accent, fontWeight: 'bold' },
  driverActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  actionButton: { alignItems: 'center', backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, minWidth: 70, position: 'relative' },
  actionIcon: { fontSize: 28, marginBottom: 5 },
  actionLabel: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  badge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.light, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: COLORS.textDark, fontSize: 12, fontWeight: 'bold' },
  tripInfo: { backgroundColor: COLORS.primary, borderRadius: 15, padding: 15, marginBottom: 15 },
  tripRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  tripIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  tripTextContainer: { flex: 1 },
  tripLabel: { fontSize: 12, color: COLORS.text, opacity: 0.7, marginBottom: 4 },
  tripValue: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  tripDivider: { height: 1, backgroundColor: COLORS.secondary, marginVertical: 5 },
  rideDetailsCard: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, marginBottom: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 13, color: COLORS.text },
  detailValue: { fontSize: 14, color: COLORS.accent, fontWeight: 'bold' },
  buttonSection: {},
  reportButton: { backgroundColor: COLORS.light, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  reportButtonText: { fontSize: 16, color: COLORS.textDark, fontWeight: 'bold' },
  cancelButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
});