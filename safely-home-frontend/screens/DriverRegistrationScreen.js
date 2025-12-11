// safely-home-frontend/screens/DriverRegistrationScreen.js
// ✅ COMPLETE VALIDATION: Inline errors + Real-time validation + Custom Alerts

import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../config';
import { register } from '../services/api';
import { showAlert } from '../components/CustomAlert';

const ERROR_COLOR = '#F44336';

export default function DriverRegistrationScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    licensePlate: '', vehicleModel: '', faceImage: null,
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Inline error states
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: '',
    licensePlate: '',
    vehicleModel: '',
    faceImage: ''
  });
  
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    gender: false,
    licensePlate: false,
    vehicleModel: false,
    faceImage: false
  });

  const [passwordStrength, setPasswordStrength] = useState({ strength: '', color: '', text: '' });

  // Validation functions
  const validateName = (value) => {
    if (!value.trim()) return 'Name is required';
    if (value.trim().length < 3) return 'Name must be at least 3 characters';
    return '';
  };

  const validateEmail = (value) => {
    if (!value.trim()) return 'Email is required';
    if (!value.includes('@')) return 'Email must contain @';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return 'Please enter a valid email (e.g., user@example.com)';
    return '';
  };

  const validatePhone = (value) => {
    if (!value.trim()) return 'Phone number is required';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10) return 'Phone number must be at least 10 digits';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumbers) return 'Password must contain at least one number';
    if (!hasSpecialChar) return 'Password must contain at least one special character';
    
    return '';
  };

  const validateConfirmPassword = (value) => {
    if (!value) return 'Please confirm your password';
    if (value !== formData.password) return 'Passwords do not match';
    return '';
  };

  const validateGender = (value) => {
    if (!value) return 'Please select your gender';
    return '';
  };

  const validateLicensePlate = (value) => {
    if (!value.trim()) return 'License plate number is required';
    if (value.trim().length < 3) return 'License plate must be at least 3 characters';
    return '';
  };

  const validateVehicleModel = (value) => {
    if (!value.trim()) return 'Vehicle model is required';
    if (value.trim().length < 3) return 'Vehicle model must be at least 3 characters';
    return '';
  };

  const validateFaceImage = (value) => {
    if (!value) return 'Face photo is required for driver verification';
    return '';
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

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'password') {
      checkPasswordStrength(value);
    }
    
    // Validate on change if field was already touched
    if (touched[field]) {
      let error = '';
      switch(field) {
        case 'name': error = validateName(value); break;
        case 'email': error = validateEmail(value); break;
        case 'phone': error = validatePhone(value); break;
        case 'password': error = validatePassword(value); break;
        case 'confirmPassword': error = validateConfirmPassword(value); break;
        case 'gender': error = validateGender(value); break;
        case 'licensePlate': error = validateLicensePlate(value); break;
        case 'vehicleModel': error = validateVehicleModel(value); break;
        case 'faceImage': error = validateFaceImage(value); break;
      }
      setErrors(prev => ({ ...prev, [field]: error }));
    }
    
    // Also revalidate confirm password if password changes
    if (field === 'password' && touched.confirmPassword) {
      setErrors(prev => ({ 
        ...prev, 
        confirmPassword: validateConfirmPassword(formData.confirmPassword) 
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    let error = '';
    switch(field) {
      case 'name': error = validateName(formData.name); break;
      case 'email': error = validateEmail(formData.email); break;
      case 'phone': error = validatePhone(formData.phone); break;
      case 'password': error = validatePassword(formData.password); break;
      case 'confirmPassword': error = validateConfirmPassword(formData.confirmPassword); break;
      case 'gender': error = validateGender(formData.gender); break;
      case 'licensePlate': error = validateLicensePlate(formData.licensePlate); break;
      case 'vehicleModel': error = validateVehicleModel(formData.vehicleModel); break;
      case 'faceImage': error = validateFaceImage(formData.faceImage); break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const pickImage = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    showAlert(
      'Permission Required',
      'Camera permission is required for face verification',
      [{ text: 'OK' }],
      { type: 'warning' }
    );
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled) {
    handleFieldChange('faceImage', result.assets[0].uri);
    // ✅ FIX: Immediately mark as touched and clear error
    setTouched(prev => ({ ...prev, faceImage: true }));
    setErrors(prev => ({ ...prev, faceImage: '' }));
  }
};

  const validateAllFields = () => {
    const allErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      gender: validateGender(formData.gender),
      licensePlate: validateLicensePlate(formData.licensePlate),
      vehicleModel: validateVehicleModel(formData.vehicleModel),
      faceImage: validateFaceImage(formData.faceImage),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword)
    };
    
    setErrors(allErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      gender: true,
      licensePlate: true,
      vehicleModel: true,
      faceImage: true,
      password: true,
      confirmPassword: true
    });
    
    return allErrors;
  };

  const handleRegister = async () => {
    const allErrors = validateAllFields();
    
    // Check if all fields are empty
    const allFieldsEmpty = !formData.name.trim() && !formData.email.trim() && 
                          !formData.phone.trim() && !formData.password && 
                          !formData.confirmPassword && !formData.gender &&
                          !formData.licensePlate.trim() && !formData.vehicleModel.trim() &&
                          !formData.faceImage;
    
    if (allFieldsEmpty) {
      showAlert(
        'Missing Information',
        'Please fill in all fields to continue',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return;
    }
    
    // Check for specific errors
    const errorFields = Object.entries(allErrors)
      .filter(([_, error]) => error !== '')
      .map(([field]) => {
        switch(field) {
          case 'name': return 'Full Name';
          case 'email': return 'Email';
          case 'phone': return 'Phone Number';
          case 'gender': return 'Gender';
          case 'licensePlate': return 'License Plate';
          case 'vehicleModel': return 'Vehicle Model';
          case 'faceImage': return 'Face Photo';
          case 'password': return 'Password';
          case 'confirmPassword': return 'Confirm Password';
          default: return field;
        }
      });
    
    if (errorFields.length > 0) {
      showAlert(
        'Incomplete Form',
        `Please check the following ${errorFields.length === 1 ? 'field' : 'fields'}:\n\n• ${errorFields.join('\n• ')}`,
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return;
    }

    // All validations passed
    setLoading(true);
    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        gender: formData.gender,
        vehicleInfo: {
          licensePlate: formData.licensePlate.trim(),
          model: formData.vehicleModel.trim(),
          color: 'Black'
        },
        faceImage: formData.faceImage
      };

      const response = await register(userData, 'driver');
      
      if (response.success) {
        showAlert(
          'Registration Successful! 🎉',
          `Welcome to Safely Home, ${userData.name}! Your driver account has been created successfully.`,
          [
            { 
              text: 'Start Driving', 
              onPress: () => navigation.replace('Login') 
            }
          ],
          { type: 'success', cancelable: false }
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      
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

        <Text style={styles.title}>Become a Driver</Text>
        <Text style={styles.subtitle}>Start earning with Safely Home</Text>

        <View style={styles.card}>
          {/* Full Name */}
          <Text style={styles.label}>Full Name *</Text>
          <TextInput 
            style={[styles.input, errors.name && touched.name && styles.inputError]} 
            placeholder="Enter your full name" 
            placeholderTextColor="#999" 
            value={formData.name} 
            onChangeText={(v) => handleFieldChange('name', v)}
            onBlur={() => handleBlur('name')}
            editable={!loading}
          />
          {errors.name && touched.name && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}

          {/* Email */}
          <Text style={styles.label}>Email Address *</Text>
          <TextInput 
            style={[styles.input, errors.email && touched.email && styles.inputError]} 
            placeholder="Enter your email" 
            placeholderTextColor="#999" 
            value={formData.email} 
            onChangeText={(v) => handleFieldChange('email', v)}
            onBlur={() => handleBlur('email')}
            keyboardType="email-address" 
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          {errors.email && touched.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}

          {/* Phone */}
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput 
            style={[styles.input, errors.phone && touched.phone && styles.inputError]} 
            placeholder="Enter your phone number" 
            placeholderTextColor="#999" 
            value={formData.phone} 
            onChangeText={(v) => handleFieldChange('phone', v)}
            onBlur={() => handleBlur('phone')}
            keyboardType="phone-pad"
            editable={!loading}
          />
          {errors.phone && touched.phone && (
            <Text style={styles.errorText}>{errors.phone}</Text>
          )}

          {/* Gender */}
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton, 
                formData.gender === 'male' && styles.genderButtonActive,
                errors.gender && touched.gender && !formData.gender && styles.genderButtonError
              ]}
              onPress={() => {
                handleFieldChange('gender', 'male');
                // ✅ FIX: Immediately mark as touched and clear error
                setTouched(prev => ({ ...prev, gender: true }));
                setErrors(prev => ({ ...prev, gender: '' }));
              }}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[styles.genderText, formData.gender === 'male' && styles.genderTextActive]}>
                👨 Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton, 
                formData.gender === 'female' && styles.genderButtonActive,
                errors.gender && touched.gender && !formData.gender && styles.genderButtonError
              ]}
              onPress={() => {
                handleFieldChange('gender', 'female');
                // ✅ FIX: Immediately mark as touched and clear error
                setTouched(prev => ({ ...prev, gender: true }));
                setErrors(prev => ({ ...prev, gender: '' }));
              }}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[styles.genderText, formData.gender === 'female' && styles.genderTextActive]}>
                👩 Female
              </Text>
            </TouchableOpacity>
          </View>
          {errors.gender && touched.gender && (
            <Text style={styles.errorText}>{errors.gender}</Text>
          )}

          {/* License */}
          <Text style={styles.label}>Driver License Number *</Text>
          <TextInput 
            style={[styles.input, errors.licensePlate && touched.licensePlate && styles.inputError]} 
            placeholder="Enter your license number" 
            placeholderTextColor="#999" 
            value={formData.licensePlate} 
            onChangeText={(v) => handleFieldChange('licensePlate', v)}
            onBlur={() => handleBlur('licensePlate')}
            editable={!loading}
          />
          {errors.licensePlate && touched.licensePlate && (
            <Text style={styles.errorText}>{errors.licensePlate}</Text>
          )}

          {/* Vehicle */}
          <Text style={styles.label}>Vehicle Model *</Text>
          <TextInput 
            style={[styles.input, errors.vehicleModel && touched.vehicleModel && styles.inputError]} 
            placeholder="e.g. Toyota Camry 2020" 
            placeholderTextColor="#999" 
            value={formData.vehicleModel} 
            onChangeText={(v) => handleFieldChange('vehicleModel', v)}
            onBlur={() => handleBlur('vehicleModel')}
            editable={!loading}
          />
          {errors.vehicleModel && touched.vehicleModel && (
            <Text style={styles.errorText}>{errors.vehicleModel}</Text>
          )}

          {/* Password */}
          <Text style={styles.label}>Password *</Text>
          <View style={[styles.passwordContainer, errors.password && touched.password && styles.inputError]}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="Create a strong password" 
              placeholderTextColor="#999" 
              value={formData.password} 
              onChangeText={(v) => handleFieldChange('password', v)}
              onBlur={() => handleBlur('password')}
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
          {errors.password && touched.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Password Strength */}
          {formData.password && passwordStrength.strength && !errors.password && (
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

          {/* Requirements */}
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
          <View style={[styles.passwordContainer, errors.confirmPassword && touched.confirmPassword && styles.inputError]}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="Re-enter your password" 
              placeholderTextColor="#999" 
              value={formData.confirmPassword} 
              onChangeText={(v) => handleFieldChange('confirmPassword', v)}
              onBlur={() => handleBlur('confirmPassword')}
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
          {errors.confirmPassword && touched.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          {/* Face Verification */}
          <View style={styles.faceVerification}>
            <Text style={styles.label}>Face Verification *</Text>
            <TouchableOpacity 
              style={[
                styles.cameraButton,
                errors.faceImage && touched.faceImage && !formData.faceImage && styles.cameraButtonError
              ]} 
              onPress={pickImage}
              disabled={loading}
              activeOpacity={0.8}
            >
              {formData.faceImage ? (
                <Image source={{ uri: formData.faceImage }} style={styles.faceImage} />
              ) : (
                <>
                  <Text style={styles.cameraIcon}>📷</Text>
                  <Text style={styles.cameraText}>Take Face Photo</Text>
                  <Text style={styles.cameraSubtext}>Required for driver verification</Text>
                </>
              )}
            </TouchableOpacity>
            {errors.faceImage && touched.faceImage && (
              <Text style={styles.errorText}>{errors.faceImage}</Text>
            )}
            {formData.faceImage && (
              <TouchableOpacity 
                style={styles.retakeButton}
                onPress={pickImage}
                disabled={loading}
              >
                <Text style={styles.retakeText}>📷 Retake Photo</Text>
              </TouchableOpacity>
            )}
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
              <Text style={styles.registerButtonText}>Create Driver Account</Text>
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
  genderContainer: { flexDirection: 'row', marginBottom: 6, gap: 10 },
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
  genderButtonError: {
    borderColor: ERROR_COLOR
  },
  genderText: { fontSize: 16, color: COLORS.text },
  genderTextActive: { color: COLORS.accent, fontWeight: 'bold' },
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
  faceVerification: { marginBottom: 15 },
  cameraButton: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    padding: 30, 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: COLORS.accent, 
    borderStyle: 'dashed',
    marginBottom: 6
  },
  cameraButtonError: {
    borderColor: ERROR_COLOR,
    borderStyle: 'solid'
  },
  cameraIcon: { fontSize: 50, marginBottom: 10 },
  cameraText: { color: COLORS.text, fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
  cameraSubtext: { color: COLORS.accent, fontSize: 13 },
  faceImage: { width: 150, height: 150, borderRadius: 75 },
  retakeButton: {
    backgroundColor: COLORS.accent + '20',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.accent
  },
  retakeText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: 'bold'
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