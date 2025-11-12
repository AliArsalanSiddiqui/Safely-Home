import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import "express-async-errors"
import { Server } from "socket.io"
import http from "http"

// Routes
import authRoutes from "./routes/auth.js"
import driverRoutes from "./routes/driver.js"
import rideRoutes from "./routes/ride.js"
import ratingRoutes from "./routes/rating.js"
import issueRoutes from "./routes/issue.js"
import locationRoutes from "./routes/location.js"

// Middleware
import errorHandler from "./middleware/errorHandler.js"

dotenv.config()

const app = express()
const server = http.createServer(app)
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Middleware
app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" })
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/drivers", driverRoutes)
app.use("/api/rides", rideRoutes)
app.use("/api/ratings", ratingRoutes)
app.use("/api/issues", issueRoutes)
app.use("/api/location", locationRoutes)

// Error handling
app.use(errorHandler)

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("MongoDB connected")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

connectDB()

// WebSocket Events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("driver-location", (data) => {
    io.to(data.rideId).emit("driver-location-update", data)
  })

  socket.on("join-ride", (rideId) => {
    socket.join(rideId)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
