import express from "express"
import { createPaymentOrder, verifyPayment } from "../controllers/payment.controller.js"
import isauth from "../middlewares/isauth.js"

const paymentRouter = express.Router()

paymentRouter.post("/order", isauth, createPaymentOrder)
paymentRouter.post("/verify", isauth, verifyPayment)

export default paymentRouter
