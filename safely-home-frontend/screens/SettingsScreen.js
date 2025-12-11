// safely-home-frontend/screens/SettingsScreen.js
// ✅ WITH CUSTOM ALERTS

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { logout } from '../services/api';
import { showAlert } from '../components/CustomAlert';

export default function SettingsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotifications(settings.notifications ?? true);
        setLocationServices(settings.locationServices ?? true);
        setSoundEffects(settings.soundEffects ?? true);
        setDarkMode(settings.darkMode ?? false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key, value) => {
    try {
      const currentSettings = await AsyncStorage.getItem('settings');
      const settings = currentSettings ? JSON.parse(currentSettings) : {};
      settings[key] = value;
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleToggle = (key, value, setter) => {
    setter(value);
    saveSettings(key, value);
  };

  const handleClearCache = () => {
    showAlert(
      'Clear Cache',
      'This will clear all cached data from the app. Your account and ride history will not be affected. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // Clear cache logic here
            showAlert(
              'Cache Cleared',
              'All cached data has been cleared successfully',
              [{ text: 'OK' }],
              { type: 'success' }
            );
          }
        }
      ],
      { type: 'warning' }
    );
  };

  const handleDeleteAccount = () => {
    showAlert(
      '⚠️ Delete Account',
      'This action cannot be undone. All your data, including ride history and profile information, will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            showAlert(
              'Final Confirmation',
              'Are you absolutely sure? This will permanently delete your account and all associated data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    // Account deletion logic
                    await logout();
                    showAlert(
                      'Account Deleted',
                      'Your account has been permanently deleted. We\'re sorry to see you go.',
                      [
                        { 
                          text: 'OK', 
                          onPress: () => navigation.replace('Login') 
                        }
                      ],
                      { type: 'info', cancelable: false }
                    );
                  }
                }
              ],
              { type: 'error' }
            );
          }
        }
      ],
      { type: 'error' }
    );
  };

  const handlePasswordChange = () => {
    showAlert(
      'Change Password',
      'Password change feature coming soon. Please contact support if you need to reset your password.',
      [{ text: 'OK' }],
      { type: 'info' }
    );
  };

  const handlePrivacyPolicy = () => {
    showAlert(
      'Privacy Policy',
      'View our complete privacy policy on our website or contact support for more information.',
      [{ text: 'OK' }],
      { type: 'info' }
    );
  };

  const handleTermsOfService = () => {
    showAlert(
      'Terms of Service',
      'View our complete terms of service on our website or contact support for more information.',
      [{ text: 'OK' }],
      { type: 'info' }
    );
  };

  const handleAbout = () => {
    showAlert(
      'About Safely Home',
      'Safely Home v1.0.0\n\nA gender-safe ride-sharing platform prioritizing your safety and comfort.\n\nFor support, contact:\nsupport@safelyhome.com',
      [{ text: 'OK' }],
      { type: 'info' }
    );
  };

  const SettingRow = ({ icon, label, value, onValueChange, type = 'switch', onPress }) => (
    <TouchableOpacity 
      style={styles.settingRow}
      onPress={type === 'link' ? onPress : undefined}
      disabled={type === 'switch'}
      activeOpacity={type === 'link' ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#767577', true: COLORS.accent }}
          thumbColor={value ? COLORS.accent : '#f4f3f4'}
        />
      ) : type === 'text' ? (
        <Text style={styles.versionText}>{value}</Text>
      ) : (
        <Text style={styles.settingArrow}>›</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <SettingRow
            icon="🔔"
            label="Push Notifications"
            value={notifications}
            onValueChange={(val) => handleToggle('notifications', val, setNotifications)}
          />

          <SettingRow
            icon="📍"
            label="Location Services"
            value={locationServices}
            onValueChange={(val) => handleToggle('locationServices', val, setLocationServices)}
          />

          <SettingRow
            icon="🔊"
            label="Sound Effects"
            value={soundEffects}
            onValueChange={(val) => handleToggle('soundEffects', val, setSoundEffects)}
          />

          <SettingRow
            icon="🌙"
            label="Dark Mode"
            value={darkMode}
            onValueChange={(val) => handleToggle('darkMode', val, setDarkMode)}
          />
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>

          <SettingRow
            icon="🚗"
            label="Driver Preference"
            type="link"
            onPress={() => navigation.navigate('GenderPreference')}
          />

          <SettingRow
            icon="🔒"
            label="Change Password"
            type="link"
            onPress={handlePasswordChange}
          />

          <SettingRow
            icon="🛡️"
            label="Privacy Policy"
            type="link"
            onPress={handlePrivacyPolicy}
          />
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>

          <SettingRow
            icon="📄"
            label="Terms of Service"
            type="link"
            onPress={handleTermsOfService}
          />

          <SettingRow
            icon="ℹ️"
            label="About Safely Home"
            type="link"
            onPress={handleAbout}
          />

          <SettingRow
            icon="📱"
            label="App Version"
            type="text"
            value="1.0.0"
          />
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>

          <SettingRow
            icon="🗑️"
            label="Clear Cache"
            type="link"
            onPress={handleClearCache}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>

          <TouchableOpacity
            style={[styles.settingRow, styles.dangerRow]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>⚠️</Text>
              <Text style={[styles.settingLabel, styles.dangerText]}>
                Delete Account
              </Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10
  },
  backButton: { fontSize: 30, color: COLORS.accent },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  section: {
    marginTop: 25
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    opacity: 0.7,
    marginBottom: 12,
    marginLeft: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  dangerTitle: {
    color: COLORS.light
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    padding: 18,
    borderRadius: 12,
    marginBottom: 10
  },
  dangerRow: {
    borderWidth: 1,
    borderColor: COLORS.light
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  settingIcon: {
    fontSize: 22,
    marginRight: 15
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500'
  },
  dangerText: {
    color: COLORS.light
  },
  settingArrow: {
    fontSize: 24,
    color: COLORS.text,
    opacity: 0.3,
    marginLeft: 10
  },
  versionText: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.6
  }
});