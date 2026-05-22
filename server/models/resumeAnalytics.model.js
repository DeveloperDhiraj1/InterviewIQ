import mongoose from "mongoose"

const resumeAnalyticsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, default: "" },
    role: { type: String, default: "" },
    experience: { type: String, default: "" },
    skills: [{ type: String }],
    projects: [{ type: String }],
    summary: { type: String, default: "" },
    score: { type: Number, default: 0 },
    provider: { type: String, default: "" },
    model: { type: String, default: "" },
  },
  { timestamps: true }
)

export default mongoose.model("ResumeAnalytics", resumeAnalyticsSchema)
