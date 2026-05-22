import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowLeft,
  FiCheck,
  FiCreditCard,
  FiTag,
} from 'react-icons/fi'

import api from '../utils/api'
import creditAsset from '../assets/credit.png'

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
    <main className='app-shell px-4 py-8'>
      <div className='mx-auto max-w-7xl'>
        <Link
          to='/'
          className='inline-flex items-center gap-2'
        >
          <FiArrowLeft />
          Dashboard
        </Link>

        <section className='hero-panel mt-6 rounded-3xl p-8 text-white'>
          <div className='grid gap-6 md:grid-cols-2'>
            <div>
              <p className='text-emerald-300 font-semibold'>
                InterviewIQ Premium
              </p>

              <h1 className='mt-3 text-5xl font-bold leading-tight'>
                Buy Interview Credits
              </h1>

              <p className='mt-4 text-slate-300'>
                Practice unlimited AI interviews
                with voice analysis and smart
                reports.
              </p>
            </div>

            <img
              src={creditAsset}
              alt=''
              className='rounded-2xl'
            />
          </div>
        </section>

        <div className='mt-6 max-w-md'>
          <label className='text-sm font-semibold'>
            Promo Code
          </label>

          <div className='mt-2 flex items-center gap-2 rounded-xl border bg-white p-3'>
            <FiTag />

            <input
              type='text'
              value={couponCode}
              onChange={(e) =>
                setCouponCode(e.target.value)
              }
              placeholder='Enter coupon code'
              className='w-full outline-none'
            />
            <button
              type='button'
              onClick={applyCoupon}
              disabled={couponLoading}
              className='rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60'
            >
              {couponLoading ? 'Checking...' : 'Apply'}
            </button>
          </div>
        </div>

        {message && (
          <div className='mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-700'>
            {message}
          </div>
        )}

        <section className='mt-8 grid gap-6 md:grid-cols-3'>
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`rounded-3xl bg-white p-6 shadow-xl ${
                index === 1
                  ? 'border-4 border-emerald-400'
                  : ''
              }`}
            >
              {index === 1 && (
                <div className='mb-4 inline-block rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold text-emerald-700'>
                  Most Popular
                </div>
              )}

              <h2 className='text-3xl font-bold'>
                {plan.name}
              </h2>

              <p className='mt-3 text-5xl font-bold'>
                {couponApplied && couponPreview[plan.id] ? (
                  <>
                    <span className='mr-2 line-through text-base font-normal text-slate-400'>₹{plan.price}</span>
                    ₹{couponPreview[plan.id].finalAmount}
                  </>
                ) : (
                  `₹${plan.price}`
                )}
              </p>

              <p className='mt-2 text-slate-500'>
                {plan.credits} Credits
              </p>

              <div className='mt-6 flex gap-2 text-sm text-slate-600'>
                <FiCheck className='mt-1 text-emerald-500' />
                {plan.bestFor}
              </div>

              <button
                onClick={() => buyPlan(plan.id)}
                disabled={loadingPlan === plan.id}
                className='mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 font-semibold text-white hover:bg-emerald-600'
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