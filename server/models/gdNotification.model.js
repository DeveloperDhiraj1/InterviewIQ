import mongoose from "mongoose";

const gdNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: [
      "RoomInvite",
      "DiscussionStarted",
      "DiscussionEnded",
      "LeaderboardUpdate",
      "CertificateEarned",
      "FriendJoined"
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId, // Could be Room ID, Certificate ID, etc.
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model("GdNotification", gdNotificationSchema);
