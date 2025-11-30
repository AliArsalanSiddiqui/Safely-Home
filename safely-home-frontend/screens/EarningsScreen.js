// safely-home-frontend/screens/EarningsScreen.js
// ✅ DRIVER EARNINGS SCREEN

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EarningsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState({
    todayEarnings: '0.00',
    todayRides: 0,
    totalEarnings: '0.00',
    totalRides: 0
  });
  const [recentRides, setRecentRides] = useState([]);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const tokenData = await AsyncStorage.getItem('token');
      
      if (!tokenData) {
        console.error('No token found');
        setLoading(false);
        return;
      }

      // Fetch earnings
      const earningsResponse = await fetch(`${API_URL}/driver/earnings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData}`,
          'Content-Type': 'application/json'
        }
      });

      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        setEarnings(earningsData);
      }

      // Fetch recent completed rides
      const ridesResponse = await fetch(`${API_URL}/rides/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData}`,
          'Content-Type': 'application/json'
        }
      });

      if (ridesResponse.ok) {
        const ridesData = await ridesResponse.json();
        const completedRides = ridesData.rides.filter(r => r.status === 'completed');
        setRecentRides(completedRides.slice(0, 10));
      }

    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  };

  const calculateDriverEarnings = (fare) => {
    return (fare * 0.80).toFixed(2);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Earnings */}
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>Today's Earnings</Text>
          <Text style={styles.todayAmount}>{earnings.todayEarnings} pkr</Text>
          <View style={styles.todayStats}>
            <View style={styles.todayStat}>
              <Text style={styles.todayStatValue}>{earnings.todayRides}</Text>
              <Text style={styles.todayStatLabel}>Rides</Text>
            </View>
            <View style={styles.todayStatDivider} />
            <View style={styles.todayStat}>
              <Text style={styles.todayStatValue}>
                {earnings.todayRides > 0 
                  ? (earnings.todayEarnings / earnings.todayRides).toFixed(2) 
                  : '0.00'}
              </Text>
              <Text style={styles.todayStatLabel}>Avg/Ride</Text>
            </View>
          </View>
        </View>

        {/* Total Earnings */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalAmount}>{earnings.totalEarnings} pkr</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Rides</Text>
            <Text style={styles.totalValue}>{earnings.totalRides} rides</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Average per Ride</Text>
            <Text style={styles.totalValue}>
              {earnings.totalRides > 0 
                ? (earnings.totalEarnings / earnings.totalRides).toFixed(2) 
                : '0.00'} pkr
            </Text>
          </View>
        </View>

        {/* Commission Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How Earnings Work</Text>
            <Text style={styles.infoText}>
              • You earn 80% of the total ride fare{'\n'}
              • Platform takes 20% service fee{'\n'}
              • Earnings update after each completed ride{'\n'}
              • Withdraw anytime to your bank account
            </Text>
          </View>
        </View>

        {/* Recent Rides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Completed Rides</Text>
          
          {recentRides.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🚗</Text>
              <Text style={styles.emptyText}>No completed rides yet</Text>
              <Text style={styles.emptySubtext}>
                Start driving to see your earnings here
              </Text>
            </View>
          ) : (
            recentRides.map((ride, index) => (
              <View key={ride._id || index} style={styles.rideCard}>
                <View style={styles.rideHeader}>
                  <View>
                    <Text style={styles.rideRider}>
                      👤 {ride.riderId?.name || 'Rider'}
                    </Text>
                    <Text style={styles.rideDate}>
                      {new Date(ride.createdAt).toLocaleDateString()} • {' '}
                      {new Date(ride.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  <View style={styles.rideEarnings}>
                    <Text style={styles.rideEarningsAmount}>
                      {calculateDriverEarnings(ride.fare)} pkr
                    </Text>
                    <Text style={styles.rideEarningsLabel}>Your Earnings</Text>
                  </View>
                </View>

                <View style={styles.rideDetails}>
                  <View style={styles.rideLocation}>
                    <Text style={styles.rideLocationIcon}>📍</Text>
                    <Text style={styles.rideLocationText} numberOfLines={1}>
                      {ride.pickup?.address || 'Pickup'}
                    </Text>
                  </View>
                  <View style={styles.rideLocation}>
                    <Text style={styles.rideLocationIcon}>🎯</Text>
                    <Text style={styles.rideLocationText} numberOfLines={1}>
                      {ride.destination?.address || 'Destination'}
                    </Text>
                  </View>
                </View>

                <View style={styles.rideMeta}>
                  <Text style={styles.rideMetaText}>
                    Total Fare: {ride.fare?.toFixed(2)} pkr
                  </Text>
                  {ride.distance && (
                    <Text style={styles.rideMetaText}>
                      {ride.distance.toFixed(1)} km
                    </Text>
                  )}
                  {ride.feedback?.rating && (
                    <Text style={styles.rideMetaText}>
                      ⭐ {ride.feedback.rating}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 50 }} />
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
    padding: 20,
    paddingTop: 10
  },
  backButton: { fontSize: 30, color: COLORS.accent },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.text },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  todayCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    padding: 25,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center'
  },
  todayLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 10
  },
  todayAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 20
  },
  todayStats: {
    flexDirection: 'row',
    width: '100%'
  },
  todayStat: {
    flex: 1,
    alignItems: 'center'
  },
  todayStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5
  },
  todayStatLabel: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.7
  },
  todayStatDivider: {
    width: 1,
    backgroundColor: COLORS.primary,
    marginHorizontal: 20
  },

  totalCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.text
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },

  infoCard: {
    backgroundColor: COLORS.accent + '20',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.accent
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12
  },
  infoContent: {
    flex: 1
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text,
    opacity: 0.8,
    lineHeight: 20
  },

  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.secondary,
    borderRadius: 15
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7
  },

  rideCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 15,
    padding: 15,
    marginBottom: 12
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  rideRider: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4
  },
  rideDate: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.6
  },
  rideEarnings: {
    alignItems: 'flex-end'
  },
  rideEarningsAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent
  },
  rideEarningsLabel: {
    fontSize: 11,
    color: COLORS.text,
    opacity: 0.6
  },

  rideDetails: {
    marginBottom: 10
  },
  rideLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6
  },
  rideLocationIcon: {
    fontSize: 16,
    marginRight: 10
  },
  rideLocationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text
  },

  rideMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary
  },
  rideMetaText: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.7
  }
});