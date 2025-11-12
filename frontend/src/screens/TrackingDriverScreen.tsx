"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker } from "react-native-maps"
import io from "socket.io-client"
import axios from "axios"

const socket = io("http://localhost:5000")

export default function TrackingDriverScreen({ route, navigation }) {
  const { rideId } = route.params
  const [ride, setRide] = useState(null)
  const [driver, setDriver] = useState(null)
  const [driverLocation, setDriverLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRideDetails()
    socket.on("driver-location-update", (data) => {
      setDriverLocation(data)
    })

    return () => socket.off("driver-location-update")
  }, [])

  const getRideDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/rides/${rideId}`)
      setRide(response.data.ride)
      if (response.data.ride.driverId) {
        getDriverDetails(response.data.ride.driverId)
      }
    } catch (error) {
      console.log("Failed to load ride details")
    } finally {
      setLoading(false)
    }
  }

  const getDriverDetails = async (driverId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/drivers/profile/${driverId}`)
      setDriver(response.data.driver)
    } catch (error) {
      console.log("Failed to load driver details")
    }
  }

  const completeRide = async () => {
    try {
      const response = await axios.post(`http://localhost:5000/api/rides/${rideId}/complete`, {
        finalFare: ride.estimatedFare,
      })
      if (response.data.success) {
        navigation.replace("Rating", { rideId, driverId: ride.driverId })
      }
    } catch (error) {
      alert("Failed to complete ride")
    }
  }

  if (loading) {
    return <Text>Loading...</Text>
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{ latitude: -34.0522, longitude: 118.2437, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        >
          {driverLocation && <Marker coordinate={driverLocation} title="Driver" />}
          <Marker coordinate={{ latitude: -34.0522, longitude: 118.2437 }} title="You" />
        </MapView>
      </View>

      <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>
        {/* Arriving Info */}
        <View style={styles.arrivingContainer}>
          <Text style={styles.arrivingText}>Arriving in 3 mins</Text>
        </View>

        {/* Tracking Message */}
        <Text style={styles.trackingTitle}>Tracking Your Driver</Text>

        {/* Driver Info */}
        {driver && (
          <View style={styles.driverContainer}>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Text style={styles.avatarInitial}>{driver.userId?.fullName?.charAt(0)}</Text>
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driver.userId?.fullName}</Text>
                <Text style={styles.driverRating}>
                  {driver.userId?.rating || 5.0} · {driver.userId?.totalTrips || 0} trips
                </Text>
                <Text style={styles.vehicleInfo}>
                  {driver.vehicleModel} · {driver.vehicleNumber}
                </Text>
              </View>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>💬</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Trip Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Trip Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "60%" }]} />
          </View>
          <Text style={styles.progressPercent}>60%</Text>
        </View>

        {/* Pickup & Dropoff */}
        <View style={styles.locationsContainer}>
          <View style={styles.locationItem}>
            <View style={styles.locationIcon}>
              <Text>📍</Text>
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationAddress}>{ride?.pickupLocation?.address}</Text>
            </View>
          </View>

          <View style={styles.locationItem}>
            <View style={styles.locationIcon}>
              <Text>📌</Text>
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationAddress}>{ride?.dropoffLocation?.address}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.completeButton} onPress={completeRide}>
          <Text style={styles.completeButtonText}>Complete Ride</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.issueButton} onPress={() => navigation.navigate("ReportIssue", { rideId })}>
          <Text style={styles.issueButtonText}>Report Issue</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel Ride</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3d2f5f" },
  mapContainer: { height: 300, borderRadius: 15, margin: 10, overflow: "hidden" },
  map: { flex: 1 },
  card: {
    flex: 1,
    backgroundColor: "#4a3f6b",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: -20,
  },
  arrivingContainer: {
    backgroundColor: "#3d2f5f",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  arrivingText: { color: "#d4a97b", fontSize: 16, fontWeight: "bold" },
  trackingTitle: { fontSize: 18, fontWeight: "bold", color: "#d4a97b", marginBottom: 15, textAlign: "center" },
  driverContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3d2f5f",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  driverInfo: { flexDirection: "row", flex: 1 },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#d4a97b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarInitial: { fontSize: 24, fontWeight: "bold", color: "#3d2f5f" },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: "bold", color: "#fff", marginBottom: 2 },
  driverRating: { fontSize: 13, color: "#d4a97b", marginBottom: 4 },
  vehicleInfo: { fontSize: 12, color: "#999" },
  driverActions: { flexDirection: "row", gap: 10 },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#d4a97b",
    justifyContent: "center",
    alignItems: "center",
  },
  actionIcon: { fontSize: 20 },
  progressContainer: { marginBottom: 15 },
  progressLabel: { color: "#999", fontSize: 12, marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: "#3d2f5f", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#d4a97b" },
  progressPercent: { color: "#d4a97b", fontSize: 12, marginTop: 6, textAlign: "right" },
  locationsContainer: { marginBottom: 20 },
  locationItem: { flexDirection: "row", marginBottom: 12 },
  locationIcon: { marginRight: 12, fontSize: 20 },
  locationText: { flex: 1 },
  locationLabel: { color: "#999", fontSize: 12, marginBottom: 2 },
  locationAddress: { color: "#fff", fontSize: 14, fontWeight: "500" },
  completeButton: {
    backgroundColor: "#d4a97b",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  completeButtonText: { color: "#3d2f5f", fontWeight: "bold", fontSize: 16 },
  issueButton: {
    borderWidth: 1,
    borderColor: "#d4a97b",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  issueButtonText: { color: "#d4a97b", fontWeight: "600", fontSize: 14 },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#999",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  cancelButtonText: { color: "#999", fontWeight: "600", fontSize: 14 },
})
