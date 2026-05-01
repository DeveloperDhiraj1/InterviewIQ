import User from "../models/usermodel.js"
import gentoken from "../config/Token.js"

const isProduction = process.env.NODE_ENV === "production"

export const googleAuth = async (req, res) => {
  try {
    const { name, email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    let user = await User.findOne({ email })
    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
      })
    }

    const token = await gentoken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.status(200).json({ message: "Login successful", user })
  } catch (error) {
    return res.status(500).json({ message: `Google auth error ${error.message}` })
  }
}

export const demoAuth = async (req, res) => {
  try {
    let user = await User.findOne({ email: "demo@interviewiq.local" })
    if (!user) {
      user = await User.create({
        name: "Demo Candidate",
        email: "demo@interviewiq.local",
        credits: 100,
      })
    }

    const token = await gentoken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.status(200).json({ message: "Demo login successful", user })
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
