"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import axios from "axios"

export default function RatingScreen({ route, navigation }) {
  const { rideId, driverId } = route.params
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [selectedTags, setSelectedTags] = useState([])
  const [loading, setLoading] = useState(false)

  const tags = ["Clean Vehicle", "Safe Driving", "Friendly Driver", "Good Route", "Professional"]

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const submitRating = async () => {
    if (rating === 0) {
      alert("Please select a rating")
      return
    }

    try {
      setLoading(true)
      const response = await axios.post("http://localhost:5000/api/ratings/submit", {
        rideId,
        ratedTo: driverId,
        rating,
        comment,
        tags: selectedTags,
      })

      if (response.data.success) {
        navigation.replace("RiderDashboard")
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit rating")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Rate Your Trip</Text>
          <Text style={styles.subtitle}>Your feedback helps us maintain quality service</Text>

          {/* Driver Rating Card */}
          <View style={styles.driverCard}>
            <View style={styles.driverAvatarLarge}>
              <Text style={styles.avatarText}>SJ</Text>
            </View>
            <Text style={styles.driverNameLarge}>Sarah Johnson</Text>
            <View style={styles.ratingDisplayContainer}>
              <Text style={styles.ratingStars}>⭐⭐⭐⭐</Text>
              <Text style={styles.ratingText}>4.9 (1,234 trips)</Text>
            </View>
          </View>

          {/* Rating Stars */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingQuestion}>How was your experience?</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={[styles.star, rating >= star ? styles.starActive : styles.starInactive]}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingLabel}>
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </Text>
            )}
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>What did you like? (Optional)</Text>
            <View style={styles.tagsGrid}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comments */}
          <View style={styles.commentContainer}>
            <Text style={styles.commentLabel}>Additional Comments (Optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share more details about your experience..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              editable={!loading}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={submitRating}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.thankYouText}>Thank you for your feedback! Safely Home</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3d2f5f" },
  scrollContent: { flexGrow: 1, padding: 20 },
  card: { backgroundColor: "#4a3f6b", borderRadius: 15, padding: 25 },
  title: { fontSize: 24, fontWeight: "bold", color: "#d4a97b", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#999", textAlign: "center", marginBottom: 20 },
  driverCard: { backgroundColor: "#3d2f5f", borderRadius: 10, padding: 20, alignItems: "center", marginBottom: 25 },
  driverAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d4a97b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#3d2f5f" },
  driverNameLarge: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  ratingDisplayContainer: { alignItems: "center" },
  ratingStars: { fontSize: 20, marginBottom: 4 },
  ratingText: { fontSize: 13, color: "#d4a97b" },
  ratingContainer: { marginBottom: 25 },
  ratingQuestion: { fontSize: 16, fontWeight: "600", color: "#d4a97b", marginBottom: 12, textAlign: "center" },
  starsContainer: { flexDirection: "row", justifyContent: "center", gap: 12 },
  star: { fontSize: 32 },
  starActive: { opacity: 1 },
  starInactive: { opacity: 0.3 },
  ratingLabel: { textAlign: "center", color: "#d4a97b", fontSize: 14, fontWeight: "600", marginTop: 12 },
  tagsContainer: { marginBottom: 20 },
  tagsTitle: { fontSize: 14, fontWeight: "600", color: "#d4a97b", marginBottom: 12 },
  tagsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d4a97b",
    backgroundColor: "transparent",
  },
  tagActive: { backgroundColor: "#d4a97b", borderColor: "#d4a97b" },
  tagText: { color: "#d4a97b", fontSize: 12, fontWeight: "600" },
  tagTextActive: { color: "#3d2f5f" },
  commentContainer: { marginBottom: 20 },
  commentLabel: { fontSize: 14, fontWeight: "600", color: "#d4a97b", marginBottom: 8 },
  commentInput: {
    backgroundColor: "#3d2f5f",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#555",
    maxHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#d4a97b",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: { color: "#3d2f5f", fontWeight: "bold", fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
  thankYouText: { textAlign: "center", color: "#999", fontSize: 12, marginTop: 15 },
})
