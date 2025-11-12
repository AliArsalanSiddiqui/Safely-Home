import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

import LoginScreen from "../screens/LoginScreen"
import RegisterScreen from "../screens/RegisterScreen"
import DriverRegistrationScreen from "../screens/DriverRegistrationScreen"
import RidePreferenceScreen from "../screens/RidePreferenceScreen"
import BookRideScreen from "../screens/BookRideScreen"
import TrackingDriverScreen from "../screens/TrackingDriverScreen"
import RatingScreen from "../screens/RatingScreen"
import ReportIssueScreen from "../screens/ReportIssueScreen"
import TripDetailsScreen from "../screens/TripDetailsScreen"

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#3d2f5f" },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
    </Stack.Navigator>
  )
}

function RiderStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#3d2f5f" },
      }}
    >
      <Stack.Screen name="RiderDashboard" component={RiderDashboard} />
      <Stack.Screen name="RidePreference" component={RidePreferenceScreen} />
      <Stack.Screen name="BookRide" component={BookRideScreen} />
      <Stack.Screen name="TrackingDriver" component={TrackingDriverScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
    </Stack.Navigator>
  )
}

function DriverStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#3d2f5f" },
      }}
    >
      <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
    </Stack.Navigator>
  )
}

// Placeholder components
function RiderDashboard() {
  return <Text>Rider Dashboard</Text>
}

function DriverDashboard() {
  return <Text>Driver Dashboard</Text>
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <AuthStack />
    </NavigationContainer>
  )
}
