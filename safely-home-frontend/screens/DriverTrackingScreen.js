import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { COLORS } from '../config';
import { completeRide, cancelRide } from '../services/api';
import socketService from '../services/socket';

export default function DriverTrackingScreen({ navigation, route }) {
  const { rideId, rider, pickup, destination } = route.params;
  const [rideStatus, setRideStatus] = useState('heading_to_pickup');

  useEffect(() => {
    setupSocketListeners();
    
    return () => {
      socketService.off('rideCancelled');
    };
  }, []);

  const setupSocketListeners = () => {
    socketService.on('rideCancelled', () => {
      Alert.alert('Ride Cancelled', 'Rider cancelled the ride', [
        { text: 'OK', onPress: () => navigation.replace('DriverHome') }
      ]);
    });
  };

  const handleArrivedAtPickup = () => {
    setRideStatus('at_pickup');
    socketService.emit('rideStatusUpdate', { rideId, status: 'arrived' });
    Alert.alert('Great!', 'Let the rider know you have arrived');
  };

  const handleStartTrip = () => {
    Alert.alert(
      'Start Trip',
      'Have you picked up the rider?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Start Trip',
          onPress: () => {
            setRideStatus('in_progress');
            socketService.emit('rideStatusUpdate', { rideId, status: 'started' });
            Alert.alert('Trip Started', 'Navigate to destination');
          }
        }
      ]
    );
  };

  const handleCompleteRide = () => {
    Alert.alert(
      'Complete Ride',
      'Have you reached the destination?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              await completeRide(rideId);
              Alert.alert(
                '✅ Ride Completed!',
                'Great job! Earnings will be added to your account.',
                [
                  { 
                    text: 'Back to Home', 
                    onPress: () => navigation.replace('DriverHome') 
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to complete ride');
            }
          }
        }
      ]
    );
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? This may affect your rating.',
      [
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
      ]
    );
  };

  const getStatusText = () => {
    switch (rideStatus) {
      case 'heading_to_pickup':
        return 'Navigate to pickup location';
      case 'at_pickup':
        return 'Waiting for rider';
      case 'in_progress':
        return 'Trip in progress - Navigate to destination';
      default:
        return 'Navigate to pickup location';
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
      default:
        return null;
    }
  };

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
                {rider?.name?.split(' ').map(n => n[0]).join('') || 'R'}
              </Text>
            </View>
            <View style={styles.riderDetails}>
              <Text style={styles.riderName}>{rider?.name || 'Rider'}</Text>
              <Text style={styles.riderPhone}>📞 {rider?.phone || 'Phone number'}</Text>
            </View>
          </View>

          <View style={styles.riderActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Calling...', rider?.phone)}>
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionLabel}>Call Rider</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Messaging...', 'Opening chat')}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionLabel}>Message</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tripInfo}>
            <View style={styles.tripRow}>
              <Text style={styles.tripIcon}>📍</Text>
              <View style={styles.tripTextContainer}>
                <Text style={styles.tripLabel}>Pickup Location</Text>
                <Text style={styles.tripValue}>{pickup}</Text>
              </View>
              <TouchableOpacity style={styles.navigateButton} onPress={() => Alert.alert('Navigation', 'Opening maps...')}>
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tripDivider} />
            
            <View style={styles.tripRow}>
              <Text style={styles.tripIcon}>🎯</Text>
              <View style={styles.tripTextContainer}>
                <Text style={styles.tripLabel}>Destination</Text>
                <Text style={styles.tripValue}>{destination}</Text>
              </View>
              <TouchableOpacity style={styles.navigateButton} onPress={() => Alert.alert('Navigation', 'Opening maps...')}>
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fareInfo}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Trip Fare</Text>
              <Text style={styles.fareValue}>$12.50</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Your Earnings (80%) </Text>
              <Text style={styles.fareEarnings}>$10.00</Text>
            </View>
          </View>

          <View style={styles.buttonSection}>
            {getActionButton()}

            <View style={styles.secondaryButtons}>
              <TouchableOpacity style={styles.emergencyButton} onPress={() => Alert.alert('Emergency', 'Calling emergency services...')}>
                <Text style={styles.emergencyButtonText}>🚨 Emergency </Text>
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

// FIXED: Proper StyleSheet definition
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
  riderInfo: { paddingLeft: 40,flexDirection: 'row', marginBottom: 20 },
  riderAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  riderAvatarText: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark },
  riderDetails: { flex: 1, justifyContent: 'center' },
  riderName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  riderPhone: { fontSize: 14, color: COLORS.text, opacity: 0.8 },
  riderActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  actionButton: { alignItems: 'center', backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, minWidth: 100 },
  actionIcon: { fontSize: 28, marginBottom: 5 },
  actionLabel: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  tripInfo: { backgroundColor: COLORS.primary, borderRadius: 15, padding: 15, marginBottom: 20 },
  tripRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  tripIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  tripTextContainer: { flex: 1 },
  tripLabel: { fontSize: 12, color: COLORS.text, opacity: 0.7, marginBottom: 4 },
  tripValue: { fontSize: 14, color: COLORS.text },
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