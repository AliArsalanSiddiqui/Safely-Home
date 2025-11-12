import express from "express"
import User from "../models/User.js"
import jwt from "jsonwebtoken"

const router = express.Router()

// Register
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phone, password, userType, facialData } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" })
    }

    const user = new User({
      fullName,
      email,
      phone,
      password,
      userType,
      facialData,
      isVerified: true,
    })

    await user.save()

    const token = jwt.sign({ id: user._id, userType: user.userType }, process.env.JWT_SECRET || "your-secret-key")

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { id: user._id, fullName: user.fullName, email: user.email, userType: user.userType },
      token,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const isValid = await user.comparePassword(password)
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const token = jwt.sign({ id: user._id, userType: user.userType }, process.env.JWT_SECRET || "your-secret-key")

    res.json({
      success: true,
      message: "Login successful",
      user: { id: user._id, fullName: user.fullName, email: user.email, userType: user.userType },
      token,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Facial Recognition Login
router.post("/facial-login", async (req, res) => {
  try {
    const { facialData, userType } = req.body

    // In production, integrate with AWS Rekognition or similar
    const user = await User.findOne({ facialData, userType })
    if (!user) {
      return res.status(401).json({ success: false, message: "Facial recognition failed" })
    }

    const token = jwt.sign({ id: user._id, userType: user.userType }, process.env.JWT_SECRET || "your-secret-key")

    res.json({
      success: true,
      message: "Facial login successful",
      user: { id: user._id, fullName: user.fullName, email: user.email, userType: user.userType },
      token,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
