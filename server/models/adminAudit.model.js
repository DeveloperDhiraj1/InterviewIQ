import mongoose from "mongoose"

const adminAuditSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entityType: { type: String, default: "" },
    entityId: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: true }
)

export default mongoose.model("AdminAudit", adminAuditSchema)
