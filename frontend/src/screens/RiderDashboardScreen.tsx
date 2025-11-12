"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from "react-native"
import axios from "axios"

export default function RiderDashboardScreen({ navigation }) {
  const [user, setUser] = useState(null)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("home")

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Simulate loading user data
      setUser({
        name: "John Doe",
        rating: 4.8,
        totalTrips: 24,
        balance: 2500,
      })

      // Load trip history
      const response = await axios.get("http://localhost:5000/api/rides/user/history")
      setTrips(response.data.rides || [])
    } catch (error) {
      console.log("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const renderTripItem = ({ item }) => (
    <TouchableOpacity style={styles.tripCard} onPress={() => navigation.navigate("TripDetails", { rideId: item._id })}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Date"}</Text>
        <Text style={[styles.tripStatus, { color: item.status === "completed" ? "#4CAF50" : "#FFC107" }]}>
          {item.status?.toUpperCase()}
        </Text>
      </View>
      <View style={styles.tripDetails}>
        <View style={styles.tripLocation}>
          <Text style={styles.locationFrom}>From: {item.pickupLocation?.address}</Text>
          <Text style={styles.locationTo}>To: {item.dropoffLocation?.address}</Text>
        </View>
        <Text style={styles.tripFare}>PKR {item.finalFare || item.estimatedFare}</Text>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#d4a97b" style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {activeTab === "home" && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>Welcome, {user?.name}</Text>
                <Text style={styles.userRating}>
                  {user?.rating} rating · {user?.totalTrips} trips
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate("RidePreference")}>
              <Text style={styles.quickActionIcon}>🚗</Text>
              <Text style={styles.quickActionText}>Book Ride</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>⭐</Text>
              <Text style={styles.quickActionText}>My Ratings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>🛡️</Text>
              <Text style={styles.quickActionText}>Safety</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>👤</Text>
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <Text style={styles.balanceAmount}>PKR {user?.balance}</Text>
            <TouchableOpacity style={styles.addFundsButton}>
              <Text style={styles.addFundsText}>Add Funds</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Trips */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recent Trips</Text>
            <FlatList
              data={trips.slice(0, 3)}
              renderItem={renderTripItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      )}

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomTabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "home" && styles.tabActive]}
          onPress={() => setActiveTab("home")}
        >
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === "home" && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "trips" && styles.tabActive]}
          onPress={() => setActiveTab("trips")}
        >
          <Text style={styles.tabIcon}>📋</Text>
          <Text style={[styles.tabLabel, activeTab === "trips" && styles.tabLabelActive]}>Trips</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "profile" && styles.tabActive]}
          onPress={() => setActiveTab("profile")}
        >
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={[styles.tabLabel, activeTab === "profile" && styles.tabLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3d2f5f" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#d4a97b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 24, fontWeight: "bold", color: "#3d2f5f" },
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  userRating: { fontSize: 12, color: "#999" },
  notificationButton: { padding: 10 },
  notificationIcon: { fontSize: 24 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  quickActionButton: {
    width: "22%",
    backgroundColor: "#4a3f6b",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
  },
  quickActionIcon: { fontSize: 24, marginBottom: 4 },
  quickActionText: { fontSize: 11, color: "#d4a97b", textAlign: "center", fontWeight: "600" },
  balanceCard: { backgroundColor: "#4a3f6b", marginHorizontal: 20, borderRadius: 12, padding: 20, marginBottom: 20 },
  balanceLabel: { fontSize: 13, color: "#999", marginBottom: 8 },
  balanceAmount: { fontSize: 28, fontWeight: "bold", color: "#d4a97b", marginBottom: 12 },
  addFundsButton: { backgroundColor: "#d4a97b", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  addFundsText: { color: "#3d2f5f", fontWeight: "bold", fontSize: 14 },
  sectionContainer: { paddingHorizontal: 20, marginBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#d4a97b", marginBottom: 12 },
  tripCard: {
    backgroundColor: "#4a3f6b",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#d4a97b",
  },
  tripHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  tripDate: { fontSize: 13, color: "#999" },
  tripStatus: { fontWeight: "600", fontSize: 12 },
  tripDetails: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  tripLocation: { flex: 1 },
  locationFrom: { fontSize: 12, color: "#d4a97b", marginBottom: 4 },
  locationTo: { fontSize: 12, color: "#d4a97b" },
  tripFare: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  bottomTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#4a3f6b",
    backgroundColor: "#2d1f4f",
  },
  tab: { alignItems: "center", paddingVertical: 8 },
  tabActive: { borderTopWidth: 3, borderTopColor: "#d4a97b", paddingTop: 5 },
  tabIcon: { fontSize: 24, marginBottom: 4 },
  tabLabel: { fontSize: 11, color: "#999" },
  tabLabelActive: { color: "#d4a97b", fontWeight: "600" },
})
