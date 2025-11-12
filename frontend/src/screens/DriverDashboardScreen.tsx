"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Switch } from "react-native"
import MapView, { Marker } from "react-native-maps"
import axios from "axios"

export default function DriverDashboardScreen({ navigation }) {
  const [isOnline, setIsOnline] = useState(false)
  const [driverStats, setDriverStats] = useState({
    totalEarnings: 8500,
    totalRides: 234,
    rating: 4.9,
    acceptanceRate: 98,
  })
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 24.8607,
    longitude: 67.0011, // Karachi
  })
  const [loading, setLoading] = useState(false)

  const toggleOnline = async () => {
    try {
      setLoading(true)
      const response = await axios.post("http://localhost:5000/api/drivers/toggle-availability")
      setIsOnline(!isOnline)
    } catch (error) {
      console.log("Failed to toggle availability")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Online Toggle */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome Back!</Text>
            <Text style={styles.status}>{isOnline ? "Online & Accepting Rides" : "Offline"}</Text>
          </View>
          <TouchableOpacity style={styles.onlineToggle} onPress={toggleOnline}>
            <Switch value={isOnline} onValueChange={toggleOnline} disabled={loading} />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              ...currentLocation,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={currentLocation} title="Your Location" />
          </MapView>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today's Earnings</Text>
            <Text style={styles.statValue}>PKR {driverStats.totalEarnings}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Rides</Text>
            <Text style={styles.statValue}>{driverStats.totalRides}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Rating</Text>
            <Text style={styles.statValue}>{driverStats.rating}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Acceptance</Text>
            <Text style={styles.statValue}>{driverStats.acceptanceRate}%</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionLabel}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabel}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Rides */}
        <View style={styles.recentRidesContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.rideItem}>
            <View style={styles.rideInfo}>
              <Text style={styles.rideName}>Sarah Johnson</Text>
              <Text style={styles.rideRoute}>Downtown to Airport</Text>
              <Text style={styles.rideTime}>2 hours ago</Text>
            </View>
            <Text style={styles.rideEarning}>PKR 450</Text>
          </View>
          <View style={styles.rideItem}>
            <View style={styles.rideInfo}>
              <Text style={styles.rideName}>Ahmed Khan</Text>
              <Text style={styles.rideRoute}>Clifton to Saddar</Text>
              <Text style={styles.rideTime}>4 hours ago</Text>
            </View>
            <Text style={styles.rideEarning}>PKR 380</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3d2f5f" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  status: { fontSize: 13, color: "#d4a97b", marginTop: 4 },
  onlineToggle: { padding: 10 },
  mapContainer: { height: 300, marginHorizontal: 20, borderRadius: 12, overflow: "hidden", marginBottom: 20 },
  map: { flex: 1 },
  statsContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  statCard: {
    width: "48%",
    backgroundColor: "#4a3f6b",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
  },
  statLabel: { fontSize: 12, color: "#999", marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#d4a97b" },
  actionsContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, marginBottom: 25, gap: 10 },
  actionCard: {
    width: "22%",
    backgroundColor: "#4a3f6b",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 11, color: "#d4a97b", textAlign: "center", fontWeight: "600" },
  recentRidesContainer: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#d4a97b", marginBottom: 15 },
  rideItem: {
    backgroundColor: "#4a3f6b",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: "#d4a97b",
  },
  rideInfo: { flex: 1 },
  rideName: { fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  rideRoute: { fontSize: 12, color: "#d4a97b", marginBottom: 4 },
  rideTime: { fontSize: 11, color: "#999" },
  rideEarning: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
})
