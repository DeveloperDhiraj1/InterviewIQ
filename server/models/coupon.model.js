import mongoose from "mongoose"

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    discountAmount: {
      type: Number,
      default: 1,
    },
    discountType: {
      type: String,
      enum: ["fixed", "dynamic"],
      default: "fixed",
    },
    expiresAt: Date,
    usageLimit: {
      type: Number,
      default: 100,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
        usedAt: { type: Date, default: Date.now },
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model("Coupon", couponSchema)
