import express from "express";
import { generateAIParticipants, evaluateParticipant } from "../controllers/gdAi.controller.js";
import isauth from "../middlewares/isauth.js";

const gdAiRouter = express.Router();

gdAiRouter.use(isauth);

gdAiRouter.post("/rooms/:roomId/generate-participants", generateAIParticipants);
gdAiRouter.post("/rooms/:roomId/evaluate", evaluateParticipant);

export default gdAiRouter;
