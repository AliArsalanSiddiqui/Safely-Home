import mongoose from "mongoose"

const rideSchema = new mongoose.Schema(
  {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pickupLocation: {
      address: String,
      latitude: Number,
      longitude: Number,
    },
    dropoffLocation: {
      address: String,
      latitude: Number,
      longitude: Number,
    },
    estimatedFare: { type: Number },
    finalFare: { type: Number },
    status: {
      type: String,
      enum: ["requested", "accepted", "ongoing", "completed", "cancelled"],
      default: "requested",
    },
    estimatedTime: { type: Number }, // in minutes
    driverGenderPreference: { type: String, enum: ["male", "female", "no_preference"], default: "no_preference" },
    startTime: Date,
    endTime: Date,
    paymentMethod: { type: String, enum: ["cash", "card", "easypaisa", "jazzcash"], default: "cash" },
    isPaid: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.model("Ride", rideSchema)
