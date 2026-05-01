import { PDFParse } from "pdf-parse"
import { extractResumeSignals } from "../utils/interviewAi.js"

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

    const report = extractResumeSignals(resumeText)
    return res.status(200).json({ report, resumeText })
  } catch (error) {
    return res.status(500).json({ message: `Resume analysis error ${error.message}` })
  }
}
