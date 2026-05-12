import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/connectDb.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.rout.js';
import resumeRouter from './routes/resume.route.js';
import interviewRouter from './routes/interview.route.js';
import paymentRouter from './routes/payment.route.js';
import adminRouter from './routes/admin.route.js';
dotenv.config();
import cors from "cors";

const app = express();
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",
].filter(Boolean)

const isAllowedOrigin = (origin) => {
  if (!origin) return true
  if (allowedOrigins.includes(origin)) return true

  try {
    const url = new URL(origin)
    return ["localhost", "127.0.0.1"].includes(url.hostname)
  } catch {
    return false
  }
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true)
    }

    return callback(new Error("Not allowed by CORS"))
  },
  credentials: true,
}

app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authRouter)
app.use("/api/resume", resumeRouter)
app.use("/api/interviews", interviewRouter)
app.use("/api/payments", paymentRouter)
app.use("/api/admin", adminRouter)

const PORT = process.env.PORT || 6000;

const startServer = async () => {
  const connected = await connectDb();
  if (!connected) {
    console.error('MongoDB connection failed. The server will shut down until the database is available.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
