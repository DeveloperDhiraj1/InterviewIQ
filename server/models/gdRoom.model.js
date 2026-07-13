import mongoose from "mongoose";

const gdRoomSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: "General"
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
    max: 20
  },
  language: {
    type: String,
    enum: ["English", "Hindi", "Hinglish"],
    default: "English"
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium"
  },
  duration: {
    type: Number,
    enum: [10, 20, 30, 45],
    default: 20
  },
  roomType: {
    type: String,
    enum: ["Public", "Private", "Password Protected", "AI Practice"],
    default: "Public"
  },
  password: {
    type: String, // only if roomType is "Password Protected"
  },
  settings: {
    enableVideo: { type: Boolean, default: true },
    enableVoice: { type: Boolean, default: true },
    allowAudience: { type: Boolean, default: true },
    recording: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ["waiting", "active", "completed"],
    default: "waiting"
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "GdParticipant"
  }],
  startedAt: Date,
  endedAt: Date
}, { timestamps: true });

export default mongoose.model("GdRoom", gdRoomSchema);
