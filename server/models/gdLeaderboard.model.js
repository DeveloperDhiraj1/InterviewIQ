import mongoose from "mongoose";

const gdLeaderboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  xp: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String
  }],
  rank: {
    type: String, // E.g., 'Bronze', 'Silver', 'Gold', 'Platinum'
    default: "Unranked"
  },
  completedGd: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model("GdLeaderboard", gdLeaderboardSchema);
