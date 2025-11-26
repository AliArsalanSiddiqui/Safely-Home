import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from '../config';
import { register } from '../services/api';

export default function RiderRegistrationScreen({ navigation }) {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '',
    gender: '' // NEW
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.gender) {
      Alert.alert('Error', 'Please fill in all fields including gender');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const userData = { 
        name: formData.name, 
        email: formData.email, 
        phone: formData.phone, 
        password: formData.password,
        gender: formData.gender
      };
      const response = await register(userData, 'rider');
      
      if (response.success) {
        Alert.alert('Success', 'Registration successful!', [
          { text: 'OK', onPress: () => navigation.replace('GenderPreference') }
        ]);
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.error || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Rider Registration</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} placeholder="Enter your full name" placeholderTextColor="#999" value={formData.name} onChangeText={(v) => updateField('name', v)} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="Enter your email" placeholderTextColor="#999" value={formData.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} placeholder="Enter your phone number" placeholderTextColor="#999" value={formData.phone} onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad" />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[styles.genderButton, formData.gender === 'male' && styles.genderButtonActive]}
              onPress={() => updateField('gender', 'male')}
            >
              <Text style={[styles.genderText, formData.gender === 'male' && styles.genderTextActive]}>👨 Male </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, formData.gender === 'female' && styles.genderButtonActive]}
              onPress={() => updateField('gender', 'female')}
            >
              <Text style={[styles.genderText, formData.gender === 'female' && styles.genderTextActive]}>👩 Female </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Enter password (min 6 characters)" placeholderTextColor="#999" value={formData.password} onChangeText={(v) => updateField('password', v)} secureTextEntry />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput style={styles.input} placeholder="Confirm your password" placeholderTextColor="#999" value={formData.confirmPassword} onChangeText={(v) => updateField('confirmPassword', v)} secureTextEntry />

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.textDark} /> : <Text style={styles.registerButtonText}>Register</Text>}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 20 },
  backButtonText: { color: COLORS.accent, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 30, textAlign: 'center' },
  card: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 25 },
  label: { fontSize: 14, color: COLORS.text, marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, color: COLORS.text, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: COLORS.accent + '30' },
  genderContainer: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  genderButton: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  genderButtonActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '20' },
  genderText: { fontSize: 16, color: COLORS.text },
  genderTextActive: { color: COLORS.accent, fontWeight: 'bold' },
  registerButton: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  registerButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: COLORS.text, fontSize: 14 },
  loginLink: { color: COLORS.accent, fontSize: 14, fontWeight: 'bold' },
});