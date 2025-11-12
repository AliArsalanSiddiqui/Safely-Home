import mongoose from "mongoose"

const ratingSchema = new mongoose.Schema(
  {
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ratedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    tags: [String], // ['clean_vehicle', 'safe_driving', 'friendly_driver', etc.]
  },
  { timestamps: true },
)

export default mongoose.model("Rating", ratingSchema)
