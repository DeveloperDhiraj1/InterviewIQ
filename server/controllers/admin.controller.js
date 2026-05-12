import Interview from "../models/interview.model.js"
import User from "../models/usermodel.js"

export const getAdminOverview = async (req, res) => {
  try {
    const [totalUsers, totalInterviews, completedInterviews, creditsAgg, recentUsers, recentInterviews] = await Promise.all([
      User.countDocuments(),
      Interview.countDocuments(),
      Interview.countDocuments({ status: "completed" }),
      User.aggregate([{ $group: { _id: null, totalCredits: { $sum: "$credits" } } }]),
      User.find().sort({ createdAt: -1 }).limit(8).select("-password -resetPasswordToken -__v"),
      Interview.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("user", "name email")
        .select("role type level status overallScore provider createdAt user"),
    ])

    return res.status(200).json({
      stats: {
        totalUsers,
        totalInterviews,
        completedInterviews,
        activeInterviews: totalInterviews - completedInterviews,
        totalCredits: creditsAgg[0]?.totalCredits || 0,
      },
      recentUsers,
      recentInterviews,
    })
  } catch (error) {
    return res.status(500).json({ message: `Admin overview error ${error.message}` })
  }
}

export const getAdminUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim()
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {}

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100).select("-password -resetPasswordToken -__v")
    return res.status(200).json({ users })
  } catch (error) {
    return res.status(500).json({ message: `Admin users error ${error.message}` })
  }
}

export const updateAdminUser = async (req, res) => {
  try {
    const { credits, isAdmin } = req.body
    const updates = {}

    if (credits !== undefined) {
      const parsedCredits = Number(credits)
      if (!Number.isFinite(parsedCredits) || parsedCredits < 0) {
        return res.status(400).json({ message: "Credits must be a non-negative number" })
      }
      updates.credits = Math.round(parsedCredits)
    }

    if (isAdmin !== undefined) {
      updates.isAdmin = Boolean(isAdmin)
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password -resetPasswordToken -__v")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    return res.status(200).json({ user })
  } catch (error) {
    return res.status(500).json({ message: `Admin update user error ${error.message}` })
  }
}

export const getAdminInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user", "name email")
      .select("role type level status overallScore provider model createdAt user")

    return res.status(200).json({ interviews })
  } catch (error) {
    return res.status(500).json({ message: `Admin interviews error ${error.message}` })
  }
}
