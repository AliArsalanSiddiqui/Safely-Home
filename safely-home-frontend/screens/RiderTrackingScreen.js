import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { COLORS } from '../config';
import { cancelRide } from '../services/api';
import socketService from '../services/socket';

export default function RiderTrackingScreen({ navigation, route }) {
  const { rideId, driver, pickup, destination } = route.params;
  const [status, setStatus] = useState('Driver is on its way ');
  const [arrivalTime, setArrivalTime] = useState('5 mins');

  useEffect(() => {
    setupSocketListeners();
    
    return () => {
      socketService.off('rideCompleted');
      socketService.off('rideCancelled');
      socketService.off('rideStatusUpdate');
    };
  }, []);

  const setupSocketListeners = () => {
    socketService.on('rideCompleted', (data) => {
      console.log('✅ Ride completed by driver');
      Alert.alert(
        'Trip Completed!',
        'How was your experience?',
        [
          { 
            text: 'Rate Trip', 
            onPress: () => navigation.replace('Rating', { 
              rideId: rideId, 
              driver: driver 
            }) 
          }
        ]
      );
    });

    socketService.on('rideCancelled', () => {
      Alert.alert('Ride Cancelled', 'Driver cancelled the ride', [
        { text: 'OK', onPress: () => navigation.replace('RiderHome') }
      ]);
    });

    socketService.on('rideStatusUpdate', (data) => {
      if (data.status === 'arrived') {
        setStatus('Driver has arrived!');
        setArrivalTime('Now');
      } else if (data.status === 'started') {
        setStatus('Trip in progress');
      }
    });
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRide(rideId);
              navigation.replace('RiderHome');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel ride');
            }
          }
        }
      ]
    );
  };

  const handleReportIssue = () => {
    navigation.navigate('ReportIssue', { rideId, driver });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('Ride in Progress', 'Please complete or cancel the ride first')}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Your Ride</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusContainer}>
          <Text style={styles.arrivalTime}>Arriving in {arrivalTime}</Text>
          <View style={styles.navigationIcon}>
            <Text style={styles.navigationIconText}>🧭</Text>
          </View>
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>
                {driver?.name?.split(' ').map(n => n[0]).join('') || 'D'}
              </Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingStar}>⭐</Text>
                <Text style={styles.ratingText}>{driver?.rating || '4.9'} ({driver?.totalTrips || '234)'} trips)</Text>
              </View>
              <Text style={styles.genderText}>
                {driver?.gender === 'female' ? '👩 Female Driver' : '👨 Male Driver'}
              </Text>
            </View>
          </View>

          <View style={styles.vehicleInfoCard}>
            <Text style={styles.vehicleIcon}>🚗</Text>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleText}>{driver?.vehicleInfo?.model || 'Toyota Camry'}</Text>
              <Text style={styles.vehiclePlate}>{driver?.vehicleInfo?.licensePlate || 'ABC-1234'}</Text>
            </View>
          </View>

          <View style={styles.driverActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Calling...', driver?.phone)}>
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionLabel}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Messaging...', 'Opening chat')}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionLabel}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Share', 'Sharing ride details...')}>
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tripInfo}>
            <View style={styles.tripRow}>
              <Text style={styles.tripIcon}>📍</Text>
              <View style={styles.tripTextContainer}>
                <Text style={styles.tripLabel}>Pickup</Text>
                <Text style={styles.tripValue}>{pickup}</Text>
              </View>
            </View>
            <View style={styles.tripDivider} />
            <View style={styles.tripRow}>
              <Text style={styles.tripIcon}>🎯</Text>
              <View style={styles.tripTextContainer}>
                <Text style={styles.tripLabel}>Destination</Text>
                <Text style={styles.tripValue}>{destination}</Text>
              </View>
            </View>
          </View>

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

// FIXED: Proper StyleSheet definition
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  backButton: { fontSize: 30, color: COLORS.accent },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  scrollContent: { paddingBottom: 30 },
  statusContainer: { alignItems: 'center', padding: 30 },
  arrivalTime: { fontSize: 28, fontWeight: 'bold', color: COLORS.accent },
  navigationIcon: { marginVertical: 20 },
  navigationIconText: { fontSize: 80 },
  statusText: { fontSize: 18, color: COLORS.text },
  driverCard: { backgroundColor: COLORS.secondary, marginHorizontal: 20, borderRadius: 20, padding: 25 },
  driverInfo: { flexDirection: 'row', marginBottom: 20 },
  driverAvatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  driverAvatarText: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },
  driverDetails: { flex: 1, justifyContent: 'center' },
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
  actionButton: { alignItems: 'center', backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, minWidth: 80 },
  actionIcon: { fontSize: 28, marginBottom: 5 },
  actionLabel: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  tripInfo: { backgroundColor: COLORS.primary, borderRadius: 15, padding: 15, marginBottom: 20 },
  tripRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  tripIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  tripTextContainer: { flex: 1 },
  tripLabel: { fontSize: 12, color: COLORS.text, opacity: 0.7, marginBottom: 4 },
  tripValue: { fontSize: 14, color: COLORS.text },
  tripDivider: { height: 1, backgroundColor: COLORS.secondary, marginVertical: 5 },
  buttonSection: {},
  reportButton: { backgroundColor: COLORS.light, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  reportButtonText: { fontSize: 16, color: COLORS.textDark, fontWeight: 'bold' },
  cancelButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
});