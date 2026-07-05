import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { CheckCircle2, Circle, FileText, Mic, Radio, Send, ShieldCheck, Square, UploadCloud, Volume2, ArrowLeft } from 'lucide-react'
import { FiArrowLeft, FiCheckCircle, FiMic, FiSend, FiUploadCloud, FiVolume2, FiSquare, FiRadio } from 'react-icons/fi'
import api from '../utils/api'
import femaleInterviewerVideo from '../assets/female-ai.mp4'
import maleInterviewerVideo from '../assets/male-ai.mp4'

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition
}

function calculateVoiceConfidence(transcript, durationSeconds) {
  const words = transcript.trim().split(/\s+/).filter(Boolean)
  const fillerCount = (transcript.match(/\b(um|uh|like|actually|basically|maybe|kind of|sort of)\b/gi) || []).length
  const hasStructure = /\b(first|then|because|result|impact|learned|finally|example)\b/i.test(transcript)
  const wordsPerMinute = durationSeconds > 0 ? (words.length / durationSeconds) * 60 : 0
  const paceScore = wordsPerMinute >= 85 && wordsPerMinute <= 165 ? 3 : wordsPerMinute >= 55 && wordsPerMinute <= 190 ? 2 : 1
  const lengthScore = words.length >= 55 ? 3 : words.length >= 28 ? 2 : 1
  const fillerScore = fillerCount <= 1 ? 2 : fillerCount <= 4 ? 1 : 0
  const structureScore = hasStructure ? 2 : 1

  return Math.min(10, Math.max(1, paceScore + lengthScore + fillerScore + structureScore))
}

function pickSpeechVoice(mode) {
  const voices = window.speechSynthesis?.getVoices?.() || []
  if (!voices.length) return null

  const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'susan', 'samantha', 'victoria', 'karen', 'eva', 'allison', 'google uk english female', 'microsoft zira', 'natural', 'neural']
  const maleKeywords = ['male', 'man', 'david', 'alex', 'mark', 'daniel', 'george', 'microsoft david', 'google uk english male', 'ravi', 'english us']
  const keywords = mode === 'female' ? femaleKeywords : maleKeywords

  const match = voices.find((voice) => {
    const haystack = `${voice.name} ${voice.lang}`.toLowerCase()
    return keywords.some((keyword) => haystack.includes(keyword))
  })

  if (match) return match
  return voices.find((voice) => voice.default) || voices[0]
}

function Interview() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('Frontend Developer')
  const [type, setType] = useState('technical')
  const [level, setLevel] = useState('mid')
  const [interviewerMode, setInterviewerMode] = useState('auto')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [resumeReport, setResumeReport] = useState(null)
  const [interview, setInterview] = useState(null)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(() => Boolean(getSpeechRecognition()) && 'speechSynthesis' in window)
  const [voiceConfidence, setVoiceConfidence] = useState(0)
  const [voiceDuration, setVoiceDuration] = useState(0)
  // Per-question timer (seconds)
  const QUESTION_TIME = 120
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)
  const handleTimeUpRef = useRef(null)
  const interviewerVideoRef = useRef(null)
  
  const recognitionRef = useRef(null)
  const transcriptBaseRef = useRef('')
  const speechStartedAtRef = useRef(0)

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    const video = interviewerVideoRef.current
    if (!video) return

    video.pause()
    video.currentTime = 0
  }, [activeQuestion, interviewerMode])

  useEffect(() => {
    // Start/reset timer when entering the interview step or changing question
    if (step === 2 && interview) {
      // reset time (defer to avoid sync state update warnings)
      setTimeout(() => setTimeLeft(QUESTION_TIME), 0)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // time up
            clearInterval(timerRef.current)
            timerRef.current = null
            handleTimeUpRef.current?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setTimeout(() => setTimeLeft(0), 0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    // restart when activeQuestion changes
  }, [step, interview, activeQuestion])

  

  const analyzeResume = async (file) => {
    if (!file) {
      setMessage('Please upload a resume PDF first.')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      const formData = new FormData()
      formData.append('resume', file)
      const { data } = await api.post('/api/resume/analyze', formData)
      setResumeReport(data.report)
      setResumeText(data.resumeText || '')
      if (data.report?.role) setRole(data.report.role)
      const qCount = data.questionCount
      if (typeof qCount === 'number') {
        setMessage(`Resume uploaded successfully. The interview will contain ${qCount} questions.`)
      } else {
        setMessage('Resume uploaded successfully.')
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Resume analysis failed. Sign in first or use demo auth.')
    } finally {
      setLoading(false)
    }
  }

  const handleResumeUpload = async (file) => {
    setResumeFile(file)
    setResumeReport(null)
    await analyzeResume(file)
  }

  const createInterview = async () => {
    if (!resumeReport) {
      setMessage('Please upload your resume first so AI can analyze it.')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      const { data } = await api.post('/api/interviews', {
        role,
        type,
        level,
        resumeSummary: resumeReport.summary,
        experience: resumeReport.experience,
        projects: resumeReport.projects || [],
        skills: resumeReport.skills || resumeReport.matchedSkills || [],
        resumeText,
      })
      setInterview(data.interview)
      const savedUser = localStorage.getItem('interviewiq-user')
      if (savedUser) {
        const user = JSON.parse(savedUser)
        localStorage.setItem('interviewiq-user', JSON.stringify({ ...user, credits: data.credits }))
      }
      const providerMessage =
        'InterviewIQ AI generated personalized interview questions from your resume.'
      const errorMessage = data.aiError ? ` AI error: ${data.aiError}` : ''
      setMessage(`Interview generated. 10 credits used. Credits left: ${data.credits}. ${providerMessage}${errorMessage}`)
      setStep(2)
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Could not create interview.')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = useCallback(async ({ autoAdvance = false } = {}) => {
    try {
      // stop and clear timer to avoid duplicate submits
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setLoading(true)
      setMessage('')
      const { data } = await api.post('/api/interviews/answer', {
        interviewId: interview._id,
        questionIndex: activeQuestion,
        answer,
        voiceConfidence,
      })
      setInterview(data.interview)
      setEvaluation(data.evaluation)
      if (data.interview.status === 'completed') {
        setStep(3)
      } else if (autoAdvance) {
        setTimeout(() => {
          nextQuestion()
        }, 250)
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Could not submit answer.')
    } finally {
      setLoading(false)
    }
  }, [interview, activeQuestion, answer, voiceConfidence])

  // wire up a stable ref handler so the timer effect doesn't need to depend on a changing function
  useEffect(() => {
    handleTimeUpRef.current = () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
      setIsListening(false)
      setIsSpeaking(false)
      setMessage('Time is up for this question — answer submitted.')
      submitAnswer({ autoAdvance: true })
    }
  }, [submitAnswer])

  const nextQuestion = () => {
    recognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
    setActiveQuestion((activeQuestion + 1) % interview.questions.length)
    setAnswer('')
    setEvaluation(null)
    setIsListening(false)
    setIsSpeaking(false)
    setVoiceConfidence(0)
    setVoiceDuration(0)
  }

  const speakQuestion = () => {
    if (!('speechSynthesis' in window)) {
      setMessage('Voice playback is not supported in this browser.')
      return
    }

    const question = interview?.questions?.[activeQuestion]?.question
    if (!question) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(question)
    utterance.rate = 0.92
    utterance.pitch = 1
    utterance.lang = 'en-US'
    const preferredVoice = pickSpeechVoice(interviewerMode === 'auto' ? (activeQuestion % 2 === 0 ? 'female' : 'male') : interviewerMode)
    if (preferredVoice) {
      utterance.voice = preferredVoice
      utterance.lang = preferredVoice.lang || 'en-US'
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
      const video = interviewerVideoRef.current
      if (video) {
        video.currentTime = 0
        video.play().catch(() => {})
      }
    }
    utterance.onend = () => {
      setIsSpeaking(false)
      const video = interviewerVideoRef.current
      if (video) {
        video.pause()
        video.currentTime = Math.min(video.currentTime || 0, Math.max(video.duration - 0.05, 0))
      }
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      interviewerVideoRef.current?.pause()
      setMessage('Could not play interviewer voice. Try again.')
    }
    window.speechSynthesis.speak(utterance)
  }

  const startVoiceAnswer = () => {
    const SpeechRecognition = getSpeechRecognition()

    if (!SpeechRecognition) {
      setSpeechSupported(false)
      setMessage('Voice interview is not supported in this browser. Use Chrome or Edge for speech recognition.')
      return
    }

    recognitionRef.current?.stop()
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    transcriptBaseRef.current = answer || interview.questions[activeQuestion].answer || ''
    speechStartedAtRef.current = Date.now()
    setVoiceConfidence(0)
    setVoiceDuration(0)
    setMessage('')

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript
        if (event.results[index].isFinal) {
          finalTranscript += text
        } else {
          interimTranscript += text
        }
      }

      const nextAnswer = `${transcriptBaseRef.current} ${finalTranscript || interimTranscript}`.trim()
      setAnswer(nextAnswer)
      const seconds = Math.max(1, Math.round((Date.now() - speechStartedAtRef.current) / 1000))
      setVoiceDuration(seconds)
      setVoiceConfidence(calculateVoiceConfidence(nextAnswer, seconds))

      if (finalTranscript) {
        transcriptBaseRef.current = `${transcriptBaseRef.current} ${finalTranscript}`.trim()
      }
    }
    recognition.onerror = (event) => {
      setIsListening(false)
      setMessage(event.error === 'not-allowed' ? 'Microphone permission was blocked. Allow mic access and try again.' : 'Voice capture stopped. You can continue typing or start again.')
    }
    recognition.onend = () => {
      setIsListening(false)
      const seconds = Math.max(1, Math.round((Date.now() - speechStartedAtRef.current) / 1000))
      setVoiceDuration(seconds)
      setVoiceConfidence((current) => current || calculateVoiceConfidence(answer || transcriptBaseRef.current, seconds))
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopVoiceAnswer = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const activeInterviewer = useMemo(() => {
    const isFemale = interviewerMode === 'female' || (interviewerMode === 'auto' && activeQuestion % 2 === 0)
    return {
      label: isFemale ? 'Female interviewer' : 'Male interviewer',
      role: isFemale ? 'Calm, structured tone' : 'Direct, practical tone',
      video: isFemale ? femaleInterviewerVideo : maleInterviewerVideo,
      accent: isFemale ? 'from-emerald-400/20 via-emerald-500/10 to-transparent' : 'from-emerald-300/20 via-emerald-500/10 to-transparent',
    }
  }, [activeQuestion, interviewerMode])

  return (
    <main className='app-shell px-4 py-6 sm:px-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-6 flex items-center justify-between'>
          <Link to='/' className='btn-ghost inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white'>
            <FiArrowLeft /> Dashboard
          </Link>
          <Link to='/pricing' className='btn-dark rounded-lg px-4 py-2 text-sm font-semibold'>
            Buy credits
          </Link>
        </div>

        <section className='hero-panel mb-6 overflow-hidden rounded-3xl text-white'>
          <div className='noise-grid grid gap-6 p-6 md:grid-cols-[1fr_220px] md:p-8'>
            <div>
              <p className='text-sm font-semibold text-emerald-300'>AI interview agent</p>
              <h1 className='mt-2 max-w-3xl text-4xl font-semibold leading-tight'>Generate a role-specific round from your resume.</h1>
              <p className='mt-3 max-w-2xl text-sm leading-6 text-emerald-100/72'>
                Upload your resume PDF and AI will analyze it to generate 15 interview questions automatically.
              </p>
            </div>
            <div className='icon-tile flex h-32 w-full items-center justify-center rounded-3xl md:h-full'>
              <div className='text-center'>
                <div className='mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300'>
                  <FileText size={28} />
                </div>
                <p className='mt-3 text-xs uppercase tracking-[0.28em] text-emerald-100/55'>Resume upload</p>
              </div>
            </div>
          </div>
        </section>

        <section className='grid gap-6 lg:grid-cols-[320px_1fr]'>
          <aside className='premium-card rounded-2xl p-5'>
            <p className='eyebrow'>Step {step}</p>
            <h2 className='mt-1 text-2xl font-semibold'>Setup progress</h2>
            <div className='mt-6 grid gap-3'>
              {['Upload resume', 'Practice interview', 'View report'].map((item, index) => (
                <div key={item} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${step >= index + 1 ? 'chip' : 'premium-card-muted text-emerald-100/45'}`}>
                  {step >= index + 1 ? <CheckCircle2 size={16} /> : <Circle size={16} className='text-emerald-100/35' />} {item}
                </div>
              ))}
            </div>
            {message && <p className='mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900'>{message}</p>}
          </aside>

          {step === 1 && (
            <Motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className='premium-card rounded-2xl p-5'>
              <div className='grid gap-4 md:grid-cols-3'>
                <label className='grid gap-2 text-sm font-semibold text-emerald-100/80'>
                  Target role
                  <input value={role} onChange={(event) => setRole(event.target.value)} className='soft-input rounded-xl px-3 py-3' />
                </label>
                <label className='grid gap-2 text-sm font-semibold text-emerald-100/80'>
                  Round
                  <select value={type} onChange={(event) => setType(event.target.value)} className='soft-input rounded-xl px-3 py-3'>
                    <option value='technical'>Technical</option>
                    <option value='behavioral'>Behavioral</option>
                    <option value='hr'>HR</option>
                  </select>
                </label>
                <label className='grid gap-2 text-sm font-semibold text-emerald-100/80'>
                  Level
                  <select value={level} onChange={(event) => setLevel(event.target.value)} className='soft-input rounded-xl px-3 py-3'>
                    <option value='junior'>Junior</option>
                    <option value='mid'>Mid</option>
                    <option value='senior'>Senior</option>
                  </select>
                </label>
              </div>

              <label className='mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-400/20 bg-white/5 px-4 py-10 text-center transition-all duration-200 hover:border-emerald-400/35 hover:bg-white/7'>
                <UploadCloud size={32} className='text-emerald-300' />
                <span className='mt-3 text-sm font-semibold'>{resumeFile ? resumeFile.name : 'Upload resume PDF'}</span>
                <span className='text-xs text-emerald-100/55'>PDF up to 5MB</span>
                <input type='file' accept='application/pdf' onChange={(event) => handleResumeUpload(event.target.files?.[0] || null)} className='hidden' />
              </label>

              <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
                <button onClick={createInterview} disabled={loading || !resumeReport} className='btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60'>
                  <Mic size={16} /> Generate interview
                </button>
              </div>

              {resumeReport && (
                <div className='mt-5 rounded-xl border border-emerald-400/15 bg-emerald-500/10 p-4 text-sm text-emerald-50'>
                  <p className='font-semibold'>
                    {resumeReport.role || role} | {resumeReport.experience || 'Experience not specified'} |{' '}
                    {resumeReport.provider
                      ? `${resumeReport.provider} analysis`
                      : 'AI analysis failed'}
                  </p>
                  <p className='mt-2'>{resumeReport.summary}</p>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {(resumeReport.skills || resumeReport.matchedSkills || []).map((skill) => (
                      <span key={skill} className='rounded-full border border-white/10 bg-black/15 px-3 py-2 font-semibold'>{skill}</span>
                    ))}
                  </div>
                  <div className='mt-3 grid gap-2 md:grid-cols-2'>
                    {(resumeReport.suggestions || []).map((suggestion) => (
                      <p key={suggestion} className='rounded-lg border border-white/10 bg-black/15 p-3 leading-5'>{suggestion}</p>
                    ))}
                  </div>
                </div>
              )}
            </Motion.section>
          )}

          {step === 2 && interview && (
            <Motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className='premium-card rounded-2xl p-5'>
                <div className='hero-panel overflow-hidden rounded-2xl text-white'>
                  <div className='grid gap-0 lg:grid-cols-[320px_1fr]'>
                    <div className='relative min-h-[320px] border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10'>
                      <video
                        ref={interviewerVideoRef}
                        key={activeInterviewer.video}
                        src={activeInterviewer.video}
                        autoPlay
                        muted
                        loop={false}
                        playsInline
                        className='absolute inset-0 h-full w-full object-cover'
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${activeInterviewer.accent}`} />
                      <div className='absolute inset-x-0 bottom-0 p-4'>
                        <div className='rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm'>
                          <p className='text-xs uppercase tracking-[0.24em] text-emerald-100/50'>Interviewer on screen</p>
                          <h3 className='mt-2 text-xl font-semibold'>{activeInterviewer.label}</h3>
                          <p className='mt-1 text-sm text-emerald-100/70'>{activeInterviewer.role}</p>
                        </div>
                      </div>
                    </div>

                    <div className='p-5'>
                      <div className='flex items-center justify-between gap-4'>
                        <div>
                          <p className='text-sm text-emerald-100/55'>Question {activeQuestion + 1} of {interview.questions.length}</p>
                          <p className='mt-1 text-xs text-emerald-100/55'>Time left: {timeLeft}s</p>
                        </div>
                        <span className='rounded-full border border-emerald-400/15 bg-white/5 px-3 py-1 text-xs uppercase text-emerald-100/70'>
                          InterviewIQ AI
                        </span>
                      </div>
                      <div className='mt-4 flex flex-wrap gap-2'>
                        {[
                          ['Auto', 'auto'],
                          ['Female', 'female'],
                          ['Male', 'male'],
                        ].map(([label, value]) => (
                          <button
                            key={value}
                            type='button'
                            onClick={() => setInterviewerMode(value)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-200 ${
                              interviewerMode === value
                                ? 'bg-emerald-400 text-slate-950'
                                : 'border border-white/10 bg-white/5 text-emerald-100/70 hover:border-emerald-400/25 hover:bg-white/10'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <h2 className='mt-4 text-2xl font-semibold leading-relaxed'>{interview.questions[activeQuestion].question}</h2>
                      <div className='mt-5 flex flex-col gap-3 sm:flex-row'>
                        <button onClick={speakQuestion} type='button' className='inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition-all duration-200 hover:bg-white/15'>
                          <Volume2 size={16} /> {isSpeaking ? 'Speaking...' : 'Interviewer speak'}
                        </button>
                        {isListening ? (
                          <button onClick={stopVoiceAnswer} type='button' className='inline-flex items-center justify-center gap-2 rounded-xl bg-red-400/20 px-4 py-2 text-sm font-semibold text-red-100 ring-1 ring-red-300/30 transition-all duration-200 hover:bg-red-400/25'>
                            <Square size={16} /> Stop recording
                          </button>
                        ) : (
                          <button onClick={startVoiceAnswer} type='button' disabled={!speechSupported} className='inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60'>
                            <Radio size={16} /> Answer by voice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              <textarea value={answer || interview.questions[activeQuestion].answer} onChange={(event) => setAnswer(event.target.value)} placeholder='Write your spoken answer here...' className='soft-input mt-5 min-h-56 w-full rounded-xl p-4 placeholder:text-emerald-100/35' />
              <div className='mt-4 grid gap-3 md:grid-cols-3'>
                <div className='premium-card-muted rounded-xl p-4'>
                  <p className='text-xs font-semibold uppercase text-emerald-100/45'>Voice status</p>
                  <p className='mt-1 text-lg font-semibold'>{isListening ? 'Listening live' : 'Ready'}</p>
                </div>
                <div className='premium-card-muted rounded-xl p-4'>
                  <p className='text-xs font-semibold uppercase text-emerald-100/45'>Voice confidence</p>
                  <p className='mt-1 text-lg font-semibold'>{voiceConfidence || 0}/10</p>
                </div>
                <div className='premium-card-muted rounded-xl p-4'>
                  <p className='text-xs font-semibold uppercase text-emerald-100/45'>Spoken time</p>
                  <p className='mt-1 text-lg font-semibold'>{voiceDuration}s</p>
                </div>
              </div>
              <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
                <button onClick={submitAnswer} disabled={loading} className='btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60'>
                  <Send size={16} /> Submit answer
                </button>
                <button onClick={nextQuestion} className='btn-ghost rounded-xl px-5 py-3 text-sm font-semibold'>Next question</button>
                <button onClick={() => setStep(3)} className='btn-dark rounded-xl px-5 py-3 text-center text-sm font-semibold'>View report</button>
              </div>
              {(evaluation || interview.questions[activeQuestion].feedback) && (
                <div className='premium-card-muted mt-5 rounded-xl p-5'>
                  <p className='text-5xl font-semibold'>{evaluation?.finalScore || interview.questions[activeQuestion].score}<span className='text-lg text-slate-500'>/10</span></p>
                  <p className='mt-2 text-sm leading-relaxed text-emerald-100/65'>{evaluation?.feedback || interview.questions[activeQuestion].feedback}</p>
                  <div className='mt-4 grid gap-3 md:grid-cols-3'>
                    {[
                      ['Confidence', evaluation?.confidence || interview.questions[activeQuestion].confidence || 0],
                      ['Communication', evaluation?.communication || interview.questions[activeQuestion].communication || 0],
                      ['Correctness', evaluation?.correctness || interview.questions[activeQuestion].correctness || 0],
                    ].map(([label, value]) => (
                      <div key={label} className='rounded-lg border border-white/10 bg-white/5 p-3'>
                        <p className='text-xs font-semibold uppercase text-emerald-100/45'>{label}</p>
                        <p className='text-2xl font-semibold'>{value}/10</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Motion.section>
          )}

          {step === 3 && interview && (
            <Motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className='premium-card rounded-2xl p-5'>
              <div className='flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between'>
                <div>
                  <p className='text-sm font-semibold text-emerald-300'>Generated report</p>
                  <h2 className='mt-1 text-3xl font-semibold'>{interview.role}</h2>
                  <p className='mt-2 text-sm text-emerald-100/60'>{interview.type} round | {interview.level} level | InterviewIQ AI Analysis</p>
                </div>
                <div className='rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center'>
                  <p className='text-xs font-semibold uppercase text-emerald-100/45'>Overall score</p>
                  <p className='text-4xl font-semibold'>{interview.report?.overallScore || interview.overallScore || 0}<span className='text-base text-slate-500'>/10</span></p>
                </div>
              </div>

              <div className='mt-5 rounded-xl border border-emerald-400/15 bg-emerald-500/10 p-5 text-emerald-50'>
                <p className='text-sm font-semibold uppercase'>Readiness: {interview.report?.hiringReadiness || 'in progress'}</p>
                <p className='mt-2 text-sm leading-6'>{interview.report?.summary || 'Answer all questions to generate a complete AI report.'}</p>
                {interview.report?.industryReadiness && (
                  <p className='mt-3 text-sm font-semibold'>{interview.report.industryReadiness}</p>
                )}
              </div>

              <div className='mt-5 grid gap-3 md:grid-cols-4'>
                {[
                  ['Technical', interview.report?.technicalScore || 0],
                  ['Communication', interview.report?.communicationScore || 0],
                  ['Confidence', interview.report?.confidenceScore || 0],
                  ['Problem solving', interview.report?.problemSolvingScore || 0],
                ].map(([label, value]) => (
                  <div key={label} className='rounded-xl border border-white/10 bg-white/5 p-4'>
                    <p className='text-xs font-semibold uppercase text-emerald-100/45'>{label}</p>
                    <p className='mt-1 text-2xl font-semibold'>{value}/10</p>
                  </div>
                ))}
              </div>

              <div className='mt-5 grid gap-4 md:grid-cols-3'>
                {[
                  ['Strengths', interview.report?.strengths || []],
                  ['Weaknesses', interview.report?.weaknesses || []],
                  ['Improvements', interview.report?.improvements || []],
                  ['Next steps', interview.report?.nextSteps || []],
                  ['Recommended topics', interview.report?.recommendedTopics || []],
                ].map(([title, items]) => (
                  <div key={title} className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                    <h3 className='font-semibold'>{title}</h3>
                    <div className='mt-3 grid gap-2'>
                      {(items.length ? items : ['Complete more answers to unlock this section.']).map((item) => (
                        <p key={item} className='rounded-lg bg-white p-3 text-sm leading-5 text-slate-600'>{item}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {(interview.report?.finalVerdict || interview.report?.motivationalNote) && (
                <div className='mt-5 grid gap-4 md:grid-cols-2'>
                  {interview.report?.finalVerdict && (
                    <div className='rounded-xl bg-slate-900 p-5 text-white'>
                      <p className='text-xs font-semibold uppercase text-slate-400'>Interviewer verdict</p>
                      <p className='mt-2 text-sm leading-6 text-slate-100'>{interview.report.finalVerdict}</p>
                    </div>
                  )}
                  {interview.report?.motivationalNote && (
                    <div className='rounded-xl bg-emerald-50 p-5 text-emerald-900'>
                      <p className='text-xs font-semibold uppercase'>Motivational note</p>
                      <p className='mt-2 text-sm leading-6'>{interview.report.motivationalNote}</p>
                    </div>
                  )}
                </div>
              )}

              <div className='mt-5 grid gap-3'>
                {interview.questions.map((item, index) => (
                  <div key={item.question} className='rounded-xl bg-slate-100 p-4 text-sm'>
                    <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
                      <p className='font-semibold'>Q{index + 1}. {item.question}</p>
                      <span className='rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-600'>{item.score || 0}/10</span>
                    </div>
                    <p className='mt-2 leading-6 text-slate-600'>{item.feedback || 'Not answered yet'}</p>
                    {item.voiceConfidence > 0 && <p className='mt-2 text-xs font-semibold uppercase text-emerald-700'>Voice confidence: {item.voiceConfidence}/10</p>}
                  </div>
                ))}
              </div>

              <div className='mt-5 flex flex-col gap-3 sm:flex-row'>
                <button onClick={() => setStep(2)} className='rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50'>Back to questions</button>
                <Link to='/history' className='rounded-lg bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white'>Open history</Link>
              </div>
            </Motion.section>
          )}
        </section>
      </div>
    </main>
  )
}

export default Interview
