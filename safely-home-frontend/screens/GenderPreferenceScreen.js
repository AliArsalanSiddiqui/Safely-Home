import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { setGenderPreference } from '../services/api';

export default function GenderPreferenceScreen({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert('Please select a preference');
      return;
    }

    setLoading(true);
    try {
      // Update on backend
      await setGenderPreference(selected);
      
      // Update local AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        user.genderPreference = selected;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      // Check if this is first time setup or update
      const isFirstTime = !userData || !JSON.parse(userData).genderPreference;
      
      if (isFirstTime) {
        // First time setup - go to rider home
        navigation.replace('RiderHome');
      } else {
        // Updating preference - go back
        Alert.alert('Success', 'Preference updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save preference');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back button only shows if coming from RiderHome */}
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
        <Text style={styles.subheading}>Select your preferred driver gender for a comfortable ride</Text>

        <TouchableOpacity
          style={[styles.option, selected === 'female' && styles.optionSelected]}
          onPress={() => setSelected('female')}
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

        <TouchableOpacity
          style={[styles.option, selected === 'male' && styles.optionSelected]}
          onPress={() => setSelected('male')}
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

        <TouchableOpacity
          style={[styles.option, selected === 'any' && styles.optionSelected]}
          onPress={() => setSelected('any')}
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

        <TouchableOpacity 
          style={[styles.continueButton, !selected && styles.continueButtonDisabled]} 
          onPress={handleContinue} 
          disabled={loading || !selected}
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
  container: { flex: 1, backgroundColor: COLORS.primary, padding: 20, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  backButtonText: { fontSize: 16, color: COLORS.accent, fontWeight: '600' },
  logo: { width: 80, height: 80, alignSelf: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.accent, letterSpacing: 2, textAlign: 'center', marginBottom: 40 },
  card: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 25 },
  heading: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 10 },
  subheading: { fontSize: 14, color: COLORS.text, textAlign: 'center', marginBottom: 30, opacity: 0.8 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 15, padding: 20, marginBottom: 15, borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '20' },
  iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  iconContainerSelected: { backgroundColor: COLORS.accent },
  icon: { fontSize: 28 },
  optionTextContainer: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  optionTitleSelected: { color: COLORS.accent },
  optionSubtitle: { fontSize: 13, color: COLORS.text, opacity: 0.7 },
  checkmark: { fontSize: 24, color: COLORS.accent, fontWeight: 'bold' },
  continueButton: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
});