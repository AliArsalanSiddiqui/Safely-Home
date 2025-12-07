// safely-home-frontend/screens/BookingScreen.js
// ✅ COMPLETE - With Custom Alerts, Keyboard handling, Autocomplete

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, GOOGLE_MAPS_API_KEY } from '../config';
import { requestRide, updateLocation, cancelRide } from '../services/api';
import socketService from '../services/socket';
import { showAlert } from '../components/CustomAlert';

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
  const [activeField, setActiveField] = useState(null);
  const [useMapSelection, setUseMapSelection] = useState(false);

  // Fare calculation
  const [calculatedFare, setCalculatedFare] = useState(null);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [calculatedETA, setCalculatedETA] = useState(null);

  // Autocomplete
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const pickupDebounceRef = useRef(null);
  const destinationDebounceRef = useRef(null);
  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
    setupSocketListeners();

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
        showAlert(
          'Permission Required',
          'Location permission is required to book rides',
          [{ text: 'OK' }],
          { type: 'warning' }
        );
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
      showAlert(
        'Location Error',
        'Could not get your location. Please check your GPS settings.',
        [{ text: 'OK' }],
        { type: 'error' }
      );
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
      setSuggestionsLoading(true);

      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      
      url.searchParams.append('input', query);
      url.searchParams.append('key', GOOGLE_MAPS_API_KEY);
      
      if (currentLocation) {
        url.searchParams.append('location', `${currentLocation.latitude},${currentLocation.longitude}`);
        url.searchParams.append('radius', '50000');
      }
      
      url.searchParams.append('components', 'country:pk');
      url.searchParams.append('types', 'geocode');

      console.log('🔍 Searching places:', query);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      console.log('📍 Autocomplete response:', {
        status: data.status,
        predictions: data.predictions?.length || 0
      });

      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        const suggestions = data.predictions.map(pred => ({
          description: pred.description,
          placeId: pred.place_id,
          mainText: pred.structured_formatting?.main_text || pred.description,
          secondaryText: pred.structured_formatting?.secondary_text || ''
        }));

        if (field === 'pickup') {
          setPickupSuggestions(suggestions);
        } else {
          setDestinationSuggestions(suggestions);
        }
        setShowSuggestions(true);
      } else if (data.status === 'ZERO_RESULTS') {
        console.log('⚠️ No results found');
        if (field === 'pickup') {
          setPickupSuggestions([]);
        } else {
          setDestinationSuggestions([]);
        }
      } else if (data.status === 'INVALID_REQUEST') {
        console.error('❌ Invalid request:', data.error_message);
        showAlert(
          'Search Error',
          'Invalid search request. Please try again.',
          [{ text: 'OK' }],
          { type: 'error' }
        );
      } else if (data.status === 'REQUEST_DENIED') {
        console.error('❌ API Key Issue:', data.error_message);
        showAlert(
          'Configuration Error',
          'Google Maps API key issue. Please contact support.',
          [{ text: 'OK' }],
          { type: 'error' }
        );
      } else {
        console.error('❌ API Error:', data.status, data.error_message);
      }
    } catch (error) {
      console.error('❌ Autocomplete error:', error);
      showAlert(
        'Search Failed',
        'Failed to search locations. Please try again.',
        [{ text: 'OK' }],
        { type: 'error' }
      );
    } finally {
      setSuggestionsLoading(false);
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
      showAlert(
        'Location Error',
        'Failed to get location details',
        [{ text: 'OK' }],
        { type: 'error' }
      );
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

      showAlert(
        'Driver Found!',
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
        { type: 'success', cancelable: false }
      );
    });

    socketService.on('rideCancelled', () => {
      setSearchingDriver(false);
      showAlert(
        'Ride Cancelled',
        'The driver cancelled the ride',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ],
        { type: 'error' }
      );
    });
  };

  // ============================================
// ADD TO BookingScreen.js - Inside handleBookRide function
// Add this validation BEFORE the ride request
// ============================================

const handleBookRide = async () => {
  if (!pickup || !destination) {
    showAlert(
      'Missing Information',
      'Please enter both pickup and destination locations',
      [{ text: 'OK' }],
      { type: 'warning' }
    );
    return;
  }

  if (!currentLocation || !destinationLocation) {
    showAlert(
      'Invalid Locations',
      'Please select valid locations on the map',
      [{ text: 'OK' }],
      { type: 'warning' }
    );
    return;
  }

  // ✅ NEW: Validate gender and preference BEFORE booking
  try {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      
      console.log('🔍 Checking user before booking:', {
        gender: user.gender,
        genderPreference: user.genderPreference,
        userType: user.userType
      });

      // Check if gender is set
      if (!user.gender) {
        showAlert(
          'Profile Incomplete',
          'Please complete your profile before booking a ride.',
          [
            { 
              text: 'Update Profile', 
              onPress: () => navigation.navigate('Profile') 
            }
          ],
          { type: 'warning' }
        );
        return;
      }

      // Male riders must have male preference
      if (user.gender === 'male' && user.genderPreference !== 'male') {
        console.log('⚠️ Auto-fixing male rider preference');
        // This will be auto-fixed on backend, but we can update locally too
        user.genderPreference = 'male';
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      // Female riders must have preference set
      if (user.gender === 'female' && !user.genderPreference) {
        showAlert(
          'Driver Preference Required',
          'Please select your driver preference before booking.',
          [
            { 
              text: 'Set Preference', 
              onPress: () => navigation.navigate('GenderPreference') 
            }
          ],
          { type: 'warning', cancelable: false }
        );
        return;
      }

      console.log('✅ User validation passed, proceeding with booking');
    }
  } catch (error) {
    console.error('❌ User validation error:', error);
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
      
      // ✅ Show gender filter info in the alert
      let filterInfo = '';
      if (response.driverFilter) {
        if (response.driverFilter.gender === 'male') {
          filterInfo = '\n🚗 Searching for male drivers only';
        } else if (response.driverFilter.gender === 'female') {
          filterInfo = '\n🚗 Searching for female drivers only';
        } else {
          filterInfo = '\n🚗 Searching for all available drivers';
        }
      }
      
      showAlert(
        'Finding Driver',
        `Searching for ${response.availableDrivers} available drivers nearby...${filterInfo}\n\n💰 Fare: ${response.calculatedFare} pkr\n📍 Distance: ${response.distance}\n⏱️ ETA: ${response.estimatedTime}`,
        [
          {
            text: 'Cancel Search',
            style: 'cancel',
            onPress: async () => {
              try {
                await cancelRide(response.rideId);
                console.log('✅ Ride cancelled during search');
              } catch (error) {
                console.error('❌ Failed to cancel ride:', error);
              }
              setSearchingDriver(false);
              navigation.goBack();
            }
          }
        ],
        { type: 'searching' }
      );
    } else {
      setSearchingDriver(false);
      
      // ✅ Handle gender preference error
      if (response.requiresGenderPreference) {
        showAlert(
          'Driver Preference Required',
          response.error || 'Please select your driver preference before booking.',
          [
            { 
              text: 'Set Preference', 
              onPress: () => navigation.navigate('GenderPreference') 
            }
          ],
          { type: 'warning', cancelable: false }
        );
      } else {
        showAlert(
          'Booking Failed',
          response.error || 'Please try again',
          [{ text: 'OK' }],
          { type: 'error' }
        );
      }
    }
  } catch (error) {
    setSearchingDriver(false);
    console.error('Booking error:', error);
    
    // ✅ Handle gender preference error from API
    if (error.response?.data?.requiresGenderPreference) {
      showAlert(
        'Driver Preference Required',
        error.response.data.error || 'Please select your driver preference before booking.',
        [
          { 
            text: 'Set Preference', 
            onPress: () => navigation.navigate('GenderPreference') 
          }
        ],
        { type: 'warning', cancelable: false }
      );
    } else {
      showAlert(
        'Booking Failed',
        error.response?.data?.error || 'Unable to book ride. Please try again.',
        [{ text: 'OK' }],
        { type: 'error' }
      );
    }
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
      {/* Header - Fixed at top with proper padding */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Your Ride</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main scroll view - Contains map + inputs + suggestions */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Map Section */}
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

            {useMapSelection && activeField && (
              <View style={styles.mapInstruction}>
                <Text style={styles.mapInstructionText}>
                  📍 Tap map to select {activeField}
                </Text>
              </View>
            )}
          </View>

          {/* Location Input Section */}
          <View style={styles.locationInputContainer}>
            {/* Pickup Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📍</Text>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Pickup Location</Text>
                <TextInput
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

          {/* Suggestions - Scrollable */}
          {showSuggestions && currentSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestionsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={COLORS.accent} />
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              ) : (
                <FlatList
                  data={currentSuggestions}
                  keyExtractor={(item) => item.placeId}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(item, activeField)}
                    >
                      <Text style={styles.suggestionIcon}>📍</Text>
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionMain}>{item.mainText}</Text>
                        {item.secondaryText && (
                          <Text style={styles.suggestionSub}>{item.secondaryText}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                  keyboardShouldPersistTaps="handled"
                />
              )}
            </View>
          )}

          {/* Fare Info Card */}
          {!useMapSelection && (
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
          )}

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

          {/* Extra padding for nav buttons */}
          <View style={{ height: 50 }} />
        </ScrollView>
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
    paddingTop: 10,
    backgroundColor: COLORS.primary,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary
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
  keyboardAvoid: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1
  },
  mapContainer: {
    height: 500,
    marginHorizontal: 0,
    marginVertical: 15,
    borderRadius: 20,
    overflow: 'visible',
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
    backgroundColor: COLORS.accent + 'DD',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  mapInstructionText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: 'bold'
  },
  locationInputContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 5,
    marginHorizontal: 15,
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
  suggestionsContainer: {
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    maxHeight: 300,
    overflow: 'hidden'
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.text
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary
  },
  suggestionIcon: {
    fontSize: 18,
    marginRight: 12
  },
  suggestionTextContainer: {
    flex: 1
  },
  suggestionMain: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 2
  },
  suggestionSub: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.7
  },
  estimateCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
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
    padding: 20,
    marginHorizontal: 15
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
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 15
  },
  confirmButtonDisabled: {
    opacity: 0.5
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark
  }
});