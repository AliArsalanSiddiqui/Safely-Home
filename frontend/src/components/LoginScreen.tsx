"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, StyleSheet, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import axios from "axios"

export default function LoginScreen({ navigation }) {
  const [userType, setUserType] = useState("rider")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      })

      if (response.data.success) {
        // Store token and navigate
        navigation.replace(userType === "rider" ? "RiderDashboard" : "DriverDashboard")
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} />
          <Text style={styles.appName}>SAFELY HOME</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.welcomeText}>Welcome Back</Text>

          {/* User Type Selector */}
          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === "rider" && styles.userTypeButtonActive]}
              onPress={() => setUserType("rider")}
            >
              <Text style={[styles.userTypeText, userType === "rider" && styles.userTypeTextActive]}>Rider</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === "driver" && styles.userTypeButtonActive]}
              onPress={() => setUserType("driver")}
            >
              <Text style={[styles.userTypeText, userType === "driver" && styles.userTypeTextActive]}>Driver</Text>
            </TouchableOpacity>
          </View>

          {/* Email Input */}
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

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login as {userType === "rider" ? "Rider" : "Driver"}</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <Text style={styles.registerText}>
            Don't have an account?{" "}
            <Text style={styles.registerLink} onPress={() => navigation.navigate("Register")}>
              Register as {userType === "rider" ? "Rider" : "Driver"}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3d2f5f" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logo: { width: 80, height: 80, marginBottom: 10 },
  appName: { fontSize: 24, fontWeight: "bold", color: "#d4a97b", textAlign: "center" },
  card: { backgroundColor: "#4a3f6b", borderRadius: 15, padding: 25 },
  welcomeText: { fontSize: 20, fontWeight: "600", color: "#d4a97b", marginBottom: 20, textAlign: "center" },
  userTypeContainer: { flexDirection: "row", marginBottom: 25, gap: 10 },
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
  loginButton: {
    backgroundColor: "#d4a97b",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  loginButtonText: { color: "#3d2f5f", fontWeight: "bold", fontSize: 16 },
  registerText: { textAlign: "center", color: "#999", marginTop: 15, fontSize: 14 },
  registerLink: { color: "#d4a97b", fontWeight: "600" },
})
