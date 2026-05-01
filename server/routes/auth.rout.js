import express from "express"
import { demoAuth, googleAuth, logout } from "../controllers/Auth.controller.js"
import { getCurrentUser } from "../controllers/user.controller.js"
import isauth from "../middlewares/isauth.js"

const authRouter = express.Router()

authRouter.post("/google", googleAuth)
authRouter.post("/demo", demoAuth)
authRouter.get("/me", isauth, getCurrentUser)
authRouter.get("/logout", logout)

export default authRouter
