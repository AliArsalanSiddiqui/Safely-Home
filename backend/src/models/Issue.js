import mongoose from "mongoose"

const issueSchema = new mongoose.Schema(
  {
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    issueType: {
      type: String,
      enum: ["safety_concern", "driver_behavior", "wrong_route", "harassment", "accident_emergency", "other"],
      required: true,
    },
    description: { type: String, required: true },
    evidence: [String], // Image URLs
    status: { type: String, enum: ["pending", "investigating", "resolved", "closed"], default: "pending" },
    resolution: String,
  },
  { timestamps: true },
)

export default mongoose.model("Issue", issueSchema)
