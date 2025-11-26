import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

LogBox.ignoreLogs(['props.pointerEvents', 'Blocked aria-hidden']);

// Import all screens
import LoginScreen from './screens/LoginScreen';
import RiderRegistrationScreen from './screens/RiderRegistrationScreen';
import DriverRegistrationScreen from './screens/DriverRegistrationScreen';
import GenderPreferenceScreen from './screens/GenderPreferenceScreen';
import RiderHomeScreen from './screens/RiderHomeScreen';
import BookingScreen from './screens/BookingScreen';
import RiderTrackingScreen from './screens/RiderTrackingScreen';
import DriverTrackingScreen from './screens/DriverTrackingScreen';
import ChatScreen from './screens/ChatScreen';
import ReportIssueScreen from './screens/ReportIssueScreen';
import RatingScreen from './screens/RatingScreen';
import DriverHomeScreen from './screens/DriverHomeScreen';

const Stack = createStackNavigator();

// Keep splash screen visible
SplashScreen.preventAutoHideAsync();

// Custom Splash Screen Component
function CustomSplashScreen({ onFinish }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);

  useEffect(() => {
    // Fade in and scale up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    // Show splash for 3 seconds
    const timer = setTimeout(() => {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Image 
          source={require('./assets/logo.png')} 
          style={styles.splashLogo} 
          resizeMode="contain"
        />
        <Text style={styles.splashTitle}>SAFELY HOME</Text>
        <Text style={styles.splashTagline}>Your Safety, Our Priority</Text>
      </Animated.View>
      
      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
        <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
      </View>
    </Animated.View>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate loading resources
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  if (showSplash) {
    return (
      <View style={styles.container} onLayout={onLayoutRootView}>
        <CustomSplashScreen onFinish={() => setShowSplash(false)} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{ 
            headerShown: false,
            cardStyle: { backgroundColor: '#312C51' }
          }}
        >
          {/* Auth Screens */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RiderRegistration" component={RiderRegistrationScreen} />
          <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
          <Stack.Screen name="GenderPreference" component={GenderPreferenceScreen} />
          
          {/* Rider Screens */}
          <Stack.Screen name="RiderHome" component={RiderHomeScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="RiderTracking" component={RiderTrackingScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
          <Stack.Screen name="Rating" component={RatingScreen} />
          
          {/* Driver Screens */}
          <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
          <Stack.Screen name="DriverTracking" component={DriverTrackingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#48426D', // Lighter shade for better visibility
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  splashLogo: {
    width: 180,
    height: 180,
    marginBottom: 30,
    alignSelf: 'center',
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F0C38E',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  splashTagline: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    marginTop: 50,
    gap: 10,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F0C38E',
    opacity: 0.3,
  },
  loadingDotDelay1: {
    opacity: 0.6,
  },
  loadingDotDelay2: {
    opacity: 1,
  },
});