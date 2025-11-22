import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_URL } from '../config';
import { completeRide, cancelRide } from '../services/api';
import socketService from '../services/socket';

export default function DriverTrackingScreen({ navigation, route }) {
  const { rideId, rider, pickup, destination } = route.params || {};
  const [rideStatus, setRideStatus] = useState('heading_to_pickup');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [userId, setUserId] = useState(null);
  
  const [rideDetails, setRideDetails] = useState(null);
  const [token, setToken] = useState(null);
  const [riderInfo, setRiderInfo] = useState(rider || {});

  useEffect(() => {
    console.log('🔍 Route params received:', {
      rideId,
      rider: rider,
      pickup,
      destination
    });

    loadUser();
    setupSocketListeners();
    
    return () => {
      socketService.off('rideCancelled');
      socketService.off('newMessage');
    };
  }, []);

  useEffect(() => {
    if (token && rideId) {
      fetchRideDetails();
    }
  }, [token, rideId]);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    const tokenData = await AsyncStorage.getItem('token');
    
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user.id);
    }
    
    if (tokenData) {
      setToken(tokenData);
    }
  };

  const fetchRideDetails = async () => {
    if (!rideId || !token) return;

    try {
      console.log('📡 Fetching ride details for:', rideId);
      
      const response = await fetch(`${API_URL}/rides/${rideId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Ride details fetched:', data);
        setRideDetails(data.ride || data);
      }
    } catch (error) {
      console.error('❌ Failed to fetch ride details:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('rideCancelled', () => {
      Alert.alert('Ride Cancelled', 'Rider cancelled the ride', [
        { text: 'OK', onPress: () => navigation.replace('DriverHome') }
      ]);
    });

    socketService.on('newMessage', (message) => {
      if (message.rideId === rideId && message.senderId !== userId) {
        setUnreadMessages(prev => prev + 1);
      }
    });
  };

  const handleCallRider = () => {
    const phoneNumber = riderInfo?.phone;
    
    console.log('📞 Calling rider:', { riderName: riderInfo?.name, phoneNumber });
    
    if (!phoneNumber) {
      Alert.alert('Error', 'Rider phone number not available');
      return;
    }

    Alert.alert(
      'Call Rider',
      `Do you want to call ${riderInfo?.name || 'Rider'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            const url = `tel:${phoneNumber}`;
            Linking.canOpenURL(url)
              .then((supported) => {
                if (supported) {
                  return Linking.openURL(url);
                } else {
                  Alert.alert('Error', 'Unable to make phone calls on this device');
                }
              })
              .catch((err) => {
                console.error('Error opening dialer:', err);
                Alert.alert('Error', 'Failed to open phone dialer');
              });
          }
        }
      ]
    );
  };

  const handleOpenChat = () => {
    setUnreadMessages(0);
    
    navigation.navigate('Chat', {
      rideId: rideId,
      otherUser: riderInfo,
      userType: 'driver'
    });
  };

  const openGoogleMaps = (location, label) => {
    if (!location) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    const url = Platform.select({
      ios: `maps://app?daddr=${encodeURIComponent(location)}&dirflg=d`,
      android: `google.navigation:q=${encodeURIComponent(location)}&mode=d`
    });

    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}&travelmode=driving`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(fallbackUrl);
        }
      })
      .catch((err) => {
        console.error('Error opening maps:', err);
        Linking.openURL(fallbackUrl).catch(() => {
          Alert.alert('Error', 'Unable to open maps');
        });
      });
  };

  const handleArrivedAtPickup = () => {
    setRideStatus('at_pickup');
    socketService.emit('rideStatusUpdate', { rideId: rideId, status: 'arrived' });
    Alert.alert('Great! 👍', 'Let the rider know you have arrived');
  };

  const handleStartTrip = () => {
    Alert.alert('Start Trip', 'Have you picked up the rider?', [
      { text: 'Not Yet', style: 'cancel' },
      {
        text: 'Yes, Start Trip',
        onPress: () => {
          setRideStatus('in_progress');
          socketService.emit('rideStatusUpdate', { rideId: rideId, status: 'started' });
          Alert.alert('Trip Started 🚀', 'Navigate to destination');
        }
      }
    ]);
  };

  const handleCompleteRide = () => {
    Alert.alert('Complete Ride', 'Have you reached the destination?', [
      { text: 'Not Yet', style: 'cancel' },
      {
        text: 'Yes, Complete',
        onPress: async () => {
          try {
            await completeRide(rideId);
            const fare = rideDetails?.fare || 12.50;
            const earnings = (fare * 0.80).toFixed(2);
            Alert.alert('✅ Ride Completed!', `Great job! Earnings: $${earnings}`, [
              { text: 'Back to Home', onPress: () => navigation.replace('DriverHome') }
            ]);
          } catch (error) {
            Alert.alert('Error', 'Failed to complete ride');
          }
        }
      }
    ]);
  };

  const handleCancelRide = () => {
    Alert.alert('Cancel Ride', 'This may affect your rating.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelRide(rideId);
            navigation.replace('DriverHome');
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel ride');
          }
        }
      }
    ]);
  };

  // ✅ FIXED: Proper emergency 911 call function
  const handleEmergency = () => {
    Alert.alert(
      '🚨 Emergency Services',
      'This will call emergency services immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: () => {
            const emergencyNumber = '911';
            const url = `tel:${emergencyNumber}`;
            
            console.log('📞 Attempting to call emergency:', emergencyNumber);
            
            Linking.canOpenURL(url)
              .then((supported) => {
                if (supported) {
                  console.log('✅ Opening emergency dialer...');
                  Linking.openURL(url);
                } else {
                  Alert.alert('Error', 'Unable to make emergency call on this device');
                }
              })
              .catch((err) => {
                console.error('Error calling emergency:', err);
                Alert.alert('Error', 'Failed to call emergency services');
              });
          }
        }
      ]
    );
  };

  const getStatusText = () => {
    switch (rideStatus) {
      case 'heading_to_pickup': return 'Navigate to pickup location';
      case 'at_pickup': return 'Waiting for rider';
      case 'in_progress': return 'Trip in progress - Navigate to destination';
      default: return 'Navigate to pickup location';
    }
  };

  const getActionButton = () => {
    switch (rideStatus) {
      case 'heading_to_pickup':
        return (
          <TouchableOpacity style={styles.primaryButton} onPress={handleArrivedAtPickup}>
            <Text style={styles.primaryButtonText}>✓ I've Arrived at Pickup</Text>
          </TouchableOpacity>
        );
      case 'at_pickup':
        return (
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartTrip}>
            <Text style={styles.primaryButtonText}>🚀 Start Trip</Text>
          </TouchableOpacity>
        );
      case 'in_progress':
        return (
          <TouchableOpacity style={styles.primaryButton} onPress={handleCompleteRide}>
            <Text style={styles.primaryButtonText}>✓ Complete Ride</Text>
          </TouchableOpacity>
        );
      default: return null;
    }
  };

  const fare = rideDetails?.fare || 12.50;
  const earnings = (fare * 0.80).toFixed(2);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('Ride in Progress', 'Please complete or cancel the ride first')}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Ride</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {rideStatus === 'heading_to_pickup' && '🚗 Heading to Pickup'}
              {rideStatus === 'at_pickup' && '⏳ At Pickup Location'}
              {rideStatus === 'in_progress' && '🚀 Trip in Progress'}
            </Text>
          </View>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        <View style={styles.riderCard}>
          <View style={styles.riderInfo}>
            <View style={styles.riderAvatar}>
              <Text style={styles.riderAvatarText}>
                {riderInfo?.name?.split(' ').map(n => n[0]).join('') || 'R'}
              </Text>
            </View>
            <View style={styles.riderDetails}>
              <Text style={styles.riderName}>{riderInfo?.name || 'Rider'}</Text>
              <Text style={styles.riderPhone}>📞 {riderInfo?.phone || 'Phone'}</Text>
            </View>
          </View>

          <View style={styles.riderActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCallRider}>
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionLabel}>Call Rider</Text>
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
          </View>

          <View style={styles.tripInfo}>
            <View style={styles.tripRow}>
              <Text style={styles.tripIcon}>📍</Text>
              <View style={styles.tripTextContainer}>
                <Text style={styles.tripLabel}>Pickup Location</Text>
                <Text style={styles.tripValue}>{pickup || 'Pickup Location'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.navigateButton} 
                onPress={() => openGoogleMaps(pickup, 'Pickup')}
              >
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tripDivider} />
            
            <View style={styles.tripRow}>
              <Text style={styles.tripIcon}>🎯</Text>
              <View style={styles.tripTextContainer}>
                <Text style={styles.tripLabel}>Destination</Text>
                <Text style={styles.tripValue}>{destination || 'Destination'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.navigateButton} 
                onPress={() => openGoogleMaps(destination, 'Destination')}
              >
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fareInfo}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Trip Fare</Text>
              <Text style={styles.fareValue}>${fare.toFixed(2)}</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Your Earnings (80%)</Text>
              <Text style={styles.fareEarnings}>${earnings}</Text>
            </View>
            {rideDetails?.distance && (
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Distance</Text>
                <Text style={styles.fareValue}>{rideDetails.distance.toFixed(2)} km</Text>
              </View>
            )}
            {rideDetails?.estimatedTime && (
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>ETA</Text>
                <Text style={styles.fareValue}>{rideDetails.estimatedTime} mins</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonSection}>
            {getActionButton()}

            <View style={styles.secondaryButtons}>
              {/* ✅ FIXED: Emergency button now actually calls 911 */}
              <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergency}>
                <Text style={styles.emergencyButtonText}>🚨 Emergency</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
                <Text style={styles.cancelButtonText}>Cancel Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <Text style={styles.tipsText}>• Confirm rider identity before starting</Text>
          <Text style={styles.tipsText}>• Follow traffic rules and drive safely</Text>
          <Text style={styles.tipsText}>• Be courteous and professional</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  backButton: { fontSize: 30, color: COLORS.accent },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  scrollContent: { paddingBottom: 30 },
  statusContainer: { alignItems: 'center', padding: 25 },
  statusBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 15 },
  statusBadgeText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  statusText: { fontSize: 16, color: COLORS.text, textAlign: 'center' },
  riderCard: { backgroundColor: COLORS.secondary, marginHorizontal: 20, borderRadius: 20, padding: 25 },
  riderInfo: { flexDirection: 'row', marginBottom: 20 },
  riderAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  riderAvatarText: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark },
  riderDetails: { flex: 1, justifyContent: 'center' },
  riderName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  riderPhone: { fontSize: 14, color: COLORS.text, opacity: 0.8 },
  riderActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  actionButton: { alignItems: 'center', backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, minWidth: 100, position: 'relative' },
  actionIcon: { fontSize: 28, marginBottom: 5 },
  actionLabel: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  badge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.light, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: COLORS.textDark, fontSize: 12, fontWeight: 'bold' },
  tripInfo: { backgroundColor: COLORS.primary, borderRadius: 15, padding: 15, marginBottom: 20 },
  tripRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  tripIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  tripTextContainer: { flex: 1 },
  tripLabel: { fontSize: 12, color: COLORS.text, opacity: 0.7, marginBottom: 4 },
  tripValue: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  navigateButton: { backgroundColor: COLORS.accent, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  navigateButtonText: { fontSize: 12, color: COLORS.textDark, fontWeight: 'bold' },
  tripDivider: { height: 1, backgroundColor: COLORS.secondary, marginVertical: 5 },
  fareInfo: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, marginBottom: 20 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fareLabel: { fontSize: 14, color: COLORS.text },
  fareValue: { fontSize: 16, color: COLORS.text, fontWeight: 'bold' },
  fareEarnings: { fontSize: 18, color: COLORS.accent, fontWeight: 'bold' },
  buttonSection: {},
  primaryButton: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  primaryButtonText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  secondaryButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  emergencyButton: { flex: 1, backgroundColor: COLORS.light, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 5 },
  emergencyButtonText: { fontSize: 14, color: COLORS.textDark, fontWeight: 'bold' },
  cancelButton: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginLeft: 5 },
  cancelButtonText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  tipsCard: { backgroundColor: COLORS.secondary, marginHorizontal: 20, marginTop: 20, borderRadius: 15, padding: 20 },
  tipsTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  tipsText: { fontSize: 14, color: COLORS.text, opacity: 0.8, marginBottom: 5 },
});