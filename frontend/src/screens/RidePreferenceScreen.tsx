"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function RidePreferenceScreen({ navigation }) {
  const [preference, setPreference] = useState("no_preference")

  const handleContinue = () => {
    navigation.navigate("BookRide", { genderPreference: preference })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Image source={require("../../assets/logo-small.png")} style={styles.logo} />

        <Text style={styles.title}>Choose Your Ride Preference</Text>
        <Text style={styles.subtitle}>Select your preferred driver gender for a comfortable ride</Text>

        {/* Female Drivers Only */}
        <TouchableOpacity
          style={[styles.preferenceButton, preference === "female" && styles.preferenceButtonActive]}
          onPress={() => setPreference("female")}
        >
          <View style={styles.preferenceIcon}>
            <Text style={styles.iconText}>👩</Text>
          </View>
          <View style={styles.preferenceContent}>
            <Text style={[styles.preferenceName, preference === "female" && styles.preferenceNameActive]}>
              Female Drivers Only
            </Text>
            <Text style={styles.preferenceDescription}>Ride with female drivers</Text>
          </View>
        </TouchableOpacity>

        {/* Male Drivers Only */}
        <TouchableOpacity
          style={[styles.preferenceButton, preference === "male" && styles.preferenceButtonActive]}
          onPress={() => setPreference("male")}
        >
          <View style={styles.preferenceIcon}>
            <Text style={styles.iconText}>👨</Text>
          </View>
          <View style={styles.preferenceContent}>
            <Text style={[styles.preferenceName, preference === "male" && styles.preferenceNameActive]}>
              Male Drivers Only
            </Text>
            <Text style={styles.preferenceDescription}>Ride with male drivers</Text>
          </View>
        </TouchableOpacity>

        {/* No Preference */}
        <TouchableOpacity
          style={[styles.preferenceButton, preference === "no_preference" && styles.preferenceButtonActive]}
          onPress={() => setPreference("no_preference")}
        >
          <View style={styles.preferenceIcon}>
            <Text style={styles.iconText}>🚗</Text>
          </View>
          <View style={styles.preferenceContent}>
            <Text style={[styles.preferenceName, preference === "no_preference" && styles.preferenceNameActive]}>
              No Preference
            </Text>
            <Text style={styles.preferenceDescription}>Ride with any available driver</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3d2f5f", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#4a3f6b", borderRadius: 15, padding: 25 },
  logo: { width: 50, height: 50, alignSelf: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#999", textAlign: "center", marginBottom: 25 },
  preferenceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#3d2f5f",
  },
  preferenceButtonActive: { borderColor: "#d4a97b", backgroundColor: "#d4a97b" },
  preferenceIcon: { marginRight: 15 },
  iconText: { fontSize: 28 },
  preferenceContent: { flex: 1 },
  preferenceName: { fontSize: 16, fontWeight: "600", color: "#d4a97b", marginBottom: 4 },
  preferenceNameActive: { color: "#3d2f5f" },
  preferenceDescription: { fontSize: 13, color: "#999" },
  continueButton: {
    backgroundColor: "#d4a97b",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  continueButtonText: { color: "#3d2f5f", fontWeight: "bold", fontSize: 16 },
})
