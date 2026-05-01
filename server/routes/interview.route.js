import express from "express"
import {
  createInterview,
  getHistory,
  getInterviewReport,
  submitAnswer,
} from "../controllers/interview.controller.js"
import isauth from "../middlewares/isauth.js"

const interviewRouter = express.Router()

interviewRouter.post("/", isauth, createInterview)
interviewRouter.post("/answer", isauth, submitAnswer)
interviewRouter.get("/history", isauth, getHistory)
interviewRouter.get("/:id", isauth, getInterviewReport)

export default interviewRouter
