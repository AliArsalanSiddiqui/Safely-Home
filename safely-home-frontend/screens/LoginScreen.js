import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../config';
import { login } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [userType, setUserType] = useState('rider');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);
      
      if (response.success) {
        if (response.user.userType === 'rider') {
          navigation.replace(response.user.genderPreference ? 'RiderHome' : 'GenderPreference');
        } else {
          navigation.replace('DriverHome');
        }
      }
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.error || 'Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>SAFELY HOME</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.welcomeText}>Welcome Back</Text>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, userType === 'rider' && styles.typeButtonActive]}
            onPress={() => setUserType('rider')}
          >
            <Text style={[styles.typeButtonText, userType === 'rider' && styles.typeButtonTextActive]}>
              Rider
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, userType === 'driver' && styles.typeButtonActive]}
            onPress={() => setUserType('driver')}
          >
            <Text style={[styles.typeButtonText, userType === 'driver' && styles.typeButtonTextActive]}>
              Driver
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.textDark} />
          ) : (
            <Text style={styles.loginButtonText}>Login as {userType === 'rider' ? 'Rider' : 'Driver'}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate(userType === 'rider' ? 'RiderRegistration' : 'DriverRegistration')}>
            <Text style={styles.registerLink}>Register as {userType === 'rider' ? 'Rider' : 'Driver'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 80, height: 80, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.accent, letterSpacing: 2 },
  card: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 25 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 20 },
  typeSelector: { flexDirection: 'row', marginBottom: 25, backgroundColor: COLORS.primary, borderRadius: 10, padding: 4 },
  typeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  typeButtonActive: { backgroundColor: COLORS.accent },
  typeButtonText: { fontSize: 16, color: COLORS.text, fontWeight: '500' },
  typeButtonTextActive: { color: COLORS.textDark, fontWeight: 'bold' },
  label: { fontSize: 14, color: COLORS.text, marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, color: COLORS.text, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: COLORS.accent + '30' },
  loginButton: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  loginButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerText: { color: COLORS.text, fontSize: 14 },
  registerLink: { color: COLORS.accent, fontSize: 14, fontWeight: 'bold' },
});