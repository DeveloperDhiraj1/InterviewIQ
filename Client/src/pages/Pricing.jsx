import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiCheck, FiCreditCard } from 'react-icons/fi'
import api from '../utils/api'
import creditAsset from '../assets/credit.png'

const plans = [
  { id: 'starter', name: 'Starter', credits: 50, price: 'Rs. 99', bestFor: 'Resume analysis and 5 interviews' },
  { id: 'pro', name: 'Pro', credits: 150, price: 'Rs. 249', bestFor: 'Serious placement preparation' },
  { id: 'premium', name: 'Premium', credits: 400, price: 'Rs. 599', bestFor: 'Campus, team, or heavy practice' },
]

function Pricing() {
  const [message, setMessage] = useState('')
  const [loadingPlan, setLoadingPlan] = useState('')

  const syncCredits = (credits) => {
    const savedUser = localStorage.getItem('interviewiq-user')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      localStorage.setItem('interviewiq-user', JSON.stringify({ ...user, credits }))
    }
  }

  const buyPlan = async (planId) => {
    try {
      setLoadingPlan(planId)
      setMessage('')
      const { data } = await api.post('/api/payments/order', { plan: planId })

      if (data.demo) {
        const verify = await api.post('/api/payments/verify', {
          plan: planId,
          demo: true,
          orderId: data.order.id,
          paymentId: 'demo_payment',
        })
        syncCredits(verify.data.credits)
        setMessage(`Demo payment complete. Credits left: ${verify.data.credits}`)
        return
      }

      const razorpay = new window.Razorpay({
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'InterviewIQ',
        description: `${data.plan.credits} credits`,
        order_id: data.order.id,
        handler: async (response) => {
          const verify = await api.post('/api/payments/verify', {
            plan: planId,
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          })
          syncCredits(verify.data.credits)
          setMessage(`Payment complete. Credits left: ${verify.data.credits}`)
        },
      })
      razorpay.open()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Payment setup failed. Sign in first.')
    } finally {
      setLoadingPlan('')
    }
  }

  return (
    <main className='app-shell px-4 py-6 sm:px-6'>
      <div className='mx-auto max-w-7xl'>
        <Link to='/' className='btn-ghost inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white'>
          <FiArrowLeft /> Dashboard
        </Link>

        <section className='hero-panel mt-6 overflow-hidden rounded-2xl text-white'>
          <div className='grid gap-6 p-6 md:grid-cols-[1fr_240px] md:p-8'>
            <div>
              <p className='text-sm font-semibold text-emerald-300'>Credits and billing</p>
              <h1 className='mt-2 max-w-3xl text-4xl font-semibold leading-tight'>Buy credits for mock interviews.</h1>
              <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-300'>
                Each generated interview uses 10 credits. Razorpay is used when keys are configured; local development uses demo credit mode.
              </p>
            </div>
            <img src={creditAsset} alt='' className='h-36 w-full rounded-xl border border-white/10 object-cover shadow-2xl md:h-full' />
          </div>
        </section>

        {message && <p className='mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800'>{message}</p>}

        <section className='mt-6 grid gap-4 md:grid-cols-3'>
          {plans.map((plan, index) => (
            <article key={plan.id} className={`premium-card rounded-2xl p-6 ${index === 1 ? 'ring-4 ring-emerald-200/70' : ''}`}>
              {index === 1 && <p className='chip mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold'>Best value</p>}
              <p className='eyebrow'>{plan.name}</p>
              <p className='mt-3 text-4xl font-semibold'>{plan.price}</p>
              <p className='mt-2 text-sm text-slate-500'>{plan.credits} credits</p>
              <div className='mt-6 flex items-start gap-2 text-sm leading-6 text-slate-600'>
                <FiCheck className='mt-1 text-emerald-500' /> {plan.bestFor}
              </div>
              <button onClick={() => buyPlan(plan.id)} disabled={loadingPlan === plan.id} className='btn-dark mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold disabled:opacity-60'>
                <FiCreditCard /> {loadingPlan === plan.id ? 'Processing...' : 'Buy credits'}
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

export default Pricing
