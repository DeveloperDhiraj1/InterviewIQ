import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import User from "../models/usermodel.js"
import gentoken from "../config/Token.js"

const isProduction = process.env.NODE_ENV === "production"

const createAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      credits: 100,
    })
    await user.save()

    const token = await gentoken(user._id)
    createAuthCookie(res, token)

    const userResponse = user.toObject()
    delete userResponse.password
    return res.status(201).json({ message: "Registration successful", user: userResponse })
  } catch (error) {
    return res.status(500).json({ message: `Registration error ${error.message}` })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    const token = await gentoken(user._id)
    createAuthCookie(res, token)

    const userResponse = user.toObject()
    delete userResponse.password
    return res.status(200).json({ message: "Login successful", user: userResponse })
  } catch (error) {
    return res.status(500).json({ message: `Login error ${error.message}` })
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" })
    }

    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(400).json({ message: "No user found with this email" })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()

    return res.status(200).json({ message: "Password updated successfully. Please log in with your new password." })
  } catch (error) {
    return res.status(500).json({ message: `Forgot password error ${error.message}` })
  }
}

export const googleAuth = async (req, res) => {
  try {
    const { name, email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    let user = await User.findOne({ email })
    if (!user) {
      const password = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10)
      user = new User({
        name: name || email.split("@")[0],
        email,
        password,
      })
      await user.save()
    }

    const token = await gentoken(user._id)
    createAuthCookie(res, token)

    const userResponse = user.toObject()
    delete userResponse.password
    return res.status(200).json({ message: "Login successful", user: userResponse })
  } catch (error) {
    return res.status(500).json({ message: `Google auth error ${error.message}` })
  }
}

export const demoAuth = async (req, res) => {
  try {
    let user = await User.findOne({ email: "demo@interviewiq.local" }).select("+password")
    if (!user) {
      const password = await bcrypt.hash("demo-password", 10)
      user = new User({
        name: "Demo Candidate",
        email: "demo@interviewiq.local",
        password,
        credits: 100,
      })
      await user.save()
    }

    const token = await gentoken(user._id)
    createAuthCookie(res, token)

    const userResponse = user.toObject()
    delete userResponse.password
    return res.status(200).json({ message: "Demo login successful", user: userResponse })
  } catch (error) {
    return res.status(500).json({ message: `Demo auth error ${error.message}` })
  }
}

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    })
    return res.status(200).json({ message: "Logout successful" })
  } catch (error) {
    return res.status(500).json({ message: `Logout error ${error.message}` })
  }
}
