import express from "express"
import { coachEnglish } from "../controllers/english.controller.js"
import isauth from "../middlewares/isauth.js"

const englishRouter = express.Router()
englishRouter.post("/coach", isauth, coachEnglish)

export default englishRouter
