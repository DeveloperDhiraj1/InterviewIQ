import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function Terms() {
  return (
    <main className='app-shell px-4 py-8 sm:px-6'>
      <div className='mx-auto max-w-4xl'>
        <Link to='/' className='btn-ghost inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold'>
          <ArrowLeft size={16} /> Back to app
        </Link>

        <section className='premium-card mt-6 rounded-3xl p-8'>
          <p className='eyebrow'>Legal</p>
          <h1 className='mt-2 text-3xl font-semibold text-white'>Terms of Service</h1>
          <p className='mt-4 max-w-2xl leading-7 text-emerald-100/75'>
            Use InterviewIQ responsibly for practice, feedback, and progress tracking. Access may be limited for abuse or policy violations.
          </p>
        </section>
      </div>
    </main>
  )
}

export default Terms