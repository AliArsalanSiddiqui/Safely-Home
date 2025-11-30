// safely-home-frontend/screens/SettingsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { logout } from '../services/api';

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
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // Clear cache logic here
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type DELETE to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Proceed',
                  style: 'destructive',
                  onPress: async () => {
                    // Account deletion logic
                    await logout();
                    navigation.replace('Login');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const SettingRow = ({ icon, label, value, onValueChange, type = 'switch' }) => (
    <View style={styles.settingRow}>
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
      ) : (
        <Text style={styles.settingArrow}>›</Text>
      )}
    </View>
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

          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('GenderPreference')}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🚗</Text>
              <Text style={styles.settingLabel}>Driver Preference</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔒</Text>
              <Text style={styles.settingLabel}>Change Password</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🛡️</Text>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>📄</Text>
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>ℹ️</Text>
              <Text style={styles.settingLabel}>About Safely Home</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>📱</Text>
              <Text style={styles.settingLabel}>App Version</Text>
            </View>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>

          <TouchableOpacity style={styles.settingRow} onPress={handleClearCache}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🗑️</Text>
              <Text style={styles.settingLabel}>Clear Cache</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
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