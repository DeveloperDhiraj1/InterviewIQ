import express from "express"
import {
  getAdminInterviews,
  getAdminOverview,
  getAdminUsers,
  updateAdminUser,
} from "../controllers/admin.controller.js"
import isadmin from "../middlewares/isadmin.js"
import isauth from "../middlewares/isauth.js"

const adminRouter = express.Router()

adminRouter.use(isauth, isadmin)
adminRouter.get("/overview", getAdminOverview)
adminRouter.get("/users", getAdminUsers)
adminRouter.patch("/users/:id", updateAdminUser)
adminRouter.get("/interviews", getAdminInterviews)

export default adminRouter
