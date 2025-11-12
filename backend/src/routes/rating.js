import express from "express"
import Rating from "../models/Rating.js"
import User from "../models/User.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Submit Rating
router.post("/submit", authenticateToken, async (req, res) => {
  try {
    const { rideId, ratedTo, rating, comment, tags } = req.body

    const ratingDoc = new Rating({
      rideId,
      ratedBy: req.user.id,
      ratedTo,
      rating,
      comment,
      tags,
    })

    await ratingDoc.save()

    // Update user's average rating
    const userRatings = await Rating.find({ ratedTo })
    const averageRating = userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length

    await User.updateOne({ _id: ratedTo }, { rating: averageRating })

    res.status(201).json({ success: true, message: "Rating submitted", rating: ratingDoc })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get User Ratings
router.get("/user/:userId", async (req, res) => {
  try {
    const ratings = await Rating.find({ ratedTo: req.params.userId }).populate("ratedBy")
    res.json({ success: true, ratings })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
