import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { FiArrowLeft, FiCheckCircle, FiMic, FiSend, FiUploadCloud } from 'react-icons/fi'
import api from '../utils/api'
import pdfAsset from '../assets/pdf.png'

function Interview() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('Frontend Developer')
  const [type, setType] = useState('technical')
  const [level, setLevel] = useState('mid')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeReport, setResumeReport] = useState(null)
  const [interview, setInterview] = useState(null)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

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
      setMessage('Resume uploaded successfully. AI analyzed your resume and will generate 25 questions from it.')
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
      })
      setInterview(data.interview)
      const savedUser = localStorage.getItem('interviewiq-user')
      if (savedUser) {
        const user = JSON.parse(savedUser)
        localStorage.setItem('interviewiq-user', JSON.stringify({ ...user, credits: data.credits }))
      }
      const providerMessage = data.interview.provider === 'openai' ? 'OpenAI questions generated.' : 'Using local fallback questions.'
      const errorMessage = data.aiError ? ` AI error: ${data.aiError}` : ''
      setMessage(`Interview generated. 10 credits used. Credits left: ${data.credits}. ${providerMessage}${errorMessage}`)
      setStep(2)
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Could not create interview.')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    try {
      setLoading(true)
      setMessage('')
      const { data } = await api.post('/api/interviews/answer', {
        interviewId: interview._id,
        questionIndex: activeQuestion,
        answer,
      })
      setInterview(data.interview)
      setEvaluation(data.evaluation)
      if (data.interview.status === 'completed') {
        setStep(3)
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Could not submit answer.')
    } finally {
      setLoading(false)
    }
  }

  const nextQuestion = () => {
    setActiveQuestion((activeQuestion + 1) % interview.questions.length)
    setAnswer('')
    setEvaluation(null)
  }

  return (
    <main className='min-h-screen bg-[#f5f7fb] px-4 py-6 text-slate-900 sm:px-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-6 flex items-center justify-between'>
          <Link to='/' className='inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-50'>
            <FiArrowLeft /> Dashboard
          </Link>
          <Link to='/pricing' className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm'>
            Buy credits
          </Link>
        </div>

        <section className='mb-6 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl'>
          <div className='grid gap-6 p-6 md:grid-cols-[1fr_220px] md:p-8'>
            <div>
              <p className='text-sm font-semibold text-emerald-300'>AI interview agent</p>
              <h1 className='mt-2 text-4xl font-semibold'>Generate a role-specific round from your resume.</h1>
              <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-300'>
                Upload your resume PDF and AI will analyze it to generate 25 interview questions automatically.
              </p>
            </div>
            <img src={pdfAsset} alt='' className='h-32 w-full rounded-xl object-cover md:h-full' />
          </div>
        </section>

        <section className='grid gap-6 lg:grid-cols-[320px_1fr]'>
          <aside className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <p className='text-sm font-semibold text-emerald-600'>Step {step}</p>
            <h2 className='mt-1 text-2xl font-semibold'>Setup progress</h2>
            <div className='mt-6 grid gap-3'>
              {['Upload resume', 'Practice interview', 'View report'].map((item, index) => (
                <div key={item} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${step >= index + 1 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                  <FiCheckCircle /> {item}
                </div>
              ))}
            </div>
            {message && <p className='mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900'>{message}</p>}
          </aside>

          {step === 1 && (
            <Motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
              <div className='grid gap-4 md:grid-cols-3'>
                <label className='grid gap-2 text-sm font-semibold text-slate-700'>
                  Target role
                  <input value={role} onChange={(event) => setRole(event.target.value)} className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-slate-900' />
                </label>
                <label className='grid gap-2 text-sm font-semibold text-slate-700'>
                  Round
                  <select value={type} onChange={(event) => setType(event.target.value)} className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-slate-900'>
                    <option value='technical'>Technical</option>
                    <option value='behavioral'>Behavioral</option>
                    <option value='hr'>HR</option>
                  </select>
                </label>
                <label className='grid gap-2 text-sm font-semibold text-slate-700'>
                  Level
                  <select value={level} onChange={(event) => setLevel(event.target.value)} className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-slate-900'>
                    <option value='junior'>Junior</option>
                    <option value='mid'>Mid</option>
                    <option value='senior'>Senior</option>
                  </select>
                </label>
              </div>

              <label className='mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center hover:border-emerald-400 hover:bg-emerald-50'>
                <FiUploadCloud size={32} />
                <span className='mt-3 text-sm font-semibold'>{resumeFile ? resumeFile.name : 'Upload resume PDF'}</span>
                <span className='text-xs text-slate-500'>PDF up to 5MB</span>
                <input type='file' accept='application/pdf' onChange={(event) => handleResumeUpload(event.target.files?.[0] || null)} className='hidden' />
              </label>

              <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
                <button onClick={createInterview} disabled={loading || !resumeReport} className='inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60'>
                  <FiMic /> Generate interview
                </button>
              </div>

              {resumeReport && (
                <div className='mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800'>
                  <p className='font-semibold'>ATS score: {resumeReport.score} | {resumeReport.provider || 'local'} analysis</p>
                  <p className='mt-2'>{resumeReport.summary}</p>
                  <div className='mt-3 grid gap-2 md:grid-cols-2'>
                    {(resumeReport.suggestions || []).map((suggestion) => (
                      <p key={suggestion} className='rounded-lg bg-white/80 p-3 leading-5'>{suggestion}</p>
                    ))}
                  </div>
                </div>
              )}
            </Motion.section>
          )}

          {step === 2 && interview && (
            <Motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
              <div className='rounded-2xl bg-slate-900 p-5 text-white'>
                <div className='flex items-center justify-between gap-4'>
                  <p className='text-sm text-slate-400'>Question {activeQuestion + 1} of {interview.questions.length}</p>
                  <span className='rounded-full bg-slate-800 px-3 py-1 text-xs uppercase text-slate-300'>
                    {interview.provider === 'openai' ? 'OpenAI' : 'Local'}
                  </span>
                </div>
                <h2 className='mt-3 text-2xl font-semibold leading-relaxed'>{interview.questions[activeQuestion].question}</h2>
              </div>
              <textarea value={answer || interview.questions[activeQuestion].answer} onChange={(event) => setAnswer(event.target.value)} placeholder='Write your spoken answer here...' className='mt-5 min-h-56 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:border-slate-900' />
              <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
                <button onClick={submitAnswer} disabled={loading} className='inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60'>
                  <FiSend /> Submit answer
                </button>
                <button onClick={nextQuestion} className='rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50'>Next question</button>
                <button onClick={() => setStep(3)} className='rounded-lg bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white'>View report</button>
              </div>
              {(evaluation || interview.questions[activeQuestion].feedback) && (
                <div className='mt-5 rounded-xl bg-slate-100 p-5'>
                  <p className='text-5xl font-semibold'>{evaluation?.score || interview.questions[activeQuestion].score}</p>
                  <p className='mt-2 text-sm leading-relaxed text-slate-600'>{evaluation?.feedback || interview.questions[activeQuestion].feedback}</p>
                </div>
              )}
            </Motion.section>
          )}

          {step === 3 && interview && (
            <Motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
              <div className='flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between'>
                <div>
                  <p className='text-sm font-semibold text-emerald-600'>Generated report</p>
                  <h2 className='mt-1 text-3xl font-semibold'>{interview.role}</h2>
                  <p className='mt-2 text-sm text-slate-500'>{interview.type} round | {interview.level} level | {interview.provider || 'local'} AI</p>
                </div>
                <div className='rounded-xl bg-slate-100 px-5 py-4 text-center'>
                  <p className='text-xs font-semibold uppercase text-slate-500'>Overall score</p>
                  <p className='text-4xl font-semibold'>{interview.overallScore || 0}</p>
                </div>
              </div>

              <div className='mt-5 rounded-xl bg-emerald-50 p-5 text-emerald-900'>
                <p className='text-sm font-semibold uppercase'>Readiness: {interview.report?.readiness || 'in progress'}</p>
                <p className='mt-2 text-sm leading-6'>{interview.report?.summary || 'Answer all questions to generate a complete AI report.'}</p>
              </div>

              <div className='mt-5 grid gap-4 md:grid-cols-3'>
                {[
                  ['Strengths', interview.report?.strengths || []],
                  ['Improvements', interview.report?.improvements || []],
                  ['Next steps', interview.report?.nextSteps || []],
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

              <div className='mt-5 grid gap-3'>
                {interview.questions.map((item, index) => (
                  <div key={item.question} className='rounded-xl bg-slate-100 p-4 text-sm'>
                    <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
                      <p className='font-semibold'>Q{index + 1}. {item.question}</p>
                      <span className='rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-600'>{item.score || 0}/100</span>
                    </div>
                    <p className='mt-2 leading-6 text-slate-600'>{item.feedback || 'Not answered yet'}</p>
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
