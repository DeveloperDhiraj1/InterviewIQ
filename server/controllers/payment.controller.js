import crypto from "crypto"
import Razorpay from "razorpay"
import User from "../models/usermodel.js"

const creditPlans = {
  starter: { credits: 50, amount: 9900 },
  pro: { credits: 150, amount: 24900 },
  premium: { credits: 400, amount: 59900 },
}

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export const createPaymentOrder = async (req, res) => {
  try {
    const { plan = "starter" } = req.body
    const selectedPlan = creditPlans[plan]

    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid credit plan" })
    }

    const razorpay = getRazorpay()
    if (!razorpay) {
      return res.status(200).json({
        demo: true,
        key: "rzp_test_demo",
        order: {
          id: `demo_order_${Date.now()}`,
          amount: selectedPlan.amount,
          currency: "INR",
        },
        plan: selectedPlan,
      })
    }

    const order = await razorpay.orders.create({
      amount: selectedPlan.amount,
      currency: "INR",
      receipt: `credits_${req.userId}_${Date.now()}`,
    })

    return res.status(200).json({ key: process.env.RAZORPAY_KEY_ID, order, plan: selectedPlan })
  } catch (error) {
    return res.status(500).json({ message: `Payment order error ${error.message}` })
  }
}

export const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, plan = "starter", demo } = req.body
    const selectedPlan = creditPlans[plan]

    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid credit plan" })
    }

    if (!demo) {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex")

      if (generatedSignature !== signature) {
        return res.status(400).json({ message: "Payment verification failed" })
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { credits: selectedPlan.credits } },
      { new: true }
    )

    return res.status(200).json({ message: "Credits added successfully", credits: user.credits })
  } catch (error) {
    return res.status(500).json({ message: `Payment verification error ${error.message}` })
  }
}
