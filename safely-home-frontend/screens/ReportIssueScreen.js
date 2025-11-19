import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { COLORS } from '../config';

export default function ReportIssueScreen({ navigation, route }) {
  const { ride } = route.params || {};
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [description, setDescription] = useState('');

  const driver = ride?.driver || { name: 'Sarah Johnson' };
  const tripId = ride?.rideId || '#3104789';

  const issues = [
    { id: 'safety', icon: '🚨', label: 'Safety Concern' },
    { id: 'behavior', icon: '⚠️', label: 'Driver Behavior' },
    { id: 'route', icon: '📍', label: 'Wrong Route' },
    { id: 'harassment', icon: '🚫', label: 'Harassment' },
    { id: 'accident', icon: '💥', label: 'Accident/Emergency' },
    { id: 'other', icon: '📝', label: 'Other Issue' },
  ];

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Services',
      'This will call emergency services immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency',
          style: 'destructive',
          onPress: () => Alert.alert('Emergency', 'Calling emergency services (911)...')
        }
      ]
    );
  };

  const handleSubmit = () => {
    if (!selectedIssue) {
      Alert.alert('Error', 'Please select an issue type');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please describe what happened');
      return;
    }

    Alert.alert(
      'Report Submitted',
      'Your safety report has been submitted. Our team will investigate immediately.',
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report an Issue</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Your safety is our priority. Report any concerns immediately.</Text>

        <View style={styles.tripInfo}>
          <Text style={styles.tripInfoLabel}>Trip Details</Text>
          <Text style={styles.tripInfoText}>Trip ID: {tripId}</Text>
          <Text style={styles.tripInfoText}>Driver: {driver.name}</Text>
          <Text style={styles.tripInfoText}>Date: Oct 15, 2025 • 2:30 PM</Text>
        </View>

        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergency}>
          <Text style={styles.emergencyIcon}>🚨</Text>
          <View style={styles.emergencyTextContainer}>
            <Text style={styles.emergencyText}>Emergency?</Text>
            <Text style={styles.emergencySubtext}>Call emergency services (dial 911)</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>What happened?</Text>

        <View style={styles.issuesGrid}>
          {issues.map((issue) => (
            <TouchableOpacity
              key={issue.id}
              style={[styles.issueCard, selectedIssue === issue.id && styles.issueCardSelected]}
              onPress={() => setSelectedIssue(issue.id)}
            >
              <Text style={styles.issueIcon}>{issue.icon}</Text>
              <Text style={[styles.issueLabel, selectedIssue === issue.id && styles.issueLabelSelected]}>
                {issue.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Please describe what happened</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Provide as much detail as possible. This helps us investigate and take appropriate action."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Text style={styles.disclaimer}>
          All reports are confidential and reviewed within 24 hours. 
          We take your safety seriously.
        </Text>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  backButton: { fontSize: 30, color: COLORS.accent },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.light },
  content: { padding: 20 },
  subtitle: { fontSize: 14, color: COLORS.text, textAlign: 'center', marginBottom: 25, opacity: 0.9 },
  tripInfo: { backgroundColor: COLORS.secondary, borderRadius: 12, padding: 15, marginBottom: 20 },
  tripInfoLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.accent, marginBottom: 8 },
  tripInfoText: { fontSize: 13, color: COLORS.text, marginBottom: 4 },
  emergencyButton: { backgroundColor: COLORS.light, borderRadius: 12, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  emergencyIcon: { fontSize: 40, marginRight: 15 },
  emergencyTextContainer: { flex: 1 },
  emergencyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 4 },
  emergencySubtext: { fontSize: 13, color: COLORS.textDark, opacity: 0.8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  issuesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  issueCard: { width: '48%', backgroundColor: COLORS.secondary, borderRadius: 12, padding: 15, marginBottom: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  issueCardSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '20' },
  issueIcon: { fontSize: 30, marginBottom: 8 },
  issueLabel: { fontSize: 13, color: COLORS.text, textAlign: 'center' },
  issueLabelSelected: { fontWeight: 'bold', color: COLORS.accent },
  descriptionInput: { backgroundColor: COLORS.secondary, borderRadius: 12, padding: 15, color: COLORS.text, fontSize: 14, height: 120, marginBottom: 15, borderWidth: 1, borderColor: COLORS.accent + '30' },
  disclaimer: { fontSize: 12, color: COLORS.text, opacity: 0.7, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  submitButton: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
});