import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, GOOGLE_MAPS_API_KEY } from '../config';
import { requestRide, updateLocation } from '../services/api';
import socketService from '../services/socket';

export default function BookingScreen({ navigation, route }) {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchingDriver, setSearchingDriver] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null); // pickup coords
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentRideId, setCurrentRideId] = useState(null);
  const [token, setToken] = useState(null);

  // NEW: activeField controls which field map taps will update: 'pickup' | 'destination' | null
  const [activeField, setActiveField] = useState(null);

  // Dynamic fare / ETA / distance
  const [calculatedFare, setCalculatedFare] = useState(null);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [calculatedETA, setCalculatedETA] = useState(null);

  // Autocomplete suggestions
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  const mapRef = useRef(null);
  const pickupInputRef = useRef(null);
  const destinationInputRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
    setupSocketListeners();

    if (route.params?.editPickup) {
      setActiveField('pickup');
    } else if (route.params?.editDestination) {
      setActiveField('destination');
    }

    return () => {
      socketService.off('driverAccepted');
      socketService.off('rideCancelled');
    };
  }, []);

  useEffect(() => {
  if (userId && token) {
    setupSocketListeners();
  }
}, [userId, token]);

  // When either coordinate changes, recalc fare/eta
  useEffect(() => {
    if (currentLocation && destinationLocation) {
      calculateFareAndETA();
    } else {
      // Clear estimates if one of them is missing
      setCalculatedDistance(null);
      setCalculatedFare(null);
      setCalculatedETA(null);
    }
  }, [currentLocation, destinationLocation]);

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
      const tokenData = await AsyncStorage.getItem('token');

      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        await updateLocation(location.coords.latitude, location.coords.longitude);
        socketService.connect(user.id);
      }

      if (tokenData) {
        setToken(tokenData);
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

  // Calculates fare/distance/eta using Haversine (keeps same logic as server)
  const calculateFareAndETA = () => {
    if (!currentLocation || !destinationLocation) {
      setCalculatedDistance(null);
      setCalculatedFare(null);
      setCalculatedETA(null);
      return;
    }

    const R = 6371; // km
    const lat1 = currentLocation.latitude;
    const lon1 = currentLocation.longitude;
    const lat2 = destinationLocation.latitude;
    const lon2 = destinationLocation.longitude;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const fare = Math.max(2.0 + (distance * 20), 2.50);
    const eta = Math.max(Math.ceil((distance / 40) * 60), 2); // 40 km/h

    setCalculatedDistance(distance);
    setCalculatedFare(fare);
    setCalculatedETA(eta);

    console.log('💰 Calculated:', {
      distance: distance.toFixed(2),
      fare: fare.toFixed(2),
      eta
    });
  };

  // Autocomplete: uses Google Places API
  const searchPlaces = async (query, field) => {
  if (!query || query.length < 2) {
    if (field === 'pickup') setPickupSuggestions([]);
    if (field === 'destination') setDestinationSuggestions([]);
    return;
  }

  try {
    const locationBias = currentLocation
      ? `${currentLocation.latitude},${currentLocation.longitude}`
      : '';

    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      `input=${encodeURIComponent(query)}` +
      `&location=${locationBias}` +
      `&radius=50000` +
      `&types=geocode` +
      `&components=country:pk` +    // <---- FIXED
      `&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.predictions) {
      const suggestions = data.predictions.map(pred => ({
        description: pred.description,
        placeId: pred.place_id
      }));

      if (field === 'pickup') {
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(true);
      } else {
        setDestinationSuggestions(suggestions);
        setShowDestinationSuggestions(true);
      }
    } else {
      console.log("Places error:", data);
    }
  } catch (error) {
    console.error('Autocomplete error:', error);
  }
};


  // When user picks a suggestion from autocomplete
  const selectSuggestion = async (suggestion, field) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.result && data.result.geometry) {
        const loc = data.result.geometry.location;
        const coords = { latitude: loc.lat, longitude: loc.lng };

        if (field === 'pickup') {
          setPickup(suggestion.description || data.result.formatted_address || data.result.name || 'Pickup location');
          setCurrentLocation(coords);
          setShowPickupSuggestions(false);
          setPickupSuggestions([]);
        } else {
          setDestination(suggestion.description || data.result.formatted_address || data.result.name || 'Destination');
          setDestinationLocation(coords);
          setShowDestinationSuggestions(false);
          setDestinationSuggestions([]);
        }

        // Clear activeField because user explicitly selected via autocomplete
        setActiveField(null);

        // Center map on selected location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 500);
        }
      } else {
        // fallback: just set the text if details not available
        if (field === 'pickup') {
          setPickup(suggestion.description);
          setShowPickupSuggestions(false);
        } else {
          setDestination(suggestion.description);
          setShowDestinationSuggestions(false);
        }
        setActiveField(null);
      }
    } catch (error) {
      console.error('Place details error:', error);
      if (field === 'pickup') {
        setPickup(suggestion.description);
        setShowPickupSuggestions(false);
      } else {
        setDestination(suggestion.description);
        setShowDestinationSuggestions(false);
      }
      setActiveField(null);
    }
  };

  // Map press behavior (Option A): updates the currently active field only
  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;

    if (!activeField) {
      // If you prefer, you can notify user to focus an input
      return;
    }

    try {
      const address = await Location.reverseGeocodeAsync(coordinate);
      const textAddress = `${address[0]?.street || address[0]?.name || 'Selected location'}, ${address[0]?.city || ''}`;

      if (activeField === 'pickup') {
        setCurrentLocation(coordinate);
        setPickup(textAddress);
        setShowPickupSuggestions(false);
        setPickupSuggestions([]);
      } else if (activeField === 'destination') {
        setDestinationLocation(coordinate);
        setDestination(textAddress);
        setShowDestinationSuggestions(false);
        setDestinationSuggestions([]);
      }

      // After a map selection we clear activeField — to re-enable, user focuses input again
      setActiveField(null);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coordinate,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 300);
      }
    } catch (error) {
      console.error('Reverse geocode error', error);
      // still update the coords and clear activeField so user can retry
      if (activeField === 'pickup') {
        setCurrentLocation(coordinate);
        setPickup('Selected pickup location');
      } else if (activeField === 'destination') {
        setDestinationLocation(coordinate);
        setDestination('Selected destination');
      }
      setActiveField(null);
    }
  };

  // Socket listeners
  const setupSocketListeners = () => {
    socketService.on('driverAccepted', (data) => {
      console.log('✅ Driver accepted:', data);
      setSearchingDriver(false);

      Alert.alert('🚗 Driver Found!', `${data.driver.name} is coming to pick you up!`, [
        {
          text: 'View Details',
          onPress: () => {
            navigation.replace('RiderTracking', {
              rideId: data.rideId || currentRideId,
              driver: data.driver,
              pickup,
              destination
            });
          }
        }
      ]);
    });

    socketService.on('rideCancelled', () => {
      setSearchingDriver(false);
      Alert.alert('Ride Cancelled', 'The driver cancelled the ride', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    });
  };

  // Booking
  const handleBookRide = async () => {
    if (!pickup || !destination) {
      Alert.alert('Error', 'Please enter both pickup and destination');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get your pickup location. Please try again.');
      return;
    }

    if (!destinationLocation) {
      Alert.alert('Error', 'Please select a valid destination location');
      return;
    }

    setLoading(true);
    setSearchingDriver(true);

    try {
      const fare = calculatedFare || 12.50;

      const rideData = {
        pickup: {
          address: pickup,
          coordinates: [currentLocation.longitude, currentLocation.latitude]
        },
        destination: {
          address: destination,
          coordinates: [destinationLocation.longitude, destinationLocation.latitude]
        },
        fare
      };

      const response = await requestRide(rideData.pickup, rideData.destination, rideData.fare);

      if (response.success) {
        setCurrentRideId(response.rideId);
        Alert.alert(
          'Finding Driver',
          `Looking for ${response.availableDrivers} available drivers...\n\n💰 Fare: $${response.calculatedFare}\n📍 Distance: ${response.distance}\n⏱️ ETA: ${response.estimatedTime}`,
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
      } else {
        setSearchingDriver(false);
        Alert.alert('Booking Failed', response.error || 'Please try again');
      }
    } catch (error) {
      setSearchingDriver(false);
      console.error('Booking error:', error);
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
            <Marker coordinate={currentLocation} title="Pickup" pinColor={COLORS.accent} />
          )}
          {destinationLocation && (
            <Marker coordinate={destinationLocation} title="Destination" pinColor={COLORS.light} />
          )}
        </MapView>

        {activeField && (
          <View style={styles.mapInstruction}>
            <Text style={styles.mapInstructionText}>
              📍 Tap map to select {activeField}
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
          nestedScrollEnabled={true}
        >
          <View style={styles.locationInputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📍</Text>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Pickup Location</Text>
                <TextInput
                  ref={pickupInputRef}
                  style={styles.input}
                  placeholder="Type or tap map"
                  placeholderTextColor="#999"
                  value={pickup}
                  onChangeText={(text) => {
                    setPickup(text);
                    searchPlaces(text, 'pickup');
                  }}
                  onFocus={() => {
                    setShowPickupSuggestions(true);
                    setShowDestinationSuggestions(false);
                    setActiveField('pickup'); // <-- Map taps will set pickup now
                  }}
                  onBlur={() => {
                    // keep suggestions hidden when losing focus
                    // (we keep activeField until user taps map OR selects suggestion)
                    // but here we can also clear activeField if you'd like auto-clear on blur:
                    // setActiveField(null);
                  }}
                />
              </View>
            </View>

            {showPickupSuggestions && pickupSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={pickupSuggestions}
                  keyExtractor={(item) => item.placeId}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(item, 'pickup')}
                    >
                      <Text style={styles.suggestionIcon}>📍</Text>
                      <Text style={styles.suggestionText}>{item.description}</Text>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                  nestedScrollEnabled={true}
                />
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🎯</Text>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Destination</Text>
                <TextInput
                  ref={destinationInputRef}
                  style={styles.input}
                  placeholder="Type or tap map"
                  placeholderTextColor="#999"
                  value={destination}
                  onChangeText={(text) => {
                    setDestination(text);
                    searchPlaces(text, 'destination');
                  }}
                  onFocus={() => {
                    setShowPickupSuggestions(false);
                    setShowDestinationSuggestions(true);
                    setActiveField('destination'); // <-- Map taps will set destination now
                  }}
                  onBlur={() => {
                    // setActiveField(null);
                  }}
                />
              </View>
            </View>

            {showDestinationSuggestions && destinationSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={destinationSuggestions}
                  keyExtractor={(item) => item.placeId}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(item, 'destination')}
                    >
                      <Text style={styles.suggestionIcon}>🎯</Text>
                      <Text style={styles.suggestionText}>{item.description}</Text>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                  nestedScrollEnabled={true}
                />
              </View>
            )}
          </View>

          <View style={styles.estimateCard}>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateIcon}>⏱️</Text>
              <Text style={styles.estimateLabel}>Est. Time</Text>
              <Text style={styles.estimateValue}>{calculatedETA ? `${calculatedETA} mins` : '-- mins'}</Text>
            </View>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateIcon}>📍</Text>
              <Text style={styles.estimateLabel}>Distance</Text>
              <Text style={styles.estimateValue}>{calculatedDistance ? `${calculatedDistance.toFixed(2)} km` : '-- km'}</Text>
            </View>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateIcon}>💰</Text>
              <Text style={styles.estimateLabel}>Est. Fare</Text>
              <Text style={styles.estimateValue}>{calculatedFare ? `${calculatedFare.toFixed(2)} pkr` : 'pkr--'}</Text>
            </View>
          </View>

          {searchingDriver ? (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.searchingText}>Finding driver...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.confirmButton, (!pickup || !destination || loading) ? { opacity: 0.7 } : {}]}
              onPress={handleBookRide}
              disabled={loading || !pickup || !destination}
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

// Styles (unchanged visually, minor ordering)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: COLORS.primary },
  backButton: { fontSize: 30, color: COLORS.accent, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  mapContainer: { flex: 1, marginTop: 100 },
  map: { flex: 1 },
  mapInstruction: { position: 'absolute', top: 10, left: 20, right: 20, backgroundColor: COLORS.accent, padding: 15, borderRadius: 10 },
  mapInstructionText: { fontSize: 14, color: COLORS.textDark, fontWeight: 'bold', textAlign: 'center' },
  bottomSheet: { backgroundColor: COLORS.secondary, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '60%' },
  scrollContent: { padding: 25 },
  locationInputContainer: { backgroundColor: COLORS.primary, borderRadius: 15, padding: 5, marginBottom: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  inputIcon: { fontSize: 24, marginRight: 12 },
  inputContent: { flex: 1 },
  inputLabel: { fontSize: 12, color: COLORS.text, opacity: 0.7, marginBottom: 5 },
  input: { fontSize: 16, color: COLORS.text, padding: 0 },
  divider: { height: 1, backgroundColor: COLORS.secondary, marginHorizontal: 15 },
  suggestionsContainer: { backgroundColor: COLORS.secondary, borderRadius: 10, marginHorizontal: 10, marginBottom: 10, maxHeight: 200 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.primary },
  suggestionIcon: { fontSize: 20, marginRight: 12 },
  suggestionText: { flex: 1, fontSize: 14, color: COLORS.text },
  estimateCard: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, marginBottom: 20 },
  estimateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  estimateIcon: { fontSize: 20, marginRight: 10, width: 30 },
  estimateLabel: { flex: 1, fontSize: 14, color: COLORS.text },
  estimateValue: { fontSize: 16, color: COLORS.accent, fontWeight: 'bold' },
  searchingContainer: { alignItems: 'center', padding: 20 },
  searchingText: { marginTop: 10, fontSize: 16, color: COLORS.text, fontWeight: 'bold' },
  confirmButton: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  confirmButtonText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
});
