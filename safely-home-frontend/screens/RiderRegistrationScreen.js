// safely-home-frontend/screens/RiderRegistrationScreen.js
// ✅ ENHANCED: Custom Alerts + Show Password + Real-time Password Strength + Better Error Handling

import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { COLORS } from '../config';
import { register } from '../services/api';
import { showAlert } from '../components/CustomAlert';

export default function RiderRegistrationScreen({ navigation }) {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: '', color: '', text: '' });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time password strength check
    if (field === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({ strength: '', color: '', text: '' });
      return;
    }

    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length;

    if (score === 5) {
      setPasswordStrength({ 
        strength: 'Strong', 
        color: '#4CAF50', 
        text: '✓ Strong password' 
      });
    } else if (score >= 3) {
      setPasswordStrength({ 
        strength: 'Medium', 
        color: '#FF9800', 
        text: '⚠ Medium strength - add more complexity' 
      });
    } else {
      setPasswordStrength({ 
        strength: 'Weak', 
        color: '#F44336', 
        text: '✕ Weak password - needs improvement' 
      });
    }
  };

  const validateForm = () => {
    // Name validation
    if (!formData.name.trim()) {
      showAlert(
        'Missing Information',
        'Please enter your full name',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return false;
    }

    if (formData.name.trim().length < 3) {
      showAlert(
        'Invalid Name',
        'Name must be at least 3 characters long',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return false;
    }

    // Email validation
    if (!formData.email.trim()) {
      showAlert(
        'Missing Information',
        'Please enter your email address',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      showAlert(
        'Invalid Email',
        'Please enter a valid email address (e.g., user@example.com)',
        [{ text: 'OK' }],
        { type: 'error' }
      );
      return false;
    }

    // Phone validation
    if (!formData.phone.trim()) {
      showAlert(
        'Missing Information',
        'Please enter your phone number',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return false;
    }

    if (formData.phone.trim().length < 10) {
      showAlert(
        'Invalid Phone',
        'Please enter a valid phone number (at least 10 digits)',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return false;
    }

    // Gender validation
    if (!formData.gender) {
      showAlert(
        'Missing Information',
        'Please select your gender',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return false;
    }

    // Password validation
    if (!formData.password) {
      showAlert(
        'Missing Information',
        'Please enter a password',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return false;
    }

    // Check password strength requirements
    const minLength = formData.password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumbers = /\d/.test(formData.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

    const errors = [];
    if (!minLength) errors.push('• At least 8 characters');
    if (!hasUpperCase) errors.push('• One uppercase letter (A-Z)');
    if (!hasLowerCase) errors.push('• One lowercase letter (a-z)');
    if (!hasNumbers) errors.push('• One number (0-9)');
    if (!hasSpecialChar) errors.push('• One special character (!@#$%...)');

    if (errors.length > 0) {
      showAlert(
        'Weak Password',
        `Your password must contain:\n\n${errors.join('\n')}`,
        [{ text: 'OK' }],
        { type: 'error' }
      );
      return false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      showAlert(
        'Missing Information',
        'Please confirm your password',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlert(
        'Passwords Don\'t Match',
        'The passwords you entered do not match. Please try again.',
        [{ text: 'OK' }],
        { type: 'error' }
      );
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = { 
        name: formData.name.trim(), 
        email: formData.email.trim().toLowerCase(), 
        phone: formData.phone.trim(), 
        password: formData.password,
        gender: formData.gender
      };
      
      const response = await register(userData, 'rider');
      
      if (response.success) {
        // Male riders auto-select male drivers and skip preference screen
        if (userData.gender === 'male') {
          showAlert(
            'Registration Successful! 🎉',
            `Welcome to Safely Home, ${userData.name}! For safety reasons, male riders will be matched with male drivers.`,
            [
              { 
                text: 'Continue', 
                onPress: () => navigation.replace('GenderPreference') 
              }
            ],
            { type: 'success', cancelable: false }
          );
        } else {
          // Female riders can choose preference
          showAlert(
            'Registration Successful! 🎉',
            `Welcome to Safely Home, ${userData.name}! You can now set your driver preference.`,
            [
              { 
                text: 'Continue', 
                onPress: () => navigation.replace('GenderPreference') 
              }
            ],
            { type: 'success', cancelable: false }
          );
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific errors
      if (error.response?.data?.error?.includes('email already exists')) {
        showAlert(
          'Email Already Registered',
          'An account with this email already exists. Would you like to login instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Login', 
              onPress: () => navigation.navigate('Login') 
            }
          ],
          { type: 'warning' }
        );
      } else if (error.response?.data?.details) {
        // Show password validation errors from backend
        const details = error.response.data.details;
        showAlert(
          'Registration Failed',
          `Please fix the following:\n\n${details.join('\n')}`,
          [{ text: 'OK' }],
          { type: 'error' }
        );
      } else if (error.customError === "Backend Inactive") {
        showAlert(
          'Server Unavailable',
          'The server is currently not responding. Please try again in a few moments.',
          [{ text: 'OK' }],
          { type: 'error' }
        );
      } else {
        showAlert(
          'Registration Failed',
          error.response?.data?.error || error.message || 'Unable to create account. Please try again.',
          [{ text: 'OK' }],
          { type: 'error' }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create Rider Account</Text>
        <Text style={styles.subtitle}>Join Safely Home today</Text>

        <View style={styles.card}>
          {/* Full Name */}
          <Text style={styles.label}>Full Name *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter your full name" 
            placeholderTextColor="#999" 
            value={formData.name} 
            onChangeText={(v) => updateField('name', v)}
            editable={!loading}
          />

          {/* Email */}
          <Text style={styles.label}>Email Address *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter your email" 
            placeholderTextColor="#999" 
            value={formData.email} 
            onChangeText={(v) => updateField('email', v)} 
            keyboardType="email-address" 
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter your phone number" 
            placeholderTextColor="#999" 
            value={formData.phone} 
            onChangeText={(v) => updateField('phone', v)} 
            keyboardType="phone-pad"
            editable={!loading}
          />

          {/* Gender */}
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[styles.genderButton, formData.gender === 'male' && styles.genderButtonActive]}
              onPress={() => updateField('gender', 'male')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[styles.genderText, formData.gender === 'male' && styles.genderTextActive]}>
                👨 Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, formData.gender === 'female' && styles.genderButtonActive]}
              onPress={() => updateField('gender', 'female')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[styles.genderText, formData.gender === 'female' && styles.genderTextActive]}>
                👩 Female
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password with Show/Hide */}
          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="Create a strong password" 
              placeholderTextColor="#999" 
              value={formData.password} 
              onChangeText={(v) => updateField('password', v)} 
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Password Strength Indicator */}
          {formData.password && passwordStrength.strength && (
            <View style={[styles.strengthIndicator, { backgroundColor: passwordStrength.color + '20' }]}>
              <View style={styles.strengthBar}>
                <View 
                  style={[
                    styles.strengthFill, 
                    { 
                      width: passwordStrength.strength === 'Weak' ? '33%' : 
                            passwordStrength.strength === 'Medium' ? '66%' : '100%',
                      backgroundColor: passwordStrength.color
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                {passwordStrength.text}
              </Text>
            </View>
          )}

          {/* Password Requirements */}
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>Password must contain:</Text>
            <Text style={styles.requirementText}>• At least 8 characters</Text>
            <Text style={styles.requirementText}>• One uppercase letter (A-Z)</Text>
            <Text style={styles.requirementText}>• One lowercase letter (a-z)</Text>
            <Text style={styles.requirementText}>• One number (0-9)</Text>
            <Text style={styles.requirementText}>• One special character (!@#$%...)</Text>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="Re-enter your password" 
              placeholderTextColor="#999" 
              value={formData.confirmPassword} 
              onChangeText={(v) => updateField('confirmPassword', v)} 
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
            onPress={handleRegister} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textDark} />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 20 },
  backButtonText: { color: COLORS.accent, fontSize: 16, fontWeight: '600' },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 30
  },
  card: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 25 },
  label: { 
    fontSize: 14, 
    color: COLORS.text, 
    marginBottom: 8, 
    marginLeft: 5,
    fontWeight: '600'
  },
  input: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    paddingVertical: 14, 
    color: COLORS.text, 
    fontSize: 16, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: COLORS.accent + '30' 
  },
  genderContainer: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  genderButton: { 
    flex: 1, 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: 'transparent' 
  },
  genderButtonActive: { 
    borderColor: COLORS.accent, 
    backgroundColor: COLORS.accent + '20' 
  },
  genderText: { fontSize: 16, color: COLORS.text },
  genderTextActive: { color: COLORS.accent, fontWeight: 'bold' },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.accent + '30'
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16
  },
  eyeButton: {
    padding: 10,
    paddingRight: 15
  },
  eyeIcon: {
    fontSize: 24
  },
  strengthIndicator: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 15
  },
  strengthBar: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden'
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3
  },
  strengthText: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  requirementsBox: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15
  },
  requirementsTitle: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 6
  },
  requirementText: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.8,
    lineHeight: 18
  },
  registerButton: { 
    backgroundColor: COLORS.accent, 
    borderRadius: 12, 
    paddingVertical: 16, 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  registerButtonDisabled: {
    opacity: 0.6
  },
  registerButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: COLORS.textDark 
  },
  loginContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 25 
  },
  loginText: { color: COLORS.text, fontSize: 14 },
  loginLink: { color: COLORS.accent, fontSize: 14, fontWeight: 'bold' }
});