import express from "express"
import Ride from "../models/Ride.js"
import Driver from "../models/Driver.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Request Ride
router.post("/request", authenticateToken, async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, estimatedFare, driverGenderPreference } = req.body

    const ride = new Ride({
      riderId: req.user.id,
      pickupLocation,
      dropoffLocation,
      estimatedFare,
      driverGenderPreference,
      status: "requested",
    })

    await ride.save()

    // Notify available drivers
    const availableDrivers = await Driver.find({
      isAvailable: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [pickupLocation.longitude, pickupLocation.latitude],
          },
          $maxDistance: 5000, // 5km radius
        },
      },
    })

    global.io?.emit("new-ride-request", { ride, availableDrivers: availableDrivers.length })

    res.status(201).json({ success: true, message: "Ride requested", ride })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Accept Ride
router.post("/:rideId/accept", authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { driverId: req.user.id, status: "accepted", startTime: new Date() },
      { new: true },
    )

    global.io?.emit("ride-accepted", ride)

    res.json({ success: true, message: "Ride accepted", ride })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Complete Ride
router.post("/:rideId/complete", authenticateToken, async (req, res) => {
  try {
    const { finalFare } = req.body
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { status: "completed", endTime: new Date(), finalFare },
      { new: true },
    )

    global.io?.emit("ride-completed", ride)

    res.json({ success: true, message: "Ride completed", ride })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get Ride Details
router.get("/:rideId", authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId).populate("riderId driverId")
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" })
    }
    res.json({ success: true, ride })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get User Rides
router.get("/user/history", authenticateToken, async (req, res) => {
  try {
    const rides = await Ride.find({
      $or: [{ riderId: req.user.id }, { driverId: req.user.id }],
    }).populate("riderId driverId")
    res.json({ success: true, rides })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
