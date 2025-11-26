# 🚗 SAFELY HOME - Ride Sharing Application - A Software Engineering Project - BS CS 4-A

A comprehensive, gender-safe ride-sharing application built with React Native (frontend) and Node.js (backend), featuring real-time GPS tracking, in-app chat, and safety features.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Socket.IO Events](#socketio-events)
- [Key Features Guide](#key-features-guide)
- [Troubleshooting](#troubleshooting)
- [Security & Safety](#security--safety)
- [Future Enhancements](#future-enhancements)

## 🎯 Project Overview

**Safely Home** is a women-centric ride-sharing platform that prioritizes safety and comfort. It allows users to book rides with gender preferences, communicate with drivers/riders in real-time, and report safety concerns immediately.

**Target Users:**
- Female riders seeking safe rides
- Gender-specific driver matching
- Emergency reporting system
- Real-time tracking and communication

## ✨ Features

### User Features

#### For Riders:
- ✅ User registration and authentication (email/password)
- ✅ Gender preference selection (Female, Male, or Any driver)
- ✅ Real-time ride booking with live driver search
- ✅ Automatic fare calculation based on distance
- ✅ Google Maps integration for pickup/destination selection
- ✅ Two ways to select locations:
  - **Map Tapping**: Click directly on map to set location
  - **Address Typing + Autocomplete**: Type address and select from Google Places suggestions
- ✅ Live driver tracking with GPS
- ✅ In-app messaging with driver
- ✅ Driver rating system (1-5 stars + tags)
- ✅ Safety reporting system
- ✅ Emergency contact button
- ✅ Ride history and analytics

#### For Drivers:
- ✅ Driver registration with license verification
- ✅ Face recognition-based identity verification
- ✅ Online/Offline status toggle
- ✅ Real-time ride requests and notifications
- ✅ Earnings dashboard (daily & total)
- ✅ Driver performance ratings
- ✅ Recent reviews from riders
- ✅ In-app messaging with riders
- ✅ Navigation integration (Google Maps)
- ✅ Emergency call feature

### Safety Features:
- 🚨 Emergency 911 calling (driver & rider)
- 📞 Direct calling between riders and drivers
- 📝 Safety incident reporting system with location tracking
- ⭐ Transparent rating system
- 🔒 Face recognition for drivers
- 🔐 Secure JWT-based authentication

## 🛠️ Tech Stack

### Frontend (React Native - Expo)
React Native 0.81.5
Expo 54.0.23
React Navigation 7.1.20
Socket.IO Client 4.8.1
Axios 1.13.2
Google Maps (react-native-maps 1.20.1)
Expo Location 19.0.7
AsyncStorage (offline storage)

### Backend (Node.js)
Node.js (Latest LTS)
Express.js 5.1.0
Socket.IO 4.8.1
MongoDB (Atlas) 6.20.0
Mongoose 8.19.4
JWT (jsonwebtoken 9.0.2)
Bcryptjs 3.0.3
Multer 2.0.2 (file uploads)
CORS 2.8.5
Dotenv 17.2.3

### Database:
- **MongoDB Atlas** (Cloud MongoDB)
- Real-time data syncing via Socket.IO

### External APIs:
- **Google Maps API** (Places, Geocoding, Navigation)
- **Google Maps Platform** for directions

## 📁 Project Structure

safely-home/
├── safely-home-backend/
│   ├── server.js                    # Main Express server + Socket.IO
│   ├── package.json                 # Backend dependencies
│   ├── package-lock.json
│   └── .env                         # Environment variables (DO NOT COMMIT)
│
└── safely-home-frontend/
    ├── App.js                       # Navigation setup
    ├── config.js                    # API & Socket URLs
    ├── app.json                     # Expo configuration
    ├── package.json                 # Frontend dependencies
    ├── index.js                     # Entry point
    │
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── RiderRegistrationScreen.js
    │   ├── DriverRegistrationScreen.js
    │   ├── GenderPreferenceScreen.js
    │   ├── RiderHomeScreen.js
    │   ├── DriverHomeScreen.js
    │   ├── BookingScreen.js         # ⭐ Main booking with map + autocomplete
    │   ├── RiderTrackingScreen.js
    │   ├── DriverTrackingScreen.js
    │   ├── ChatScreen.js
    │   ├── RatingScreen.js
    │   └── ReportIssueScreen.js
    │
    ├── services/
    │   ├── api.js                   # Axios API client
    │   └── socket.js                # Socket.IO client
    │
    ├── assets/
    │   ├── logo.png
    │   ├── icon.png
    │   ├── splash-icon.png
    │   ├── adaptive-icon.png
    │   └── favicon.png
    │
    └── eas.json                     # EAS Build configuration

## 🚀 Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Expo CLI (`npm install -g expo-cli`)
- MongoDB Atlas account
- Google Maps API key
- A mobile device or emulator

### Step 1: Backend Setup
# Navigate to backend
cd safely-home-backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=10000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safelyhome?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-min-32-chars
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
SOCKET_TIMEOUT=60000
EOF

# Start backend (development)
npm run dev

# Start backend (production)
npm start

### Step 2: Frontend Setup

# Navigate to frontend
cd safely-home-frontend

# Install dependencies
npm install

# Update config.js with your backend URL
# For local development:
# API_URL = 'http://192.168.X.X:10000/api'
# SOCKET_URL = 'http://192.168.X.X:10000'

# For production (Render/Heroku):
# API_URL = 'https://your-backend.onrender.com/api'
# SOCKET_URL = 'https://your-backend.onrender.com'

# Start frontend (development)
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

### Step 3: Database Setup

1. Create MongoDB Atlas account
2. Create a cluster
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
4. Add to `.env` as `MONGODB_URI`


## ⚙️ Configuration

### Backend (.env)
PORT=10000
NODE_ENV=production
MONGODB_URI=mongodb+srv://safely_home_user:password@cluster0.mongodb.net/safelyhome?retryWrites=true&w=majority
JWT_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa (min 32 chars)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
SOCKET_TIMEOUT=60000

### Frontend (config.js)
const isDevelopment = __DEV__;

export const API_URL = isDevelopment 
  ? 'http://YOUR_IP:10000/api'      // Local IP
  : 'https://safely-home-backend.onrender.com/api';  // Production

export const SOCKET_URL = isDevelopment
  ? 'http://YOUR_IP:10000'
  : 'https://safely-home-backend.onrender.com';

export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

export const COLORS = {
  primary: '#312C51',
  secondary: '#48426D',
  accent: '#F0C38E',
  light: '#F1AA9B',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#FFFFFF',
  textDark: '#312C51'
};

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
   - Geocoding API
4. Create an API key
5. Add to `app.json` and `config.js`


## 🏃 Running the Application

### Development Environment

**Terminal 1 - Backend:**
cd safely-home-backend
npm run dev


**Terminal 2 - Frontend:**
cd safely-home-frontend
npm start


Then press:
- `a` for Android emulator
- `i` for iOS simulator
- `w` for web (if needed)

### Production Deployment

**Backend (Render):**
# Push to Git and deploy via Render dashboard
git push origin main

**Frontend (EAS Build):**
eas build --platform android
eas build --platform ios
eas submit -p android --latest



## 📡 API Endpoints

### Authentication
- `POST /api/register` - Register new user (rider/driver)
- `POST /api/login` - Login user
- `POST /api/gender-preference` - Set rider's gender preference

### Rider Features
- `POST /api/location` - Update user location
- `POST /api/ride/request` - Request a ride
- `POST /api/ride/rate` - Rate completed ride
- `GET /api/rides/:rideId` - Get ride details

### Driver Features
- `GET /api/rides/available` - Get available ride requests
- `POST /api/ride/accept` - Accept a ride
- `POST /api/driver/status` - Update online status
- `GET /api/driver/earnings` - Get driver earnings
- `GET /api/driver/stats` - Get driver performance stats

### Ride Management
- `POST /api/ride/complete` - Complete a ride
- `POST /api/ride/cancel` - Cancel a ride


## 🔌 Socket.IO Events

### Client → Server

'authenticate'           // Authenticate socket with userId
'updateLocation'         // Send real-time location
'rideStatusUpdate'       // Update ride status
'sendMessage'            // Send chat message
'getChatHistory'         // Fetch message history


### Server → Client

'newRideRequest'         // New ride request notification
'driverAccepted'         // Driver accepted ride
'rideAcceptedByYou'      // Confirmation that your ride was accepted
'rideCancelled'          // Ride was cancelled
'rideCompleted'          // Ride completed
'rideStatusUpdate'       // Ride status changed
'newMessage'             // New chat message
'messageHistory'         // Chat history response
'driverLocationUpdate'   // Driver location update
'driverStatusChanged'    // Driver online status changed


## 🎯 Key Features Guide

### Booking a Ride (BookingScreen.js)

**Two ways to select locations:**

1. **Using Autocomplete (Type & Select):**
   - Type address in input field
   - Google Places suggestions appear
   - Tap suggestion to select
   - Fare auto-updates
   - **Example**: Type "Bahria University" → Tap suggestion → Fare shows

2. **Using Map (Tap & Select):**
   - Focus input field (pickup or destination)
   - Tap map at desired location
   - Location updates with address from geocoding
   - Fare auto-updates
   - **Example**: Focus "Destination" → Tap map → Address appears

**Fare Calculation:**
Base Fare: 50 PKR
Per KM Rate: 20 PKR
Formula: max(50 + (distance * 20), 50)

Distance Calculation: Haversine formula (GPS coordinates)
ETA: distance / 40 km/h * 60 (average city speed)

### Gender Preference System
- **Female Only**: Only female drivers shown
- **Male Only**: Only male drivers shown
- **Any**: Any available driver shown
- **Changeable**: Update anytime from RiderHome

### Chat System
- Real-time messaging via Socket.IO
- Messages persisted in MongoDB
- 30-day TTL (auto-delete after 30 days)
- Unread message badges
- Rider ↔ Driver direct communication

### Safety Reporting
- Emergency 911 calling
- Issue types:
  - Safety concern
  - Driver behavior
  - Wrong route
  - Harassment
  - Accident/Emergency
  - Other
- Location tracking with reports
- 24-hour review commitment

### Rating System
- 1-5 star rating (required)
- Optional tags for feedback
- Optional written comments
- Driver average rating auto-calculated
- Reviews persist and appear on driver profile

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Failed**

Error: connect ECONNREFUSED
Solution: 
1. Check MongoDB URI in .env
2. Verify IP whitelist in MongoDB Atlas
3. Ensure cluster is running


**Socket.IO Not Connecting**

Solution:
1. Check ALLOWED_ORIGINS in .env
2. Verify backend is running on correct PORT
3. Clear browser cache/app cache
4. Restart both frontend and backend

### Frontend Issues

**Google Maps Not Showing**

Solution:
1. Verify API_KEY in app.json and config.js
2. Check Google Maps API is enabled in Cloud Console
3. Verify API key restrictions (should be unrestricted for development)
4. Restart app: Expo > "r"


**Autocomplete Not Working**

Solution:
1. Verify Google Places API is enabled
2. Check API key has Places API permission
3. Ensure location permissions granted
4. Check network connection
5. Try typing with delay (debounce)


**Fare Not Updating**

Solution:
1. Ensure both pickup and destination have valid coordinates
2. Check distance calculation logic
3. Verify useEffect dependency array
4. Clear app cache and rebuild


**Socket Connection Issues**

Solution:
1. Verify SOCKET_URL in config.js
2. Check backend Socket.IO is listening
3. Check firewall/network doesn't block WebSocket
4. Verify userId is authenticated
5. Check console for socket errors


### Common Errors

| Error                  | Cause                 | Solution                         |
|------------------------|-----------------------|----------------------------------|
| `401 Unauthorized`     | Token expired         | Login again                      |
| `Backend Inactive`     | Server not responding | Start backend with `npm run dev` |
| `Invalid email format` | Email missing @       | Use valid email                  |
| `Password too weak`    | < 8 chars             | Use stronger password            |
| `No suggestions`       | Places API issue      | Check API key                    |


## 🔐 Security & Safety

### Authentication
- JWT tokens (30-day expiration)
- Password hashing (bcryptjs)
- Email validation
- Session management

### Data Protection
- MongoDB Atlas encryption
- HTTPS on production
- CORS configured
- API request authentication

### Safety Features
- Real-time location tracking
- Emergency contact system
- Incident reporting with GPS
- Driver background verification
- Face recognition for drivers
- User ratings system

### Best Practices
- Never commit `.env` files
- Use environment variables for secrets
- Validate all inputs (frontend & backend)
- Rate limit API endpoints
- Use HTTPS in production
- Regular security audits


## 🚀 Future Enhancements

- [ ] Payment integration (Stripe/PayPal)
- [ ] Advanced background checks for drivers
- [ ] Insurance coverage
- [ ] Group rides / Shared rides
- [ ] Scheduled rides
- [ ] Driver license OCR scanning
- [ ] AI-based safety scoring
- [ ] Video call integration
- [ ] Accessibility features
- [ ] Multi-language support
- [ ] Web dashboard (admin panel)
- [ ] Analytics dashboard
- [ ] Referral program
- [ ] Loyalty rewards

## 📞 Support & Contact

For issues, feature requests, or questions:
- Create an issue on GitHub
- Email: support@safelyhome.com
- Document: [Full API Documentation](./API.md)


## 🙏 Acknowledgments

- Google Maps API
- MongoDB Atlas
- React Native & Expo community
- Socket.IO contributors

## 📊 Project Statistics

- **Frontend**: React Native (Expo)
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **APIs**: Google Maps, Places, Geocoding
- **Total Screens**: 14+
- **API Endpoints**: 15+
- **Socket Events**: 12+


**Last Updated**: November 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
