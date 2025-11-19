import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { COLORS } from '../config';
import { rateRide } from '../services/api';

export default function RatingScreen({ navigation, route }) {
  const { ride } = route.params || {};
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const driver = ride?.driver || { name: 'Sarah Johnson', rating: 4.9, totalTrips: 234 };
  const tripId = ride?.rideId || '#3104789';

  const tags = [
    { id: 1, label: '🚗 Clean Vehicle' },
    { id: 2, label: '🛡️ Safe Driving' },
    { id: 3, label: '😊 Friendly Driver' },
    { id: 4, label: '⏰ On Time' },
    { id: 5, label: '🗺️ Good Route' },
    { id: 6, label: '💼 Professional' },
  ];

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Please rate your experience');
      return;
    }

    setLoading(true);
    try {
      await rateRide(tripId, rating, {
        tags: selectedTags,
        comments: comment
      });

      Alert.alert(
        'Thank you!',
        'Your feedback helps us maintain quality service',
        [
          { text: 'OK', onPress: () => navigation.replace('RiderHome') }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Rate Your Trip</Text>
          <Text style={styles.subtitle}>Your feedback helps us maintain quality service</Text>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {driver.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text style={styles.driverName}>{driver.name}</Text>
          <View style={styles.driverStats}>
            <Text style={styles.driverStat}>⭐ {driver.rating} </Text>
            <Text style={styles.driverStat}>•{driver.totalTrips} trips </Text>
          </View>
          <Text style={styles.tripId}>Trip {tripId} • Oct 15, 2025</Text>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>How was your experience?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text style={[styles.star, star <= rating && styles.starFilled]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 0 && ''}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </Text>
        </View>

        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>What did you like? (Optional) </Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[styles.tag, selectedTags.includes(tag.id) && styles.tagSelected]}
                onPress={() => toggleTag(tag.id)}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag.id) && styles.tagTextSelected]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Additional Comments (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share more details about your experience..."
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || rating === 0}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Thank you for helping us improve Safely Home
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 25, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.accent, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.text, textAlign: 'center', opacity: 0.8 },
  driverCard: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 30 },
  driverAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  driverAvatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.textDark },
  driverName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  driverStats: { flexDirection: 'row', marginBottom: 8 },
  driverStat: { fontSize: 14, color: COLORS.text, marginHorizontal: 5 },
  tripId: { fontSize: 13, color: COLORS.text, opacity: 0.7 },
  ratingSection: { marginBottom: 30, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 15, alignSelf: 'flex-start' },
  starsContainer: { opacity: 0.8, flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  starButton: { padding: 5 },
  star: { fontSize: 50, color: COLORS.primary },
  starFilled: { color: COLORS.accent },
  ratingLabel: { fontSize: 18, color: COLORS.accent, fontWeight: 'bold', height: 25 },
  tagsSection: { marginBottom: 30 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: COLORS.secondary, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  tagSelected: { backgroundColor: COLORS.accent + '30', borderColor: COLORS.accent },
  tagText: { fontSize: 14, color: COLORS.text },
  tagTextSelected: { color: COLORS.accent, fontWeight: 'bold' },
  commentSection: { marginBottom: 25 },
  commentInput: { backgroundColor: COLORS.secondary, borderRadius: 12, padding: 15, color: COLORS.text, fontSize: 14, height: 100, borderWidth: 1, borderColor: COLORS.accent + '30' },
  submitButton: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 15 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  disclaimer: { fontSize: 12, color: COLORS.text, textAlign: 'center', opacity: 0.7 },
});