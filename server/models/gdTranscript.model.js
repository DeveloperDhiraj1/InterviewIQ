import mongoose from "mongoose";

const gdTranscriptSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GdRoom",
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GdParticipant",
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isFinal: {
    type: Boolean,
    default: true // Whether the STT has finalized this chunk
  },
  confidenceScore: {
    type: Number,
    default: 1.0
  }
}, { timestamps: true });

// Index for fast room-based retrieval sorted by time
gdTranscriptSchema.index({ room: 1, timestamp: 1 });

export default mongoose.model("GdTranscript", gdTranscriptSchema);
