import express from "express"
import {
  createAdminAnnouncement,
  createAdminCoupon,
  getAdminAnalytics,
  getAdminAnnouncements,
  getAdminCoupons,
  getAdminInterviews,
  getAdminOverview,
  getAdminPayments,
  getAdminReports,
  getAdminResumes,
  getAdminSecurity,
  getAdminSettings,
  getAdminUserProfile,
  getAdminUsers,
  updateAdminCoupon,
  updateAdminSettings,
  updateAdminUser,
} from "../controllers/admin.controller.js"
import isadmin from "../middlewares/isadmin.js"
import isauth from "../middlewares/isauth.js"

const adminRouter = express.Router()

adminRouter.use(isauth, isadmin)
adminRouter.get("/overview", getAdminOverview)
adminRouter.get("/users", getAdminUsers)
adminRouter.get("/users/:id", getAdminUserProfile)
adminRouter.patch("/users/:id", updateAdminUser)
adminRouter.get("/payments", getAdminPayments)
adminRouter.get("/coupons", getAdminCoupons)
adminRouter.post("/coupons", createAdminCoupon)
adminRouter.patch("/coupons/:id", updateAdminCoupon)
adminRouter.get("/interviews", getAdminInterviews)
adminRouter.get("/analytics", getAdminAnalytics)
adminRouter.get("/reports", getAdminReports)
adminRouter.get("/resumes", getAdminResumes)
adminRouter.get("/settings", getAdminSettings)
adminRouter.patch("/settings", updateAdminSettings)
adminRouter.get("/announcements", getAdminAnnouncements)
adminRouter.post("/announcements", createAdminAnnouncement)
adminRouter.get("/security", getAdminSecurity)

export default adminRouter
