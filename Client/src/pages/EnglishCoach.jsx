import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Brain, CheckCircle2, Lightbulb, Mic, MicOff, Send, Volume2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import femaleInterviewerVideo from '../assets/female-ai.mp4'

const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

function EnglishCoach() {
  const [level, setLevel] = useState('beginner')
  const [goal, setGoal] = useState('conversation')
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I’m your English speaking coach. Tell me about your day in English, and I’ll help you improve naturally." },
  ])
  const [lastFeedback, setLastFeedback] = useState(null)
  const recognitionRef = useRef(null)
  const coachVideoRef = useRef(null)
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false)

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setIsCoachSpeaking(true)
    coachVideoRef.current?.play().catch(() => {})
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.92
    utterance.onend = () => {
      setIsCoachSpeaking(false)
      coachVideoRef.current?.pause()
    }
    window.speechSynthesis.speak(utterance)
  }

  const startListening = () => {
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. Try Chrome on Android or desktop.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onstart = () => { setIsListening(true); setError('') }
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      window.setTimeout(() => sendMessage(null, transcript), 0)
    }
    recognition.onerror = () => setError('I could not hear that clearly. Please try again.')
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
  }

  const sendMessage = async (event, directMessage = '') => {
    event?.preventDefault()
    const message = (directMessage || input).trim()
    if (!message || isLoading) return

    setError('')
    setInput('')
    setMessages((current) => [...current, { role: 'user', content: message }])
    setIsLoading(true)

    try {
      const { data } = await api.post('/api/english/coach', {
        message,
        level,
        goal,
        history: messages.slice(-8),
      })
      const result = data.result
      setMessages((current) => [...current, { role: 'assistant', content: result.reply }])
      setLastFeedback(result)
      speak(result.reply)
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Coach is temporarily unavailable. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className='app-shell min-h-screen px-4 py-6 pb-24 text-emerald-50 sm:px-6'>
      <div className='mx-auto max-w-6xl'>
        <div className='flex items-center justify-between gap-3'>
          <Link to='/' className='btn-ghost inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold'>
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <span className='chip inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold'>
            <Brain size={15} /> English Coach
          </span>
        </div>

        <section className='hero-panel mt-5 overflow-hidden rounded-3xl p-5 text-white sm:p-8'>
          <div className='max-w-3xl'>
            <p className='eyebrow'>Speak with confidence</p>
            <h1 className='mt-2 text-3xl font-semibold tracking-tight sm:text-5xl'>Practice English with a patient conversation partner.</h1>
            <p className='mt-3 max-w-2xl text-sm leading-6 text-emerald-100/70 sm:text-base'>Speak naturally, get gentle corrections, learn better phrases, and continue the conversation without feeling judged.</p>
          </div>
          <div className='mt-6 grid gap-3 sm:grid-cols-2'>
            <label className='grid gap-2 text-sm font-semibold text-emerald-100/80'>
              Your level
              <select value={level} onChange={(event) => setLevel(event.target.value)} className='soft-input rounded-xl px-3 py-3'>
                <option value='beginner'>Beginner</option>
                <option value='intermediate'>Intermediate</option>
                <option value='advanced'>Advanced</option>
              </select>
            </label>
            <label className='grid gap-2 text-sm font-semibold text-emerald-100/80'>
              Practice goal
              <select value={goal} onChange={(event) => setGoal(event.target.value)} className='soft-input rounded-xl px-3 py-3'>
                <option value='conversation'>Daily conversation</option>
                <option value='interview'>Interview English</option>
                <option value='workplace'>Workplace English</option>
                <option value='pronunciation'>Pronunciation and fluency</option>
              </select>
            </label>
          </div>
        </section>

        <div className='mt-6 grid gap-6 lg:grid-cols-[1fr_320px]'>
          <section className='premium-card flex min-h-[520px] flex-col rounded-2xl p-4 sm:p-5'>
            <div className='mb-4 grid gap-4 rounded-2xl border border-emerald-400/15 bg-gradient-to-br from-emerald-500/10 to-white/[0.03] p-3 sm:grid-cols-[190px_1fr] sm:p-4'>
              <div className={`relative aspect-video overflow-hidden rounded-xl border bg-slate-950 ${isCoachSpeaking ? 'border-emerald-300 shadow-[0_0_26px_rgba(52,211,153,0.35)]' : 'border-white/10'}`}>
                <video ref={coachVideoRef} src={femaleInterviewerVideo} autoPlay muted playsInline loop className='h-full w-full object-cover' />
                <div className='absolute inset-x-2 bottom-2 rounded-lg bg-black/55 px-2 py-1.5 text-xs font-semibold text-white backdrop-blur'>
                  {isCoachSpeaking ? 'Speaking...' : 'English Coach'}
                </div>
              </div>
              <div className='flex flex-col justify-center'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300'>Your virtual tutor</p>
                <h2 className='mt-2 text-xl font-semibold text-white'>Let’s have a real conversation.</h2>
                <p className='mt-2 text-sm leading-6 text-emerald-100/65'>Tap the microphone, speak naturally, and I’ll listen, reply, and gently correct your English.</p>
              </div>
            </div>
            <div className='flex items-center justify-between border-b border-white/10 pb-4'>
              <div>
                <p className='text-sm font-semibold text-white'>Conversation practice</p>
                <p className='mt-1 text-xs text-emerald-100/50'>Speak or type in English</p>
              </div>
              <span className='flex items-center gap-2 text-xs text-emerald-300'><span className='h-2 w-2 rounded-full bg-emerald-400' /> Coach ready</span>
            </div>

            <div className='flex-1 space-y-4 overflow-y-auto py-5'>
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-emerald-500/20 text-emerald-50' : 'rounded-bl-md bg-white/5 text-emerald-100/80'}`}>
                    <p>{message.content}</p>
                    {message.role === 'assistant' && (
                      <button onClick={() => speak(message.content)} className='mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200'>
                        <Volume2 size={13} /> Listen
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && <p className='text-sm text-emerald-100/50'>Coach is thinking...</p>}
            </div>

            <form onSubmit={sendMessage} className='flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row'>
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder='Say something in English...' className='soft-input min-w-0 flex-1 rounded-xl px-4 py-3 text-sm' />
              <div className='flex gap-2'>
                <button type='button' onClick={isListening ? () => recognitionRef.current?.stop() : startListening} className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold sm:flex-none ${isListening ? 'bg-red-500 text-white' : 'btn-dark'}`}>
                  {isListening ? <MicOff size={17} /> : <Mic size={17} />} <span className='sm:hidden'>{isListening ? 'Stop' : 'Speak'}</span>
                </button>
                <button type='submit' disabled={!input.trim() || isLoading} className='btn-primary inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50 sm:flex-none'>
                  <Send size={17} /> Send
                </button>
              </div>
            </form>
            {error && <p className='mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200'>{error}</p>}
          </section>

          <aside className='space-y-4'>
            <div className='premium-card rounded-2xl p-5'>
              <div className='flex items-center gap-2 text-sm font-semibold'><CheckCircle2 size={17} className='text-emerald-300' /> Your feedback</div>
              {lastFeedback ? (
                <div className='mt-4 space-y-4 text-sm'>
                  <div><p className='text-xs uppercase tracking-wider text-emerald-100/45'>What you said</p><p className='mt-1 text-emerald-100/80'>{lastFeedback.correctedSentence}</p></div>
                  <div><p className='text-xs uppercase tracking-wider text-emerald-100/45'>Correction</p><p className='mt-1 text-emerald-100/70'>{lastFeedback.explanation}</p></div>
                  <div className='rounded-xl border border-emerald-400/15 bg-emerald-500/10 p-3'><p className='text-xs uppercase tracking-wider text-emerald-200/60'>Better phrase</p><p className='mt-1 font-semibold text-emerald-100'>{lastFeedback.betterPhrase}</p></div>
                  <div><p className='text-xs uppercase tracking-wider text-emerald-100/45'>Pronunciation tips</p><div className='mt-2 grid gap-2'>{(lastFeedback.pronunciationTips || []).map((tip) => <p key={tip} className='flex gap-2 text-xs leading-5 text-emerald-100/70'><Lightbulb size={14} className='mt-0.5 shrink-0 text-amber-300' />{tip}</p>)}</div></div>
                </div>
              ) : <p className='mt-4 text-sm leading-6 text-emerald-100/60'>Your corrections, useful phrases, and pronunciation tips will appear here after you speak.</p>}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default EnglishCoach
