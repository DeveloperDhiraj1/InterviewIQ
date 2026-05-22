import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    amount: Number,

    credits: Number,
    plan: String,
    currency: { type: String, default: "INR" },

    razorpayOrderId: String,

    razorpayPaymentId: String,
    razorpaySignature: String,

    status: {
      type: String,
      default: "created",
    },

    couponCode: String,
    discountAmount: { type: Number, default: 0 },
    failureReason: String,
  },
  {
    timestamps: true,
  }
)

const Payment = mongoose.model("Payment", paymentSchema)

export default Payment
