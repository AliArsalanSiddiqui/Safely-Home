"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import axios from "axios"

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState("rider")

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      alert("Please fill all fields")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    try {
      setLoading(true)
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        fullName,
        email,
        phone,
        password,
        userType,
      })

      if (response.data.success) {
        if (userType === "driver") {
          navigation.replace("DriverRegistration")
        } else {
          navigation.replace("Login")
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>

          {/* User Type Selector */}
          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === "rider" && styles.userTypeButtonActive]}
              onPress={() => setUserType("rider")}
            >
              <Text style={[styles.userTypeText, userType === "rider" && styles.userTypeTextActive]}>As Rider</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === "driver" && styles.userTypeButtonActive]}
              onPress={() => setUserType("driver")}
            >
              <Text style={[styles.userTypeText, userType === "driver" && styles.userTypeTextActive]}>As Driver</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
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
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#999"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3d2f5f" },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 0 },
  header: { paddingVertical: 15 },
  backButton: { color: "#d4a97b", fontSize: 16, fontWeight: "600" },
  card: { backgroundColor: "#4a3f6b", borderRadius: 15, padding: 25 },
  title: { fontSize: 24, fontWeight: "bold", color: "#d4a97b", marginBottom: 20, textAlign: "center" },
  userTypeContainer: { flexDirection: "row", marginBottom: 20, gap: 10 },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#3d2f5f",
    borderWidth: 1,
    borderColor: "#d4a97b",
  },
  userTypeButtonActive: { backgroundColor: "#d4a97b" },
  userTypeText: { textAlign: "center", color: "#d4a97b", fontWeight: "600" },
  userTypeTextActive: { color: "#3d2f5f" },
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
  registerButton: {
    backgroundColor: "#d4a97b",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  registerButtonText: { color: "#3d2f5f", fontWeight: "bold", fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
  loginText: { textAlign: "center", color: "#999", marginTop: 15, fontSize: 14 },
  loginLink: { color: "#d4a97b", fontWeight: "600" },
})
