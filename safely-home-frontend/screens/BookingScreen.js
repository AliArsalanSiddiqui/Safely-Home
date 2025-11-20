import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { requestRide, updateLocation } from '../services/api';
import socketService from '../services/socket';

export default function BookingScreen({ navigation, route }) {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchingDriver, setSearchingDriver] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentRideId, setCurrentRideId] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
    setupSocketListeners();

    if (route.params?.editPickup) {
      setEditingField('pickup');
    } else if (route.params?.editDestination) {
      setEditingField('destination');
    }

    return () => {
      socketService.off('driverAccepted');
      socketService.off('rideCancelled');
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(coords);

      const address = await Location.reverseGeocodeAsync(coords);
      if (address[0]) {
        const fullAddress = `${address[0].street || address[0].name || 'Unknown street'}, ${address[0].city || 'City'}`;
        setPickup(fullAddress);
      }

      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        await updateLocation(location.coords.latitude, location.coords.longitude);
        socketService.connect(user.id);
      }

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not get your location');
    }
  };

  const setupSocketListeners = () => {
    socketService.on('driverAccepted', (data) => {
      console.log('✅ Driver accepted - Full data:', JSON.stringify(data, null, 2));
      setSearchingDriver(false);
      
      // CRITICAL FIX: Ensure locations are strings
      const pickupLocation = pickup || 'Pickup location';
      const destinationLocation = destination || 'Destination';
      
      console.log('Navigating with locations:', { 
        pickup: pickupLocation, 
        destination: destinationLocation 
      });
      
      Alert.alert(
        '🚗 Driver Found!',
        `${data.driver.name} is coming to pick you up!`,
        [
          { 
            text: 'View Details', 
            onPress: () => {
              navigation.replace('RiderTracking', { 
                rideId: data.rideId || currentRideId,
                driver: data.driver,
                pickup: pickupLocation,
                destination: destinationLocation
              });
            }
          }
        ]
      );
    });

    socketService.on('rideCancelled', () => {
      setSearchingDriver(false);
      Alert.alert('Ride Cancelled', 'The driver cancelled the ride', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    });
  };

  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    
    if (editingField === 'pickup') {
      setCurrentLocation(coordinate);
      try {
        const address = await Location.reverseGeocodeAsync(coordinate);
        if (address[0]) {
          setPickup(`${address[0].street || address[0].name || 'Selected location'}, ${address[0].city || ''}`);
        }
      } catch (error) {
        setPickup('Selected pickup location');
      }
      setEditingField(null);
    } else if (editingField === 'destination') {
      setDestinationLocation(coordinate);
      try {
        const address = await Location.reverseGeocodeAsync(coordinate);
        if (address[0]) {
          setDestination(`${address[0].street || address[0].name || 'Selected location'}, ${address[0].city || ''}`);
        }
      } catch (error) {
        setDestination('Selected destination');
      }
      setEditingField(null);
    }
  };

  const handleBookRide = async () => {
    if (!pickup || !destination) {
      Alert.alert('Error', 'Please enter both pickup and destination');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }

    setLoading(true);
    setSearchingDriver(true);

    try {
      const rideData = {
        pickup: {
          address: pickup,
          coordinates: [currentLocation.longitude, currentLocation.latitude]
        },
        destination: {
          address: destination,
          coordinates: destinationLocation 
            ? [destinationLocation.longitude, destinationLocation.latitude]
            : [0, 0]
        },
        fare: 12.50
      };

      console.log('📤 Requesting ride with data:', rideData);

      const response = await requestRide(rideData.pickup, rideData.destination, rideData.fare);
      
      if (response.success) {
        setCurrentRideId(response.rideId);
        console.log('✅ Ride requested - RideId:', response.rideId);
        Alert.alert(
          'Finding Driver', 
          `Looking for ${response.availableDrivers} available drivers nearby...`,
          [
            {
              text: 'Cancel Search',
              onPress: () => {
                setSearchingDriver(false);
                navigation.goBack();
              },
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      setSearchingDriver(false);
      Alert.alert('Booking Failed', error.response?.data?.error || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Your Ride</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: currentLocation?.latitude || 37.78825,
            longitude: currentLocation?.longitude || -122.4324,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              title="Pickup Location"
              pinColor={COLORS.accent}
            />
          )}
          {destinationLocation && (
            <Marker
              coordinate={destinationLocation}
              title="Destination"
              pinColor={COLORS.light}
            />
          )}
        </MapView>
        
        {editingField && (
          <View style={styles.mapInstruction}>
            <Text style={styles.mapInstructionText}>
              📍 Tap on the map to select {editingField === 'pickup' ? 'pickup' : 'destination'} location
            </Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomSheet}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.locationInputContainer}>
            <TouchableOpacity 
              style={styles.inputWrapper}
              onPress={() => setEditingField('pickup')}
            >
              <Text style={styles.inputIcon}>📍</Text>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Pickup Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tap to select on map or type"
                  placeholderTextColor="#999"
                  value={pickup}
                  onChangeText={setPickup}
                  onFocus={() => setEditingField(null)}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.inputWrapper}
              onPress={() => setEditingField('destination')}
            >
              <Text style={styles.inputIcon}>🎯</Text>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Destination</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tap to select on map or type"
                  placeholderTextColor="#999"
                  value={destination}
                  onChangeText={setDestination}
                  onFocus={() => setEditingField(null)}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.estimateCard}>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateIcon}>⏱️</Text>
              <Text style={styles.estimateLabel}>Est. Time</Text>
              <Text style={styles.estimateValue}>15 mins</Text>
            </View>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateIcon}>💰</Text>
              <Text style={styles.estimateLabel}>Est. Fare</Text>
              <Text style={styles.estimateValue}>$12.50</Text>
            </View>
          </View>

          {searchingDriver ? (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.searchingText}>Finding driver...</Text>
              <Text style={styles.searchingSubtext}>Please wait</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleBookRide}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textDark} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: COLORS.primary },
  backButton: { fontSize: 30, color: COLORS.accent, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  mapContainer: { flex: 1, marginTop: 100 },
  map: { flex: 1 },
  mapInstruction: { position: 'absolute', top: 10, left: 20, right: 20, backgroundColor: COLORS.accent, padding: 15, borderRadius: 10 },
  mapInstructionText: { fontSize: 14, color: COLORS.textDark, fontWeight: 'bold', textAlign: 'center' },
  bottomSheet: { backgroundColor: COLORS.secondary, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '50%' },
  scrollContent: { padding: 25 },
  locationInputContainer: { backgroundColor: COLORS.primary, borderRadius: 15, padding: 5, marginBottom: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  inputIcon: { fontSize: 24, marginRight: 12 },
  inputContent: { flex: 1 },
  inputLabel: { fontSize: 12, color: COLORS.text, opacity: 0.7, marginBottom: 5 },
  input: { fontSize: 16, color: COLORS.text, padding: 0 },
  divider: { height: 1, backgroundColor: COLORS.secondary, marginHorizontal: 15 },
  estimateCard: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, marginBottom: 20 },
  estimateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  estimateIcon: { fontSize: 20, marginRight: 10, width: 30 },
  estimateLabel: { flex: 1, fontSize: 14, color: COLORS.text },
  estimateValue: { fontSize: 16, color: COLORS.accent, fontWeight: 'bold' },
  searchingContainer: { alignItems: 'center', padding: 20 },
  searchingText: { marginTop: 10, fontSize: 16, color: COLORS.text, fontWeight: 'bold' },
  searchingSubtext: { marginTop: 5, fontSize: 14, color: COLORS.text, opacity: 0.7 },
  confirmButton: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  confirmButtonText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
});