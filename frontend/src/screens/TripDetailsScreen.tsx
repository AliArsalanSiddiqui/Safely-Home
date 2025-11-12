"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import axios from "axios"

export default function TripDetailsScreen({ route, navigation }) {
  const { rideId } = route.params
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTripDetails()
  }, [])

  const getTripDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/rides/${rideId}`)
      setTrip(response.data.ride)
    } catch (error) {
      console.log("Failed to load trip details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#d4a97b" />
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Trip Info */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Trip ID</Text>
            <Text style={styles.value}>{trip?._id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Driver</Text>
            <Text style={styles.value}>{trip?.driverId?.fullName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Date & Time</Text>
            <Text style={styles.value}>{trip?.createdAt}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Route</Text>
            <Text style={styles.value}>
              {trip?.pickupLocation?.address} to {trip?.dropoffLocation?.address}
            </Text>
          </View>

          {/* Evidence Section */}
          <View style={styles.evidenceSection}>
            <View style={styles.evidenceTitleContainer}>
              <Text style={styles.evidenceIcon}>📸</Text>
              <Text style={styles.evidenceTitle}>Add Evidence (Optional)</Text>
            </View>
            <TouchableOpacity style={styles.addPhotoButton}>
              <Text style={styles.addPhotoText}>Add Photo or Screenshot</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Submit Report</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimerText}>
            All reports are confidential and reviewed immediately. We take your safety seriously.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3d2f5f" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15 },
  backButton: { color: "#d4a97b", fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#d4a97b", marginLeft: 20 },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 0 },
  card: { backgroundColor: "#4a3f6b", borderRadius: 15, padding: 25 },
  infoRow: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#3d2f5f", paddingBottom: 12 },
  label: { fontSize: 13, color: "#999", fontWeight: "600", marginBottom: 4 },
  value: { fontSize: 14, color: "#fff", fontWeight: "500" },
  evidenceSection: {
    backgroundColor: "#3d2f5f",
    borderRadius: 8,
    padding: 15,
    marginVertical: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#555",
  },
  evidenceTitleContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  evidenceIcon: { fontSize: 20, marginRight: 10 },
  evidenceTitle: { fontSize: 14, fontWeight: "600", color: "#d4a97b" },
  addPhotoButton: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#555",
    borderRadius: 8,
    paddingVertical: 20,
    alignItems: "center",
  },
  addPhotoText: { color: "#999", fontSize: 13, fontWeight: "500" },
  submitButton: {
    backgroundColor: "#d4a97b",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: { color: "#3d2f5f", fontWeight: "bold", fontSize: 16 },
  disclaimerText: { fontSize: 12, color: "#999", marginTop: 15, textAlign: "center" },
})
