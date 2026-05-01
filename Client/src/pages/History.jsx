import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiBarChart2, FiClock, FiTarget } from 'react-icons/fi'
import api from '../utils/api'

function History() {
  const [interviews, setInterviews] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    api
      .get('/api/interviews/history')
      .then(({ data }) => setInterviews(data.interviews))
      .catch((error) => setMessage(error?.response?.data?.message || 'Sign in to view saved interview history.'))
  }, [])

  const average = interviews.length ? Math.round(interviews.reduce((sum, item) => sum + item.overallScore, 0) / interviews.length) : 0
  const completed = interviews.filter((item) => item.status === 'completed').length

  return (
    <main className='min-h-screen bg-[#f5f7fb] px-4 py-6 text-slate-900 sm:px-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-6 flex items-center justify-between'>
          <Link to='/' className='inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-50'>
            <FiArrowLeft /> Dashboard
          </Link>
          <Link to='/interview' className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm'>
            New interview
          </Link>
        </div>

        <section className='rounded-2xl bg-slate-950 p-6 text-white shadow-xl md:p-8'>
          <p className='text-sm font-semibold text-emerald-300'>Reports</p>
          <h1 className='mt-2 text-4xl font-semibold'>Interview History</h1>
          <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-300'>
            Review generated rounds, scores, feedback, and completion state in one clean workspace.
          </p>
        </section>

        <section className='mt-6 grid gap-4 md:grid-cols-3'>
          {[
            [FiBarChart2, 'Average score', average],
            [FiClock, 'Total sessions', interviews.length],
            [FiTarget, 'Completed', completed],
          ].map(([Icon, label, value]) => (
            <div key={label} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
              <Icon className='text-emerald-500' />
              <p className='mt-4 text-sm text-slate-500'>{label}</p>
              <p className='text-4xl font-semibold'>{value}</p>
            </div>
          ))}
        </section>

        {message && <p className='mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>{message}</p>}

        <section className='mt-6 grid gap-4'>
          {interviews.map((interview) => (
            <article key={interview._id} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
              <div className='flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between'>
                <div>
                  <h2 className='text-xl font-semibold'>{interview.role}</h2>
                  <p className='text-sm text-slate-500'>
                    {interview.type} round | {interview.level} level | {new Date(interview.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className='rounded-xl bg-slate-100 px-4 py-3 text-center'>
                  <p className='text-xs font-semibold uppercase text-slate-500'>Score</p>
                  <p className='text-3xl font-semibold'>{interview.overallScore || 0}</p>
                </div>
              </div>
              <div className='mt-4 grid gap-3'>
                {interview.questions.map((item, index) => (
                  <div key={item.question} className='rounded-xl bg-slate-100 p-4 text-sm'>
                    <p className='font-semibold'>Q{index + 1}. {item.question}</p>
                    <p className='mt-2 leading-6 text-slate-600'>{item.feedback || 'Not answered yet'}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

export default History
