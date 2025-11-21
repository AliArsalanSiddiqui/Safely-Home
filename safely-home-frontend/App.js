import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';

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
import ChatScreen from './screens/ChatScreen'; // NEW
import ReportIssueScreen from './screens/ReportIssueScreen';
import RatingScreen from './screens/RatingScreen';
import DriverHomeScreen from './screens/DriverHomeScreen';

const Stack = createStackNavigator();

export default function App() {
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