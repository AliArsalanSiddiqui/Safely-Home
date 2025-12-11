// safely-home-frontend/screens/ReportIssueScreen.js
// ✅ UPDATED: Using Custom Alerts instead of Alert.alert

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Linking, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { COLORS, API_URL } from '../config';
import { makeEmergencyCall } from '../services/phoneUtils';
import { showAlert } from '../components/CustomAlert';

export default function ReportIssueScreen({ navigation, route }) {
  const params = route.params || {};
  const rideId = params.rideId;
  const driver = params.driver || {};
  
  const [rideDetails, setRideDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const issues = [
    { id: 'safety', icon: '🚨', label: 'Safety Concern' },
    { id: 'behavior', icon: '⚠️', label: 'Driver Behavior' },
    { id: 'route', icon: '📍', label: 'Wrong Route' },
    { id: 'harassment', icon: '🚫', label: 'Harassment' },
    { id: 'accident', icon: '💥', label: 'Accident/Emergency' },
    { id: 'other', icon: '📝', label: 'Other Issue' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tokenData = await AsyncStorage.getItem('token');
      setToken(tokenData);

      if (rideId && tokenData) {
        await fetchRideDetails(tokenData);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const fetchRideDetails = async (authToken) => {
    try {
      console.log('📡 Fetching ride details for report:', rideId);
      
      const response = await fetch(`${API_URL}/rides/${rideId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const ride = data.ride || data;
        
        console.log('✅ Ride details loaded:', ride);
        setRideDetails(ride);
      } else {
        console.log('⚠️ Could not fetch ride details');
      }
    } catch (error) {
      console.error('❌ Failed to fetch ride details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergency = () => {
    makeEmergencyCall();
  };

  const handleSubmit = async () => {
    if (!selectedIssue) {
      showAlert(
        'Issue Type Required',
        'Please select an issue type to continue',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return;
    }

    if (!description.trim()) {
      showAlert(
        'Description Required',
        'Please describe what happened so we can help you better',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return;
    }

    setSubmitting(true);

    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      const reportData = {
        rideId: rideId,
        issueType: selectedIssue,
        description: description.trim(),
        driverName: driver?.name || 'Unknown',
        driverId: driver?.id || null,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        timestamp: new Date().toISOString()
      };

      console.log('📝 Submitting report:', reportData);

      // Save report locally
      const existingReports = await AsyncStorage.getItem('reports');
      const reports = existingReports ? JSON.parse(existingReports) : [];
      reports.push(reportData);
      await AsyncStorage.setItem('reports', JSON.stringify(reports));

      showAlert(
        'Report Submitted',
        'Your safety report has been submitted successfully. Our team will investigate immediately and contact you within 24 hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { type: 'success', cancelable: false }
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      showAlert(
        'Submission Failed',
        'Failed to submit report. Please try again or contact support directly.',
        [{ text: 'OK' }],
        { type: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report an Issue</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </View>
    );
  }

  const getRideDateTime = () => {
    if (rideDetails?.createdAt) {
      const date = new Date(rideDetails.createdAt);
      return date.toLocaleString();
    }
    return 'Date not available';
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
          <Text style={styles.tripInfoText}>Trip ID: {rideId?.slice(-6) || '#XXXXX'}</Text>
          <Text style={styles.tripInfoText}>Driver: {driver?.name || rideDetails?.driverId?.name || 'Unknown'}</Text>
          <Text style={styles.tripInfoText}>Date: {getRideDateTime()}</Text>
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

        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.text },
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
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
});