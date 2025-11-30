// safely-home-frontend/screens/ProfileScreen.js
// ✅ COMPLETE PROFILE SCREEN - Works for both Rider & Driver

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_URL } from '../config';

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  
  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [newImageUri, setNewImageUri] = useState(null);
  
  // Driver specific
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const tokenData = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (!tokenData) {
        Alert.alert('Error', 'Please login again');
        navigation.replace('Login');
        return;
      }

      setToken(tokenData);

      console.log('📡 Fetching profile...');

      const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const profile = data.user;
        
        console.log('✅ Profile loaded:', profile);

        setUser(profile);
        setName(profile.name || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
        setProfileImage(profile.profilePicture || null);

        if (profile.vehicleInfo) {
          setVehicleModel(profile.vehicleInfo.model || '');
          setLicensePlate(profile.vehicleInfo.licensePlate || '');
          setVehicleColor(profile.vehicleInfo.color || '');
        }
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('❌ Load profile error:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });

            if (!result.canceled) {
              setNewImageUri(result.assets[0].uri);
            }
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });

            if (!result.canceled) {
              setNewImageUri(result.assets[0].uri);
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (user.userType === 'driver' && (!vehicleModel.trim() || !licensePlate.trim())) {
      Alert.alert('Error', 'Please fill in vehicle information');
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());

      if (user.userType === 'driver') {
        formData.append('vehicleInfo', JSON.stringify({
          model: vehicleModel.trim(),
          licensePlate: licensePlate.trim(),
          color: vehicleColor.trim() || 'Not specified'
        }));
      }

      if (newImageUri) {
        const filename = newImageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('profilePicture', {
          uri: newImageUri,
          name: filename,
          type
        });
      }

      console.log('📤 Saving profile...');

      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log('✅ Profile updated:', data);

        // Update AsyncStorage
        const updatedUser = {
          ...user,
          ...data.user
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              setUser(updatedUser);
              setProfileImage(data.user.profilePicture);
              setNewImageUri(null);
            }
          }
        ]);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Save profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture */}
          <View style={styles.profileImageSection}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={pickImage}
            >
              {newImageUri || profileImage ? (
                <Image
                  source={{ uri: newImageUri || profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImageText}>
                    {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.profileImageHint}>Tap to change picture</Text>
            {newImageUri && (
              <Text style={styles.unsavedChanges}>• Unsaved changes</Text>
            )}
          </View>

          {/* User Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User Type</Text>
              <View style={styles.userTypeBadge}>
                <Text style={styles.userTypeText}>
                  {user?.userType === 'rider' ? '👤 Rider' : '🚗 Driver'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>
                {user?.gender === 'male' ? '👨 Male' : 
                 user?.gender === 'female' ? '👩 Female' : 'Not specified'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {new Date(user?.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {user?.rating && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rating</Text>
                <Text style={styles.infoValue}>⭐ {user.rating.toFixed(1)}</Text>
              </View>
            )}

            {user?.totalRides !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Rides</Text>
                <Text style={styles.infoValue}>{user.totalRides} rides</Text>
              </View>
            )}
          </View>

          {/* Editable Info */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Personal Information</Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {/* Driver Vehicle Info */}
            {user?.userType === 'driver' && (
              <>
                <Text style={[styles.formTitle, { marginTop: 20 }]}>
                  Vehicle Information
                  </Text>

                <Text style={styles.label}>Vehicle Model *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Toyota Camry 2020"
                  placeholderTextColor="#999"
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                />

                <Text style={styles.label}>License Plate *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., ABC-123"
                  placeholderTextColor="#999"
                  value={licensePlate}
                  onChangeText={setLicensePlate}
                  autoCapitalize="characters"
                />

                <Text style={styles.label}>Vehicle Color</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Black"
                  placeholderTextColor="#999"
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.textDark} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteIcon}>ℹ️</Text>
            <Text style={styles.noteText}>
              Gender cannot be changed for security reasons. Contact support if you need assistance.
            </Text>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.text },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  
  profileImageSection: {
    alignItems: 'center',
    marginVertical: 30
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    position: 'relative'
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.accent
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.accent
  },
  profileImageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.textDark
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary
  },
  cameraIconText: { fontSize: 20 },
  profileImageHint: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7
  },
  unsavedChanges: {
    fontSize: 12,
    color: COLORS.light,
    marginTop: 5,
    fontWeight: 'bold'
  },

  infoCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600'
  },
  userTypeBadge: {
    backgroundColor: COLORS.accent + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.accent
  },

  formCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 5
  },
  input: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.accent + '30'
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10
  },
  saveButtonDisabled: {
    opacity: 0.5
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark
  },

  noteCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  noteIcon: {
    fontSize: 20,
    marginRight: 10
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    opacity: 0.8,
    lineHeight: 18
  }
});