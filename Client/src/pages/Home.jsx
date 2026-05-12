import React, { useEffect, useMemo, useState } from 'react'
import { motion as Motion } from 'framer-motion'
import {
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiLogOut,
  FiMic,
  FiPlay,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiUser,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import aiAnswerAsset from '../assets/ai-ans.png'
import confidenceAsset from '../assets/confi.png'
import historyAsset from '../assets/history.png'
import resumeAsset from '../assets/resume.png'
import techAsset from '../assets/tech.png'
import api from '../utils/api'

const questionBank = {
  technical: [
    'Walk me through a project where you solved a difficult technical problem.',
    'How would you design a scalable API for a high-traffic interview platform?',
    'Explain a tradeoff you made between performance, readability, and delivery speed.',
    'How do you debug a production issue when logs are incomplete?',
    'Describe how you would structure tests for a feature with multiple user flows.',
  ],
  behavioral: [
    'Tell me about a time you handled conflict with a teammate.',
    'Describe a situation where you had to learn something quickly.',
    'Give an example of a time you received difficult feedback.',
    'Tell me about a time you had to influence without authority.',
    'Describe a failure and what you changed afterward.',
  ],
  hr: [
    'Why are you interested in this role?',
    'What are your salary and growth expectations?',
    'Where do you see yourself in the next two years?',
    'Why should we choose you over other candidates?',
    'What kind of team environment helps you do your best work?',
  ],
}

const skillKeywords = ['react', 'node', 'express', 'mongodb', 'javascript', 'typescript', 'python', 'sql', 'api', 'aws', 'docker', 'testing']
const starterHistory = [
  { role: 'Frontend Developer', type: 'Technical', score: 86, date: 'Today' },
  { role: 'Product Intern', type: 'Behavioral', score: 78, date: 'Yesterday' },
  { role: 'Software Engineer', type: 'HR', score: 91, date: 'Apr 28' },
]

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function scoreAnswer(answer) {
  const words = answer.trim().split(/\s+/).filter(Boolean)
  const structure = /(first|second|because|result|impact|learned|finally)/i.test(answer) ? 22 : 8
  const proof = /\d|percent|users|revenue|latency|deadline|team|customer/i.test(answer) ? 22 : 10
  return Math.round(clamp(words.length * 2.1 + structure + proof + 10, 30, 98))
}

function buildFeedback(answer, score) {
  if (!answer.trim()) return 'Start with a direct answer, add one specific example, then close with impact.'
  if (score >= 85) return 'Strong answer. It is specific, structured, and outcome-focused. Tighten the opening sentence for extra polish.'
  if (score >= 70) return 'Good foundation. Add one measurable result and make the final lesson more explicit.'
  return 'Use STAR format, add one concrete example, and finish with a measurable result.'
}

function analyzeResume(text) {
  const lowerText = text.toLowerCase()
  const matchedSkills = skillKeywords.filter((skill) => lowerText.includes(skill))
  const hasMetrics = /\d+%|\d+\s*(users|customers|projects|months|years|x|k|m)/i.test(text)
  const hasLinks = /github|linkedin|portfolio|https?:\/\//i.test(text)
  const hasActionWords = /built|led|created|improved|optimized|launched|designed|implemented/i.test(text)
  const score = clamp(48 + matchedSkills.length * 4 + (hasMetrics ? 16 : 0) + (hasLinks ? 10 : 0) + (hasActionWords ? 12 : 0), 42, 96)

  return {
    score,
    matchedSkills,
    suggestions: [
      hasMetrics ? 'Metrics are visible. Keep impact close to each bullet.' : 'Add measurable outcomes like time saved, users served, or accuracy improved.',
      hasLinks ? 'Profile links are discoverable.' : 'Add GitHub, LinkedIn, or portfolio links near contact details.',
      hasActionWords ? 'Your bullets use active language.' : 'Start bullets with built, led, optimized, launched, or designed.',
    ],
  }
}

function Home() {
  const [activeTab, setActiveTab] = useState('interview')
  const [role, setRole] = useState('Frontend Developer')
  const [interviewType, setInterviewType] = useState('technical')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [resumeReport, setResumeReport] = useState(null)
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('interviewiq-history')
    return saved ? JSON.parse(saved) : starterHistory
  })
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('interviewiq-user')
    return saved ? JSON.parse(saved) : null
  })

  const questions = questionBank[interviewType]
  const currentQuestion = questions[questionIndex]
  const averageScore = Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length)
  const credits = currentUser?.credits ?? 0
  const focusTips = useMemo(() => (averageScore >= 80 ? ['Mock interview daily', 'Sharpen metrics', 'Practice concise endings'] : ['Use STAR format', 'Add project numbers', 'Review weak answers']), [averageScore])

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then(({ data }) => {
        setCurrentUser(data.user)
        localStorage.setItem('interviewiq-user', JSON.stringify(data.user))
      })
      .catch(() => {
        const saved = localStorage.getItem('interviewiq-user')
        setCurrentUser(saved ? JSON.parse(saved) : null)
      })
  }, [])

  const saveHistory = (nextHistory) => {
    setHistory(nextHistory)
    localStorage.setItem('interviewiq-history', JSON.stringify(nextHistory))
  }

  const submitAnswer = () => {
    const score = scoreAnswer(answer)
    setFeedback({
      score,
      note: buildFeedback(answer, score),
      improvements: score > 80 ? ['Make the close more memorable'] : ['Add metrics', 'Clarify ownership'],
    })
    saveHistory([{ role, type: interviewType[0].toUpperCase() + interviewType.slice(1), score, date: 'Just now' }, ...history.slice(0, 5)])
  }

  const exportReport = () => {
    const rows = history.map((item) => `${item.date} | ${item.role} | ${item.type} | ${item.score}`).join('\n')
    const blob = new Blob([`InterviewIQ Report\nAverage score: ${averageScore}\nCredits: ${credits}\n\n${rows}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'interviewiq-report.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const logout = () => {
    localStorage.removeItem('interviewiq-user')
    setCurrentUser(null)
  }

  return (
    <main className='app-shell text-[#111827]'>
      <header className='sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6'>
          <Link to='/' className='flex items-center gap-3'>
            <span className='btn-dark grid h-10 w-10 place-items-center rounded-lg'>
              <FiMic size={20} />
            </span>
            <div>
              <p className='text-base font-semibold'>InterviewIQ</p>
              <p className='text-xs text-slate-500'>Premium AI interview SaaS</p>
            </div>
          </Link>

          <nav className='hidden items-center gap-2 md:flex'>
            <Link className='rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100' to='/interview'>Interview</Link>
            <Link className='rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100' to='/history'>Reports</Link>
            <Link className='rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100' to='/pricing'>Pricing</Link>
            {currentUser?.isAdmin && <Link className='rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100' to='/admin'>Admin</Link>}
          </nav>

          <div className='flex items-center gap-2'>
            <span className='chip hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold sm:inline-flex'>
              <FiAward /> {credits} credits
            </span>
            {currentUser ? (
              <button onClick={logout} className='btn-dark inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold'>
                <FiLogOut /> Logout
              </button>
            ) : (
              <Link to='/auth' className='btn-dark inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold'>
                <FiUser /> Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className='mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.08fr_0.92fr]'>
        <Motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className='hero-panel overflow-hidden rounded-2xl text-white'>
          <div className='grid min-h-[380px] gap-6 p-6 md:grid-cols-[1fr_280px] md:p-8'>
            <div className='flex flex-col justify-between'>
              <div>
                <p className='inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200'>Production-ready interview prep</p>
                <h1 className='mt-6 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl'>Practice smarter before the real interview.</h1>
                <p className='mt-4 max-w-xl text-sm leading-6 text-slate-300 md:text-base'>
                  Upload a resume, generate role-specific rounds, get feedback, and track your readiness with credits and reports.
                </p>
              </div>
              <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
                <Link to='/interview' className='btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold'>
                  <FiPlay /> Start interview
                </Link>
                <Link to='/history' className='inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white'>
                  <FiBarChart2 /> View reports
                </Link>
              </div>
            </div>
            <div className='grid content-end gap-3'>
              <img src={techAsset} alt='' className='h-36 w-full rounded-xl border border-white/10 object-cover shadow-2xl' />
              <div className='rounded-xl bg-white/10 p-4 backdrop-blur'>
                <p className='text-sm text-slate-300'>Readiness score</p>
                <div className='mt-2 flex items-end gap-3'>
                  <span className='text-5xl font-semibold'>{averageScore}</span>
                  <span className='pb-2 text-sm text-emerald-200'>avg</span>
                </div>
              </div>
            </div>
          </div>
        </Motion.div>

        <div className='grid gap-4 sm:grid-cols-3 lg:grid-cols-1'>
          {[
            [confidenceAsset, 'Confidence', averageScore >= 80 ? 'Strong' : 'Building', 'bg-white'],
            [historyAsset, 'Sessions', history.length, 'bg-white'],
            [resumeAsset, 'Resume lab', resumeReport ? `${resumeReport.score} ATS` : 'Ready', 'bg-white'],
          ].map(([image, label, value]) => (
            <div key={label} className={`premium-card flex items-center gap-4 rounded-2xl p-4`}>
              <img src={image} alt='' className='h-16 w-16 rounded-xl object-cover' />
              <div>
                <p className='text-sm text-slate-500'>{label}</p>
                <p className='text-2xl font-semibold'>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className='mx-auto grid max-w-7xl gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-[260px_1fr]'>
        <aside className='space-y-4'>
          <div className='premium-card rounded-2xl p-3'>
            {[
              ['interview', FiMic, 'Practice'],
              ['resume', FiFileText, 'Resume'],
              ['analytics', FiTrendingUp, 'Analytics'],
            ].map(([tab, Icon, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold last:mb-0 ${
                  activeTab === tab ? 'btn-dark' : 'text-slate-600 hover:bg-white/80'
                }`}
              >
                {React.createElement(Icon)} {label}
              </button>
            ))}
          </div>

          <div className='premium-card rounded-2xl p-5'>
            <p className='text-sm font-semibold'>Focus this week</p>
            <div className='mt-4 grid gap-3'>
              {focusTips.map((tip) => (
                <div key={tip} className='flex items-center gap-2 text-sm text-slate-600'>
                  <FiCheckCircle className='text-emerald-500' /> {tip}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {activeTab === 'interview' && (
          <Motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className='grid gap-6 xl:grid-cols-[1fr_320px]'>
            <div className='premium-card rounded-2xl p-5'>
              <div className='flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between'>
                <div>
                  <p className='text-sm font-semibold text-emerald-600'>Quick practice</p>
                  <h2 className='mt-1 text-2xl font-semibold'>Interview room</h2>
                </div>
                <button
                  onClick={() => {
                    setQuestionIndex((questionIndex + 1) % questions.length)
                    setAnswer('')
                    setFeedback(null)
                  }}
                  className='inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50'
                >
                  <FiRefreshCw /> New question
                </button>
              </div>

              <div className='mt-5 grid gap-4 sm:grid-cols-2'>
                <label className='grid gap-2 text-sm font-semibold text-slate-700'>
                  Target role
                  <input value={role} onChange={(event) => setRole(event.target.value)} className='soft-input rounded-lg px-3 py-3' />
                </label>
                <label className='grid gap-2 text-sm font-semibold text-slate-700'>
                  Interview type
                  <select value={interviewType} onChange={(event) => { setInterviewType(event.target.value); setQuestionIndex(0); setFeedback(null) }} className='soft-input rounded-lg px-3 py-3'>
                    <option value='technical'>Technical</option>
                    <option value='behavioral'>Behavioral</option>
                    <option value='hr'>HR</option>
                  </select>
                </label>
              </div>

              <div className='hero-panel mt-5 rounded-2xl p-5 text-white'>
                <p className='text-sm text-slate-400'>Question {questionIndex + 1} of {questions.length}</p>
                <p className='mt-3 text-xl font-semibold leading-relaxed'>{currentQuestion}</p>
              </div>

              <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder='Type your spoken answer here...' className='soft-input mt-5 min-h-48 w-full resize-y rounded-xl p-4 leading-relaxed' />
              <button onClick={submitAnswer} className='btn-primary mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold'>
                <FiPlay /> Analyze answer
              </button>
            </div>

            <aside className='premium-card rounded-2xl p-5'>
              <div className='flex items-center gap-3'>
                <img src={aiAnswerAsset} alt='' className='h-14 w-14 rounded-xl object-cover' />
                <div>
                  <p className='font-semibold'>AI coach</p>
                  <p className='text-sm text-slate-500'>Instant scoring</p>
                </div>
              </div>
              {feedback ? (
                <div className='mt-6 space-y-4'>
                  <p className='text-6xl font-semibold'>{feedback.score}</p>
                  <p className='rounded-xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-800'>{feedback.note}</p>
                  {feedback.improvements.map((item) => <p key={item} className='rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700'>{item}</p>)}
                </div>
              ) : (
                <p className='premium-card-muted mt-6 rounded-xl p-4 text-sm leading-relaxed text-slate-600'>Submit an answer to receive scoring and coaching.</p>
              )}
            </aside>
          </Motion.section>
        )}

        {activeTab === 'resume' && (
          <Motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className='grid gap-6 xl:grid-cols-[1fr_320px]'>
            <div className='premium-card rounded-2xl p-5'>
              <h2 className='text-2xl font-semibold'>Resume analyzer</h2>
              <p className='mt-2 text-sm text-slate-500'>Paste your resume text and get quick ATS-style feedback.</p>
              <textarea value={resumeText} onChange={(event) => setResumeText(event.target.value)} placeholder='Paste resume content, project bullets, or job-targeted summary...' className='soft-input mt-5 min-h-80 w-full resize-y rounded-xl p-4 leading-relaxed' />
              <button onClick={() => setResumeReport(analyzeResume(resumeText))} className='btn-dark mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold'>
                <FiTarget /> Analyze resume
              </button>
            </div>
            <aside className='premium-card rounded-2xl p-5'>
              <p className='font-semibold'>Resume report</p>
              {resumeReport ? (
                <div className='mt-5 space-y-4'>
                  <p className='text-6xl font-semibold'>{resumeReport.score}</p>
                  <div className='flex flex-wrap gap-2'>{(resumeReport.matchedSkills.length ? resumeReport.matchedSkills : ['Add keywords']).map((skill) => <span key={skill} className='rounded-lg bg-slate-100 px-3 py-2 text-sm'>{skill}</span>)}</div>
                  {resumeReport.suggestions.map((suggestion) => <p key={suggestion} className='rounded-xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-900'>{suggestion}</p>)}
                </div>
              ) : (
                <p className='premium-card-muted mt-5 rounded-xl p-4 text-sm text-slate-600'>Your report will appear here.</p>
              )}
            </aside>
          </Motion.section>
        )}

        {activeTab === 'analytics' && (
          <Motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className='premium-card rounded-2xl p-5'>
            <div className='flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between'>
              <div>
                <p className='text-sm font-semibold text-emerald-600'>Performance</p>
                <h2 className='text-2xl font-semibold'>Progress dashboard</h2>
              </div>
              <button onClick={exportReport} className='btn-dark inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold'>
                <FiDownload /> Export report
              </button>
            </div>
            <div className='mt-5 grid gap-4 md:grid-cols-3'>
              {[[FiTrendingUp, 'Average score', averageScore], [FiBookOpen, 'Sessions', history.length], [FiAward, 'Credits left', credits]].map(([Icon, label, value]) => (
                <div key={label} className='premium-card-muted rounded-xl p-4'>
                  {React.createElement(Icon, { className: 'text-emerald-500' })}
                  <p className='mt-4 text-sm text-slate-500'>{label}</p>
                  <p className='text-3xl font-semibold'>{value}</p>
                </div>
              ))}
            </div>
            <div className='mt-6 overflow-hidden rounded-xl border border-slate-200'>
              {history.map((item) => (
                <div key={`${item.role}-${item.type}-${item.date}`} className='grid gap-2 border-b border-slate-200 p-4 last:border-b-0 md:grid-cols-[1fr_130px_90px_70px] md:items-center'>
                  <p className='font-semibold'>{item.role}</p>
                  <p className='text-sm text-slate-500'>{item.type}</p>
                  <p className='text-sm text-slate-500'>{item.date}</p>
                  <p className='font-semibold'>{item.score}</p>
                </div>
              ))}
            </div>
          </Motion.section>
        )}
      </section>
    </main>
  )
}

export default Home
