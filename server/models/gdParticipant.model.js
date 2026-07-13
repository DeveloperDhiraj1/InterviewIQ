import mongoose from "mongoose";

const gdParticipantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GdRoom",
    required: true
  },
  role: {
    type: String,
    enum: ["Host", "Participant", "AI", "Audience"],
    default: "Participant"
  },
  aiPersona: {
    type: String, // E.g., 'HR', 'Software Engineer' for AI practice mode
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: Date,
  speakingTimeSec: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model("GdParticipant", gdParticipantSchema);
