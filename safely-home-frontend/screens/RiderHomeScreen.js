// ============================================
// FILE: screens/RiderHomeScreen.js (COMPLETE FIX)
// FIXED: Proper scrolling + Clickable locations + Auto-refresh
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  ScrollView, 
  RefreshControl 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { logout } from '../services/api';

export default function RiderHomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [genderPref, setGenderPref] = useState('Any Driver');
  const [refreshing, setRefreshing] = useState(false);

  // FIXED: Auto-refresh when coming back from gender preference screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUser();
    });
    
    loadUser();
    return unsubscribe;
  }, [navigation]);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      updateGenderDisplay(parsed.genderPreference);
    }
  };

  const updateGenderDisplay = (pref) => {
    const display = pref === 'female' ? 'Female Drivers' : 
                    pref === 'male' ? 'Male Drivers' : 'Any Driver';
    setGenderPref(display);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* FIXED: Header now stays on top */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>SAFELY HOME</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* FIXED: Added ScrollView with pull-to-refresh */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.accent} 
          />
        }
      >
        {/* FIXED: Gender preference button is now clickable with arrow */}
        <TouchableOpacity 
          style={styles.prefButton} 
          onPress={() => navigation.navigate('GenderPreference')}
          activeOpacity={0.7}
        >
          <View style={styles.prefButtonContent}>
            <Text style={styles.prefButtonLabel}>Gender Preference</Text>
            <View style={styles.prefValueContainer}>
              <Text style={styles.prefValue}>{genderPref}</Text>
              <Text style={styles.prefArrow}>›</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Booking Card */}
        <View style={styles.bookingCard}>
          <Text style={styles.cardTitle}>Book Your Ride</Text>
          
          <View style={styles.locationInputs}>
            {/* FIXED: Pickup location is now clickable */}
            <TouchableOpacity 
              style={styles.locationInput}
              onPress={() => navigation.navigate('Booking', { editPickup: true })}
              activeOpacity={0.7}
            >
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Pickup Location</Text>
                <Text style={styles.locationValue}>Current Location</Text>
              </View>
              <Text style={styles.locationArrow}>›</Text>
            </TouchableOpacity>

            {/* FIXED: Destination is now clickable */}
            <TouchableOpacity 
              style={styles.locationInput}
              onPress={() => navigation.navigate('Booking', { editDestination: true })}
              activeOpacity={0.7}
            >
              <Text style={styles.locationIcon}>🎯</Text>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationValue}>Where to?</Text>
              </View>
              <Text style={styles.locationArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => navigation.navigate('Booking')}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Continue to Booking</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Card - Now visible with scrolling */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome back, {user?.name || 'Rider'}! 👋</Text>
          <Text style={styles.welcomeSubtext}>Where would you like to go today?</Text>
        </View>

        {/* Bottom padding for better scroll experience */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.primary 
  },
  
  // FIXED: Header stays at top
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 15,
    backgroundColor: COLORS.primary,
    zIndex: 10
  },
  
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  
  logo: { 
    width: 40, 
    height: 40, 
    marginRight: 10 
  },
  
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.accent, 
    letterSpacing: 1 
  },
  
  logoutButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: COLORS.light, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  logoutText: { 
    fontSize: 20 
  },

  // FIXED: Scrolling content
  scrollView: { 
    flex: 1 
  },
  
  scrollContent: { 
    paddingBottom: 30 
  },

  // FIXED: Preference button with arrow
  prefButton: { 
    marginHorizontal: 20, 
    marginBottom: 20, 
    backgroundColor: COLORS.secondary, 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  prefButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  prefButtonLabel: { 
    fontSize: 14, 
    color: COLORS.text, 
    opacity: 0.8 
  },
  
  prefValueContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  
  prefValue: { 
    fontSize: 16, 
    color: COLORS.accent, 
    fontWeight: 'bold', 
    marginRight: 5 
  },
  
  prefArrow: { 
    fontSize: 24, 
    color: COLORS.accent, 
    fontWeight: 'bold' 
  },

  mapPlaceholder: { 
    height: 200, 
    backgroundColor: COLORS.secondary, 
    marginHorizontal: 20, 
    marginBottom: 20, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  mapIcon: { 
    alignItems: 'center' 
  },
  
  mapIconText: { 
    fontSize: 60 
  },
  
  mapText: { 
    fontSize: 18, 
    color: COLORS.text, 
    marginTop: 10, 
    fontWeight: 'bold' 
  },
  
  mapSubtext: { 
    fontSize: 14, 
    color: COLORS.text, 
    opacity: 0.7, 
    marginTop: 5 
  },

  bookingCard: { 
    backgroundColor: COLORS.secondary, 
    marginHorizontal: 20, 
    borderRadius: 20, 
    padding: 25, 
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  
  cardTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginBottom: 20 
  },
  
  locationInputs: { 
    marginBottom: 20 
  },
  
  // FIXED: Location inputs now show they're clickable
  locationInput: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  
  locationIcon: { 
    fontSize: 24, 
    marginRight: 12 
  },
  
  locationTextContainer: { 
    flex: 1 
  },
  
  locationLabel: { 
    fontSize: 12, 
    color: COLORS.text, 
    opacity: 0.7, 
    marginBottom: 4 
  },
  
  locationValue: { 
    fontSize: 16, 
    color: COLORS.text, 
    fontWeight: '500' 
  },
  
  // FIXED: Arrow shows it's clickable
  locationArrow: { 
    fontSize: 24, 
    color: COLORS.accent, 
    fontWeight: 'bold',
    marginLeft: 10
  },

  fareInfo: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 20 
  },
  
  fareRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  
  fareIcon: { 
    fontSize: 20, 
    marginRight: 10, 
    width: 25 
  },
  
  fareLabel: { 
    flex: 1, 
    fontSize: 14, 
    color: COLORS.text 
  },
  
  fareValue: { 
    fontSize: 16, 
    color: COLORS.accent, 
    fontWeight: 'bold' 
  },

  confirmButton: { 
    backgroundColor: COLORS.accent, 
    borderRadius: 12, 
    paddingVertical: 16, 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  confirmButtonText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.textDark 
  },

  // FIXED: Welcome card now visible with scrolling
  welcomeCard: { 
    backgroundColor: COLORS.secondary, 
    marginHorizontal: 20, 
    borderRadius: 15, 
    padding: 20, 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  welcomeText: { 
    fontSize: 18, 
    color: COLORS.text, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  
  welcomeSubtext: { 
    fontSize: 14, 
    color: COLORS.text, 
    opacity: 0.8, 
    textAlign: 'center' 
  },
});

/*
===============================================
✅ WHAT WAS FIXED:
===============================================

1. SCROLLING:
   ✅ Wrapped content in ScrollView
   ✅ Added RefreshControl for pull-to-refresh
   ✅ Added proper padding at bottom
   ✅ Header stays fixed at top
   ✅ Smooth scrolling with showsVerticalScrollIndicator={false}

2. CLICKABLE LOCATIONS:
   ✅ Changed View to TouchableOpacity for pickup
   ✅ Changed View to TouchableOpacity for destination
   ✅ Added arrow (›) to show it's clickable
   ✅ Added activeOpacity for visual feedback
   ✅ Passes parameters to BookingScreen
   ✅ Added border highlight

3. GENDER PREFERENCE UPDATE:
   ✅ Added navigation.addListener('focus')
   ✅ Reloads user data when screen comes back into focus
   ✅ Updates display immediately
   ✅ No app restart needed

4. VISUAL IMPROVEMENTS:
   ✅ Added subtle shadows/elevation
   ✅ Better spacing
   ✅ Arrow indicators
   ✅ Welcome card now visible

===============================================
HOW TO TEST:
===============================================

1. SCROLLING:
   - Open RiderHomeScreen
   - Swipe up/down - content should scroll
   - Pull down from top - should refresh
   - Welcome card should be visible at bottom

2. CLICKABLE LOCATIONS:
   - Click "📍 Current Location" 
     → Should navigate to BookingScreen
   - Click "🎯 Where to?"
     → Should navigate to BookingScreen
   - See arrow (›) indicating it's clickable

3. GENDER PREFERENCE:
   - Click preference button
   - Change preference
   - Click Continue
   - Should see updated preference immediately

===============================================
*/