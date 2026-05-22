import mongoose from "mongoose"

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    active: { type: Boolean, default: true },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)

export default mongoose.model("Announcement", announcementSchema)
