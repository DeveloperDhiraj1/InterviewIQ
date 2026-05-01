import Interview from "../models/interview.model.js"
import User from "../models/usermodel.js"
import { evaluateAnswer, generateInterviewQuestions } from "../utils/interviewAi.js"

const INTERVIEW_COST = 10

export const createInterview = async (req, res) => {
  try {
    const { role, type, level, resumeSummary } = req.body
    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.credits < INTERVIEW_COST) {
      return res.status(402).json({ message: "Not enough credits. Please purchase more credits." })
    }

    const questionText = generateInterviewQuestions({ role, type, level, resumeSummary })
    const interview = await Interview.create({
      user: req.userId,
      role: role || "Software Developer",
      type: type || "technical",
      level: level || "mid",
      resumeSummary,
      questions: questionText.map((question) => ({ question })),
    })

    user.credits -= INTERVIEW_COST
    await user.save()

    return res.status(201).json({ interview, credits: user.credits })
  } catch (error) {
    return res.status(500).json({ message: `Create interview error ${error.message}` })
  }
}

export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer } = req.body
    const interview = await Interview.findOne({ _id: interviewId, user: req.userId })

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" })
    }

    const target = interview.questions[questionIndex]
    if (!target) {
      return res.status(400).json({ message: "Invalid question index" })
    }

    const evaluation = evaluateAnswer(answer)
    target.answer = answer
    target.score = evaluation.score
    target.feedback = evaluation.feedback
    target.strengths = evaluation.strengths
    target.improvements = evaluation.improvements

    const answered = interview.questions.filter((item) => item.answer)
    interview.overallScore = answered.length
      ? Math.round(answered.reduce((sum, item) => sum + item.score, 0) / answered.length)
      : 0
    interview.status = answered.length === interview.questions.length ? "completed" : "active"

    await interview.save()
    return res.status(200).json({ interview, evaluation })
  } catch (error) {
    return res.status(500).json({ message: `Submit answer error ${error.message}` })
  }
}

export const getHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.userId }).sort({ createdAt: -1 }).limit(25)
    return res.status(200).json({ interviews })
  } catch (error) {
    return res.status(500).json({ message: `History error ${error.message}` })
  }
}

export const getInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.userId })
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" })
    }

    return res.status(200).json({ interview })
  } catch (error) {
    return res.status(500).json({ message: `Report error ${error.message}` })
  }
}
