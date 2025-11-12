import mongoose from "mongoose"

const driverSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    licenseNumber: { type: String, required: true, unique: true },
    vehicleModel: { type: String, required: true },
    vehicleNumber: { type: String, required: true, unique: true },
    vehicleImage: { type: String },
    isAvailable: { type: Boolean, default: true },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    documents: {
      licenseImage: String,
      vehicleRegistration: String,
      insuranceDocument: String,
    },
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      bankName: String,
    },
    earnings: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export default mongoose.model("Driver", driverSchema)
