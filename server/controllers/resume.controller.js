import { PDFParse } from "pdf-parse"
import { extractResumeSignals } from "../utils/interviewAi.js"
import ResumeAnalytics from "../models/resumeAnalytics.model.js"
import AdminSettings from "../models/adminSettings.model.js"

export const analyzeResume = async (req, res) => {
  try {
    let resumeText = req.body.resumeText || ""

    if (req.file?.buffer) {
      let parser
      try {
        parser = new PDFParse({ data: req.file.buffer })
        const parsed = await parser.getText()
        resumeText = parsed.text || resumeText
      } catch {
        resumeText = resumeText || req.file.originalname
      } finally {
        await parser?.destroy()
      }
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ message: "Upload a PDF or paste resume text" })
    }

    const report = await extractResumeSignals(resumeText)
    await ResumeAnalytics.create({
      user: req.userId,
      fileName: req.file?.originalname || "Pasted resume",
      role: report.role,
      experience: report.experience,
      skills: report.skills || report.matchedSkills || [],
      projects: report.projects || [],
      summary: report.summary,
      score: report.score || 0,
      provider: report.provider,
      model: report.model,
    })

    // include platform question count if configured by admin
    const settings = await AdminSettings.findOne({ key: "platform" })
    const questionCount = settings?.questionCount || 15

    return res.status(200).json({ report, resumeText, questionCount })
  } catch (error) {
    return res.status(500).json({ message: `Resume analysis error ${error.message}` })
  }
}
