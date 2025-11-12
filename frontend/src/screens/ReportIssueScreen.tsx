"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import axios from "axios"

export default function ReportIssueScreen({ route, navigation }) {
  const { rideId } = route.params
  const [issueType, setIssueType] = useState(null)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const issues = [
    { id: "safety_concern", label: "Safety Concern", icon: "🛡️" },
    { id: "driver_behavior", label: "Driver Behavior", icon: "⚠️" },
    { id: "wrong_route", label: "Wrong Route", icon: "🗺️" },
    { id: "harassment", label: "Harassment", icon: "⚠️" },
    { id: "accident_emergency", label: "Accident/Emergency", icon: "🚨" },
    { id: "other", label: "Other Issues", icon: "❓" },
  ]

  const reportIssue = async () => {
    if (!issueType || !description) {
      alert("Please select issue type and provide description")
      return
    }

    try {
      setLoading(true)
      const response = await axios.post("http://localhost:5000/api/issues/report", {
        rideId,
        issueType,
        description,
      })

      if (response.data.success) {
        alert("Issue reported successfully. Our team will review it shortly.")
        navigation.goBack()
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to report issue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report an Issue</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.subtitle}>Your safety is our priority. Report any concerns immediately.</Text>

          {/* Emergency Banner */}
          <View style={styles.emergencyBanner}>
            <Text style={styles.emergencyIcon}>🚨</Text>
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>Emergency?</Text>
              <Text style={styles.emergencyText}>In case of immediate danger, call emergency services first</Text>
            </View>
            <TouchableOpacity style={styles.emergencyButton}>
              <Text style={styles.emergencyButtonText}>Call Emergency Services</Text>
            </TouchableOpacity>
          </View>

          {/* Issue Types */}
          <Text style={styles.issueTypeTitle}>What happened?</Text>
          <View style={styles.issuesGrid}>
            {issues.map((issue) => (
              <TouchableOpacity
                key={issue.id}
                style={[styles.issueButton, issueType === issue.id && styles.issueButtonActive]}
                onPress={() => setIssueType(issue.id)}
              >
                <Text style={styles.issueIcon}>{issue.icon}</Text>
                <Text style={[styles.issueLabel, issueType === issue.id && styles.issueLabelActive]}>
                  {issue.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Please describe what happened</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Provide as much detail as possible. This helps us investigate and take appropriate action."
              placeholderTextColor="#666"
              multiline
              numberOfLines={5}
              value={description}
              onChangeText={setDescription}
              editable={!loading}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={reportIssue}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Report</Text>}
          </TouchableOpacity>

          <Text style={styles.confidentialText}>
            All reports are confidential and reviewed by our safety team. We take your safety seriously.
          </Text>
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
    paddingVertical: 15,
  },
  backButton: { color: "#d4a97b", fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#d4a97b" },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 0 },
  card: { backgroundColor: "#4a3f6b", borderRadius: 15, padding: 25 },
  subtitle: { fontSize: 14, color: "#999", marginBottom: 20, textAlign: "center" },
  emergencyBanner: {
    backgroundColor: "#8B0000",
    borderRadius: 10,
    padding: 15,
    marginBottom: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  emergencyIcon: { fontSize: 24, marginRight: 12 },
  emergencyContent: { flex: 1, marginRight: 10 },
  emergencyTitle: { color: "#fff", fontWeight: "bold", fontSize: 14, marginBottom: 2 },
  emergencyText: { color: "#ddd", fontSize: 12 },
  emergencyButton: { backgroundColor: "#fff", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  emergencyButtonText: { color: "#8B0000", fontWeight: "bold", fontSize: 11 },
  issueTypeTitle: { fontSize: 16, fontWeight: "600", color: "#d4a97b", marginBottom: 15 },
  issuesGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 25, gap: 10 },
  issueButton: {
    flex: 0.48,
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#555",
    backgroundColor: "#3d2f5f",
    alignItems: "center",
  },
  issueButtonActive: { borderColor: "#d4a97b", backgroundColor: "#d4a97b" },
  issueIcon: { fontSize: 28, marginBottom: 6 },
  issueLabel: { fontSize: 12, color: "#999", textAlign: "center", fontWeight: "600" },
  issueLabelActive: { color: "#3d2f5f" },
  descriptionContainer: { marginBottom: 20 },
  descriptionLabel: { fontSize: 14, fontWeight: "600", color: "#d4a97b", marginBottom: 8 },
  descriptionInput: {
    backgroundColor: "#3d2f5f",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#555",
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: "#d4a97b",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  submitButtonText: { color: "#3d2f5f", fontWeight: "bold", fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
  confidentialText: { fontSize: 12, color: "#999", marginTop: 15, textAlign: "center" },
})
