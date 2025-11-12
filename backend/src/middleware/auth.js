import jwt from "jsonwebtoken"

export const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token required" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    req.user = decoded
    next()
  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid token" })
  }
}
