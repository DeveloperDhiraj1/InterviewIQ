import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY); // Assuming they use GEMINI_API_KEY

export const getGeminiModel = (modelName = "gemini-2.5-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};

// Prompt for generating AI Participants for Practice Mode
export const generateAIPersonasPrompt = (topic, difficulty) => {
  return `
You are tasked with generating 4 distinct AI participant personas for a Group Discussion on the topic: "${topic}".
The difficulty level of the discussion is: ${difficulty}.

Generate 4 participants in a valid JSON array format, where each object has:
- "name": A realistic name (e.g., "Candidate 1 - HR", "Candidate 2 - Tech Lead").
- "persona": A brief description of their background.
- "communicationStyle": E.g., "Aggressive", "Polite", "Analytical", "Questioning".
- "stance": Their stance on the topic (Pro, Anti, Neutral).

Return ONLY valid JSON.
  `;
};

// Prompt for Post-Discussion Evaluation
export const generateGDEvaluationPrompt = (transcript, targetUserId) => {
  return `
You are an expert HR and communication evaluator. 
Review the following transcript of a Group Discussion and provide a detailed evaluation for the participant with ID: ${targetUserId}.

Transcript:
${transcript}

Evaluate them based on Communication, Grammar, Vocabulary, Confidence, Fluency, Leadership, Listening Skills, Critical Thinking, Relevance, and Professionalism.
Score each metric out of 10.

Provide the response strictly as a JSON object:
{
  "scores": {
    "communication": 8,
    "grammar": 7,
    "vocabulary": 8,
    "confidence": 9,
    "fluency": 7,
    "leadership": 6,
    "listening": 8,
    "criticalThinking": 7,
    "relevance": 9,
    "professionalism": 8
  },
  "feedback": "Detailed paragraph of their performance...",
  "improvements": ["suggestion 1", "suggestion 2"]
}
  `;
};
