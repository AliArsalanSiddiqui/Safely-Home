"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker } from "react-native-maps"
import axios from "axios"

export default function BookRideScreen({ route, navigation }) {
  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [predictions, setPredictions] = useState([])
  const [estimatedFare, setEstimatedFare] = useState(null)
  const [estimatedTime, setEstimatedTime] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false)

  const searchLocations = async (query, type) => {
    try {
      const response = await axios.get("http://localhost:5000/api/location/autocomplete", {
        params: { input: query },
      })
      if (type === "pickup") {
        setShowPickupSuggestions(true)
      } else {
        setShowDropoffSuggestions(true)
      }
      setPredictions(response.data.predictions)
    } catch (error) {
      console.log("Search failed")
    }
  }

  const estimateFare = async () => {
    if (!pickup || !dropoff) {
      alert("Please select both pickup and dropoff locations")
      return
    }

    try {
      setLoading(true)
      const response = await axios.post("http://localhost:5000/api/location/estimate-fare", {
        pickupLat: -34.0522,
        pickupLng: 118.2437,
        dropoffLat: -34.0522,
        dropoffLng: 118.2437,
      })

      setEstimatedFare(response.data.estimatedFare)
      setEstimatedTime(response.data.duration)
    } catch (error) {
      alert("Failed to estimate fare")
    } finally {
      setLoading(false)
    }
  }

  const handleBookRide = async () => {
    try {
      setLoading(true)
      const response = await axios.post("http://localhost:5000/api/rides/request", {
        pickupLocation: { address: pickup, latitude: 0, longitude: 0 },
        dropoffLocation: { address: dropoff, latitude: 0, longitude: 0 },
        estimatedFare,
        driverGenderPreference: route.params?.genderPreference || "no_preference",
      })

      if (response.data.success) {
        navigation.navigate("TrackingDriver", { rideId: response.data.ride._id })
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to request ride")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{ latitude: -34.0522, longitude: 118.2437, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        >
          <Marker coordinate={{ latitude: -34.0522, longitude: 118.2437 }} title="Pickup" />
        </MapView>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Book Your Ride</Text>

        {/* Pickup Location */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Pickup Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter pickup location"
            placeholderTextColor="#999"
            value={pickup}
            onChangeText={(text) => {
              setPickup(text)
              if (text.length > 2) searchLocations(text, "pickup")
            }}
          />
          {showPickupSuggestions && predictions.length > 0 && (
            <FlatList
              data={predictions.slice(0, 3)}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    setPickup(item.description)
                    setShowPickupSuggestions(false)
                  }}
                >
                  <Text style={styles.suggestionText}>{item.description}</Text>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Dropoff Location */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Destination</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter destination"
            placeholderTextColor="#999"
            value={dropoff}
            onChangeText={(text) => {
              setDropoff(text)
              if (text.length > 2) searchLocations(text, "dropoff")
            }}
          />
          {showDropoffSuggestions && predictions.length > 0 && (
            <FlatList
              data={predictions.slice(0, 3)}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    setDropoff(item.description)
                    setShowDropoffSuggestions(false)
                  }}
                >
                  <Text style={styles.suggestionText}>{item.description}</Text>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Estimate Button */}
        <TouchableOpacity style={styles.estimateButton} onPress={estimateFare} disabled={loading}>
          <Text style={styles.estimateButtonText}>{loading ? "Calculating..." : "Estimate Fare"}</Text>
        </TouchableOpacity>

        {/* Fare Display */}
        {estimatedFare && (
          <View style={styles.fareContainer}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Est. Time:</Text>
              <Text style={styles.fareValue}>{estimatedTime} mins</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Est. Fare:</Text>
              <Text style={styles.fareValue}>PKR {estimatedFare}</Text>
            </View>
          </View>
        )}

        {/* Book Ride Button */}
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.buttonDisabled]}
          onPress={handleBookRide}
          disabled={loading || !estimatedFare}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookButtonText}>Confirm Booking</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3d2f5f" },
  mapContainer: { height: "40%", borderRadius: 15, margin: 10, overflow: "hidden" },
  map: { flex: 1 },
  card: {
    flex: 1,
    backgroundColor: "#4a3f6b",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: -20,
    paddingTop: 25,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#d4a97b", marginBottom: 15 },
  inputContainer: { marginBottom: 15, zIndex: 10 },
  label: { color: "#d4a97b", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: "#3d2f5f",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#d4a97b",
  },
  suggestionItem: { backgroundColor: "#3d2f5f", padding: 10, borderBottomWidth: 1, borderBottomColor: "#555" },
  suggestionText: { color: "#999", fontSize: 13 },
  estimateButton: {
    backgroundColor: "#d4a97b",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  estimateButtonText: { color: "#3d2f5f", fontWeight: "bold" },
  fareContainer: { backgroundColor: "#3d2f5f", borderRadius: 8, padding: 15, marginBottom: 15 },
  fareRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  fareLabel: { color: "#999", fontSize: 14 },
  fareValue: { color: "#d4a97b", fontWeight: "bold", fontSize: 14 },
  bookButton: { backgroundColor: "#d4a97b", paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  bookButtonText: { color: "#3d2f5f", fontWeight: "bold", fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
})
