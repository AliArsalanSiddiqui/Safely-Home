"use client"

import { useState, useRef } from "react"
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, StyleSheet, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { CameraView } from "expo-camera"
import axios from "axios"

export default function DriverRegistrationScreen({ navigation }) {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [vehicleModel, setVehicleModel] = useState("")
  const [facialData, setFacialData] = useState(null)
  const [loading, setLoading] = useState(false)
  const cameraRef = useRef(null)

  const takeFacialRecognitionPhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        base64: true,
      })
      setFacialData("data:image/jpg;base64," + photo.base64)
      setStep(3)
    } catch (error) {
      alert("Failed to capture photo")
    }
  }

  const handleRegister = async () => {
    try {
      setLoading(true)
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        fullName,
        email,
        phone,
        password: phone, // Simple registration
        userType: "driver",
        facialData,
      })

      if (response.data.success) {
        alert("Registration successful! Please login.")
        navigation.navigate("Login")
      }
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>Driver Registration</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Driver License Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your license number"
                placeholderTextColor="#999"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehicle Model</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter vehicle model"
                placeholderTextColor="#999"
                value={vehicleModel}
                onChangeText={setVehicleModel}
              />
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 2 && (
        <View style={styles.container}>
          <CameraView ref={cameraRef} style={styles.camera}>
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraText}>Face Recognition Verification</Text>
              <Text style={styles.cameraSubtext}>Click below to verify your identity</Text>

              <TouchableOpacity style={styles.captureButton} onPress={takeFacialRecognitionPhoto}>
                <Text style={styles.captureButtonText}>Start Face Recognition</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}

      {step === 3 && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>Verification Complete</Text>

            {facialData && <Image source={{ uri: facialData }} style={styles.facialImage} />}

            <View style={styles.confirmContainer}>
              <Text style={styles.confirmText}>Your face has been captured successfully!</Text>
              <Text style={styles.confirmSubtext}>Now complete your driver registration</Text>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Complete Registration</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
              <Text style={styles.buttonText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3d2f5f" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#4a3f6b", borderRadius: 15, padding: 25 },
  title: { fontSize: 24, fontWeight: "bold", color: "#d4a97b", marginBottom: 25, textAlign: "center" },
  inputContainer: { marginBottom: 15 },
  label: { color: "#d4a97b", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: "#3d2f5f",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#d4a97b",
  },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" },
  cameraText: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 10, textAlign: "center" },
  cameraSubtext: { fontSize: 14, color: "#ccc", marginBottom: 30, textAlign: "center" },
  captureButton: { backgroundColor: "#d4a97b", paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  captureButtonText: { color: "#3d2f5f", fontWeight: "bold", fontSize: 16 },
  facialImage: { width: 200, height: 200, borderRadius: 10, alignSelf: "center", marginBottom: 20 },
  confirmContainer: { alignItems: "center", marginBottom: 25 },
  confirmText: { fontSize: 16, fontWeight: "600", color: "#d4a97b", textAlign: "center", marginBottom: 5 },
  confirmSubtext: { fontSize: 14, color: "#999", textAlign: "center" },
  nextButton: { backgroundColor: "#d4a97b", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 20 },
  registerButton: {
    backgroundColor: "#d4a97b",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  backButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d4a97b",
  },
  buttonText: { color: "#3d2f5f", fontWeight: "bold", fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
})
