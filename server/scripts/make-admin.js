import dotenv from "dotenv"
import mongoose from "mongoose"
import User from "../models/usermodel.js"

dotenv.config()

const email = process.argv[2] || process.env.ADMIN_EMAIL

if (!email) {
  console.error("Usage: node scripts/make-admin.js admin@example.com")
  process.exit(1)
}

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME || "InterviewIQ",
  })

  const user = await User.findOneAndUpdate(
    { email },
    { isAdmin: true },
    { new: true }
  ).select("name email isAdmin")

  if (!user) {
    console.error(`No user found for ${email}`)
    process.exitCode = 1
  } else {
    console.log(`${user.email} is now an admin.`)
  }
} catch (error) {
  console.error(`Make admin error: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
