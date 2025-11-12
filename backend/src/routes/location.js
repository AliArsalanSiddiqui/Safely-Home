import express from "express"
import axios from "axios"

const router = express.Router()

// Google Maps Autocomplete (Address Search)
router.get("/autocomplete", async (req, res) => {
  try {
    const { input } = req.query
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
      params: {
        input,
        key: process.env.GOOGLE_MAPS_API_KEY,
        components: "country:pk", // Pakistan only
      },
    })
    res.json({ success: true, predictions: response.data.predictions })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get Place Details
router.get("/details", async (req, res) => {
  try {
    const { placeId } = req.query
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
      params: {
        place_id: placeId,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    })
    res.json({ success: true, details: response.data.result })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Estimate Fare (Distance Matrix API)
router.post("/estimate-fare", async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body
    const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
      params: {
        origins: `${pickupLat},${pickupLng}`,
        destinations: `${dropoffLat},${dropoffLng}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        units: "metric",
      },
    })

    const distance = response.data.rows[0].elements[0].distance.value / 1000 // km
    const duration = response.data.rows[0].elements[0].duration.value / 60 // minutes
    const baseFare = 50 // PKR
    const perKmRate = 15 // PKR per km
    const estimatedFare = baseFare + distance * perKmRate

    res.json({
      success: true,
      distance: distance.toFixed(2),
      duration: Math.ceil(duration),
      estimatedFare: Math.ceil(estimatedFare),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
