import React, { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { BsRobot } from 'react-icons/bs'
import { IoSparkles } from 'react-icons/io5'
import axios from 'axios'
import { serverUrl } from '../utils/api'
import { useNavigate } from 'react-router-dom'

const cardAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setStatus('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setStatus('')

    try {
      if (mode === 'register') {
        if (!name || !email || !password || !confirmPassword) {
          throw new Error('Fill all registration fields.')
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }
        const result = await axios.post(
          `${serverUrl}/api/auth/register`,
          { name, email, password },
          { withCredentials: true }
        )
        localStorage.setItem('interviewiq-user', JSON.stringify(result.data.user))
        navigate('/home')
        return
      }

      if (mode === 'login') {
        if (!email || !password) {
          throw new Error('Enter email and password.')
        }
        const result = await axios.post(
          `${serverUrl}/api/auth/login`,
          { email, password },
          { withCredentials: true }
        )
        localStorage.setItem('interviewiq-user', JSON.stringify(result.data.user))
        navigate('/home')
        return
      }

      if (mode === 'forgot') {
        if (!email || !password) {
          throw new Error('Enter email and new password.')
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }
        await axios.post(
          `${serverUrl}/api/auth/forgot-password`,
          { email, newPassword: password },
          { withCredentials: true }
        )
        setStatus('Password updated successfully. Please login with your new password.')
        setMode('login')
        return
      }
    } catch (error) {
      setStatus(error?.response?.data?.message || error.message || 'Authentication failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsLoading(true)
    setStatus('')

    try {
      const result = await axios.post(`${serverUrl}/api/auth/demo`, {}, { withCredentials: true })
      localStorage.setItem('interviewiq-user', JSON.stringify(result.data.user))
      navigate('/home')
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Demo login failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Motion.div className='app-shell flex min-h-screen w-full items-center justify-center px-6 py-20'>
      <Motion.div
        className='premium-card w-full max-w-md rounded-3xl p-8'
        initial={cardAnimation.initial}
        animate={cardAnimation.animate}
        transition={cardAnimation.transition}
      >
        <div className='mb-6 flex items-center justify-between gap-3'>
          <div className='btn-dark rounded-lg p-2'>
            <BsRobot size={18} />
          </div>
          <div>
            <h2 className='text-lg font-semibold'>InterviewIQ</h2>
            <p className='text-sm text-slate-500'>Use email and password to sign in.</p>
          </div>
        </div>

        <div className='mb-6 grid grid-cols-3 gap-2'>
          {['login', 'register', 'forgot'].map((item) => (
            <button
              key={item}
              type='button'
              onClick={() => {
                setMode(item)
                resetForm()
              }}
              className={`rounded-full py-2 text-sm font-semibold ${mode === item ? 'btn-dark' : 'premium-card-muted text-slate-600'}`}
            >
              {item === 'forgot' ? 'Forgot' : item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {mode === 'register' && (
            <label className='block text-sm font-semibold text-slate-700'>
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className='soft-input mt-2 w-full rounded-xl px-4 py-3'
                placeholder='Your name'
              />
            </label>
          )}

          <label className='block text-sm font-semibold text-slate-700'>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className='soft-input mt-2 w-full rounded-xl px-4 py-3'
              placeholder='you@example.com'
              type='email'
            />
          </label>

          <label className='block text-sm font-semibold text-slate-700'>
            {mode === 'forgot' ? 'New Password' : 'Password'}
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className='soft-input mt-2 w-full rounded-xl px-4 py-3'
              placeholder='Password'
              type='password'
            />
          </label>

          {(mode === 'register' || mode === 'forgot') && (
            <label className='block text-sm font-semibold text-slate-700'>
              Confirm Password
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className='soft-input mt-2 w-full rounded-xl px-4 py-3'
                placeholder='Confirm password'
                type='password'
              />
            </label>
          )}

          <button
            type='submit'
            disabled={isLoading}
            className='btn-primary w-full rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isLoading
              ? 'Processing...'
              : mode === 'register'
              ? 'Register'
              : mode === 'forgot'
              ? 'Reset Password'
              : 'Login'}
          </button>
        </form>

        <button
          onClick={handleDemoLogin}
          className='btn-ghost mt-4 w-full rounded-full py-3 text-sm font-semibold text-slate-700'
        >
          Continue as demo candidate
        </button>

        {status && <p className='mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600'>{status}</p>}
      </Motion.div>
    </Motion.div>
  )
}

export default Auth
