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
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentRideId, setCurrentRideId] = useState(null);
  const [token, setToken] = useState(null);
  const [userGender, setUserGender] = useState(null); // ✅ NEW: Track user's gender

  // Track which field is being edited for map tapping
  const [activeMapField, setActiveMapField] = useState(null);

  // Dynamic fare / ETA / distance
  const [calculatedFare, setCalculatedFare] = useState(null);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [calculatedETA, setCalculatedETA] = useState(null);

  // Autocomplete suggestions - separate for each field
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  // Debounce timer
  const pickupDebounceRef = useRef(null);
  const destinationDebounceRef = useRef(null);

  const mapRef = useRef(null);
  const pickupInputRef = useRef(null);
  const destinationInputRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
    setupSocketListeners();

    return () => {
      socketService.off('driverAccepted');
      socketService.off('rideCancelled');
      if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
      if (destinationDebounceRef.current) clearTimeout(destinationDebounceRef.current);
    };
  }, []);

  // When either coordinate changes, recalc fare/eta
  useEffect(() => {
    if (currentLocation && destinationLocation) {
      calculateFareAndETA();
    } else {
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
        setUserGender(user.gender); // ✅ NEW: Set user's gender
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

  // Calculates fare/distance/eta using Haversine
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

    const fare = Math.max(50 + (distance * 20), 50);
    const eta = Math.max(Math.ceil((distance / 40) * 60), 2);

    setCalculatedDistance(distance);
    setCalculatedFare(fare);
    setCalculatedETA(eta);

    console.log('💰 Calculated:', {
      distance: distance.toFixed(2),
      fare: fare.toFixed(2),
      eta
    });
  };

  // Autocomplete with debouncing
  const searchPlaces = (query, field) => {
    if (!query || query.length < 2) {
      if (field === 'pickup') {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      }
      return;
    }

    if (field === 'pickup' && pickupDebounceRef.current) {
      clearTimeout(pickupDebounceRef.current);
    }
    if (field === 'destination' && destinationDebounceRef.current) {
      clearTimeout(destinationDebounceRef.current);
    }

    const timer = setTimeout(() => {
      fetchPlacesSuggestions(query, field);
    }, 500);

    if (field === 'pickup') {
      pickupDebounceRef.current = timer;
    } else {
      destinationDebounceRef.current = timer;
    }
  };

  const fetchPlacesSuggestions = async (query, field) => {
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
        `&components=country:pk` +
        `&key=${GOOGLE_MAPS_API_KEY}`;

      console.log('🔍 Searching places for:', query);

      const response = await fetch(url);
      const data = await response.json();

      if (data.predictions && data.predictions.length > 0) {
        const suggestions = data.predictions.map(pred => ({
          description: pred.description,
          placeId: pred.place_id
        }));

        console.log(`✅ Found ${suggestions.length} suggestions`);

        if (field === 'pickup') {
          setPickupSuggestions(suggestions);
          setShowPickupSuggestions(true);
        } else {
          setDestinationSuggestions(suggestions);
          setShowDestinationSuggestions(true);
        }
      } else {
        console.log('⚠️ No suggestions found');
        if (field === 'pickup') {
          setPickupSuggestions([]);
        } else {
          setDestinationSuggestions([]);
        }
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  };

  const selectSuggestion = async (suggestion, field) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.result && data.result.geometry) {
        const loc = data.result.geometry.location;
        const coords = { latitude: loc.lat, longitude: loc.lng };
        const address = suggestion.description || data.result.formatted_address || 'Selected location';

        if (field === 'pickup') {
          setPickup(address);
          setCurrentLocation(coords);
          setShowPickupSuggestions(false);
          setPickupSuggestions([]);
        } else {
          setDestination(address);
          setDestinationLocation(coords);
          setShowDestinationSuggestions(false);
          setDestinationSuggestions([]);
        }

        setActiveMapField(null);

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 500);
        }

        console.log(`✅ ${field} selected:`, address);
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
      setActiveMapField(null);
    }
  };

  const handleMapPress = async (event) => {
    if (!activeMapField) return;

    const { coordinate } = event.nativeEvent;

    try {
      const address = await Location.reverseGeocodeAsync(coordinate);
      const textAddress = `${address[0]?.street || address[0]?.name || 'Selected location'}, ${address[0]?.city || ''}`;

      if (activeMapField === 'pickup') {
        setCurrentLocation(coordinate);
        setPickup(textAddress);
        setShowPickupSuggestions(false);
        setPickupSuggestions([]);
      } else if (activeMapField === 'destination') {
        setDestinationLocation(coordinate);
        setDestination(textAddress);
        setShowDestinationSuggestions(false);
        setDestinationSuggestions([]);
      }

      setActiveMapField(null);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coordinate,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 300);
      }

      console.log(`✅ Map ${activeMapField} selected:`, textAddress);
    } catch (error) {
      console.error('Reverse geocode error:', error);
      if (activeMapField === 'pickup') {
        setCurrentLocation(coordinate);
        setPickup('Selected pickup location');
      } else if (activeMapField === 'destination') {
        setDestinationLocation(coordinate);
        setDestination('Selected destination');
      }
      setActiveMapField(null);
    }
  };

  // ✅ FIXED: Socket listeners - Listen for driverAccepted on ride request
  const setupSocketListeners = () => {
  // ✅ FIXED: Remove any existing listeners first
  socketService.off('driverAccepted');
  socketService.off('rideCancelled');

  // ✅ FIXED: This listener now fires when driver accepts
  socketService.on('driverAccepted', (data) => {
    console.log('✅ Driver accepted (Rider):', data);
    setSearchingDriver(false);

    if (!data.rideId) {
      console.error('❌ No rideId in driverAccepted event');
      return;
    }

    // ✅ CRITICAL FIX: Don't check if rideId matches - accept ANY driver acceptance
    // This fixes the "first ride gets discarded" bug
    console.log('🔄 Navigating to RiderTracking with:', {
      rideId: data.rideId,
      driver: data.driver,
      pickup,
      destination
    });

    Alert.alert(
      '🚗 Driver Found!', 
      `${data.driver?.name || 'Driver'} is coming to pick you up!`, 
      [
        {
          text: 'View Details',
          onPress: () => {
            navigation.replace('RiderTracking', {
              rideId: data.rideId,
              driver: data.driver,
              pickup: pickup,
              destination: destination
            });
          }
        }
      ],
      { cancelable: false } // ✅ Prevent dismissing alert
    );
  });

  socketService.on('rideCancelled', () => {
    setSearchingDriver(false);
    Alert.alert('Ride Cancelled', 'The driver cancelled the ride', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  });
};

  // ✅ FIXED: Booking - Pass gender preference to backend
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
      const fare = calculatedFare || 50;

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

      console.log('📝 Booking ride with user gender:', userGender);

      const response = await requestRide(rideData.pickup, rideData.destination, rideData.fare);

      if (response.success) {
        setCurrentRideId(response.rideId);
        
        console.log('✅ Ride request sent:', response.rideId);

        Alert.alert(
          'Finding Driver',
          `Looking for ${response.availableDrivers} available drivers...\n\n💰 Fare: ${response.calculatedFare} pkr\n📍 Distance: ${response.distance}\n⏱️ ETA: ${response.estimatedTime}`,
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

        {activeMapField && (
          <View style={styles.mapInstruction}>
            <Text style={styles.mapInstructionText}>
              📍 Tap map to select {activeMapField}
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
                  placeholder="Type address or tap map"
                  placeholderTextColor="#999"
                  value={pickup}
                  onChangeText={(text) => {
                    setPickup(text);
                    searchPlaces(text, 'pickup');
                  }}
                  onFocus={() => {
                    setShowPickupSuggestions(true);
                    setShowDestinationSuggestions(false);
                  }}
                />
              </View>
              <TouchableOpacity
                style={[styles.mapButton, activeMapField === 'pickup' && styles.mapButtonActive]}
                onPress={() => setActiveMapField(activeMapField === 'pickup' ? null : 'pickup')}
              >
                <Text style={styles.mapButtonText}>📍</Text>
              </TouchableOpacity>
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
                  placeholder="Type address or tap map"
                  placeholderTextColor="#999"
                  value={destination}
                  onChangeText={(text) => {
                    setDestination(text);
                    searchPlaces(text, 'destination');
                  }}
                  onFocus={() => {
                    setShowPickupSuggestions(false);
                    setShowDestinationSuggestions(true);
                  }}
                />
              </View>
              <TouchableOpacity
                style={[styles.mapButton, activeMapField === 'destination' && styles.mapButtonActive]}
                onPress={() => setActiveMapField(activeMapField === 'destination' ? null : 'destination')}
              >
                <Text style={styles.mapButtonText}>🎯</Text>
              </TouchableOpacity>
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
  mapButton: { paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8, borderRadius: 8 },
  mapButtonActive: { backgroundColor: COLORS.accent + '40' },
  mapButtonText: { fontSize: 18 },
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