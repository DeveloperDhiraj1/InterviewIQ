import mongoose from "mongoose"

const adminSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "platform" },
    aiProvider: { type: String, enum: ["openai", "gemini", "fallback"], default: "gemini" },
    questionCount: { type: Number, default: 15 },
    creditsPerInterview: { type: Number, default: 10 },
    blockedIps: [{ type: String }],
  },
  { timestamps: true }
)

export default mongoose.model("AdminSettings", adminSettingsSchema)
