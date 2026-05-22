import express from "express"
import {
  createOrder,
  validateCoupon,
  verifyPayment,
} from "../controllers/payment.controller.js"

import isauth from "../middlewares/isauth.js"

const router = express.Router()

router.post("/order", isauth, createOrder)
router.post("/validate", isauth, validateCoupon)
router.post("/verify", isauth, verifyPayment)

export default router
