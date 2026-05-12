import mongoose from "mongoose"

const answerSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, default: "" },
    score: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    correctness: { type: Number, default: 0 },
    voiceConfidence: { type: Number, default: 0 },
    feedback: { type: String, default: "" },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    provider: { type: String, default: "" },
    model: { type: String, default: "" },
  },
  { _id: false }
)

const reportSchema = new mongoose.Schema(
  {
    summary: { type: String, default: "" },
    readiness: { type: String, enum: ["ready", "needs-practice", "early-stage", ""], default: "" },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    nextSteps: [{ type: String }],
    provider: { type: String, default: "" },
    model: { type: String, default: "" },
  },
  { _id: false }
)

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    type: { type: String, enum: ["technical", "behavioral", "hr"], default: "technical" },
    level: { type: String, default: "mid" },
    resumeSummary: { type: String, default: "" },
    experience: { type: String, default: "" },
    projects: [{ type: String }],
    skills: [{ type: String }],
    provider: { type: String, default: "" },
    model: { type: String, default: "" },
    questions: [answerSchema],
    report: { type: reportSchema, default: () => ({}) },
    overallScore: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true }
)

export default mongoose.model("Interview", interviewSchema)
