const OPENAI_API_URL = "https://api.openai.com/v1/responses"
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini"
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash"
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

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

  const score = Math.min(
    96,
    42 + matchedSkills.length * 4 + (hasMetrics ? 18 : 0) + (hasLinks ? 10 : 0) + (hasActionWords ? 14 : 0)
  )

  return {
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

function localInterviewQuestions({ role = "Software Developer", type = "technical", level = "mid", resumeSummary = "", count = 25 }) {
  const skills = skillMap[getRoleKey(role)] || skillMap.default
  const context = resumeSummary ? ` Your resume context: ${resumeSummary}` : ""

  const hrQuestions = [
    `Why are you interested in the ${role} role?`,
    `Tell me about a time you handled pressure while working at a ${level} level.`,
    "What kind of team environment helps you perform your best?",
    "Describe a failure and what you changed afterward.",
    `Why should the company choose you for this ${role} opening?${context}`,
    `How do you stay motivated when a project changes direction?`,
    `What makes a strong culture for a ${level} ${role}?`,
    "How do you prioritize work when everything feels urgent?",
    "Describe a time you helped a teammate succeed.",
    `How would you explain your one-year goals in this ${role} position?`,
  ]

  const behavioralQuestions = [
    "Tell me about a project where you had unclear requirements.",
    "Describe a time you disagreed with a teammate and still shipped the work.",
    "Give an example of feedback that changed how you work.",
    `Tell me about a time you showed ownership as a ${role}.`,
    `Describe a difficult deadline and the result.${context}`,
    "How did you adapt when priorities shifted suddenly?",
    "What was the most important lesson from your last major project?",
    "Share an example of when you mentored or supported someone else.",
    "How did you handle a mistake you made on a high-stakes task?",
    "Describe a time you turned a setback into a stronger outcome.",
  ]

  const technicalQuestions = [
    `Walk me through a ${role} project where you used ${skills[0]}.`,
    `How would you design a production-ready feature involving ${skills[1]}?`,
    `Explain a debugging process for a complex ${skills[2]} issue.`,
    `What tradeoffs would you consider for ${skills[3]} in a SaaS product?`,
    `How would you test and deploy a ${level}-level ${role} feature?${context}`,
    `How do you approach performance when you work with ${skills[0]}?`,
    `What is your strategy for reducing technical debt on ${skills[1]} work?`,
    `Explain how you would scale a system that depends on ${skills[2]}.`,
    `What security risks do you watch for in ${skills[3]} architectures?`,
    `How do you validate a production change before release?`,
  ]

  const templates = type === "hr" ? hrQuestions : type === "behavioral" ? behavioralQuestions : technicalQuestions

  const dynamicQuestions = []
  const extraTemplates = type === "hr"
    ? [
        `What do you think is the most important quality for a ${level} ${role}?`,
        "How do you build trust with new colleagues?",
        "Describe the best feedback you've ever received.",
        `How would you handle conflict between your manager and a teammate?`,
        "What motivates you to keep growing in your career?",
      ]
    : type === "behavioral"
      ? [
          "Tell me about a time you managed competing priorities successfully.",
          `Describe how you kept focus during a long ${role} project.`,
          "What did you learn from a difficult collaboration?",
          "How do you stay calm while solving an urgent problem?",
          "When have you changed your approach after new information?",
        ]
      : [
          `How would you compare ${skills[0]} and ${skills[1]} when choosing a solution?`,
          `Describe a time you improved reliability in a ${skills[2]} system.`,
          `What metrics matter most for ${skills[3]} performance?`,
          `How would you automate testing for ${skills[0]} code?`,
          `What is your rollback plan if a ${skills[1]} release fails?`,
        ]

  while (templates.length + dynamicQuestions.length < count) {
    const index = dynamicQuestions.length % extraTemplates.length
    const skill = skills[dynamicQuestions.length % skills.length]
    const variant = extraTemplates[index]
      .replace(/\$\{skills\[0\]\}/g, skills[0])
      .replace(/\$\{skills\[1\]\}/g, skills[1])
      .replace(/\$\{skills\[2\]\}/g, skills[2])
      .replace(/\$\{skills\[3\]\}/g, skills[3])
      .replace(/\$\{skill\}/g, skill)
    dynamicQuestions.push(variant)
  }

  return [...templates, ...dynamicQuestions].slice(0, count)
}

function localAnswerEvaluation(answer = "") {
  const words = answer.trim().split(/\s+/).filter(Boolean)
  const structure = /(situation|task|action|result|first|then|finally|because|impact|learned)/i.test(answer)
  const metrics = /\d|percent|users|latency|revenue|deadline|team|customer/i.test(answer)
  const score = Math.min(98, Math.max(35, Math.round(words.length * 2 + (structure ? 22 : 8) + (metrics ? 20 : 8))))

  return {
    score,
    feedback:
      score >= 85
        ? "Strong answer. It is specific, structured, and outcome-focused."
        : score >= 70
          ? "Good answer. Add one sharper metric and make the ending more memorable."
          : "Use STAR format, add one concrete example, and finish with measurable impact.",
    strengths: [structure ? "Structured response" : "Clear starting point", metrics ? "Specific impact" : "Relevant example"],
    improvements: score >= 85 ? ["Tighten the opening sentence"] : ["Add measurable result", "Clarify your personal ownership"],
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
    readiness: interview.overallScore >= 80 ? "ready" : interview.overallScore >= 60 ? "needs-practice" : "early-stage",
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
      schemaName: "resume_analysis",
      instructions:
        "You are an interview coach and resume reviewer. Analyze resumes for interview readiness. Be specific, concise, and practical.",
      input: `Analyze this resume text and return interview-ready insights.\n\nResume:\n${clampText(text)}`,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["score", "matchedSkills", "summary", "suggestions"],
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          matchedSkills: { type: "array", items: { type: "string" } },
          summary: { type: "string" },
          suggestions: { type: "array", items: { type: "string" } },
        },
      },
    })

    if (!result) return fallback
    return { ...fallback, ...result.json, provider: result.provider, model: result.model }
  } catch (error) {
    return { ...fallback, aiError: error.message }
  }
}

export async function generateInterviewQuestions({ role = "Software Developer", type = "technical", level = "mid", resumeSummary = "" }) {
  const fallbackQuestions = localInterviewQuestions({ role, type, level, resumeSummary, count: 25 })

  try {
    const result = await callAiJson({
      schemaName: "interview_questions",
      instructions:
        "You generate realistic interview questions. Use the resume context when present. Questions should be challenging, role-specific, and answerable in 2-4 minutes.",
      input: JSON.stringify({ role, type, level, resumeSummary: clampText(resumeSummary, 2500), questionCount: 25 }),
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["questions"],
        properties: {
          questions: {
            type: "array",
            minItems: 25,
            maxItems: 25,
            items: { type: "string" },
          },
        },
      },
    })

    if (!result) return { questions: fallbackQuestions, ...localProvider }
    return { questions: result.json.questions, provider: result.provider, model: result.model }
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
        "You are a strict but helpful interview evaluator. Score the answer against the question, explain the score, and give practical coaching.",
      input: JSON.stringify({
        role,
        type,
        level,
        question,
        answer: clampText(answer, 8000),
        resumeSummary: clampText(resumeSummary, 2500),
      }),
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["score", "feedback", "strengths", "improvements"],
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          feedback: { type: "string" },
          strengths: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
          improvements: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
        },
      },
    })

    if (!result) return fallback
    return { ...fallback, ...result.json, provider: result.provider, model: result.model }
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
