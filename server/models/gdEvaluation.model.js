import mongoose from "mongoose";

const gdEvaluationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GdRoom",
    required: true
  },
  scores: {
    communication: { type: Number, min: 0, max: 10, default: 0 },
    grammar: { type: Number, min: 0, max: 10, default: 0 },
    vocabulary: { type: Number, min: 0, max: 10, default: 0 },
    confidence: { type: Number, min: 0, max: 10, default: 0 },
    fluency: { type: Number, min: 0, max: 10, default: 0 },
    leadership: { type: Number, min: 0, max: 10, default: 0 },
    listening: { type: Number, min: 0, max: 10, default: 0 },
    criticalThinking: { type: Number, min: 0, max: 10, default: 0 },
    relevance: { type: Number, min: 0, max: 10, default: 0 },
    professionalism: { type: Number, min: 0, max: 10, default: 0 },
    overallScore: { type: Number, min: 0, max: 10, default: 0 }
  },
  feedback: {
    type: String,
    required: true
  },
  improvementSuggestions: [{
    type: String
  }],
  aiSummary: {
    type: String // Optional summary of what the AI observed for this user
  }
}, { timestamps: true });

export default mongoose.model("GdEvaluation", gdEvaluationSchema);
