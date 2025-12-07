// safely-home-frontend/screens/GenderPreferenceScreen.js
// ✅ COMPLETE: Shows options based on gender, auto-submits for male riders

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { setGenderPreference } from '../services/api';
import { showAlert } from '../components/CustomAlert';

export default function GenderPreferenceScreen({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userGender, setUserGender] = useState(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  useEffect(() => {
    loadUserGender();
  }, []);

  const loadUserGender = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserGender(user.gender);
      
      console.log('👤 User gender:', user.gender);
      
      // ✅ AUTO-SELECT AND SUBMIT for male riders
      if (user.gender === 'male') {
        setSelected('male');
        // Auto-submit after a brief delay to show the UI
        setTimeout(() => {
          handleContinue(true, 'male');
        }, 500);
      }
    }
  };

  const handleContinue = async (isAutoSubmit = false, autoGender = null) => {
    const preferenceToSubmit = autoGender || selected;
    
    if (!preferenceToSubmit) {
      showAlert(
        'Selection Required',
        'Please select a driver preference',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return;
    }

    // ✅ VALIDATE: Male riders cannot select female or any
    if (userGender === 'male' && (preferenceToSubmit === 'female' || preferenceToSubmit === 'any')) {
      showAlert(
        'Not Available',
        'For safety reasons, male riders can only book male drivers.',
        [{ text: 'OK' }],
        { type: 'error' }
      );
      return;
    }

    if (isAutoSubmit) {
      setAutoSubmitting(true);
    } else {
      setLoading(true);
    }
    
    try {
      await setGenderPreference(preferenceToSubmit);
      
      // Update local storage
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        user.genderPreference = preferenceToSubmit;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      // Check if this is first time (coming from registration) or updating preference
      const isFirstTime = navigation.canGoBack() === false || isAutoSubmit;
      
      if (isFirstTime) {
        // Coming from registration - go to home
        if (isAutoSubmit) {
          // For male riders, show brief success message
          showAlert(
            'Preference Set',
            'You will be matched with male drivers for your safety.',
            [{ text: 'Get Started', onPress: () => navigation.replace('RiderHome') }],
            { type: 'success', cancelable: false }
          );
        } else {
          navigation.replace('RiderHome');
        }
      } else {
        // Updating preference from settings - go back
        showAlert(
          'Preference Updated',
          'Your driver preference has been updated successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
          { type: 'success' }
        );
      }
    } catch (error) {
      console.error('Preference error:', error);
      showAlert(
        'Update Failed',
        'Failed to save preference. Please try again.',
        [{ text: 'OK' }],
        { type: 'error' }
      );
    } finally {
      setLoading(false);
      setAutoSubmitting(false);
    }
  };

  // Show loading screen for male riders during auto-submit
  if (autoSubmitting) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('../assets/logo.png')} style={styles.loadingLogo} resizeMode="contain" />
        <Text style={styles.loadingTitle}>Setting Your Preference...</Text>
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>You'll be matched with male drivers</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.canGoBack() && navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>SAFELY HOME</Text>

      <View style={styles.card}>
        <Text style={styles.heading}>Choose Your Ride Preference</Text>
        <Text style={styles.subheading}>
          {userGender === 'male' 
            ? 'For safety, male riders are matched with male drivers only'
            : 'Select your preferred driver gender for a comfortable ride'}
        </Text>

        {/* ✅ SHOW ALL OPTIONS FOR FEMALE RIDERS */}
        {userGender === 'female' && (
          <>
            {/* Female Drivers Option */}
            <TouchableOpacity
              style={[styles.option, selected === 'female' && styles.optionSelected]}
              onPress={() => setSelected('female')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, selected === 'female' && styles.iconContainerSelected]}>
                <Text style={styles.icon}>👩</Text>
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, selected === 'female' && styles.optionTitleSelected]}>
                  Female Drivers Only
                </Text>
                <Text style={styles.optionSubtitle}>Ride with female drivers</Text>
              </View>
              {selected === 'female' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            {/* Male Drivers Option */}
            <TouchableOpacity
              style={[styles.option, selected === 'male' && styles.optionSelected]}
              onPress={() => setSelected('male')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, selected === 'male' && styles.iconContainerSelected]}>
                <Text style={styles.icon}>👨</Text>
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, selected === 'male' && styles.optionTitleSelected]}>
                  Male Drivers Only
                </Text>
                <Text style={styles.optionSubtitle}>Ride with male drivers</Text>
              </View>
              {selected === 'male' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            {/* No Preference Option */}
            <TouchableOpacity
              style={[styles.option, selected === 'any' && styles.optionSelected]}
              onPress={() => setSelected('any')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, selected === 'any' && styles.iconContainerSelected]}>
                <Text style={styles.icon}>👥</Text>
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, selected === 'any' && styles.optionTitleSelected]}>
                  No Preference
                </Text>
                <Text style={styles.optionSubtitle}>Ride with any available driver</Text>
              </View>
              {selected === 'any' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ✅ MALE RIDERS ONLY SEE MALE OPTION (PRE-SELECTED) */}
        {userGender === 'male' && (
          <>
            <TouchableOpacity
              style={[styles.option, styles.optionSelected]}
              disabled={true}
            >
              <View style={[styles.iconContainer, styles.iconContainerSelected]}>
                <Text style={styles.icon}>👨</Text>
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, styles.optionTitleSelected]}>
                  Male Drivers Only
                </Text>
                <Text style={styles.optionSubtitle}>Required for male riders</Text>
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </TouchableOpacity>

            {/* Info box for male riders */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                For safety and security, male riders can only book male drivers. This is pre-selected for you.
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity 
          style={[styles.continueButton, (!selected || loading) && styles.continueButtonDisabled]} 
          onPress={() => handleContinue(false)} 
          disabled={loading || !selected}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textDark} />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.primary, 
    padding: 20, 
    justifyContent: 'center' 
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingLogo: {
    width: 120,
    height: 120,
    marginBottom: 30
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    marginTop: 20
  },
  backButton: { 
    position: 'absolute', 
    top: 60, 
    left: 20, 
    zIndex: 10 
  },
  backButtonText: { 
    fontSize: 16, 
    color: COLORS.accent, 
    fontWeight: '600' 
  },
  logo: { 
    width: 100, 
    height: 100, 
    alignSelf: 'center', 
    marginBottom: 15 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: COLORS.accent, 
    letterSpacing: 2, 
    textAlign: 'center', 
    marginBottom: 40 
  },
  card: { 
    backgroundColor: COLORS.secondary, 
    borderRadius: 20, 
    padding: 25 
  },
  heading: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    textAlign: 'center', 
    marginBottom: 10 
  },
  subheading: { 
    fontSize: 14, 
    color: COLORS.text, 
    textAlign: 'center', 
    marginBottom: 30, 
    opacity: 0.8, 
    lineHeight: 20 
  },
  option: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primary, 
    borderRadius: 15, 
    padding: 20, 
    marginBottom: 15, 
    borderWidth: 2, 
    borderColor: 'transparent' 
  },
  optionSelected: { 
    borderColor: COLORS.accent, 
    backgroundColor: COLORS.accent + '20' 
  },
  iconContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: COLORS.secondary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  iconContainerSelected: { 
    backgroundColor: COLORS.accent 
  },
  icon: { fontSize: 28 },
  optionTextContainer: { flex: 1 },
  optionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginBottom: 4 
  },
  optionTitleSelected: { color: COLORS.accent },
  optionSubtitle: { 
    fontSize: 13, 
    color: COLORS.text, 
    opacity: 0.7 
  },
  checkmark: { 
    fontSize: 24, 
    color: COLORS.accent, 
    fontWeight: 'bold' 
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent + '20',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.accent
  },
  infoIcon: { 
    fontSize: 20, 
    marginRight: 10 
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18
  },
  continueButton: { 
    backgroundColor: COLORS.accent, 
    borderRadius: 12, 
    paddingVertical: 16, 
    alignItems: 'center', 
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: COLORS.textDark 
  }
});