import express from "express"
import Driver from "../models/Driver.js"
import User from "../models/User.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Register Driver
router.post("/register", authenticateToken, async (req, res) => {
  try {
    const { licenseNumber, vehicleModel, vehicleNumber, licenseImage, vehicleRegistration } = req.body

    const existingDriver = await Driver.findOne({ userId: req.user.id })
    if (existingDriver) {
      return res.status(400).json({ success: false, message: "Driver profile already exists" })
    }

    const driver = new Driver({
      userId: req.user.id,
      licenseNumber,
      vehicleModel,
      vehicleNumber,
      documents: {
        licenseImage,
        vehicleRegistration,
      },
    })

    await driver.save()
    await User.updateOne({ _id: req.user.id }, { isVerified: true })

    res.status(201).json({
      success: true,
      message: "Driver registered successfully",
      driver,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get Driver Profile
router.get("/profile/:driverId", async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.params.driverId }).populate("userId")
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" })
    }
    res.json({ success: true, driver })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update Driver Location
router.post("/update-location", authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body
    const driver = await Driver.findOneAndUpdate(
      { userId: req.user.id },
      {
        currentLocation: { latitude, longitude },
      },
      { new: true },
    )

    // Emit real-time location update via WebSocket
    global.io?.emit("driver-location-updated", {
      driverId: req.user.id,
      location: { latitude, longitude },
    })

    res.json({ success: true, driver })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Toggle Driver Availability
router.post("/toggle-availability", authenticateToken, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id })
    driver.isAvailable = !driver.isAvailable
    await driver.save()

    res.json({ success: true, message: "Availability toggled", driver })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
