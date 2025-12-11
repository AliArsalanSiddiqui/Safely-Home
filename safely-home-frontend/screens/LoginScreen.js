// safely-home-frontend/screens/LoginScreen.js
// ✅ ENHANCED: Real-time validation with inline error messages + Custom Alerts

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView
} from 'react-native';
import { COLORS } from '../config';
import { login } from '../services/api';
import { showAlert } from '../components/CustomAlert';

// Add error color if not in COLORS
const ERROR_COLOR = COLORS.error || '#F44336';

export default function LoginScreen({ navigation }) {
  const [userType, setUserType] = useState('rider');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Inline error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  // Real-time email validation
  const validateEmail = (value) => {
    if (!value.trim()) {
      return 'Email is required';
    }
    
    if (!value.includes('@')) {
      return 'Email must contain @';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return 'Please enter a valid email (e.g., user@example.com)';
    }
    
    return '';
  };

  // Real-time password validation
  const validatePassword = (value) => {
    if (!value) {
      return 'Password is required';
    }
    
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    
    return '';
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (touched.email) {
      setEmailError(validateEmail(value));
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (touched.password) {
      setPasswordError(validatePassword(value));
    }
  };

  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setTouched({ ...touched, password: true });
    setPasswordError(validatePassword(password));
  };

  const handleLogin = async () => {
    // Mark all fields as touched
    setTouched({ email: true, password: true });
    
    // Validate all fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    // Check if all fields are empty
    if (!email.trim() && !password) {
      showAlert(
        'Missing Information',
        'Please fill in all fields to continue',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return;
    }

    // Check for specific field errors
    const missingFields = [];
    if (emailErr) missingFields.push('Email');
    if (passwordErr) missingFields.push('Password');

    if (missingFields.length > 0) {
      showAlert(
        'Incomplete Form',
        `Please check the following ${missingFields.length === 1 ? 'field' : 'fields'}:\n\n• ${missingFields.join('\n• ')}`,
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return;
    }

    // All validations passed
    setLoading(true);
    try {
      const response = await login(email.trim(), password);
      
      if (response.success) {
        // Success - navigate based on user type
        if (response.user.userType === 'rider') {
          navigation.replace(response.user.genderPreference ? 'RiderHome' : 'GenderPreference');
        } else {
          navigation.replace('DriverHome');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error types
      if (error.customError === "Backend Inactive") {
        showAlert(
          'Server Unavailable',
          'The server is currently not responding. Please try again in a few moments.',
          [{ text: 'OK' }],
          { type: 'error' }
        );
      } else if (error.message?.includes('Invalid email or password')) {
        showAlert(
          'Login Failed',
          'The email or password you entered is incorrect. Please try again.',
          [{ text: 'OK' }],
          { type: 'error' }
        );
      } else if (error.message?.includes('User not found')) {
        showAlert(
          'Account Not Found',
          'No account found with this email. Would you like to register?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Register', 
              onPress: () => navigation.navigate(
                userType === 'rider' ? 'RiderRegistration' : 'DriverRegistration'
              )
            }
          ],
          { type: 'info' }
        );
      } else {
        showAlert(
          'Login Failed',
          error.message || 'Unable to login. Please check your credentials and try again.',
          [{ text: 'OK' }],
          { type: 'error' }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.primary }}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.logoContainer}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>SAFELY HOME</Text>
          <Text style={styles.tagline}>Your Safety, Our Priority</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.welcomeText}>Welcome Back</Text>

          {/* User Type Selector */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, userType === 'rider' && styles.typeButtonActive]}
              onPress={() => setUserType('rider')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeButtonText, userType === 'rider' && styles.typeButtonTextActive]}>
                👤 Rider
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, userType === 'driver' && styles.typeButtonActive]}
              onPress={() => setUserType('driver')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeButtonText, userType === 'driver' && styles.typeButtonTextActive]}>
                🚗 Driver
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email Input */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, emailError && touched.email && styles.inputError]}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={handleEmailChange}
            onBlur={handleEmailBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          {emailError && touched.email && (
            <Text style={styles.errorText}>{emailError}</Text>
          )}

          {/* Password Input with Show/Hide */}
          <Text style={styles.label}>Password</Text>
          <View style={[styles.passwordContainer, passwordError && touched.password && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={handlePasswordBlur}
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
          {passwordError && touched.password && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}

          {/* Forgot Password */}
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => {
              showAlert(
                'Reset Password',
                'Password reset feature coming soon. Please contact support if you need help.',
                [{ text: 'OK' }],
                { type: 'info' }
              );
            }}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
            onPress={handleLogin} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textDark} />
            ) : (
              <Text style={styles.loginButtonText}>
                Login as {userType === 'rider' ? 'Rider' : 'Driver'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate(
                userType === 'rider' ? 'RiderRegistration' : 'DriverRegistration'
              )}
              disabled={loading}
            >
              <Text style={styles.registerLink}>
                Register as {userType === 'rider' ? 'Rider' : 'Driver'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    padding: 20 
  },
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 40,
    marginTop: 60
  },
  logo: { 
    width: 100, 
    height: 100, 
    marginBottom: 15 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: COLORS.accent, 
    letterSpacing: 2 
  },
  tagline: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    marginTop: 5
  },
  card: { 
    backgroundColor: COLORS.secondary, 
    borderRadius: 20, 
    padding: 25 
  },
  welcomeText: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    textAlign: 'center', 
    marginBottom: 25 
  },
  typeSelector: { 
    flexDirection: 'row', 
    marginBottom: 25, 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    padding: 4 
  },
  typeButton: { 
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center', 
    borderRadius: 10 
  },
  typeButtonActive: { 
    backgroundColor: COLORS.accent 
  },
  typeButtonText: { 
    fontSize: 16, 
    color: COLORS.text, 
    fontWeight: '500' 
  },
  typeButtonTextActive: { 
    color: COLORS.textDark, 
    fontWeight: 'bold' 
  },
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
    marginBottom: 6, 
    borderWidth: 1, 
    borderColor: COLORS.accent + '30' 
  },
  inputError: {
    borderColor: ERROR_COLOR,
    borderWidth: 2
  },
  errorText: {
    color: ERROR_COLOR,
    fontSize: 12,
    marginLeft: 5,
    marginBottom: 15,
    marginTop: -3
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginBottom: 6,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 10
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600'
  },
  loginButton: { 
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
  loginButtonDisabled: {
    opacity: 0.6
  },
  loginButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: COLORS.textDark 
  },
  registerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 25 
  },
  registerText: { 
    color: COLORS.text, 
    fontSize: 14 
  },
  registerLink: { 
    color: COLORS.accent, 
    fontSize: 14, 
    fontWeight: 'bold' 
  }
});