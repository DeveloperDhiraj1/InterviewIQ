import React from 'react'
import { motion as Motion } from 'framer-motion'
import { BsRobot } from 'react-icons/bs'
import { IoSparkles } from 'react-icons/io5'
import { FcGoogle } from 'react-icons/fc'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../utils/firebse'
import axios from 'axios'
import { serverUrl } from '../App'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const cardAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

function Auth() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true)
      setStatus('')
      const response = await signInWithPopup(auth, provider)
      const user = response.user
      const name = user.displayName
      const email = user.email

      const result = await axios.post(
        `${serverUrl}/api/auth/google`,
        { name, email },
        { withCredentials: true }
      )

      localStorage.setItem('interviewiq-user', JSON.stringify(result.data.user))
      navigate('/home')
    } catch (error) {
      console.error('Google authentication failed:', error)
      setStatus(error?.response?.data?.message || error.message || 'Google authentication failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const continueAsDemo = () => {
    setIsLoading(true)
    setStatus('')
    axios
      .post(`${serverUrl}/api/auth/demo`, {}, { withCredentials: true })
      .then(({ data }) => {
        localStorage.setItem('interviewiq-user', JSON.stringify(data.user))
        navigate('/home')
      })
      .catch((error) => setStatus(error?.response?.data?.message || 'Demo login failed.'))
      .finally(() => setIsLoading(false))
  }

  return (
    <Motion.div className='w-full min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20'>
      <Motion.div
        className='w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl'
        initial={cardAnimation.initial}
        animate={cardAnimation.animate}
        transition={cardAnimation.transition}
      >
        <div className='mb-6 flex items-center justify-center gap-3'>
          <div className='rounded-lg bg-black p-2 text-white'>
            <BsRobot size={18} />
          </div>
          <h2 className='text-lg font-semibold'>Interview.AI</h2>
        </div>
        <h1 className='mb-4 text-center text-2xl font-semibold leading-snug md:text-3xl'>
          Continue with{' '}
          <span className='inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-green-600'>
            <IoSparkles size={16} />
            AI Smart Interview
          </span>
        </h1>
        <p className='mb-8 text-center text-sm leading-relaxed text-gray-500 md:text-base'>
          Sign in to start AI-powered mock interviews, track your progress, and unlock detailed performance insights.
        </p>

        <Motion.button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          whileHover={{ opacity: 0.9, scale: 1.03 }}
          whileTap={{ opacity: 1, scale: 0.98 }}
          className='flex w-full items-center justify-center gap-3 rounded-full bg-black py-3 text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60'
        >
          <FcGoogle size={25} />
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </Motion.button>
        <button
          onClick={continueAsDemo}
          className='mt-3 w-full rounded-full border border-gray-200 py-3 text-sm font-semibold text-gray-700'
        >
          Continue as demo candidate
        </button>
        {status && <p className='mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600'>{status}</p>}
      </Motion.div>
    </Motion.div>
  )
}

export default Auth
