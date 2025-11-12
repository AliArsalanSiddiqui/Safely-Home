import express from "express"
import Issue from "../models/Issue.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Report Issue
router.post("/report", authenticateToken, async (req, res) => {
  try {
    const { rideId, issueType, description, evidence } = req.body

    const issue = new Issue({
      rideId,
      reportedBy: req.user.id,
      issueType,
      description,
      evidence,
      status: "pending",
    })

    await issue.save()

    res.status(201).json({ success: true, message: "Issue reported", issue })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get Issues (Admin)
router.get("/all", async (req, res) => {
  try {
    const issues = await Issue.find().populate("reportedBy rideId")
    res.json({ success: true, issues })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
