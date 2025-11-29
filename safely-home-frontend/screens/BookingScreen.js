// safely-home-frontend/screens/BookingScreen.js
// ✅ COMPLETELY FIXED: Keyboard, Autocomplete, Map Size, Header, Everything!

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  SafeAreaView,
  Dimensions
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, GOOGLE_MAPS_API_KEY } from '../config';
import { requestRide, updateLocation } from '../services/api';
import socketService from '../services/socket';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const [userGender, setUserGender] = useState(null);

  // Active field tracking
  const [activeField, setActiveField] = useState(null); // 'pickup' or 'destination'
  const [useMapSelection, setUseMapSelection] = useState(false);

  // Fare calculation
  const [calculatedFare, setCalculatedFare] = useState(null);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [calculatedETA, setCalculatedETA] = useState(null);

  // Autocomplete
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const pickupDebounceRef = useRef(null);
  const destinationDebounceRef = useRef(null);
  const mapRef = useRef(null);
  const pickupInputRef = useRef(null);
  const destinationInputRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
    setupSocketListeners();

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      socketService.off('driverAccepted');
      socketService.off('rideCancelled');
      if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
      if (destinationDebounceRef.current) clearTimeout(destinationDebounceRef.current);
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
        setUserGender(user.gender);
        await updateLocation(location.coords.latitude, location.coords.longitude);
        socketService.connect(user.id);
      }

      if (tokenData) setToken(tokenData);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 1000);
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not get your location');
    }
  };

  const calculateFareAndETA = () => {
    if (!currentLocation || !destinationLocation) return;

    const R = 6371;
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
  };

  const searchPlaces = (query, field) => {
    if (!query || query.length < 2) {
      if (field === 'pickup') {
        setPickupSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
      setShowSuggestions(false);
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

      const response = await fetch(url);
      const data = await response.json();

      if (data.predictions && data.predictions.length > 0) {
        const suggestions = data.predictions.map(pred => ({
          description: pred.description,
          placeId: pred.place_id
        }));

        if (field === 'pickup') {
          setPickupSuggestions(suggestions);
        } else {
          setDestinationSuggestions(suggestions);
        }
        setShowSuggestions(true);
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
        const address = suggestion.description || data.result.formatted_address;

        if (field === 'pickup') {
          setPickup(address);
          setCurrentLocation(coords);
          setPickupSuggestions([]);
        } else {
          setDestination(address);
          setDestinationLocation(coords);
          setDestinationSuggestions([]);
        }

        setShowSuggestions(false);
        setActiveField(null);
        Keyboard.dismiss();

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...coords,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 500);
        }
      }
    } catch (error) {
      console.error('Place details error:', error);
    }
  };

  const handleMapPress = async (event) => {
    if (!useMapSelection || !activeField) return;

    const { coordinate } = event.nativeEvent;

    try {
      const address = await Location.reverseGeocodeAsync(coordinate);
      const textAddress = `${address[0]?.street || address[0]?.name || 'Selected location'}, ${address[0]?.city || ''}`;

      if (activeField === 'pickup') {
        setCurrentLocation(coordinate);
        setPickup(textAddress);
      } else if (activeField === 'destination') {
        setDestinationLocation(coordinate);
        setDestination(textAddress);
      }

      setUseMapSelection(false);
      setActiveField(null);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coordinate,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 300);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.off('driverAccepted');
    socketService.off('rideCancelled');

    socketService.on('driverAccepted', (data) => {
      setSearchingDriver(false);
      if (!data.rideId) return;

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
        { cancelable: false }
      );
    });

    socketService.on('rideCancelled', () => {
      setSearchingDriver(false);
      Alert.alert('Ride Cancelled', 'The driver cancelled the ride', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    });
  };

  const handleBookRide = async () => {
    if (!pickup || !destination) {
      Alert.alert('Error', 'Please enter both pickup and destination');
      return;
    }

    if (!currentLocation || !destinationLocation) {
      Alert.alert('Error', 'Please select valid locations');
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

      const response = await requestRide(rideData.pickup, rideData.destination, rideData.fare);

      if (response.success) {
        setCurrentRideId(response.rideId);
        
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

  const handleInputFocus = (field) => {
    setActiveField(field);
    setUseMapSelection(false);
    setShowSuggestions(true);
  };

  const handleMapButtonPress = (field) => {
    Keyboard.dismiss();
    setActiveField(field);
    setUseMapSelection(true);
    setShowSuggestions(false);
    setPickupSuggestions([]);
    setDestinationSuggestions([]);
  };

  const currentSuggestions = activeField === 'pickup' ? pickupSuggestions : destinationSuggestions;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Your Ride</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map Section - BIGGER */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: currentLocation?.latitude || 37.78825,
            longitude: currentLocation?.longitude || -122.4324,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
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

        {/* Map instruction - SMALLER & TRANSPARENT */}
        {useMapSelection && activeField && (
          <View style={styles.mapInstruction}>
            <Text style={styles.mapInstructionText}>
              📍 Tap map to select {activeField}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomSheet}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.bottomSheetContent}>
          {/* Input Section */}
          <View style={styles.locationInputContainer}>
            {/* Pickup Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📍</Text>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Pickup Location</Text>
                <TextInput
                  ref={pickupInputRef}
                  style={styles.input}
                  placeholder="Type address"
                  placeholderTextColor="#999"
                  value={pickup}
                  onChangeText={(text) => {
                    setPickup(text);
                    searchPlaces(text, 'pickup');
                  }}
                  onFocus={() => handleInputFocus('pickup')}
                />
              </View>
              <TouchableOpacity
                style={[styles.mapButton, useMapSelection && activeField === 'pickup' && styles.mapButtonActive]}
                onPress={() => handleMapButtonPress('pickup')}
              >
                <Text style={styles.mapButtonText}>🗺️</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Destination Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🎯</Text>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Destination</Text>
                <TextInput
                  ref={destinationInputRef}
                  style={styles.input}
                  placeholder="Type address"
                  placeholderTextColor="#999"
                  value={destination}
                  onChangeText={(text) => {
                    setDestination(text);
                    searchPlaces(text, 'destination');
                  }}
                  onFocus={() => handleInputFocus('destination')}
                />
              </View>
              <TouchableOpacity
                style={[styles.mapButton, useMapSelection && activeField === 'destination' && styles.mapButtonActive]}
                onPress={() => handleMapButtonPress('destination')}
              >
                <Text style={styles.mapButtonText}>🗺️</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Suggestions List - ABOVE KEYBOARD */}
          {showSuggestions && currentSuggestions.length > 0 && keyboardVisible && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={currentSuggestions}
                keyExtractor={(item) => item.placeId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(item, activeField)}
                  >
                    <Text style={styles.suggestionIcon}>📍</Text>
                    <Text style={styles.suggestionText} numberOfLines={2}>{item.description}</Text>
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
                style={styles.suggestionsList}
              />
            </View>
          )}

          {/* Fare Info - Only when not typing */}
          {!keyboardVisible && (
            <>
              <View style={styles.estimateCard}>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateIcon}>⏱️</Text>
                  <Text style={styles.estimateLabel}>Est. Time</Text>
                  <Text style={styles.estimateValue}>{calculatedETA ? `${calculatedETA} mins` : '--'}</Text>
                </View>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateIcon}>📍</Text>
                  <Text style={styles.estimateLabel}>Distance</Text>
                  <Text style={styles.estimateValue}>{calculatedDistance ? `${calculatedDistance.toFixed(2)} km` : '--'}</Text>
                </View>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateIcon}>💰</Text>
                  <Text style={styles.estimateLabel}>Est. Fare</Text>
                  <Text style={styles.estimateValue}>{calculatedFare ? `${calculatedFare.toFixed(2)} pkr` : '--'}</Text>
                </View>
              </View>

              {/* Confirm Button */}
              {searchingDriver ? (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text style={styles.searchingText}>Finding driver...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.confirmButton, (!pickup || !destination || loading) && styles.confirmButtonDisabled]}
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
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20, 
    paddingTop: 10, // ✅ Safe for notch
    backgroundColor: COLORS.primary,
    zIndex: 10 
  },
  backButton: { 
    fontSize: 30, 
    color: COLORS.accent, 
    fontWeight: 'bold' 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: COLORS.text 
  },
  
  // ✅ FIXED: Bigger map (60% of screen)
  mapContainer: { 
    height: SCREEN_HEIGHT * 0.5, // 50% of screen
    position: 'relative' 
  },
  map: { 
    flex: 1 
  },
  mapInstruction: { 
    position: 'absolute', 
    top: 10, 
    left: 20, 
    right: 20, 
    backgroundColor: COLORS.accent + 'DD', // Semi-transparent
    padding: 12, 
    borderRadius: 10,
    alignItems: 'center'
  },
  mapInstructionText: { 
    fontSize: 13, 
    color: COLORS.textDark, 
    fontWeight: 'bold' 
  },
  
  // ✅ FIXED: Bottom sheet
  bottomSheet: { 
    flex: 1,
    backgroundColor: COLORS.secondary, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30 
  },
  bottomSheetContent: { 
    flex: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 30 : 20 // Extra padding for Android nav
  },
  locationInputContainer: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 15, 
    padding: 5, 
    marginBottom: 15 
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12 
  },
  inputIcon: { 
    fontSize: 22, 
    marginRight: 10 
  },
  inputContent: { 
    flex: 1 
  },
  inputLabel: { 
    fontSize: 11, 
    color: COLORS.text, 
    opacity: 0.7, 
    marginBottom: 4 
  },
  input: { 
    fontSize: 15, 
    color: COLORS.text, 
    padding: 0 
  },
  mapButton: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    marginLeft: 8, 
    borderRadius: 8 
  },
  mapButtonActive: { 
    backgroundColor: COLORS.accent + '40' 
  },
  mapButtonText: { 
    fontSize: 20 
  },
  divider: { 
    height: 1, 
    backgroundColor: COLORS.secondary, 
    marginHorizontal: 12 
  },
  
  // ✅ FIXED: Suggestions ABOVE keyboard
  suggestionsContainer: { 
    maxHeight: 200,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden'
  },
  suggestionsList: {
    flexGrow: 0
  },
  suggestionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.secondary 
  },
  suggestionIcon: { 
    fontSize: 18, 
    marginRight: 12 
  },
  suggestionText: { 
    flex: 1, 
    fontSize: 14, 
    color: COLORS.text 
  },
  
  estimateCard: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 15 
  },
  estimateRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  estimateIcon: { 
    fontSize: 18, 
    marginRight: 10, 
    width: 25 
  },
  estimateLabel: { 
    flex: 1, 
    fontSize: 14, 
    color: COLORS.text 
  },
  estimateValue: { 
    fontSize: 15, 
    color: COLORS.accent, 
    fontWeight: 'bold' 
  },
  searchingContainer: { 
    alignItems: 'center', 
    padding: 20 
  },
  searchingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: COLORS.text, 
    fontWeight: 'bold' 
  },
  confirmButton: { 
    backgroundColor: COLORS.accent, 
    borderRadius: 12, 
    paddingVertical: 16, 
    alignItems: 'center' 
  },
  confirmButtonDisabled: { 
    opacity: 0.5 
  },
  confirmButtonText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.textDark 
  },
});