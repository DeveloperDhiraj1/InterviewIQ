import AdminSettings from "../models/adminSettings.model.js"
import { coachEnglishMessage } from "../utils/interviewAi.js"

export const coachEnglish = async (req, res) => {
  try {
    const { message = "", history = [], level = "beginner", goal = "conversation" } = req.body
    if (!String(message).trim()) {
      return res.status(400).json({ message: "Please send an English message to practice." })
    }

    const settings = await AdminSettings.findOne({ key: "platform" })
    const result = await coachEnglishMessage({
      message,
      history: Array.isArray(history) ? history : [],
      level,
      goal,
      aiProvider: settings?.aiProvider,
    })

    return res.status(200).json({ result })
  } catch (error) {
    return res.status(500).json({ message: `English coach error ${error.message}` })
  }
}
