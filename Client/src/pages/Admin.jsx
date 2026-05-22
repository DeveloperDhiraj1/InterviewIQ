import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiActivity,
  FiBell,
  FiCpu,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiLock,
  FiMoon,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiSun,
  FiTag,
  FiUsers,
} from 'react-icons/fi'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../utils/api'

const navItems = [
  ['dashboard', FiGrid, 'Dashboard'],
  ['users', FiUsers, 'Users'],
  ['payments', FiCreditCard, 'Payments'],
  ['coupons', FiTag, 'Coupons'],
  ['interviews', FiActivity, 'Interviews'],
  ['reports', FiFileText, 'Reports'],
  ['resumes', FiFileText, 'Resumes'],
  ['ai', FiCpu, 'AI Settings'],
  ['analytics', FiActivity, 'Analytics'],
  ['announcements', FiBell, 'Announcements'],
  ['security', FiLock, 'Settings'],
]

const emptyState = {
  overview: { stats: {}, charts: { daily: [] } },
  users: [],
  payments: [],
  coupons: [],
  interviews: [],
  reports: [],
  resumes: [],
  analytics: {},
  settings: null,
  announcements: [],
  security: { logs: [], bannedUsers: [], blockedIps: [] },
}

function Admin() {
  const [active, setActive] = useState('dashboard')
  const [dark, setDark] = useState(false)
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [data, setData] = useState(emptyState)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [couponForm, setCouponForm] = useState({ code: '', discountAmount: 75, discountType: 'dynamic', usageLimit: 100, expiresAt: '' })
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' })

  const loadAdmin = async (query = search) => {
    try {
      setLoading(true)
      setMessage('')
      const [overview, users, payments, coupons, interviews, reports, resumes, analytics, settings, announcements, security] = await Promise.all([
        api.get('/api/admin/overview'),
        api.get('/api/admin/users', { params: { search: query } }),
        api.get('/api/admin/payments'),
        api.get('/api/admin/coupons'),
        api.get('/api/admin/interviews'),
        api.get('/api/admin/reports'),
        api.get('/api/admin/resumes'),
        api.get('/api/admin/analytics'),
        api.get('/api/admin/settings'),
        api.get('/api/admin/announcements'),
        api.get('/api/admin/security'),
      ])

      setData({
        overview: overview.data,
        users: users.data.users || [],
        payments: payments.data.payments || [],
        coupons: coupons.data.coupons || [],
        interviews: interviews.data.interviews || [],
        reports: reports.data.reports || [],
        resumes: resumes.data.resumes || [],
        analytics: analytics.data || {},
        settings: settings.data.settings,
        announcements: announcements.data.announcements || [],
        security: security.data || emptyState.security,
      })
      setAdminUnlocked(true)
      return true
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Admin access failed. Login as an admin user.')
      setAdminUnlocked(false)
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (event) => {
    event.preventDefault()
    try {
      setLoading(true)
      setMessage('')
      const result = await api.post('/api/auth/login', { email: adminEmail, password: adminPassword })
      if (!result.data.user?.isAdmin) {
        setAdminUnlocked(false)
        setMessage('This email is not an admin account.')
        return
      }
      localStorage.setItem('interviewiq-user', JSON.stringify(result.data.user))
      await loadAdmin('')
    } catch (error) {
      setAdminUnlocked(false)
      setMessage(error?.response?.data?.message || 'Admin login failed.')
    } finally {
      setLoading(false)
    }
  }

  const stats = data.overview?.stats || {}
  const daily = data.overview?.charts?.daily || []
  const shell = dark ? 'min-h-screen bg-slate-950 text-slate-100' : 'app-shell min-h-screen text-slate-950'
  const panel = dark ? 'border border-slate-800 bg-slate-900 text-slate-100' : 'premium-card'
  const mutedPanel = dark ? 'border border-slate-800 bg-slate-900/70 text-slate-200' : 'premium-card-muted'
  const input = dark ? 'rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white' : 'soft-input rounded-lg px-3 py-2 text-sm'

  const updateUser = async (userId, updates) => {
    const { data: result } = await api.patch(`/api/admin/users/${userId}`, updates)
    setData((current) => ({ ...current, users: current.users.map((user) => (user._id === userId ? result.user : user)) }))
  }

  const updateSettings = async (updates) => {
    const { data: result } = await api.patch('/api/admin/settings', updates)
    setData((current) => ({ ...current, settings: result.settings }))
    setMessage('AI settings updated.')
  }

  const createCoupon = async (event) => {
    event.preventDefault()
    const { data: result } = await api.post('/api/admin/coupons', couponForm)
    setData((current) => ({ ...current, coupons: [result.coupon, ...current.coupons] }))
    setCouponForm({ code: '', discountAmount: 1, usageLimit: 100, expiresAt: '' })
  }

  const updateCoupon = async (couponId, updates) => {
    const { data: result } = await api.patch(`/api/admin/coupons/${couponId}`, updates)
    setData((current) => ({ ...current, coupons: current.coupons.map((coupon) => (coupon._id === couponId ? result.coupon : coupon)) }))
  }

  const createAnnouncement = async (event) => {
    event.preventDefault()
    const { data: result } = await api.post('/api/admin/announcements', announcementForm)
    setData((current) => ({ ...current, announcements: [result.announcement, ...current.announcements] }))
    setAnnouncementForm({ title: '', message: '' })
  }

  const commonRoles = useMemo(() => data.analytics?.roles || [], [data.analytics])

  if (!adminUnlocked) {
    return (
      <main className='app-shell flex min-h-screen items-center justify-center px-4 py-10'>
        <section className='premium-card w-full max-w-md rounded-2xl p-6'>
          <p className='text-sm font-semibold uppercase text-emerald-600'>InterviewIQ Admin</p>
          <h1 className='mt-2 text-3xl font-semibold'>Admin sign in</h1>
          <p className='mt-2 text-sm leading-6 text-slate-500'>
            Enter admin email and password to open the control panel.
          </p>

          <form onSubmit={handleAdminLogin} className='mt-6 grid gap-4'>
            <label className='grid gap-2 text-sm font-semibold text-slate-700'>
              Admin email
              <input
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                type='email'
                placeholder='admin@example.com'
                className='soft-input rounded-xl px-4 py-3'
                required
              />
            </label>
            <label className='grid gap-2 text-sm font-semibold text-slate-700'>
              Password
              <input
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                type='password'
                placeholder='Admin password'
                className='soft-input rounded-xl px-4 py-3'
                required
              />
            </label>
            <button disabled={loading} className='btn-primary rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60'>
              {loading ? 'Verifying...' : 'Open admin panel'}
            </button>
          </form>

          {message && <p className='mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700'>{message}</p>}
          <Link to='/' className='mt-4 block text-center text-sm font-semibold text-slate-500'>
            Back to app
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className={shell}>
      <div className='grid min-h-screen lg:grid-cols-[270px_1fr]'>
        <aside className={`${dark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white/80'} border-r p-5 lg:sticky lg:top-0 lg:h-screen`}>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase text-emerald-500'>InterviewIQ</p>
              <h1 className='text-2xl font-semibold'>Admin Panel</h1>
            </div>
            <button onClick={() => setDark((value) => !value)} className='rounded-lg border border-slate-200 p-2'>
              {dark ? <FiSun /> : <FiMoon />}
            </button>
          </div>

          <nav className='mt-8 grid gap-1'>
            {navItems.map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold ${active === id ? 'bg-emerald-500 text-white' : dark ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Icon /> {label}
              </button>
            ))}
          </nav>

          <Link to='/' className={`mt-8 block rounded-lg px-3 py-2 text-sm font-semibold ${dark ? 'bg-slate-900' : 'bg-slate-100'}`}>
            Back to app
          </Link>
        </aside>

        <section className='p-4 sm:p-6'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <p className='text-sm font-semibold text-emerald-500'>Production control center</p>
              <h2 className='text-3xl font-semibold'>AI SaaS operations</h2>
            </div>
            <button onClick={() => loadAdmin()} className='btn-dark inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold'>
              <FiRefreshCw /> {loading ? 'Syncing...' : 'Refresh'}
            </button>
          </div>

          {message && <p className='mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900'>{message}</p>}

          {active === 'dashboard' && (
            <div className='mt-6 grid gap-5'>
              <div className='grid gap-4 md:grid-cols-3 xl:grid-cols-6'>
                {[
                  ['Total users', stats.totalUsers || 0],
                  ['Active users', stats.activeUsers || 0],
                  ['Interviews', stats.totalInterviews || 0],
                  ['Revenue', `₹${stats.totalRevenue || 0}`],
                  ['Credits sold', stats.creditsSold || 0],
                  ['Completed', stats.completedInterviews || 0],
                ].map(([label, value]) => (
                  <div key={label} className={`${panel} rounded-xl p-4`}>
                    <p className='text-xs font-semibold uppercase text-slate-500'>{label}</p>
                    <p className='mt-2 text-3xl font-semibold'>{value}</p>
                  </div>
                ))}
              </div>

              <div className={`${panel} rounded-xl p-5`}>
                <h3 className='text-lg font-semibold'>Daily platform analytics</h3>
                <div className='mt-4 h-80'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={daily}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='date' />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type='monotone' dataKey='users' stroke='#10b981' fill='#10b981' fillOpacity={0.15} />
                      <Area type='monotone' dataKey='interviews' stroke='#6366f1' fill='#6366f1' fillOpacity={0.12} />
                      <Area type='monotone' dataKey='revenue' stroke='#f59e0b' fill='#f59e0b' fillOpacity={0.12} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {active === 'users' && (
            <AdminTable title='User management' panel={panel}>
              <form onSubmit={(event) => { event.preventDefault(); loadAdmin(search) }} className='mb-4 flex gap-2'>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Search name or email' className={input} />
                <button className='btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold'><FiSearch /> Search</button>
              </form>
              <div className='overflow-x-auto'>
                <table className='w-full text-left text-sm'>
                  <thead className='text-xs uppercase text-slate-500'><tr><th className='p-3'>User</th><th>Credits</th><th>Status</th><th>Role</th><th>Actions</th></tr></thead>
                  <tbody>
                    {data.users.map((user) => (
                      <tr key={user._id} className='border-t border-slate-200/60'>
                        <td className='p-3'><p className='font-semibold'>{user.name}</p><p className='text-slate-500'>{user.email}</p></td>
                        <td>{user.credits}</td>
                        <td>{user.isBanned ? 'Banned' : 'Active'}</td>
                        <td>{user.isAdmin ? 'Admin' : 'User'}</td>
                        <td className='flex flex-wrap gap-2 py-3'>
                          <button onClick={() => updateUser(user._id, { creditDelta: 10 })} className='rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white'>+10 credits</button>
                          <button onClick={() => updateUser(user._id, { creditDelta: -10 })} className='rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700'>-10 credits</button>
                          <button onClick={() => updateUser(user._id, { isBanned: !user.isBanned })} className='rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white'>{user.isBanned ? 'Unban' : 'Ban'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminTable>
          )}

          {active === 'payments' && (
            <AdminTable title='Payment management' panel={panel}>
              <div className='overflow-x-auto'>
                <table className='w-full text-left text-sm'>
                  <thead className='text-xs uppercase text-slate-500'><tr><th className='p-3'>User</th><th>Plan</th><th>Amount</th><th>Status</th><th>Order ID</th><th>Payment ID</th></tr></thead>
                  <tbody>{data.payments.map((payment) => <tr key={payment._id} className='border-t border-slate-200/60'><td className='p-3'>{payment.user?.email || 'Unknown'}</td><td>{payment.plan || '-'}</td><td>₹{payment.amount || 0}</td><td>{payment.status}</td><td>{payment.razorpayOrderId || '-'}</td><td>{payment.razorpayPaymentId || '-'}</td></tr>)}</tbody>
                </table>
              </div>
            </AdminTable>
          )}

          {active === 'coupons' && (
            <AdminTable title='Coupon management' panel={panel}>
              <form onSubmit={createCoupon} className='mb-5 grid gap-3 md:grid-cols-5'>
                <input value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value })} placeholder='Auto or custom code' className={input} />
                <input type='number' value={couponForm.discountAmount} onChange={(event) => setCouponForm({ ...couponForm, discountAmount: event.target.value })} className={input} />
                <select value={couponForm.discountType} onChange={(event) => setCouponForm({ ...couponForm, discountType: event.target.value })} className={input}>
                  <option value='fixed'>Fixed amount</option>
                  <option value='dynamic'>Percentage</option>
                </select>
                <input type='number' value={couponForm.usageLimit} onChange={(event) => setCouponForm({ ...couponForm, usageLimit: event.target.value })} className={input} />
                <input type='date' value={couponForm.expiresAt} onChange={(event) => setCouponForm({ ...couponForm, expiresAt: event.target.value })} className={input} />
                <button className='btn-primary rounded-lg px-4 py-2 text-sm font-semibold'>Create coupon</button>
              </form>
              <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                {data.coupons.map((coupon) => (
                  <div key={coupon._id} className={`${mutedPanel} rounded-xl p-4`}>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-xl font-semibold'>{coupon.code}</h3>
                      <button onClick={() => updateCoupon(coupon._id, { active: !coupon.active })} className='rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-700'>{coupon.active ? 'Active' : 'Inactive'}</button>
                    </div>
                    <p className='mt-2 text-sm text-slate-500'>
                      {coupon.discountType === 'dynamic' ? `${coupon.discountAmount}% off` : `₹${coupon.discountAmount} off`} | {coupon.usedCount}/{coupon.usageLimit} used
                    </p>
                  </div>
                ))}
              </div>
            </AdminTable>
          )}

          {active === 'interviews' && <InterviewList panel={panel} interviews={data.interviews} />}
          {active === 'reports' && <ReportList panel={panel} reports={data.reports} />}
          {active === 'resumes' && (
            <AdminTable title='Resume analytics' panel={panel}>
              <div className='grid gap-3'>
                {data.resumes.map((resume) => (
                  <div key={resume._id} className={`${mutedPanel} rounded-xl p-4 text-sm`}>
                    <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                      <div>
                        <p className='font-semibold'>{resume.user?.email || 'Unknown user'} | {resume.role || 'Role unknown'}</p>
                        <p className='mt-1 text-slate-500'>{resume.experience || 'Experience not specified'}</p>
                        <p className='mt-2 leading-6'>{resume.summary}</p>
                      </div>
                      <p className='rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700'>{resume.score || 0}/100</p>
                    </div>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {(resume.skills || []).slice(0, 10).map((skill) => <span key={skill} className='rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'>{skill}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </AdminTable>
          )}

          {active === 'analytics' && (
            <div className='mt-6 grid gap-5 xl:grid-cols-2'>
              <div className={`${panel} rounded-xl p-5`}><h3 className='font-semibold'>Most common job roles</h3><div className='mt-4 h-72'><ResponsiveContainer><BarChart data={commonRoles}><CartesianGrid strokeDasharray='3 3' /><XAxis dataKey='_id' /><YAxis /><Tooltip /><Bar dataKey='count' fill='#10b981' /></BarChart></ResponsiveContainer></div></div>
              <div className={`${panel} rounded-xl p-5`}><h3 className='font-semibold'>Readiness trends</h3><p className='mt-4 text-4xl font-semibold'>{data.analytics.averageScore || 0}/10</p><p className='text-sm text-slate-500'>Average score | Voice confidence {data.analytics.averageVoiceConfidence || 0}/10</p><div className='mt-5 grid gap-2'>{(data.analytics.weakSkills || []).map((item) => <p key={item._id} className='rounded-lg bg-slate-100 p-3 text-sm text-slate-700'>{item._id} ({item.count})</p>)}</div></div>
            </div>
          )}

          {active === 'ai' && (
            <AdminTable title='AI control panel' panel={panel}>
              <div className='grid gap-4 md:grid-cols-3'>
                <label className='grid gap-2 text-sm font-semibold'>Provider<select value={data.settings?.aiProvider || 'gemini'} onChange={(event) => updateSettings({ aiProvider: event.target.value })} className={input}><option value='openai'>OpenAI</option><option value='gemini'>Gemini</option><option value='fallback'>Fallback</option></select></label>
                <label className='grid gap-2 text-sm font-semibold'>Questions<input type='number' value={data.settings?.questionCount || 15} onChange={(event) => updateSettings({ questionCount: event.target.value })} className={input} /></label>
                <label className='grid gap-2 text-sm font-semibold'>Credits per interview<input type='number' value={data.settings?.creditsPerInterview || 10} onChange={(event) => updateSettings({ creditsPerInterview: event.target.value })} className={input} /></label>
              </div>
            </AdminTable>
          )}

          {active === 'announcements' && (
            <AdminTable title='Announcements' panel={panel}>
              <form onSubmit={createAnnouncement} className='grid gap-3 md:grid-cols-[240px_1fr_140px]'>
                <input value={announcementForm.title} onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })} placeholder='Title' className={input} />
                <input value={announcementForm.message} onChange={(event) => setAnnouncementForm({ ...announcementForm, message: event.target.value })} placeholder='New AI model update available' className={input} />
                <button className='btn-primary rounded-lg px-4 py-2 text-sm font-semibold'>Send</button>
              </form>
              <div className='mt-5 grid gap-3'>{data.announcements.map((item) => <div key={item._id} className={`${mutedPanel} rounded-xl p-4`}><p className='font-semibold'>{item.title}</p><p className='text-sm text-slate-500'>{item.message}</p></div>)}</div>
            </AdminTable>
          )}

          {active === 'security' && (
            <AdminTable title='Security and audit logs' panel={panel}>
              <div className='grid gap-3'>{(data.security.logs || []).map((log) => <div key={log._id} className={`${mutedPanel} rounded-xl p-4 text-sm`}><p className='font-semibold'>{log.action}</p><p className='text-slate-500'>{log.admin?.email || 'System'} | {log.ip || 'No IP'} | {new Date(log.createdAt).toLocaleString()}</p></div>)}</div>
            </AdminTable>
          )}
        </section>
      </div>
    </main>
  )
}

function AdminTable({ title, panel, children }) {
  return <section className={`${panel} mt-6 rounded-xl p-5`}><h3 className='mb-5 text-xl font-semibold'>{title}</h3>{children}</section>
}

function InterviewList({ panel, interviews }) {
  return <AdminTable title='Interview analytics' panel={panel}><div className='grid gap-3'>{interviews.map((interview) => <div key={interview._id} className='rounded-xl bg-slate-100 p-4 text-sm text-slate-700'><div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'><div><p className='font-semibold'>{interview.role}</p><p>{interview.user?.email || 'Unknown'} | {interview.type} | {interview.status}</p></div><p className='text-xl font-semibold'>{interview.overallScore || 0}/10</p></div></div>)}</div></AdminTable>
}

function ReportList({ panel, reports }) {
  return <AdminTable title='Report management' panel={panel}><div className='grid gap-4'>{reports.map((interview) => <div key={interview._id} className='rounded-xl bg-slate-100 p-4 text-sm text-slate-700'><div className='flex flex-col gap-2 md:flex-row md:justify-between'><div><p className='font-semibold'>{interview.user?.email || 'Unknown'} | {interview.role}</p><p className='mt-2'>{interview.report?.summary}</p></div><p className='text-2xl font-semibold'>{interview.report?.overallScore || interview.overallScore || 0}/10</p></div><div className='mt-3 grid gap-2 md:grid-cols-2'><p><b>Strengths:</b> {(interview.report?.strengths || []).join(', ')}</p><p><b>Weaknesses:</b> {(interview.report?.weaknesses || []).join(', ')}</p></div></div>)}</div></AdminTable>
}

export default Admin
