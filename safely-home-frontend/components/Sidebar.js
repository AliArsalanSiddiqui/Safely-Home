// safely-home-frontend/components/Sidebar.js
// ✅ COMPLETE - WITH ACTIVE RIDE INDICATOR

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_URL } from '../config';
import ProfileAvatar from './ProfileAvatar';

const { width } = Dimensions.get('window');

export default function Sidebar({ visible, onClose, navigation, userType }) {
  const [user, setUser] = useState(null);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeRide, setActiveRide] = useState(null);
  const [checkingRide, setCheckingRide] = useState(true);

  useEffect(() => {
    if (visible) {
      loadUser();
      checkActiveRide();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 250,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const checkActiveRide = async () => {
    try {
      const tokenData = await AsyncStorage.getItem('token');
      if (!tokenData) {
        setCheckingRide(false);
        return;
      }

      console.log('🔍 Sidebar checking for active ride...');

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
          console.log('ℹ️ No active ride in sidebar');
          setActiveRide(null);
        }
      }
    } catch (error) {
      console.error('❌ Sidebar - Error checking active ride:', error);
    } finally {
      setCheckingRide(false);
    }
  };

  const handleNavigation = (screen) => {
    onClose();
    setTimeout(() => navigation.navigate(screen), 300);
  };

  const handleGoToActiveRide = () => {
    if (!activeRide) return;

    console.log('🔄 Navigating to active ride from sidebar:', activeRide._id);

    onClose();
    
    setTimeout(() => {
      if (userType === 'rider') {
        navigation.navigate('RiderTracking', {
          rideId: activeRide._id,
          driver: activeRide.driverId,
          pickup: activeRide.pickup?.address,
          destination: activeRide.destination?.address
        });
      } else {
        navigation.navigate('DriverTracking', {
          rideId: activeRide._id,
          rider: activeRide.riderId,
          pickup: activeRide.pickup?.address,
          destination: activeRide.destination?.address
        });
      }
    }, 300);
  };

  const MenuItem = ({ icon, label, onPress, badge, highlight }) => (
    <TouchableOpacity 
      style={[styles.menuItem, highlight && styles.menuItemHighlight]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, highlight && styles.menuLabelHighlight]}>{label}</Text>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={[styles.menuArrow, highlight && styles.menuArrowHighlight]}>›</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Profile Header */}
              <View style={styles.profileSection}>
              <ProfileAvatar user={user} size={80} fontSize={32} />
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
              <View style={styles.userTypeBadge}>
                <Text style={styles.userTypeText}>
                  {userType === 'rider' ? '👤 Rider' : '🚗 Driver'}
                </Text>
              </View>
            </View>

              <View style={styles.divider} />

              {/* ✅ ACTIVE RIDE SECTION */}
              {checkingRide ? (
                <View style={styles.activeRideSection}>
                  <View style={styles.checkingContainer}>
                    <ActivityIndicator color={COLORS.accent} size="small" />
                    <Text style={styles.checkingText}>Checking for active ride...</Text>
                  </View>
                </View>
              ) : activeRide ? (
                <View style={styles.activeRideSection}>
                  <MenuItem
                    icon="🚗"
                    label="Active Ride - Tap to View"
                    onPress={handleGoToActiveRide}
                    highlight={true}
                  />
                  <Text style={styles.activeRideStatus}>
                    Status: {
                      activeRide.status === 'requested' ? '🔍 Finding Driver...' :
                      activeRide.status === 'accepted' ? '✅ Driver On The Way' :
                      activeRide.status === 'started' ? '🚀 Trip In Progress' : 
                      activeRide.status
                    }
                  </Text>
                  {activeRide.driverId && (
                    <Text style={styles.activeRideDriver}>
                      Driver: {activeRide.driverId.name}
                    </Text>
                  )}
                  <View style={styles.divider} />
                </View>
              ) : null}

              {/* Menu Items */}
              <View style={styles.menuSection}>
                <MenuItem
                  icon="👤"
                  label="Profile"
                  onPress={() => handleNavigation('Profile')}
                />
                
                <MenuItem
                  icon="📜"
                  label="Ride History"
                  onPress={() => handleNavigation('RideHistory')}
                />

                {userType === 'rider' && (
                  <MenuItem
                    icon="⚙️"
                    label="Driver Preference"
                    onPress={() => handleNavigation('GenderPreference')}
                  />
                )}

                {userType === 'driver' && (
                  <MenuItem
                    icon="💰"
                    label="Earnings"
                    onPress={() => handleNavigation('Earnings')}
                  />
                )}

                <MenuItem
                  icon="⭐"
                  label="My Ratings"
                  onPress={() => handleNavigation('MyRatings')}
                />

                <MenuItem
                  icon="🔔"
                  label="Notifications"
                  onPress={() => handleNavigation('Notifications')}
                />

                <MenuItem
                  icon="❓"
                  label="Help & Support"
                  onPress={() => handleNavigation('Support')}
                />

                <MenuItem
                  icon="⚙️"
                  label="Settings"
                  onPress={() => handleNavigation('Settings')}
                />
              </View>

              <View style={styles.divider} />

              {/* App Info */}
              <View style={styles.appInfo}>
                <Text style={styles.appVersion}>Safely Home v1.0.0 </Text>
                <Text style={styles.appSubtext}>Your Safety, Our Priority  </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row'
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  sidebar: {
    width: width * 0.8,
    backgroundColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10
  },
  safeArea: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 30
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textDark
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7,
    marginBottom: 15
  },
  userTypeBadge: {
    backgroundColor: COLORS.accent + '30',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.accent
  },
  userTypeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.accent
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.primary,
    marginVertical: 10
  },
  
  // Active Ride Section
  activeRideSection: {
    paddingVertical: 10
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15
  },
  checkingText: {
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 10,
    opacity: 0.7
  },
  activeRideStatus: {
    fontSize: 13,
    color: COLORS.accent,
    paddingHorizontal: 20,
    paddingBottom: 5,
    fontWeight: '600'
  },
  activeRideDriver: {
    fontSize: 12,
    color: COLORS.text,
    paddingHorizontal: 20,
    paddingBottom: 10,
    opacity: 0.8
  },
  
  menuSection: {
    paddingVertical: 10
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20
  },
  menuItemHighlight: {
    backgroundColor: COLORS.accent + '20',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent
  },
  menuIcon: {
    fontSize: 24,
    width: 40
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500'
  },
  menuLabelHighlight: {
    color: COLORS.accent,
    fontWeight: 'bold'
  },
  menuArrow: {
    fontSize: 24,
    color: COLORS.text,
    opacity: 0.3
  },
  menuArrowHighlight: {
    color: COLORS.accent,
    opacity: 1
  },
  badge: {
    backgroundColor: COLORS.light,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 10
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20
  },
  appVersion: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7,
    marginBottom: 5
  },
  appSubtext: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.5
  }
});