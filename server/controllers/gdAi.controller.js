import GdRoom from "../models/gdRoom.model.js";
import GdEvaluation from "../models/gdEvaluation.model.js";
import GdTranscript from "../models/gdTranscript.model.js";
import { getGeminiModel, generateAIPersonasPrompt, generateGDEvaluationPrompt } from "../utils/geminiGdPrompts.js";

// Generate AI Participants for a room
export const generateAIParticipants = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await GdRoom.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });

    const model = getGeminiModel();
    const prompt = generateAIPersonasPrompt(room.topic, room.difficulty);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean markdown formatting if present
    if (text.startsWith("```json")) {
      text = text.replace(/```json\n/, "").replace(/```\n?$/, "");
    }

    const participants = JSON.parse(text);

    return res.status(200).json({ success: true, participants });
  } catch (error) {
    console.error("Error generating AI participants:", error);
    return res.status(500).json({ success: false, message: "Failed to generate AI personas", error: error.message });
  }
};

// Evaluate a specific user after the discussion
export const evaluateParticipant = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body; // the user to evaluate, defaults to req.userId
    const targetUserId = userId || req.userId;

    // Fetch the transcript for the room
    const transcripts = await GdTranscript.find({ room: roomId }).populate("participant", "user role aiPersona");
    
    if (transcripts.length === 0) {
      return res.status(400).json({ success: false, message: "No transcript found to evaluate" });
    }

    // Format transcript for Gemini
    const formattedTranscript = transcripts.map(t => {
      const speakerName = t.participant.aiPersona || (t.participant.user?.toString() === targetUserId.toString() ? "TARGET_CANDIDATE" : "OTHER_CANDIDATE");
      return `[${speakerName}]: ${t.text}`;
    }).join("\n");

    const model = getGeminiModel();
    const prompt = generateGDEvaluationPrompt(formattedTranscript, "TARGET_CANDIDATE");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    if (text.startsWith("```json")) {
      text = text.replace(/```json\n/, "").replace(/```\n?$/, "");
    }

    const evaluationData = JSON.parse(text);

    // Calculate overall score average
    const scores = Object.values(evaluationData.scores);
    const overall = scores.reduce((a, b) => a + b, 0) / scores.length;
    evaluationData.scores.overallScore = Math.round(overall * 10) / 10;

    // Save to database
    const evaluation = await GdEvaluation.create({
      user: targetUserId,
      room: roomId,
      scores: evaluationData.scores,
      feedback: evaluationData.feedback,
      improvementSuggestions: evaluationData.improvements
    });

    return res.status(200).json({ success: true, evaluation });
  } catch (error) {
    console.error("Error evaluating participant:", error);
    return res.status(500).json({ success: false, message: "Evaluation failed", error: error.message });
  }
};
