const skillMap = {
  frontend: ["React", "state management", "component design", "performance", "accessibility"],
  backend: ["Node.js", "API design", "database modeling", "authentication", "scalability"],
  fullstack: ["React", "Node.js", "MongoDB", "deployment", "system design"],
  data: ["SQL", "analytics", "experimentation", "dashboards", "data quality"],
  default: ["problem solving", "communication", "ownership", "debugging", "product thinking"],
}

export function extractResumeSignals(text = "") {
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
  }
}

export function generateInterviewQuestions({ role = "Software Developer", type = "technical", level = "mid", resumeSummary = "" }) {
  const roleKey = role.toLowerCase().includes("front")
    ? "frontend"
    : role.toLowerCase().includes("back")
      ? "backend"
      : role.toLowerCase().includes("data")
        ? "data"
        : role.toLowerCase().includes("full")
          ? "fullstack"
          : "default"

  const skills = skillMap[roleKey] || skillMap.default
  const context = resumeSummary ? ` Your resume context: ${resumeSummary}` : ""

  if (type === "hr") {
    return [
      `Why are you interested in the ${role} role?`,
      `Tell me about a time you handled pressure while working at a ${level} level.`,
      "What kind of team environment helps you perform your best?",
      "Describe a failure and what you changed afterward.",
      `Why should the company choose you for this ${role} opening?${context}`,
    ]
  }

  if (type === "behavioral") {
    return [
      "Tell me about a project where you had unclear requirements.",
      "Describe a time you disagreed with a teammate and still shipped the work.",
      "Give an example of feedback that changed how you work.",
      `Tell me about a time you showed ownership as a ${role}.`,
      `Describe a difficult deadline and the result.${context}`,
    ]
  }

  return [
    `Walk me through a ${role} project where you used ${skills[0]}.`,
    `How would you design a production-ready feature involving ${skills[1]}?`,
    `Explain a debugging process for a complex ${skills[2]} issue.`,
    `What tradeoffs would you consider for ${skills[3]} in a SaaS product?`,
    `How would you test and deploy a ${level}-level ${role} feature?${context}`,
  ]
}

export function evaluateAnswer(answer = "") {
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
  }
}
