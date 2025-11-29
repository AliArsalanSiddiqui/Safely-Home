// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);

// -----------------------------
// Config & env checks
// -----------------------------
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!MONGODB_URI) {
  console.error('❌ FATAL ERROR: MONGODB_URI not set in environment variables!');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET not set in environment variables!');
  process.exit(1);
}

console.log(`ℹ️  Environment: ${NODE_ENV}`);

// -----------------------------
// Allowed origins (MUST be defined BEFORE using it with Socket.IO / CORS)
// -----------------------------
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : '*';

// -----------------------------
// Socket.IO initialization (uses allowedOrigins)
// -----------------------------
const io = socketIo(server, { 
  cors: { 
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// -----------------------------
// Middleware
// -----------------------------
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// -----------------------------
// MongoDB connection
// -----------------------------
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ============================================
// SCHEMAS
// ============================================

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  phone: String,
  userType: { type: String, enum: ['rider', 'driver'], required: true },
  genderPreference: String,
  gender: String,
  rating: { type: Number, default: 5.0 },
  faceData: String,
  vehicleInfo: {
    model: String,
    licensePlate: String,
    color: String
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  isOnline: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ location: '2dsphere' });
const User = mongoose.model('User', userSchema);

// ============================================
// UPDATE RIDE SCHEMA - ADD ACTIVE FIELD
// ============================================

const rideSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pickup: {
    address: String,
    coordinates: [Number]
  },
  destination: {
    address: String,
    coordinates: [Number]
  },
  fare: Number,
  distance: Number,
  estimatedTime: Number,
  status: {
    type: String,
    enum: ['requested', 'accepted', 'started', 'completed', 'cancelled'],
    default: 'requested'
  },
  active: { type: Boolean, default: true }, // ✅ CRITICAL
  feedback: {
    rating: Number,
    tags: [Number],
    comments: String
  },
  createdAt: { type: Date, default: Date.now },
  acceptedAt: Date,
  completedAt: Date
});

const Ride = mongoose.model('Ride', rideSchema);

// NEW: Message Schema for MongoDB
const messageSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now }
});

messageSchema.index({ rideId: 1, timestamp: 1 });
messageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30-day TTL
const Message = mongoose.model('Message', messageSchema);

// ============================================
// FILE UPLOAD CONFIG
// ============================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Calculate fare: 20 pkr per km + base fare
function calculateFare(distanceKm) {
  const baseFare = 50; // Base fare
  const perKmRate = 20;
  const fare = baseFare + (distanceKm * perKmRate);
  return Math.max(fare, 50); // Minimum fare 50 pkr
}

// Calculate ETA: Average speed 40 km/h in city
function calculateETA(distanceKm) {
  const avgSpeedKmh = 40;
  const timeHours = distanceKm / avgSpeedKmh;
  const timeMinutes = Math.ceil(timeHours * 60);
  return Math.max(timeMinutes, 2); // Minimum 2 minutes
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    strength: errors.length === 0 ? 'Strong' : 
              errors.length <= 2 ? 'Medium' : 'Weak'
  };
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.replace('Bearer ', '');
  console.log(token);
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({ error: 'Invalid token' });
  }
};

// ============================================
// TEST ROUTE
// ============================================

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend is working!', timestamp: new Date() });
});

// ============================================
// AUTH ROUTES
// ============================================

// Register (UPDATED with email & password validation)
app.post('/api/register', upload.single('faceImage'), async (req, res) => {
  try {
    console.log('📝 Registration Request Body:', req.body);
    console.log('📸 File:', req.file);

    const { email, password, name, phone, userType, gender, vehicleInfo } = req.body;
    
    if (!email || !password || !name || !phone || !userType) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        required: ['email', 'password', 'name', 'phone', 'userType']
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format. Email must contain @ symbol and valid domain'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        success: false,
        error: 'Password does not meet security requirements',
        strength: passwordValidation.strength,
        details: passwordValidation.errors
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User with this email already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let parsedVehicleInfo = null;
    if (vehicleInfo) {
      try {
        parsedVehicleInfo = typeof vehicleInfo === 'string' ? JSON.parse(vehicleInfo) : vehicleInfo;
      } catch (e) {
        console.error('Error parsing vehicleInfo:', e);
      }
    }

    const user = new User({
      email,
      password: hashedPassword,
      name,
      phone,
      userType,
      gender: gender || (userType === 'driver' ? 'male' : null),
      vehicleInfo: userType === 'driver' ? parsedVehicleInfo : undefined,
      faceData: req.file ? req.file.filename : null,
      location: { type: 'Point', coordinates: [0, 0] }
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, userType: user.userType }, 
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    console.log('✅ User registered successfully:', user.email);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login.',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Registration failed',
      details: error.message 
    });
  }
});

// Login (UPDATED with email validation)
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔐 Login Request:', req.body);

    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format. Email must contain @ symbol and valid domain'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    const token = jwt.sign(
      { userId: user._id, userType: user.userType }, 
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    console.log('✅ Login successful:', user.email);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        genderPreference: user.genderPreference,
        gender: user.gender,
        vehicleInfo: user.vehicleInfo
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed',
      details: error.message 
    });
  }
});

// Gender Preference
app.post('/api/gender-preference', authenticateToken, async (req, res) => {
  try {
    const { genderPreference } = req.body;
    
    if (!['male', 'female', 'any'].includes(genderPreference)) {
      return res.status(400).json({ success: false, error: 'Invalid gender preference' });
    }

    await User.findByIdAndUpdate(req.user.userId, { genderPreference });
    
    console.log('✅ Gender preference updated:', req.user.userId, genderPreference);
    res.json({ success: true, genderPreference });
  } catch (error) {
    console.error('❌ Gender preference error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Location
app.post('/api/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ 
        success: false,
        error: 'Latitude and longitude must be numbers' 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      { new: true, runValidators: true }
    );

    console.log('📍 Location updated:', updatedUser.email, [longitude, latitude]);

    res.json({ success: true, location: updatedUser.location });
  } catch (error) {
    console.error('❌ Location update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// RIDE ROUTES
// ============================================
// ============================================
// GET ACTIVE RIDE ENDPOINT (NEW)
// Returns the rider's current active ride if any
// ============================================

app.get('/api/rides/active', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;

    console.log('🔍 Checking active ride for:', userId);

    let query = {
      status: { $in: ['requested', 'accepted', 'started'] },
      active: true
    };

    if (userType === 'rider') {
      query.riderId = userId;
    } else {
      query.driverId = userId;
    }

    const activeRide = await Ride.findOne(query)
      .populate('riderId', 'name phone gender')
      .populate('driverId', 'name phone rating vehicleInfo gender')
      .sort({ createdAt: -1 });

    if (activeRide) {
      console.log('✅ Active ride found:', activeRide._id);
      res.json({ success: true, activeRide });
    } else {
      console.log('ℹ️ No active ride');
      res.json({ success: true, activeRide: null });
    }
  } catch (error) {
    console.error('❌ Get active ride error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// ============================================
// RIDE HISTORY ENDPOINT (NEW)
// ============================================

app.get('/api/rides/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;

    console.log('📜 Fetching ride history for:', {
      userId: userId,
      userType: userType
    });

    // ✅ Convert to ObjectId (mongoose is already imported at top)
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // ✅ Build query based on user type
    let query = {
      status: { $in: ['completed', 'cancelled'] },
      active: false
    };

    if (userType === 'rider') {
      query.riderId = userObjectId;
    } else {
      query.driverId = userObjectId;
    }

    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    // ✅ Fetch rides
    const rides = await Ride.find(query)
      .populate('riderId', 'name phone gender')
      .populate('driverId', 'name phone rating vehicleInfo gender')
      .sort({ createdAt: -1 })
      .limit(100);

    console.log(`✅ Found ${rides.length} historical rides`);

    // ✅ Log first ride if exists (for debugging)
    if (rides.length > 0) {
      console.log('📋 Sample ride:', {
        id: rides[0]._id,
        status: rides[0].status,
        active: rides[0].active,
        riderId: rides[0].riderId?._id,
        driverId: rides[0].driverId?._id,
        createdAt: rides[0].createdAt
      });
    }

    res.json({ success: true, rides });
  } catch (error) {
    console.error('❌ Ride history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// ============================================
// UPDATED GET AVAILABLE RIDES - ONLY SHOW ACTIVE REQUESTED
// ============================================

app.get('/api/rides/available', authenticateToken, async (req, res) => {
  try {
    const driver = await User.findById(req.user.userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const rides = await Ride.find({ 
      status: 'requested',
      active: true,
      driverId: { $exists: false }
    })
    .populate('riderId', 'name phone gender')
    .sort({ createdAt: -1 })
    .limit(10);

    console.log(`📋 ${rides.length} available rides for driver: ${driver.name}`);

    res.json({ 
      success: true, 
      rides: rides.map(ride => ({
        id: ride._id,
        riderName: ride.riderId?.name,
        riderPhone: ride.riderId?.phone,
        riderGender: ride.riderId?.gender,
        pickup: ride.pickup.address,
        destination: ride.destination.address,
        fare: ride.fare,
        distance: ride.distance,
        estimatedTime: ride.estimatedTime,
        createdAt: ride.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Get available rides error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get('/api/admin/active-rides', authenticateToken, async (req, res) => {
  try {
    const activeRides = await Ride.find({ active: true })
      .populate('riderId', 'name email')
      .populate('driverId', 'name email')
      .sort({ createdAt: -1 });

    console.log(`📊 Total active rides: ${activeRides.length}`);

    res.json({
      success: true,
      count: activeRides.length,
      rides: activeRides.map(ride => ({
        id: ride._id,
        status: ride.status,
        rider: ride.riderId?.name || 'Unknown',
        driver: ride.driverId?.name || 'Not assigned',
        createdAt: ride.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching active rides:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get('/api/debug/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;
    
    const user = await User.findById(userId);
    
    console.log('👤 Current user:', {
      id: userId,
      type: userType,
      name: user?.name,
      email: user?.email
    });
    
    // Find rides as rider
    const asRider = await Ride.countDocuments({ 
      riderId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['completed', 'cancelled'] },
      active: false
    });
    
    // Find rides as driver
    const asDriver = await Ride.countDocuments({ 
      driverId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['completed', 'cancelled'] },
      active: false
    });
    
    res.json({
      success: true,
      user: {
        id: userId,
        type: userType,
        name: user?.name,
        email: user?.email
      },
      rideCount: {
        asRider: asRider,
        asDriver: asDriver
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post('/api/ride/request', authenticateToken, async (req, res) => {
  try {
    const { pickup, destination, fare } = req.body;
    
    console.log('🚗 Ride request from:', req.user.userId);

    const rider = await User.findById(req.user.userId);
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }

    console.log('📋 Rider info:', {
      name: rider.name,
      gender: rider.gender,
      genderPreference: rider.genderPreference
    });

    // Calculate distance and fare
    const pickupCoords = pickup.coordinates;
    const destCoords = destination.coordinates;
    
    let calculatedDistance = 0;
    let calculatedFare = fare || 50;
    let calculatedETA = 15;
    
    if (pickupCoords && destCoords && pickupCoords.length === 2 && destCoords.length === 2) {
      calculatedDistance = calculateDistance(
        pickupCoords[1], pickupCoords[0],
        destCoords[1], destCoords[0]
      );
      calculatedFare = calculateFare(calculatedDistance);
      calculatedETA = calculateETA(calculatedDistance);
    }

    const ride = new Ride({
      riderId: req.user.userId,
      pickup: {
        ...pickup,
        address: pickup.address || 'Pickup location'
      },
      destination: {
        ...destination,
        address: destination.address || 'Destination'
      },
      fare: calculatedFare,
      distance: calculatedDistance,
      estimatedTime: calculatedETA,
      status: 'requested',
      active: true
    });

    await ride.save();

    // ✅ CRITICAL FIX: Gender-based filtering
    let driverFilter = {
      userType: 'driver',
      isOnline: true
    };

    // Apply gender preference
    if (rider.genderPreference && rider.genderPreference !== 'any') {
      driverFilter.gender = rider.genderPreference;
      console.log(`✅ Filtering for ${rider.genderPreference} drivers only`);
    } else if (rider.gender === 'male') {
      // Male riders can only get male drivers
      driverFilter.gender = 'male';
      console.log('✅ Male rider - showing male drivers only');
    } else {
      console.log('✅ No gender filter applied');
    }

    const drivers = await User.find(driverFilter).limit(20);

    console.log(`✅ Found ${drivers.length} drivers matching:`, driverFilter);

    // Emit to matching drivers ONLY
    drivers.forEach(driver => {
      console.log(`🔔 Notifying ${driver.gender} driver: ${driver.name}`);
      io.to(driver._id.toString()).emit('newRideRequest', {
        rideId: ride._id,
        riderId: rider._id,
        riderName: rider.name,
        riderGender: rider.gender,
        pickup: pickup.address,
        destination: destination.address,
        fare: calculatedFare.toFixed(2),
        distance: calculatedDistance.toFixed(2),
        estimatedTime: calculatedETA
      });
    });

    res.json({ 
      success: true,
      rideId: ride._id, 
      message: 'Finding driver...',
      availableDrivers: drivers.length,
      calculatedFare: calculatedFare.toFixed(2),
      distance: calculatedDistance.toFixed(2) + ' km',
      estimatedTime: calculatedETA + ' mins'
    });
  } catch (error) {
    console.error('❌ Ride request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// UPDATED ACCEPT RIDE - REMOVE FROM AVAILABLE
// ============================================

app.post('/api/ride/accept', authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.body;
    
    const ride = await Ride.findById(rideId).populate('riderId');
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' });
    }

    if (ride.status !== 'requested') {
      return res.status(400).json({ success: false, error: 'Ride already accepted' });
    }

    // ✅ UPDATE: Mark as accepted and remove from available
    ride.driverId = req.user.userId;
    ride.status = 'accepted';
    ride.acceptedAt = new Date();
    ride.active = true; // Keep active until completed
    await ride.save();

    const driver = await User.findById(req.user.userId);
    
    const totalRides = await Ride.countDocuments({
      driverId: req.user.userId,
      status: 'completed'
    });
    
    console.log('✅ Ride accepted by driver:', driver.name);

    // Emit to rider
    io.to(ride.riderId._id.toString()).emit('driverAccepted', {
      rideId: ride._id,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        rating: driver.rating || 0,
        totalRides: totalRides,
        vehicleInfo: driver.vehicleInfo,
        gender: driver.gender
      },
      pickup: ride.pickup?.address || 'Pickup location',
      destination: ride.destination?.address || 'Destination'
    });

    // Emit to driver
    io.to(driver._id.toString()).emit('rideAcceptedByYou', {
      rideId: ride._id,
      rider: {
        name: ride.riderId.name,
        phone: ride.riderId.phone
      },
      pickup: ride.pickup?.address || 'Pickup location',
      destination: ride.destination?.address || 'Destination'
    });

    res.json({ 
      success: true, 
      ride,
      message: 'Ride accepted successfully!'
    });
  } catch (error) {
    console.error('❌ Ride accept error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// ============================================
// UPDATED COMPLETE RIDE - MOVE TO HISTORY
// ============================================

app.post('/api/ride/complete', authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.body;
    
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      { 
        status: 'completed', 
        completedAt: new Date(),
        active: false // ✅ Move to history
      },
      { new: true }
    );
    
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' });
    }
    
    console.log('✅ Ride completed and moved to history:', rideId);
    
    io.to(ride.riderId.toString()).emit('rideCompleted', { rideId: ride._id });
    io.to(ride.driverId.toString()).emit('rideCompleted', { rideId: ride._id });
    
    res.json({ success: true, ride });
  } catch (error) {
    console.error('❌ Complete ride error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// UPDATED: Cancel Ride - Mark as inactive
// ============================================

app.post('/api/ride/cancel', authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.body;
    
    const ride = await Ride.findByIdAndUpdate(
      rideId, 
      { 
        status: 'cancelled',
        active: false // ✅ Move to history
      }, 
      { new: true }
    );
    
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' });
    }
    
    console.log('⚠️ Ride cancelled and moved to history:', rideId);
    
    // Notify both rider and driver
    io.to(ride.riderId.toString()).emit('rideCancelled', { rideId: ride._id });
    if (ride.driverId) {
      io.to(ride.driverId.toString()).emit('rideCancelled', { rideId: ride._id });
    }
    
    res.json({ success: true, ride });
  } catch (error) {
    console.error('❌ Cancel ride error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rate Ride
app.post('/api/ride/rate', authenticateToken, async (req, res) => {
  try {
    const { rideId, rating, feedback } = req.body;
    
    console.log('📝 Rating submission:', { rideId, rating, feedback });
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    const ride = await Ride.findById(rideId).populate('driverId');
    
    if (!ride) {
      console.error('❌ Ride not found:', rideId);
      return res.status(404).json({ 
        success: false, 
        error: 'Ride not found' 
      });
    }
    
    if (!ride.driverId) {
      console.error('❌ Driver not found for ride:', rideId);
      return res.status(404).json({ 
        success: false, 
        error: 'Driver not found for this ride' 
      });
    }
    
    if (ride.feedback && ride.feedback.rating) {
      console.warn('⚠️ Ride already rated');
      return res.status(400).json({ 
        success: false, 
        error: 'This ride has already been rated' 
      });
    }
    
    ride.feedback = {
      rating: rating,
      tags: feedback?.tags || [],
      comments: feedback?.comments || ''
    };
    await ride.save();
    
    console.log('✅ Ride feedback saved:', ride.feedback);
    
    const driver = await User.findById(ride.driverId);
    
    const completedRidesWithRatings = await Ride.countDocuments({
      driverId: ride.driverId,
      status: 'completed',
      'feedback.rating': { $exists: true, $ne: null }
    });
    
    const allRatedRides = await Ride.find({
      driverId: ride.driverId,
      status: 'completed',
      'feedback.rating': { $exists: true, $ne: null }
    }).select('feedback.rating');
    
    const totalRating = allRatedRides.reduce((sum, r) => sum + r.feedback.rating, 0);
    const newAverageRating = completedRidesWithRatings > 0 
      ? totalRating / completedRidesWithRatings 
      : 0;
    
    driver.rating = Number(newAverageRating.toFixed(2));
    await driver.save();
    
    console.log('✅ Driver rating updated:', {
      driverId: driver._id,
      newRating: driver.rating,
      totalRatedRides: completedRidesWithRatings
    });
    
    res.json({ 
      success: true, 
      message: 'Rating submitted successfully',
      newRating: driver.rating,
      totalRides: completedRidesWithRatings
    });
    
  } catch (error) {
    console.error('❌ Rate ride error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit rating',
      details: error.message 
    });
  }
});
// Get Ride Details
app.get('/api/rides/:rideId', authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone rating vehicleInfo');
    
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' });
    }
    
    res.json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============================================
// DRIVER ROUTES
// ============================================

// Get Driver Stats (Authenticated Driver)
app.get('/api/driver/stats', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user.userId;
    
    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    
    // Count total completed rides
    const totalRides = await Ride.countDocuments({
      driverId: driverId,
      status: 'completed'
    });
    
    // Get rides with ratings
    const ratedRides = await Ride.find({
      driverId: driverId,
      status: 'completed',
      'feedback.rating': { $exists: true, $ne: null }
    })
    .sort({ completedAt: -1 })
    .limit(10)
    .select('feedback createdAt riderId')
    .populate('riderId', 'name');
    
    // Format reviews
    const reviews = ratedRides.map(ride => ({
      riderName: ride.riderId?.name || 'Anonymous',
      rating: ride.feedback.rating,
      comment: ride.feedback.comments || '',
      tags: ride.feedback.tags || [],
      date: ride.createdAt
    }));
    
    res.json({
      success: true,
      stats: {
        totalRides,
        averageRating: driver.rating || 0,
        reviews: reviews
      }
    });
    
  } catch (error) {
    console.error('❌ Get driver stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Driver Stats by ID (Public - for riders)
app.get('/api/driver/stats/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    
    const totalRides = await Ride.countDocuments({
      driverId: driverId,
      status: 'completed'
    });
    
    const ratedRides = await Ride.find({
      driverId: driverId,
      status: 'completed',
      'feedback.rating': { $exists: true, $ne: null }
    })
    .sort({ completedAt: -1 })
    .limit(10)
    .select('feedback createdAt riderId')
    .populate('riderId', 'name');
    
    const reviews = ratedRides.map(ride => ({
      riderName: ride.riderId?.name || 'Anonymous',
      rating: ride.feedback.rating,
      comment: ride.feedback.comments || '',
      tags: ride.feedback.tags || [],
      date: ride.createdAt
    }));
    
    res.json({
      success: true,
      stats: {
        totalRides,
        averageRating: driver.rating || 0,
        reviews: reviews
      }
    });
    
  } catch (error) {
    console.error('❌ Get driver stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Driver Status
app.post('/api/driver/status', authenticateToken, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const driver = await User.findByIdAndUpdate(req.user.userId, { isOnline }, { new: true });
    if (!driver) return res.status(404).json({ success: false, error: 'Driver not found' });
    console.log('🚦 Driver status updated:', driver.name, isOnline ? 'Online' : 'Offline');
    io.emit('driverStatusChanged', { driverId: driver._id, isOnline, name: driver.name });
    res.json({ success: true, isOnline });
  } catch (error) {
    console.error('❌ Driver status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Earnings
app.get('/api/driver/earnings', authenticateToken, async (req, res) => {
  try {
    const rides = await Ride.find({ driverId: req.user.userId, status: 'completed' });
    const totalEarnings = rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
    const todayRides = rides.filter(ride => {
      const today = new Date();
      const rideDate = new Date(ride.completedAt);
      return rideDate.toDateString() === today.toDateString();
    });
    res.json({
      success: true,
      totalEarnings: totalEarnings.toFixed(2),
      totalRides: rides.length,
      todayRides: todayRides.length,
      todayEarnings: todayRides.reduce((sum, ride) => sum + (ride.fare || 0), 0).toFixed(2)
    });
  } catch (error) {
    console.error('❌ Earnings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SOCKET.IO
// ============================================

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  socket.on('authenticate', (userId) => {
    socket.join(userId);
    connectedUsers.set(userId, socket.id);
    console.log('✅ User authenticated:', userId);
  });

  socket.on('updateLocation', async ({ userId, latitude, longitude }) => {
    try {
      await User.findByIdAndUpdate(userId, {
        location: { type: 'Point', coordinates: [longitude, latitude] }
      });
      socket.broadcast.emit('driverLocationUpdate', { driverId: userId, latitude, longitude });
    } catch (error) {
      console.error('Location update error:', error);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log('👤 User disconnected:', socket.id);
  });

  socket.on('rideStatusUpdate', async ({ rideId, status }) => {
    try {
      console.log('📡 Received status update:', { rideId, status });
      
      const ride = await Ride.findById(rideId).populate('riderId driverId');
      
      if (ride) {
        if (ride.riderId) {
          io.to(ride.riderId._id.toString()).emit('rideStatusUpdate', {
            rideId: ride._id,
            status: status
          });
          console.log('✅ Status sent to rider:', ride.riderId._id);
        }
        
        if (ride.driverId) {
          io.to(ride.driverId._id.toString()).emit('rideStatusUpdate', {
            rideId: ride._id,
            status: status
          });
          console.log('✅ Status sent to driver:', ride.driverId._id);
        }
      }
    } catch (error) {
      console.error('❌ Status update error:', error);
    }
  });

  // Chat - saves to MongoDB instead of memory
  socket.on('sendMessage', async (message) => {
    try {
      console.log('💬 Message received:', message);
      
      const { rideId, senderId, senderName, text, timestamp } = message;
      
      // Save to MongoDB
      const newMessage = new Message({
        rideId,
        senderId,
        senderName,
        text,
        timestamp: timestamp || new Date()
      });
      
      await newMessage.save();
      console.log('✅ Message saved to MongoDB');
      
      // Broadcast to all users in this ride (emit to room might be better if you join users to ride rooms)
      io.emit('newMessage', {
        _id: newMessage._id,
        rideId,
        senderId,
        senderName,
        text,
        timestamp: newMessage.timestamp
      });
      
    } catch (error) {
      console.error('❌ Send message error:', error);
    }
  });

  // Get chat history from MongoDB
  socket.on('getChatHistory', async ({ rideId }) => {
    try {
      const messages = await Message.find({ rideId })
        .sort({ timestamp: 1 })
        .limit(100);
      
      socket.emit('messageHistory', messages);
      console.log(`📜 Sent ${messages.length} messages for ride ${rideId}`);
    } catch (error) {
      console.error('❌ Get chat history error:', error);
      socket.emit('messageHistory', []);
    }
  });
});

// ============================================
// GLOBAL ERROR HANDLER (place after routes)
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================
const HOST = '0.0.0.0';

server.listen(PORT, () => {
  console.log('========================================');
  console.log('🚗 SAFELY HOME BACKEND - PRODUCTION MODE');
  console.log('========================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${NODE_ENV}`);
  console.log('========================================');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

const shutdownHandler = async () => {
  console.log('⛔ Shutting down gracefully...');
  try {
    await mongoose.connection.close();
  } catch (e) {
    console.error('❌ Error closing mongoose connection:', e);
  }
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdownHandler);
process.on('SIGINT', shutdownHandler);

module.exports = server;
