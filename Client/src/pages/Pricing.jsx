import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, CreditCard, FileText, ShieldCheck, Tag, WalletCards } from 'lucide-react'
import {
  FiArrowLeft,
  FiCheck,
  FiCreditCard,
  FiTag,
} from 'react-icons/fi'

import api from '../utils/api'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 49,
    bestFor: 'Resume analysis and 5 interviews',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 150,
    price: 99,
    bestFor: 'Serious placement preparation',
  },
  {
    id: 'premium',
    name: 'Premium',
    credits: 400,
    price: 149,
    bestFor: 'Campus and heavy practice',
  },
]

function Pricing() {
  const [message, setMessage] = useState('')
  const [loadingPlan, setLoadingPlan] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponPreview, setCouponPreview] = useState({})
  const [couponApplied, setCouponApplied] = useState(false)

  const syncCredits = (credits) => {
    const savedUser = localStorage.getItem('interviewiq-user')

    if (savedUser) {
      const user = JSON.parse(savedUser)

      localStorage.setItem(
        'interviewiq-user',
        JSON.stringify({
          ...user,
          credits,
        })
      )
    }
  }

  const buyPlan = async (planId) => {
    try {
      setLoadingPlan(planId)
      setMessage('')

      const { data } = await api.post('/api/payments/order', {
        plan: planId,
        couponCode,
      })

      if (!data || !data.order || !data.key || !data.plan) {
        setMessage('Unable to start payment. Please refresh and try again.')
        return
      }

      if (!data.order.id || !data.order.amount || !data.order.currency) {
        setMessage('Invalid payment order received. Please refresh and try again.')
        return
      }

      if (!window.Razorpay) {
        setMessage('Razorpay checkout is unavailable. Please check whether the payment script is loaded.')
        return
      }

      const razorpay = new window.Razorpay({
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'InterviewIQ',
        description: `${data.plan.credits} Credits`,
        image: '/logo.png',
        order_id: data.order.id,

        handler: async function (response) {
          if (!response) {
            setMessage('Payment was not completed. Please try again.')
            return
          }

          if (!response.razorpay_order_id || !response.razorpay_payment_id || !response.razorpay_signature) {
            setMessage('Incomplete payment details received. Please try again.')
            return
          }
          try {
            const verify = await api.post(
              '/api/payments/verify',
              {
                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,

                plan: planId,
              }
            )

            if (!verify?.data) {
              setMessage('Payment verification failed. Please contact support.')
              return
            }

            syncCredits(verify.data.credits)

            setMessage(
              `Payment successful. Credits: ${verify.data.credits}`
            )
          } catch (verifyError) {
            setMessage(
              verifyError?.response?.data?.message ||
                'Payment verification failed. Please try again.'
            )
          }
        },

        theme: {
          color: '#10b981',
        },
      })

      razorpay.open()
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          'Payment failed'
      )
    } finally {
      setLoadingPlan('')
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setMessage('Enter a promo code to apply it.')
      return
    }
    try {
      setCouponLoading(true)
      setMessage('')
      const validations = await Promise.all(plans.map((plan) =>
        api.post('/api/payments/validate', {
          plan: plan.id,
          couponCode,
        }).then((response) => ({ planId: plan.id, data: response.data }))
          .catch((error) => ({ planId: plan.id, error }))
      ))

      const invalid = validations.find((item) => item.error)
      if (invalid) {
        setCouponPreview({})
        setCouponApplied(false)
        setMessage(invalid.error?.response?.data?.message || 'Promo code is invalid.')
        return
      }

      const previewMap = {}
      validations.forEach((item) => {
        previewMap[item.planId] = item.data
      })
      setCouponPreview(previewMap)
      setCouponApplied(true)
      setMessage(validations[0].data.message || 'Promo code applied.')
    } catch (error) {
      setCouponPreview({})
      setCouponApplied(false)
      setMessage(error?.response?.data?.message || 'Could not validate promo code.')
    } finally {
      setCouponLoading(false)
    }
  }

  return (
    <main className='app-shell px-4 py-8 sm:px-6'>
      <div className='mx-auto max-w-7xl'>
        <Link
          to='/'
          className='btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold'
        >
          <FiArrowLeft />
          Dashboard
        </Link>

        <section className='hero-panel mt-6 overflow-hidden rounded-3xl text-white'>
          <div className='noise-grid grid gap-6 p-8 md:grid-cols-2'>
            <div>
              <p className='text-sm font-semibold text-emerald-300'>
                InterviewIQ Premium
              </p>

              <h1 className='mt-3 text-5xl font-semibold leading-tight'>
                Buy Interview Credits
              </h1>

              <p className='mt-4 max-w-xl text-emerald-100/72'>
                Practice unlimited AI interviews
                with voice analysis and smart
                reports.
              </p>

              <div className='mt-6 flex flex-wrap gap-3'>
                {[
                  ['Secure checkout', ShieldCheck],
                  ['Fast activation', BadgeCheck],
                  ['Resume-linked', FileText],
                ].map(([label, Icon]) => (
                  <span key={label} className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-emerald-100/75'>
                    {React.createElement(Icon, { size: 14, className: 'text-emerald-300' })}
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='icon-tile rounded-3xl p-6'>
                <WalletCards size={44} className='text-emerald-300' />
                <p className='mt-4 text-sm uppercase tracking-[0.24em] text-emerald-100/55'>Flexible plans</p>
              </div>
              <div className='rounded-3xl border border-white/10 bg-white/5 p-6'>
                <CreditCard size={44} className='text-emerald-300' />
                <p className='mt-4 text-sm text-emerald-100/65'>Simple pricing for sustained practice and report generation.</p>
              </div>
            </div>
          </div>
        </section>

        <div className='mt-6 max-w-md'>
          <label className='text-sm font-semibold text-emerald-100/80'>
            Promo Code
          </label>

          <div className='mt-2 flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-white/5 p-3'>
            <FiTag />

            <input
              type='text'
              value={couponCode}
              onChange={(e) =>
                setCouponCode(e.target.value)
              }
              placeholder='Enter coupon code'
              className='w-full bg-transparent outline-none placeholder:text-emerald-100/35'
            />
            <button
              type='button'
              onClick={applyCoupon}
              disabled={couponLoading}
              className='rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-emerald-400 disabled:opacity-60'
            >
              {couponLoading ? 'Checking...' : 'Apply'}
            </button>
          </div>
        </div>

        {message && (
          <div className='mt-5 rounded-xl border border-emerald-400/15 bg-emerald-500/10 p-4 text-emerald-50'>
            {message}
          </div>
        )}

        <section className='mt-8 grid gap-6 md:grid-cols-3'>
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`premium-card rounded-3xl p-6 transition-all duration-200 hover:-translate-y-0.5 ${
                index === 1
                  ? 'border-emerald-400/35 shadow-md'
                  : ''
              }`}
            >
              {index === 1 && (
                <div className='mb-4 inline-block rounded-full border border-emerald-400/15 bg-emerald-500/10 px-4 py-1 text-xs font-semibold text-emerald-100'>
                  Most Popular
                </div>
              )}

              <h2 className='text-3xl font-semibold text-white'>
                {plan.name}
              </h2>

              <p className='mt-3 text-5xl font-semibold'>
                {couponApplied && couponPreview[plan.id] ? (
                  <>
                    <span className='mr-2 text-base font-normal text-emerald-100/45 line-through'>₹{plan.price}</span>
                    ₹{couponPreview[plan.id].finalAmount}
                  </>
                ) : (
                  `₹${plan.price}`
                )}
              </p>

              <p className='mt-2 text-emerald-100/60'>
                {plan.credits} Credits
              </p>

              <div className='mt-6 flex gap-2 text-sm text-emerald-100/72'>
                <FiCheck className='mt-1 text-emerald-400' />
                {plan.bestFor}
              </div>

              <button
                onClick={() => buyPlan(plan.id)}
                disabled={loadingPlan === plan.id}
                className='mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 font-semibold text-slate-950 transition-all duration-200 hover:bg-emerald-400 disabled:opacity-60'
              >
                <FiCreditCard />

                {loadingPlan === plan.id
                  ? 'Processing...'
                  : 'Buy Now'}
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

export default Pricing