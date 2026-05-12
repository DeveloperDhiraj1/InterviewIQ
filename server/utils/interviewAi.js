const OPENAI_API_URL = "https://api.openai.com/v1/responses"
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini"
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

const AI_PROVIDER = (process.env.AI_PROVIDER || "openai").toLowerCase()
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const skillMap = {
  frontend: ["React", "state management", "component design", "performance", "accessibility"],
  backend: ["Node.js", "API design", "database modeling", "authentication", "scalability"],
  fullstack: ["React", "Node.js", "MongoDB", "deployment", "system design"],
  data: ["SQL", "analytics", "experimentation", "dashboards", "data quality"],
  default: ["problem solving", "communication", "ownership", "debugging", "product thinking"],
}

const clampText = (text = "", max = 12000) => text.toString().slice(0, max)

const localProvider = { provider: "local", model: "rules-fallback" }

const getJsonOutput = (response) => {
  if (response.output_text) return response.output_text

  const output = response.output || response.outputs
  if (output) {
    const lines = (output || [])
      .flatMap((item) => item.content || [])
      .filter((content) => content.type === "output_text" && content.text)
      .map((content) => content.text)
    if (lines.length) return lines.join("\n")
  }

  if (response.candidates?.length) {
    const candidate = response.candidates[0]
    if (candidate.output_text) return candidate.output_text
    if (candidate.content?.parts?.length) {
      return candidate.content.parts.map((part) => part.text || "").join("\n")
    }
    if (candidate.content) {
      return candidate.content
        .filter((item) => item.type === "output_text" && item.text)
        .map((item) => item.text)
        .join("\n")
    }
  }

  return ""
}

const parseJsonText = (text = "") => {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI response was not valid JSON")
    }

    return JSON.parse(cleaned.slice(start, end + 1))
  }
}

const callOpenAiJson = async ({ instructions, input, schemaName, schema }) => {
  if (!OPENAI_API_KEY) {
    return null
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      instructions,
      input,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${details}`)
  }

  const payload = await response.json()
  const jsonText = getJsonOutput(payload)
  if (!jsonText) {
    throw new Error("OpenAI response did not include JSON text")
  }

  return parseJsonText(jsonText)
}

const callGeminiJson = async ({ instructions, input, schemaName, schema }) => {
  if (!GEMINI_API_KEY) {
    return null
  }

  const prompt = `${instructions}\n\n${input}\n\nRespond with valid JSON that matches this schema:\n${JSON.stringify(schema)}`
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
      },
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${details}`)
  }

  const payload = await response.json()
  const jsonText = getJsonOutput(payload)
  if (!jsonText) {
    throw new Error("Gemini response did not include JSON text")
  }

  return parseJsonText(jsonText)
}

const callAiJson = async (args) => {
  const providers = [AI_PROVIDER]
  if (AI_PROVIDER === "openai" && GEMINI_API_KEY) providers.push("gemini")
  if (AI_PROVIDER === "gemini" && OPENAI_API_KEY) providers.push("openai")

  for (const provider of providers) {
    try {
      if (provider === "openai") {
        const json = await callOpenAiJson(args)
        if (json) return { json, provider: "openai", model: DEFAULT_MODEL }
      }

      if (provider === "gemini") {
        const json = await callGeminiJson(args)
        if (json) return { json, provider: "gemini", model: GEMINI_MODEL }
      }
    } catch (error) {
      const lower = String(error.message).toLowerCase()
      const shouldTryFallback = lower.includes("insufficient_quota") || lower.includes("quota") || lower.includes("429") || lower.includes("model not found") || lower.includes("invalid") || lower.includes("not found")
      if (provider === "openai" && GEMINI_API_KEY && shouldTryFallback) {
        continue
      }
      if (provider === "gemini" && OPENAI_API_KEY && shouldTryFallback) {
        continue
      }
      throw error
    }
  }

  return null
}

function getRoleKey(role = "") {
  const normalized = role.toLowerCase()
  if (normalized.includes("front")) return "frontend"
  if (normalized.includes("back")) return "backend"
  if (normalized.includes("data")) return "data"
  if (normalized.includes("full")) return "fullstack"
  return "default"
}

function localResumeSignals(text = "") {
  const normalized = text.toLowerCase()
  const allSkills = [...new Set(Object.values(skillMap).flat())]
  const matchedSkills = allSkills.filter((skill) => normalized.includes(skill.toLowerCase()))
  const hasMetrics = /\d+%|\d+\s*(users|customers|projects|months|years|x|k|m|requests)/i.test(text)
  const hasLinks = /github|linkedin|portfolio|https?:\/\//i.test(text)
  const hasActionWords = /built|created|led|improved|optimized|launched|designed|implemented|reduced/i.test(text)
  const role = normalized.includes("frontend")
    ? "Frontend Developer"
    : normalized.includes("backend")
      ? "Backend Developer"
      : normalized.includes("full stack") || normalized.includes("fullstack")
        ? "Full Stack Developer"
        : "Software Developer"
  const projectMatches = text
    .split(/\n|\*|-/)
    .map((line) => line.trim())
    .filter((line) => /project|built|created|developed|implemented|designed/i.test(line))
    .slice(0, 4)

  const score = Math.min(
    96,
    42 + matchedSkills.length * 4 + (hasMetrics ? 18 : 0) + (hasLinks ? 10 : 0) + (hasActionWords ? 14 : 0)
  )

  return {
    role,
    experience: normalized.match(/\b\d+\+?\s*(years|yrs|year)\b/)?.[0] || "Not specified",
    projects: projectMatches.length ? projectMatches : ["Resume project details need clearer project names."],
    skills: matchedSkills.length ? matchedSkills : skillMap[getRoleKey(role)],
    score,
    matchedSkills,
    summary:
      matchedSkills.length > 0
        ? `Resume highlights ${matchedSkills.slice(0, 5).join(", ")} with ${hasMetrics ? "measurable impact" : "scope for stronger metrics"}.`
        : "Resume needs clearer role keywords, measurable project impact, and stronger action verbs.",
    suggestions: [
      hasMetrics ? "Keep impact metrics near the start of each major bullet." : "Add measurable outcomes such as users served, latency reduced, or time saved.",
      hasLinks ? "Profile links are easy to discover." : "Add GitHub, LinkedIn, or portfolio links near your contact section.",
      hasActionWords ? "Action verbs are present." : "Start bullets with verbs like built, optimized, launched, or led.",
      matchedSkills.length >= 5 ? "Skill coverage is strong." : "Add role-specific keywords from the job description.",
    ],
    ...localProvider,
  }
}

function fitQuestionLength(question) {
  const words = question.split(/\s+/).filter(Boolean)
  if (words.length >= 15 && words.length <= 25) return question
  if (words.length < 15) {
    return `${question.replace(/\?$/, "")} using a clear example from your recent practical work?`
  }
  return `${words.slice(0, 24).join(" ").replace(/[?.!,;:]$/, "")}?`
}

function localInterviewQuestions({
  role = "Software Developer",
  type = "technical",
  level = "mid",
  resumeSummary = "",
  projects = [],
  skills: resumeSkills = [],
  resumeText = "",
  count = 5,
}) {
  const roleSkills = skillMap[getRoleKey(role)] || skillMap.default
  const selectedSkills = resumeSkills.length ? resumeSkills : roleSkills
  const project = projects[0] || "your main resume project"
  const context = resumeSummary || resumeText ? "based on your resume details" : "based on your recent work"

  const hrQuestions = [
    `Can you briefly introduce yourself and explain why this ${role} opportunity feels like a good next step?`,
    `What motivates you most when working as a ${role}, especially during routine or repetitive project tasks?`,
    `Tell me about a time you handled pressure while staying calm, organized, and professional with your team.`,
    `How would you manage a disagreement with a teammate while still keeping the project work moving forward?`,
    `Why should we choose you for this ${role} position compared with other candidates with similar skills?`,
  ]

  const behavioralQuestions = [
    `Tell me about a project where the requirements were unclear and how you decided what to build first.`,
    `Describe a time you received feedback on your work and used it to improve your final outcome.`,
    `How did you organize your tasks when working on ${project} and facing multiple competing priorities?`,
    `Tell me about a mistake you made in a project and what you changed after learning from it.`,
    `Describe a difficult collaboration where you still delivered useful results and protected the quality of work.`,
  ]

  const technicalQuestions = [
    `Can you explain one ${role} project from your resume and the main problem it solved?`,
    `How did you use ${selectedSkills[0]} in your work, and what challenge did it help you handle?`,
    `Walk me through how you would debug a production issue in ${project} without guessing randomly.`,
    `What tradeoffs would you consider while improving performance, security, and maintainability in this project?`,
    `How would you redesign ${project} for more users while keeping the system reliable and easy to maintain?`,
  ]

  const templates = type === "hr" ? hrQuestions : type === "behavioral" ? behavioralQuestions : technicalQuestions
  return templates.slice(0, count).map((question) => fitQuestionLength(question.replace("based on your recent work", context)))
}

function localAnswerEvaluation(answer = "") {
  const words = answer.trim().split(/\s+/).filter(Boolean)
  const structure = /(situation|task|action|result|first|then|finally|because|impact|learned)/i.test(answer)
  const metrics = /\d|percent|users|latency|revenue|deadline|team|customer/i.test(answer)
  const confidence = Math.min(10, Math.max(1, Math.round(words.length / 18) + (structure ? 2 : 0)))
  const communication = Math.min(10, Math.max(1, Math.round(words.length / 22) + (answer.includes(".") ? 2 : 1)))
  const correctness = Math.min(10, Math.max(1, Math.round(words.length / 20) + (metrics ? 2 : 0) + (structure ? 1 : 0)))
  const finalScore = Math.round((confidence + communication + correctness) / 3)

  return {
    confidence,
    communication,
    correctness,
    finalScore,
    score: finalScore,
    feedback:
      finalScore >= 8
        ? "Strong answer with clear structure, confidence, and relevant practical detail."
        : finalScore >= 6
          ? "Good answer, but add sharper examples and more measurable impact."
          : "Answer needs clearer structure, stronger detail, and more confidence.",
    strengths: [structure ? "Structured response" : "Clear starting point", metrics ? "Specific impact" : "Relevant example"],
    improvements: finalScore >= 8 ? ["Tighten the opening sentence"] : ["Add measurable result", "Clarify your personal ownership"],
    ...localProvider,
  }
}

function localReport(interview) {
  const answered = interview.questions.filter((item) => item.answer)
  const strengths = [...new Set(answered.flatMap((item) => item.strengths || []))].slice(0, 4)
  const improvements = [...new Set(answered.flatMap((item) => item.improvements || []))].slice(0, 4)

  return {
    summary:
      answered.length === interview.questions.length
        ? `${interview.role} ${interview.type} round completed with an overall score of ${interview.overallScore}.`
        : `${answered.length} of ${interview.questions.length} questions answered so far for the ${interview.role} round.`,
    readiness: interview.overallScore >= 8 ? "ready" : interview.overallScore >= 6 ? "needs-practice" : "early-stage",
    strengths: strengths.length ? strengths : ["Relevant examples"],
    improvements: improvements.length ? improvements : ["Answer every question with a clear result"],
    nextSteps: [
      "Rewrite weak answers in STAR format.",
      "Add one metric to every project story.",
      "Practice the highest-difficulty questions again.",
    ],
    ...localProvider,
  }
}

export async function extractResumeSignals(text = "") {
  const fallback = localResumeSignals(text)

  try {
    const result = await callAiJson({
      schemaName: "resume_structured_data",
      instructions:
        `Extract structured data from resume.

Return strictly JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}`,
      input: clampText(text),
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["role", "experience", "projects", "skills"],
        properties: {
          role: { type: "string" },
          experience: { type: "string" },
          projects: { type: "array", items: { type: "string" } },
          skills: { type: "array", items: { type: "string" } },
        },
      },
    })

    if (!result) return fallback
    const structured = result.json
    return {
      ...fallback,
      ...structured,
      matchedSkills: structured.skills,
      summary: `${structured.role || "Candidate"} with ${structured.experience || "experience not specified"}. Skills: ${(structured.skills || []).slice(0, 6).join(", ") || "not listed"}.`,
      suggestions: [
        "Prepare examples from your strongest resume projects.",
        "Add measurable outcomes where project impact is unclear.",
        "Connect each skill to one practical implementation story.",
      ],
      provider: result.provider,
      model: result.model,
    }
  } catch (error) {
    return { ...fallback, aiError: error.message }
  }
}

function normalizeQuestionLines(text = "") {
  return String(text)
    .split("\n")
    .map((line) => line.replace(/^\s*(?:\d+[\).:-]|\-|\*)\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5)
}

export async function generateInterviewQuestions({
  role = "Software Developer",
  type = "technical",
  level = "mid",
  resumeSummary = "",
  experience = "",
  projects = [],
  skills = [],
  resumeText = "",
}) {
  const fallbackQuestions = localInterviewQuestions({ role, type, level, resumeSummary, projects, skills, resumeText, count: 5 })

  try {
    const result = await callAiJson({
      schemaName: "interview_questions",
      instructions:
        `You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:
Question 1 -> easy
Question 2 -> easy
Question 3 -> medium
Question 4 -> medium
Question 5 -> hard

Make questions based on the candidate's role, experience,interviewMode, projects, skills, and resume details.`,
      input: `Role:${role}
Experience:${experience || level}
InterviewMode:${type}
Projects:${projects.join(", ") || "Not specified"}
Skills:${skills.join(", ") || "Not specified"},
Resume:${clampText(resumeText || resumeSummary, 3500)}`,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["questions"],
        properties: {
          questions: {
            type: "array",
            minItems: 5,
            maxItems: 5,
            items: { type: "string" },
          },
        },
      },
    })

    if (!result) return { questions: fallbackQuestions, ...localProvider }
    const questions = result.json.questions?.length ? result.json.questions : normalizeQuestionLines(result.json)
    return { questions: questions.slice(0, 5), provider: result.provider, model: result.model }
  } catch (error) {
    return { questions: fallbackQuestions, ...localProvider, aiError: error.message }
  }
}

export async function evaluateAnswer({ question = "", answer = "", role = "", type = "", level = "", resumeSummary = "" }) {
  const fallback = localAnswerEvaluation(answer)

  try {
    const result = await callAiJson({
      schemaName: "answer_evaluation",
      instructions:
        `You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence - Does the answer sound clear, confident, and well-presented?
2. Communication - Is the language simple, clear, and easy to understand?
3. Correctness - Is the answer accurate, relevant, and complete?

Rules:
- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback.
- 10 to 15 words only.
- Sound like real interview feedback.
- Can suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}`,
      input: `Question: ${question}
Answer: ${clampText(answer, 8000)}

Role: ${role}
InterviewMode: ${type}
Level: ${level}
Resume: ${clampText(resumeSummary, 2500)}`,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["confidence", "communication", "correctness", "finalScore", "feedback"],
        properties: {
          confidence: { type: "integer", minimum: 0, maximum: 10 },
          communication: { type: "integer", minimum: 0, maximum: 10 },
          correctness: { type: "integer", minimum: 0, maximum: 10 },
          finalScore: { type: "integer", minimum: 0, maximum: 10 },
          feedback: { type: "string" },
        },
      },
    })

    if (!result) return fallback
    return {
      ...fallback,
      ...result.json,
      score: result.json.finalScore,
      strengths: [
        result.json.confidence >= 7 ? "Confident delivery" : "Attempted clear delivery",
        result.json.communication >= 7 ? "Clear communication" : "Basic communication",
      ],
      improvements: [
        result.json.correctness >= 7 ? "Add more depth where useful" : "Improve answer accuracy and completeness",
      ],
      provider: result.provider,
      model: result.model,
    }
  } catch (error) {
    return { ...fallback, aiError: error.message }
  }
}

export async function generateInterviewReport(interview) {
  const fallback = localReport(interview)

  try {
    const result = await callAiJson({
      schemaName: "interview_report",
      instructions:
        "You create concise interview performance reports for candidates. Focus on readiness, repeatable strengths, gaps, and next practice steps.",
      input: JSON.stringify({
        role: interview.role,
        type: interview.type,
        level: interview.level,
        resumeSummary: interview.resumeSummary,
        overallScore: interview.overallScore,
        questions: interview.questions.map((item) => ({
          question: item.question,
          answer: item.answer,
          score: item.score,
          confidence: item.confidence,
          communication: item.communication,
          correctness: item.correctness,
          voiceConfidence: item.voiceConfidence,
          feedback: item.feedback,
          strengths: item.strengths,
          improvements: item.improvements,
        })),
      }),
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["summary", "readiness", "strengths", "improvements", "nextSteps"],
        properties: {
          summary: { type: "string" },
          readiness: { type: "string", enum: ["ready", "needs-practice", "early-stage"] },
          strengths: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
          improvements: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
          nextSteps: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
        },
      },
    })

    if (!result) return fallback
    return { ...fallback, ...result.json, provider: result.provider, model: result.model }
  } catch (error) {
    return { ...fallback, aiError: error.message }
  }
}
