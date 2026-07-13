import AdminAudit from "../models/adminAudit.model.js"
import AdminSettings from "../models/adminSettings.model.js"
import Announcement from "../models/announcement.model.js"
import Coupon from "../models/coupon.model.js"
import Interview from "../models/interview.model.js"
import Payment from "../models/payment.model.js"
import ResumeAnalytics from "../models/resumeAnalytics.model.js"
import User from "../models/usermodel.js"
import { sendAnnouncementEmails } from "../utils/email.js"

const rupees = (paiseOrRupees = 0) => Math.round(Number(paiseOrRupees) || 0)

const logAdminAction = async (req, action, entityType = "", entityId = "", details = {}) => {
  await AdminAudit.create({
    admin: req.userId,
    action,
    entityType,
    entityId,
    details,
    ip: req.ip,
  })
}

const getSettingsDoc = () =>
  AdminSettings.findOneAndUpdate({ key: "platform" }, { $setOnInsert: { key: "platform" } }, { upsert: true, new: true })

const readinessFromScore = (score = 0) => {
  if (score >= 9) return "Excellent"
  if (score >= 7) return "Interview Ready"
  if (score >= 5) return "Needs Improvement"
  return "Early Stage"
}

export const getAdminOverview = async (req, res) => {
  try {
    const start = new Date()
    start.setDate(start.getDate() - 13)
    start.setHours(0, 0, 0, 0)

    const [totalUsers, activeUsers, totalInterviews, completedInterviews, creditsAgg, revenueAgg, dailyUsers, dailyInterviews, dailyRevenue, recentUsers, recentInterviews] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ $or: [{ lastLoginAt: { $gte: start } }, { updatedAt: { $gte: start } }] }),
        Interview.countDocuments(),
        Interview.countDocuments({ status: "completed" }),
        Payment.aggregate([{ $match: { status: "success" } }, { $group: { _id: null, credits: { $sum: "$credits" } } }]),
        Payment.aggregate([{ $match: { status: "success" } }, { $group: { _id: null, revenue: { $sum: "$amount" } } }]),
        User.aggregate([
          { $match: { createdAt: { $gte: start } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, users: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Interview.aggregate([
          { $match: { createdAt: { $gte: start } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, interviews: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Payment.aggregate([
          { $match: { status: "success", createdAt: { $gte: start } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$amount" } } },
          { $sort: { _id: 1 } },
        ]),
        User.find().sort({ createdAt: -1 }).limit(8).select("-password -resetPasswordToken -__v"),
        Interview.find().sort({ createdAt: -1 }).limit(8).populate("user", "name email").select("role type level status overallScore provider createdAt user"),
      ])

    const dayMap = new Map()
    for (let index = 0; index < 14; index += 1) {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      const key = date.toISOString().slice(0, 10)
      dayMap.set(key, { date: key, users: 0, interviews: 0, revenue: 0 })
    }
    dailyUsers.forEach((item) => {
      const bucket = dayMap.get(item._id)
      if (bucket) bucket.users = item.users
    })
    dailyInterviews.forEach((item) => {
      const bucket = dayMap.get(item._id)
      if (bucket) bucket.interviews = item.interviews
    })
    dailyRevenue.forEach((item) => {
      const bucket = dayMap.get(item._id)
      if (bucket) bucket.revenue = rupees(item.revenue)
    })

    return res.status(200).json({
      stats: {
        totalUsers,
        activeUsers,
        totalInterviews,
        completedInterviews,
        activeInterviews: totalInterviews - completedInterviews,
        totalRevenue: rupees(revenueAgg[0]?.revenue),
        creditsSold: creditsAgg[0]?.credits || 0,
      },
      charts: { daily: [...dayMap.values()] },
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
      ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
      : {}
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200).select("-password -resetPasswordToken -__v")
    return res.status(200).json({ users })
  } catch (error) {
    return res.status(500).json({ message: `Admin users error ${error.message}` })
  }
}

export const getAdminUserProfile = async (req, res) => {
  try {
    const [user, interviews, payments, resumes] = await Promise.all([
      User.findById(req.params.id).select("-password -resetPasswordToken -__v"),
      Interview.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(25),
      Payment.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(25),
      ResumeAnalytics.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(10),
    ])
    if (!user) return res.status(404).json({ message: "User not found" })
    return res.status(200).json({ user, interviews, payments, resumes })
  } catch (error) {
    return res.status(500).json({ message: `Admin user profile error ${error.message}` })
  }
}

export const updateAdminUser = async (req, res) => {
  try {
    const { credits, creditDelta, isAdmin, isBanned } = req.body
    const updates = {}
    const inc = {}

    if (credits !== undefined) {
      const parsedCredits = Number(credits)
      if (!Number.isFinite(parsedCredits) || parsedCredits < 0) return res.status(400).json({ message: "Credits must be a non-negative number" })
      updates.credits = Math.round(parsedCredits)
    }
    if (creditDelta !== undefined) {
      const parsedDelta = Number(creditDelta)
      if (!Number.isFinite(parsedDelta)) return res.status(400).json({ message: "Credit delta must be numeric" })
      inc.credits = Math.round(parsedDelta)
    }
    if (isAdmin !== undefined) updates.isAdmin = Boolean(isAdmin)
    if (isBanned !== undefined) updates.isBanned = Boolean(isBanned)

    const update = {}
    if (Object.keys(updates).length) update.$set = updates
    if (Object.keys(inc).length) update.$inc = inc

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password -resetPasswordToken -__v")
    if (!user) return res.status(404).json({ message: "User not found" })
    if (user.credits < 0) {
      user.credits = 0
      await user.save()
    }
    await logAdminAction(req, "user.update", "User", req.params.id, req.body)
    return res.status(200).json({ user })
  } catch (error) {
    return res.status(500).json({ message: `Admin update user error ${error.message}` })
  }
}

export const getAdminPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(200).populate("user", "name email")
    const revenueByStatus = await Payment.aggregate([{ $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } }])
    return res.status(200).json({ payments, revenueByStatus })
  } catch (error) {
    return res.status(500).json({ message: `Admin payments error ${error.message}` })
  }
}

export const getAdminCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).limit(200)
    return res.status(200).json({ coupons })
  } catch (error) {
    return res.status(500).json({ message: `Admin coupons error ${error.message}` })
  }
}

export const createAdminCoupon = async (req, res) => {
  try {
    const code = (req.body.code || `IQ${Math.random().toString(36).slice(2, 8)}`).toUpperCase()
    const discountType = req.body.discountType === "dynamic" ? "dynamic" : "fixed"
    let discountAmount = Number(req.body.discountAmount ?? 1)

    if (discountType === "dynamic") {
      discountAmount = Math.min(Math.max(discountAmount, 0), 100)
    } else {
      discountAmount = Math.max(discountAmount, 0)
    }

    const coupon = await Coupon.create({
      code,
      discountAmount,
      discountType,
      expiresAt: req.body.expiresAt || undefined,
      usageLimit: Number(req.body.usageLimit ?? 100),
      active: req.body.active ?? true,
    })
    await logAdminAction(req, "coupon.create", "Coupon", coupon._id.toString(), { code })
    return res.status(201).json({ coupon })
  } catch (error) {
    return res.status(500).json({ message: `Create coupon error ${error.message}` })
  }
}

export const updateAdminCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!coupon) return res.status(404).json({ message: "Coupon not found" })
    await logAdminAction(req, "coupon.update", "Coupon", req.params.id, req.body)
    return res.status(200).json({ coupon })
  } catch (error) {
    return res.status(500).json({ message: `Update coupon error ${error.message}` })
  }
}

export const getAdminInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find().sort({ createdAt: -1 }).limit(200).populate("user", "name email").select("-__v")
    return res.status(200).json({ interviews })
  } catch (error) {
    return res.status(500).json({ message: `Admin interviews error ${error.message}` })
  }
}

export const getAdminAnalytics = async (req, res) => {
  try {
    const [roles, scoreAgg, voiceAgg, topUsers, weakSkills] = await Promise.all([
      Interview.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
      Interview.aggregate([{ $group: { _id: null, averageScore: { $avg: "$overallScore" } } }]),
      Interview.aggregate([{ $unwind: "$questions" }, { $group: { _id: null, averageVoiceConfidence: { $avg: "$questions.voiceConfidence" } } }]),
      Interview.aggregate([
        { $group: { _id: "$user", averageScore: { $avg: "$overallScore" }, sessions: { $sum: 1 } } },
        { $sort: { averageScore: -1 } },
        { $limit: 8 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { averageScore: 1, sessions: 1, "user.name": 1, "user.email": 1 } },
      ]),
      Interview.aggregate([
        { $unwind: "$report.weaknesses" },
        { $group: { _id: "$report.weaknesses", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ])
    return res.status(200).json({
      roles,
      averageScore: Math.round(scoreAgg[0]?.averageScore || 0),
      averageVoiceConfidence: Math.round(voiceAgg[0]?.averageVoiceConfidence || 0),
      topUsers,
      weakSkills,
      readiness: readinessFromScore(Math.round(scoreAgg[0]?.averageScore || 0)),
    })
  } catch (error) {
    return res.status(500).json({ message: `Admin analytics error ${error.message}` })
  }
}

export const getAdminReports = async (req, res) => {
  try {
    const reports = await Interview.find({ "report.summary": { $exists: true, $ne: "" } }).sort({ updatedAt: -1 }).limit(100).populate("user", "name email")
    return res.status(200).json({ reports })
  } catch (error) {
    return res.status(500).json({ message: `Admin reports error ${error.message}` })
  }
}

export const getAdminResumes = async (req, res) => {
  try {
    const resumes = await ResumeAnalytics.find().sort({ createdAt: -1 }).limit(200).populate("user", "name email")
    return res.status(200).json({ resumes })
  } catch (error) {
    return res.status(500).json({ message: `Admin resumes error ${error.message}` })
  }
}

export const getAdminSettings = async (req, res) => {
  try {
    const settings = await getSettingsDoc()
    const aiFailures = await AdminAudit.find({ action: /ai/i }).sort({ createdAt: -1 }).limit(25)
    return res.status(200).json({ settings, aiFailures })
  } catch (error) {
    return res.status(500).json({ message: `Admin settings error ${error.message}` })
  }
}

export const updateAdminSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate({ key: "platform" }, req.body, { upsert: true, new: true })
    await logAdminAction(req, "settings.update", "AdminSettings", settings._id.toString(), req.body)
    return res.status(200).json({ settings })
  } catch (error) {
    return res.status(500).json({ message: `Admin settings update error ${error.message}` })
  }
}

export const getAdminAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(100).populate("sentBy", "name email")
    return res.status(200).json({ announcements })
  } catch (error) {
    return res.status(500).json({ message: `Admin announcements error ${error.message}` })
  }
}

export const createAdminAnnouncement = async (req, res) => {
  try {
    console.log(`[Announcement] Announcement request received:`, req.body.title);

    const announcement = await Announcement.create({ title: req.body.title, message: req.body.message, sentBy: req.userId, active: req.body.active ?? true })
    await logAdminAction(req, "announcement.create", "Announcement", announcement._id.toString(), req.body)

    console.log(`[Announcement] Announcement saved successfully with ID: ${announcement._id}`);

    let emailResult = { successCount: 0, failedCount: 0 };
    try {
      const adminUser = await User.findById(req.userId).select('name email').lean()
      emailResult = await sendAnnouncementEmails({
        title: announcement.title,
        message: announcement.message,
        senderName: adminUser?.name || 'InterviewIQ Team',
      })
    } catch (emailError) {
      console.error('[Announcement] Failed to process announcement emails:', emailError)
    }

    return res.status(201).json({ 
      announcement, 
      emailsSent: emailResult.successCount, 
      emailsFailed: emailResult.failedCount 
    })
  } catch (error) {
    return res.status(500).json({ message: `Create announcement error ${error.message}` })
  }
}

export const getAdminSecurity = async (req, res) => {
  try {
    const [logs, bannedUsers, settings] = await Promise.all([
      AdminAudit.find().sort({ createdAt: -1 }).limit(100).populate("admin", "name email"),
      User.find({ isBanned: true }).select("name email credits createdAt"),
      getSettingsDoc(),
    ])
    return res.status(200).json({ logs, bannedUsers, blockedIps: settings.blockedIps || [] })
  } catch (error) {
    return res.status(500).json({ message: `Admin security error ${error.message}` })
  }
}
