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
const io = socketIo(server, { 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST']
  } 
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://safely_home_user:safelyhome123@cluster0.5gek3qr.mongodb.net/safelyhome?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

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

// Ride Schema
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
  status: {
    type: String,
    enum: ['requested', 'accepted', 'started', 'completed', 'cancelled'],
    default: 'requested'
  },
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

// File upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.replace('Bearer ', '');
  
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
// ROUTES
// ============================================

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend is working!', timestamp: new Date() });
});

// Register
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

// Login
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

// Request Ride
app.post('/api/ride/request', authenticateToken, async (req, res) => {
  try {
    const { pickup, destination, fare } = req.body;
    
    console.log('🚗 Ride request from:', req.user.userId);

    const rider = await User.findById(req.user.userId);
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }

    const ride = new Ride({
      riderId: req.user.userId,
      pickup,
      destination,
      fare,
      status: 'requested'
    });

    await ride.save();

    const genderFilter = {};
    if (rider.genderPreference && rider.genderPreference !== 'any') {
      genderFilter.gender = rider.genderPreference;
    }

    const drivers = await User.find({
      userType: 'driver',
      isOnline: true,
      ...genderFilter
    }).limit(20);

    console.log(`✅ Found ${drivers.length} available drivers matching preference: ${rider.genderPreference || 'any'}`);

    drivers.forEach(driver => {
      console.log('🔔 Notifying driver:', driver.name, driver._id.toString());
      io.to(driver._id.toString()).emit('newRideRequest', {
        rideId: ride._id,
        riderId: rider._id,
        riderName: rider.name,
        pickup: pickup.address,
        destination: destination.address,
        fare: fare
      });
    });

    res.json({ 
      success: true,
      rideId: ride._id, 
      message: 'Finding driver...',
      availableDrivers: drivers.length
    });
  } catch (error) {
    console.error('❌ Ride request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Available Rides
app.get('/api/rides/available', authenticateToken, async (req, res) => {
  try {
    const driver = await User.findById(req.user.userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const rides = await Ride.find({ 
      status: 'requested' 
    })
    .populate('riderId', 'name phone')
    .sort({ createdAt: -1 })
    .limit(10);

    console.log(`📋 Found ${rides.length} available rides for driver:`, driver.name);

    res.json({ 
      success: true, 
      rides: rides.map(ride => ({
        id: ride._id,
        riderName: ride.riderId?.name,
        riderPhone: ride.riderId?.phone,
        pickup: ride.pickup.address,
        destination: ride.destination.address,
        fare: ride.fare,
        createdAt: ride.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Get available rides error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Accept Ride
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

    ride.driverId = req.user.userId;
    ride.status = 'accepted';
    ride.acceptedAt = new Date();
    await ride.save();

    const driver = await User.findById(req.user.userId);
    
    // FIXED: Get total completed rides for this driver
    const totalRides = await Ride.countDocuments({
      driverId: req.user.userId,
      status: 'completed'
    });
    
    console.log('✅ Ride accepted by driver:', driver.name);

    // Emit to rider with complete driver info including totalRides
    io.to(ride.riderId._id.toString()).emit('driverAccepted', {
      rideId: ride._id,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        rating: driver.rating || 0,
        totalRides: totalRides, // FIXED: Include total rides
        vehicleInfo: driver.vehicleInfo,
        gender: driver.gender
      }
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

// Complete, Cancel, Rate Ride
app.post('/api/ride/complete', authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );
    if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });
    console.log('✅ Ride completed:', rideId);
    io.to(ride.riderId.toString()).emit('rideCompleted', { rideId: ride._id });
    io.to(ride.driverId.toString()).emit('rideCompleted', { rideId: ride._id });
    res.json({ success: true, ride });
  } catch (error) {
    console.error('❌ Complete ride error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ride/cancel', authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findByIdAndUpdate(rideId, { status: 'cancelled' }, { new: true });
    if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });
    console.log('⚠️ Ride cancelled:', rideId);
    io.to(ride.riderId.toString()).emit('rideCancelled', { rideId: ride._id });
    if (ride.driverId) io.to(ride.driverId.toString()).emit('rideCancelled', { rideId: ride._id });
    res.json({ success: true, ride });
  } catch (error) {
    console.error('❌ Cancel ride error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ride/rate', authenticateToken, async (req, res) => {
  try {
    const { rideId, rating, feedback } = req.body;
    
    console.log('📝 Rating submission:', { rideId, rating, feedback });
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    // Find the ride
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
    
    // Check if already rated
    if (ride.feedback && ride.feedback.rating) {
      console.warn('⚠️ Ride already rated');
      return res.status(400).json({ 
        success: false, 
        error: 'This ride has already been rated' 
      });
    }
    
    // Update ride with feedback
    ride.feedback = {
      rating: rating,
      tags: feedback?.tags || [],
      comments: feedback?.comments || ''
    };
    await ride.save();
    
    console.log('✅ Ride feedback saved:', ride.feedback);
    
    // Calculate new driver rating
    const driver = await User.findById(ride.driverId);
    
    // Count all completed rides with ratings
    const completedRidesWithRatings = await Ride.countDocuments({
      driverId: ride.driverId,
      status: 'completed',
      'feedback.rating': { $exists: true, $ne: null }
    });
    
    // Calculate average rating
    const allRatedRides = await Ride.find({
      driverId: ride.driverId,
      status: 'completed',
      'feedback.rating': { $exists: true, $ne: null }
    }).select('feedback.rating');
    
    const totalRating = allRatedRides.reduce((sum, r) => sum + r.feedback.rating, 0);
    const newAverageRating = completedRidesWithRatings > 0 
      ? totalRating / completedRidesWithRatings 
      : 5.0;
    
    // Update driver rating
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

app.get('/api/driver/stats/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    
    // Count total completed rides
    const totalRides = await Ride.countDocuments({
      driverId: driverId,
      status: 'completed'
    });
    
    // Count rides with ratings
    const ratedRides = await Ride.countDocuments({
      driverId: driverId,
      status: 'completed',
      'feedback.rating': { $exists: true, $ne: null }
    });
    
    // Get all ratings
    const ridesWithRatings = await Ride.find({
      driverId: driverId,
      status: 'completed',
      'feedback.rating': { $exists: true, $ne: null }
    }).select('feedback.rating feedback.tags feedback.comments createdAt');
    
    res.json({
      success: true,
      stats: {
        totalRides,
        ratedRides,
        averageRating: driver.rating || 0,
        reviews: ridesWithRatings.map(ride => ({
          rating: ride.feedback.rating,
          tags: ride.feedback.tags,
          comments: ride.feedback.comments,
          date: ride.createdAt
        }))
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

// Socket.io
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
      // Broadcast to both rider and driver
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
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error', message: err.message });
});

// Start Server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('========================================');
  console.log('🚗 SAFELY HOME BACKEND SERVER');
  console.log('========================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Local:    http://localhost:${PORT}`);
  console.log(`✅ Network:  Find your IP and use http://YOUR_IP:${PORT}`);
  console.log('========================================');
  console.log(`📊 MongoDB: ${MONGODB_URI.includes('atlas') ? 'Atlas (Cloud)' : 'Local'}`);
  console.log('========================================');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

module.exports = server;
