import dotenv from "dotenv"
import mongoose from "mongoose"
import User from "../models/usermodel.js"

dotenv.config()

const email = process.argv[2] || process.env.ADMIN_EMAIL

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME || "InterviewIQ",
  })

  if (!email) {
    const users = await User.find().sort({ createdAt: -1 }).limit(20).select("name email isAdmin")
    console.error("Usage: node scripts/make-admin.js admin@example.com")
    console.log("Available users:")
    users.forEach((user) => {
      console.log(`- ${user.email} (${user.name})${user.isAdmin ? " [admin]" : ""}`)
    })
    process.exitCode = 1
    await mongoose.disconnect()
    process.exit()
  }

  const user = await User.findOneAndUpdate(
    { email },
    { isAdmin: true },
    { new: true }
  ).select("name email isAdmin")

  if (!user) {
    console.error(`No user found for ${email}`)
    const users = await User.find().sort({ createdAt: -1 }).limit(20).select("name email isAdmin")
    console.log("Available users:")
    users.forEach((item) => {
      console.log(`- ${item.email} (${item.name})${item.isAdmin ? " [admin]" : ""}`)
    })
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
