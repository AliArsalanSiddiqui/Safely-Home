import mongoose from "mongoose"
import bcryptjs from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    userType: { type: String, enum: ["rider", "driver"], required: true },
    profileImage: { type: String },
    facialData: { type: String }, // Base64 encoded facial data for recognition
    genderPreference: { type: String, enum: ["male", "female", "no_preference"], default: "no_preference" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 5.0 },
    totalTrips: { type: Number, default: 0 },
    location: {
      latitude: Number,
      longitude: Number,
    },
  },
  { timestamps: true },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcryptjs.hash(this.password, 10)
  next()
})

// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
  return await bcryptjs.compare(password, this.password)
}

export default mongoose.model("User", userSchema)
