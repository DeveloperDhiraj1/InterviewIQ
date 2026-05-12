import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiBarChart2, FiCheckCircle, FiCreditCard, FiRefreshCw, FiSearch, FiShield, FiUsers } from 'react-icons/fi'
import api from '../utils/api'

function Admin() {
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [interviews, setInterviews] = useState([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const loadAdmin = async (query = '') => {
    try {
      setLoading(true)
      setMessage('')
      const [overviewResult, usersResult, interviewsResult] = await Promise.all([
        api.get('/api/admin/overview'),
        api.get('/api/admin/users', { params: { search: query } }),
        api.get('/api/admin/interviews'),
      ])
      setOverview(overviewResult.data)
      setUsers(usersResult.data.users)
      setInterviews(interviewsResult.data.interviews)
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Admin access failed. Login as an admin user.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    const loadInitialAdmin = async () => {
      try {
        setLoading(true)
        setMessage('')
        const [overviewResult, usersResult, interviewsResult] = await Promise.all([
          api.get('/api/admin/overview'),
          api.get('/api/admin/users'),
          api.get('/api/admin/interviews'),
        ])

        if (!ignore) {
          setOverview(overviewResult.data)
          setUsers(usersResult.data.users)
          setInterviews(interviewsResult.data.interviews)
        }
      } catch (error) {
        if (!ignore) setMessage(error?.response?.data?.message || 'Admin access failed. Login as an admin user.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadInitialAdmin()

    return () => {
      ignore = true
    }
  }, [])

  const updateUser = async (userId, updates) => {
    try {
      setMessage('')
      const { data } = await api.patch(`/api/admin/users/${userId}`, updates)
      setUsers((current) => current.map((user) => (user._id === userId ? data.user : user)))
      setMessage('User updated successfully.')
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Could not update user.')
    }
  }

  const stats = overview?.stats || {
    totalUsers: 0,
    totalInterviews: 0,
    completedInterviews: 0,
    activeInterviews: 0,
    totalCredits: 0,
  }

  return (
    <main className='app-shell px-4 py-6 sm:px-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-6 flex items-center justify-between'>
          <Link to='/' className='btn-ghost inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white'>
            <FiArrowLeft /> Dashboard
          </Link>
          <button onClick={() => loadAdmin(search)} className='btn-dark inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold'>
            <FiRefreshCw /> Refresh
          </button>
        </div>

        <section className='hero-panel rounded-2xl p-6 text-white md:p-8'>
          <p className='text-sm font-semibold text-emerald-300'>Admin control center</p>
          <h1 className='mt-2 text-4xl font-semibold leading-tight'>Manage InterviewIQ operations.</h1>
          <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-300'>
            Monitor users, interviews, credits, completion state, and platform activity from one premium workspace.
          </p>
        </section>

        {message && <p className='mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900'>{message}</p>}

        <section className='mt-6 grid gap-4 md:grid-cols-5'>
          {[
            [FiUsers, 'Users', stats.totalUsers],
            [FiBarChart2, 'Interviews', stats.totalInterviews],
            [FiCheckCircle, 'Completed', stats.completedInterviews],
            [FiRefreshCw, 'Active', stats.activeInterviews],
            [FiCreditCard, 'Credits', stats.totalCredits],
          ].map(([Icon, label, value]) => (
            <div key={label} className='premium-card rounded-2xl p-5'>
              {React.createElement(Icon, { className: 'text-emerald-500' })}
              <p className='mt-4 text-sm text-slate-500'>{label}</p>
              <p className='text-3xl font-semibold'>{value}</p>
            </div>
          ))}
        </section>

        <section className='mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]'>
          <div className='premium-card rounded-2xl p-5'>
            <div className='flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between'>
              <div>
                <p className='eyebrow'>Users</p>
                <h2 className='mt-1 text-2xl font-semibold'>Account management</h2>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  loadAdmin(search)
                }}
                className='flex gap-2'
              >
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Search users' className='soft-input w-full rounded-lg px-3 py-2 text-sm md:w-56' />
                <button className='btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold'>
                  <FiSearch /> Search
                </button>
              </form>
            </div>

            <div className='mt-5 grid gap-3'>
              {users.map((user) => (
                <article key={user._id} className='premium-card-muted rounded-xl p-4'>
                  <div className='grid gap-4 lg:grid-cols-[1fr_120px_150px_120px]'>
                    <div>
                      <p className='font-semibold'>{user.name}</p>
                      <p className='text-sm text-slate-500'>{user.email}</p>
                      <p className='mt-1 text-xs text-slate-400'>{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <label className='grid gap-1 text-xs font-semibold uppercase text-slate-500'>
                      Credits
                      <input
                        type='number'
                        min='0'
                        defaultValue={user.credits}
                        onBlur={(event) => updateUser(user._id, { credits: event.target.value })}
                        className='soft-input rounded-lg px-3 py-2 text-sm font-semibold text-slate-900'
                      />
                    </label>
                    <button
                      onClick={() => updateUser(user._id, { isAdmin: !user.isAdmin })}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${user.isAdmin ? 'chip' : 'btn-ghost text-slate-700'}`}
                    >
                      <FiShield /> {user.isAdmin ? 'Admin' : 'Make admin'}
                    </button>
                    <span className='inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-600'>
                      {user.credits} credits
                    </span>
                  </div>
                </article>
              ))}
              {!users.length && <p className='premium-card-muted rounded-xl p-4 text-sm text-slate-600'>{loading ? 'Loading users...' : 'No users found.'}</p>}
            </div>
          </div>

          <div className='premium-card rounded-2xl p-5'>
            <div className='border-b border-slate-200 pb-5'>
              <p className='eyebrow'>Interviews</p>
              <h2 className='mt-1 text-2xl font-semibold'>Recent activity</h2>
            </div>

            <div className='mt-5 grid gap-3'>
              {interviews.map((interview) => (
                <article key={interview._id} className='premium-card-muted rounded-xl p-4'>
                  <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                    <div>
                      <p className='font-semibold'>{interview.role}</p>
                      <p className='text-sm text-slate-500'>{interview.user?.name || 'Unknown user'} | {interview.type} | {interview.provider || 'local'}</p>
                      <p className='mt-1 text-xs text-slate-400'>{new Date(interview.createdAt).toLocaleString()}</p>
                    </div>
                    <div className='flex gap-2'>
                      <span className='rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-600'>{interview.status}</span>
                      <span className='rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-600'>{interview.overallScore || 0}/10</span>
                    </div>
                  </div>
                </article>
              ))}
              {!interviews.length && <p className='premium-card-muted rounded-xl p-4 text-sm text-slate-600'>{loading ? 'Loading interviews...' : 'No interviews found.'}</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Admin
