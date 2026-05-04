import express from "express"
import { demoAuth, googleAuth, logout, register, login, forgotPassword } from "../controllers/Auth.controller.js"
import { getCurrentUser } from "../controllers/user.controller.js"
import isauth from "../middlewares/isauth.js"

const authRouter = express.Router()

authRouter.post("/register", register)
authRouter.post("/login", login)
authRouter.post("/forgot-password", forgotPassword)
authRouter.post("/google", googleAuth)
authRouter.post("/demo", demoAuth)
authRouter.get("/me", isauth, getCurrentUser)
authRouter.get("/logout", logout)

export default authRouter
