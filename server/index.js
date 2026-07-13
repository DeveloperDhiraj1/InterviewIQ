import 'dotenv/config';
import express from 'express';
import connectDb from './config/connectDb.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.rout.js';
import resumeRouter from './routes/resume.route.js';
import interviewRouter from './routes/interview.route.js';
import paymentRouter from './routes/payment.routes.js';
import adminRouter from './routes/admin.route.js';
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import gdRoomRouter from "./routes/gdRoom.route.js";
import gdAiRouter from "./routes/gdAi.route.js";
import { initializeGdSockets } from "./sockets/gdSocketHandler.js";

const app = express();
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1)
}
const normalizeOrigin = (origin) => {
  if (!origin) return origin
  try {
    return new URL(origin).origin
  } catch {
    if (!origin.startsWith('http')) {
      return `https://${origin}`
    }
    return origin
  }
}

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "https://interviewiqai.me",
  "https://www.interviewiqai.me",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",
]
  .map(normalizeOrigin)
  .filter(Boolean)

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
app.use("/api/gd/rooms", gdRoomRouter)
app.use("/api/gd/ai", gdAiRouter)

const PORT = process.env.PORT || 6000;

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });
initializeGdSockets(io);

const startServer = async () => {
  const connected = await connectDb();
  if (!connected) {
    console.error('MongoDB connection failed. The server will shut down until the database is available.');
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
