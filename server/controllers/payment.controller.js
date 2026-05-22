import Razorpay from "razorpay"
import crypto from "crypto"
import User from "../models/usermodel.js"
import Coupon from "../models/coupon.model.js"
import Payment from "../models/payment.model.js"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const plans = {
  starter: {
    credits: 50,
    amount: 49,
  },
  pro: {
    credits: 150,
    amount: 99,
  },
  premium: {
    credits: 400,
    amount: 149,
  },
}

export const createOrder = async (req, res) => {
  try {
    const { plan, couponCode } = req.body

    const selectedPlan = plans[plan]

    if (!selectedPlan) {
      return res.status(400).json({
        message: "Invalid plan",
      })
    }

    let finalAmount = selectedPlan.amount
    let couponApplied = false

    let coupon = null
    if (couponCode) {
      const now = new Date()
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        active: true,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }],
      })

      if (coupon && coupon.usedCount < coupon.usageLimit) {
        if (coupon.discountType === "dynamic") {
          const discountPercent = Math.min(Math.max(Number(coupon.discountAmount) || 0, 0), 100)
          finalAmount = Math.round(selectedPlan.amount * (100 - discountPercent) / 100)
        } else {
          finalAmount -= coupon.discountAmount
        }
        couponApplied = true
      }
    }

    finalAmount = Math.max(finalAmount, 1)

    const order = await razorpay.orders.create({
      amount: finalAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    })

    await Payment.create({
      user: req.userId,
      amount: finalAmount,
      credits: selectedPlan.credits,
      plan,
      razorpayOrderId: order.id,
      status: "pending",
      couponCode: couponApplied ? couponCode?.toUpperCase() : "",
      discountAmount: couponApplied ? selectedPlan.amount - finalAmount : 0,
    })

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
      },
      key: process.env.RAZORPAY_KEY_ID,
      couponApplied,
      finalAmount,
      plan: {
        id: plan,
        credits: selectedPlan.credits,
        amount: selectedPlan.amount,
      },
    })
  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}

export const validateCoupon = async (req, res) => {
  try {
    const { plan, couponCode } = req.body

    const selectedPlan = plans[plan]
    if (!selectedPlan) {
      return res.status(400).json({ message: 'Invalid plan' })
    }

    if (!couponCode || !couponCode.trim()) {
      return res.status(400).json({ message: 'Enter a promo code to validate.' })
    }

    const now = new Date()
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      active: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }],
    })

    if (!coupon || coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Promo code is invalid or expired.' })
    }

    let finalAmount = selectedPlan.amount
    let discountAmount = 0

    if (coupon.discountType === 'dynamic') {
      const discountPercent = Math.min(Math.max(Number(coupon.discountAmount) || 0, 0), 100)
      finalAmount = Math.round(selectedPlan.amount * (100 - discountPercent) / 100)
      discountAmount = selectedPlan.amount - finalAmount
    } else {
      discountAmount = Number(coupon.discountAmount) || 0
      finalAmount = selectedPlan.amount - discountAmount
    }

    finalAmount = Math.max(finalAmount, 1)

    return res.status(200).json({
      valid: true,
      originalAmount: selectedPlan.amount,
      finalAmount,
      discountAmount,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountAmount: coupon.discountAmount,
      },
      message: coupon.discountType === 'dynamic'
        ? `${coupon.discountAmount}% off applied` 
        : `₹${discountAmount} off applied`,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      couponCode,
    } = req.body

    const body =
      razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex")

    const isAuthentic =
      expectedSignature === razorpay_signature

    if (!isAuthentic) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: "failed", failureReason: "Signature mismatch" }
      )
      return res.status(400).json({
        message: "Payment verification failed",
      })
    }

    const selectedPlan = plans[plan]
    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid plan" })
    }

    const user = await User.findById(req.userId)
    const existingPayment = await Payment.findOne({ razorpayOrderId: razorpay_order_id })

    user.credits += selectedPlan.credits

    await user.save()
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        user: req.userId,
        amount: existingPayment?.amount || selectedPlan.amount,
        credits: selectedPlan.credits,
        plan,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "success",
      },
      { new: true, upsert: true }
    )

    if (couponCode) {
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        { $inc: { usedCount: 1 }, $push: { usedBy: { user: req.userId, payment: payment._id } } }
      )
    }

    res.status(200).json({
      success: true,
      credits: user.credits,
      message: "Payment successful",
    })
  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}
