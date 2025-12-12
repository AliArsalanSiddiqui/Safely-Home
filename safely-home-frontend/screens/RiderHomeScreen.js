// safely-home-frontend/screens/RiderHomeScreen.js
// ✅ WITH CUSTOM ALERTS

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_URL } from '../config';
import { logout } from '../services/api';
import Sidebar from '../components/Sidebar';
import socketService from '../services/socket';
import { showAlert } from '../components/CustomAlert';

export default function RiderHomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [genderPref, setGenderPref] = useState('Any Driver');
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // Active ride tracking
  const [activeRide, setActiveRide] = useState(null);
  const [checkingRide, setCheckingRide] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUser();
      checkActiveRide();
    });
    
    loadUser();
    checkActiveRide();
    setupSocketListeners();
    
    return unsubscribe;
  }, [navigation]);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    const tokenData = await AsyncStorage.getItem('token');
    
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      updateGenderDisplay(parsed.genderPreference);
      
      if (tokenData) {
        setToken(tokenData);
        socketService.connect(parsed.id);
      }
    }
  };

  const checkActiveRide = async () => {
    try {
      const tokenData = await AsyncStorage.getItem('token');
      if (!tokenData) {
        setCheckingRide(false);
        return;
      }

      console.log('🔍 Home checking for active ride...');

      const response = await fetch(`${API_URL}/rides/active`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.activeRide) {
          console.log('✅ Active ride found in sidebar:', data.activeRide._id);
          setActiveRide(data.activeRide);
        } else {
          console.log('ℹ️ No active ride');
          setActiveRide(null);
        }
      }
    } catch (error) {
      console.error('❌ Error checking active ride:', error);
    } finally {
      setCheckingRide(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('driverAccepted', (data) => {
      console.log('✅ Driver accepted (updating active ride)');
      checkActiveRide();
    });

    socketService.on('rideCompleted', () => {
      console.log('✅ Ride completed (clearing active ride)');
      setActiveRide(null);
    });

    socketService.on('rideCancelled', () => {
      console.log('⚠️ Ride cancelled (clearing active ride)');
      setActiveRide(null);
    });
  };

  const updateGenderDisplay = (pref) => {
    const display = pref === 'female' ? 'Female Drivers' : 
                    pref === 'male' ? 'Male Drivers' : 'Any Driver';
    setGenderPref(display);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    await checkActiveRide();
    setRefreshing(false);
  };

  const handleGoToActiveRide = () => {
    if (!activeRide) return;

    console.log('🔄 Navigating to tracking screen:', activeRide._id);

    navigation.navigate('RiderTracking', {
      rideId: activeRide._id,
      driver: activeRide.driverId,
      pickup: activeRide.pickup?.address,
      destination: activeRide.destination?.address
    });
  };

  const handleLogout = async () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            socketService.disconnect();
            navigation.replace('Login');
          }
        }
      ],
      { type: 'warning' }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <Text style={styles.menuButton}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>SAFELY HOME</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Sidebar */}
      <Sidebar 
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
        userType="rider"
      />

      {/* Active Ride Banner */}
      {checkingRide ? (
        <View style={styles.activeRideBanner}>
          <ActivityIndicator color={COLORS.accent} size="small" />
          <Text style={styles.activeRideText}>Checking for active ride...</Text>
        </View>
      ) : activeRide ? (
        <TouchableOpacity 
          style={styles.activeRideBanner} 
          onPress={handleGoToActiveRide}
          activeOpacity={0.8}
        >
          <View style={styles.activeRideContent}>
            <View style={styles.activeRideIcon}>
              <Text style={styles.activeRideIconText}>🚗</Text>
            </View>
            <View style={styles.activeRideInfo}>
              <Text style={styles.activeRideTitle}>
                {activeRide.status === 'requested' ? 'Finding Driver...' :
                 activeRide.status === 'accepted' ? 'Driver On The Way' :
                 activeRide.status === 'started' ? 'Trip In Progress' : 'Active Ride'}
              </Text>
              <Text style={styles.activeRideDriver}>
                {activeRide.driverId?.name ? `Driver: ${activeRide.driverId.name}` : 'Driver assigned'}
              </Text>
            </View>
            <View style={styles.activeRideArrow}>
              <Text style={styles.activeRideArrowText}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Content */}
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

        <View style={styles.bookingCard}>
          <Text style={styles.cardTitle}>Book Your Ride</Text>
          
          <View style={styles.locationInputs}>
            <TouchableOpacity 
              style={styles.locationInput}
              onPress={() => navigation.navigate('Booking')}
              activeOpacity={0.7}
            >
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Pickup Location</Text>
                <Text style={styles.locationValue}>Current Location</Text>
              </View>
              <Text style={styles.locationArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.locationInput}
              onPress={() => navigation.navigate('Booking')}
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

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome back, {user?.name || 'Rider'}! 👋</Text>
          <Text style={styles.welcomeSubtext}>Where would you like to go today?</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: COLORS.primary,
    zIndex: 10
  },
  menuButton: {
    fontSize: 30,
    color: COLORS.accent,
    fontWeight: 'bold',
    width: 40
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  logo: { width: 40, height: 40, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.accent, letterSpacing: 1 },
  logoutButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.light, justifyContent: 'center', alignItems: 'center' },
  logoutText: { fontSize: 20 },

  activeRideBanner: {
    backgroundColor: COLORS.accent,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 15,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeRideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  activeRideIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.textDark + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  activeRideIconText: { fontSize: 28 },
  activeRideInfo: { flex: 1 },
  activeRideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4
  },
  activeRideDriver: {
    fontSize: 13,
    color: COLORS.textDark,
    opacity: 0.8
  },
  activeRideArrow: { marginLeft: 10 },
  activeRideArrowText: {
    fontSize: 30,
    color: COLORS.textDark,
    fontWeight: 'bold'
  },
  activeRideText: {
    fontSize: 14,
    color: COLORS.textDark,
    marginLeft: 10,
    fontWeight: '600'
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  prefButton: { 
    marginHorizontal: 20, 
    marginBottom: 20, 
    backgroundColor: COLORS.secondary, 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderRadius: 12,
    elevation: 2
  },
  prefButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  prefButtonLabel: { fontSize: 14, color: COLORS.text, opacity: 0.8 },
  prefValueContainer: { flexDirection: 'row', alignItems: 'center' },
  prefValue: { fontSize: 16, color: COLORS.accent, fontWeight: 'bold', marginRight: 5 },
  prefArrow: { fontSize: 24, color: COLORS.accent, fontWeight: 'bold' },
  bookingCard: { 
    backgroundColor: COLORS.secondary, 
    marginHorizontal: 20, 
    borderRadius: 20, 
    padding: 25, 
    marginBottom: 20,
    elevation: 3
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
  locationInputs: { marginBottom: 20 },
  locationInput: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.accent + '30'
  },
  locationIcon: { fontSize: 24, marginRight: 12 },
  locationTextContainer: { flex: 1 },
  locationLabel: { fontSize: 12, color: COLORS.text, opacity: 0.7, marginBottom: 4 },
  locationValue: { fontSize: 16, color: COLORS.text, fontWeight: '500' },
  locationArrow: { fontSize: 24, color: COLORS.accent, fontWeight: 'bold', marginLeft: 10 },
  confirmButton: { 
    backgroundColor: COLORS.accent, 
    borderRadius: 12, 
    paddingVertical: 16, 
    alignItems: 'center',
    elevation: 2
  },
  confirmButtonText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  welcomeCard: { 
    backgroundColor: COLORS.secondary, 
    marginHorizontal: 20, 
    borderRadius: 15, 
    padding: 20, 
    alignItems: 'center',
    elevation: 2
  },
  welcomeText: { fontSize: 18, color: COLORS.text, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  welcomeSubtext: { fontSize: 14, color: COLORS.text, opacity: 0.8, textAlign: 'center' }
});