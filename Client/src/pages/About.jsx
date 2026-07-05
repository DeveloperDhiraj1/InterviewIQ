import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiAward, FiClock, FiGithub, FiLinkedin, FiShield, FiTrendingUp, FiTwitter } from 'react-icons/fi'
import aboutPhoto from '../assets/about.jpg'

function About() {
  return (
    <main className='app-shell text-white'>
      <section className='relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8'>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_30%)]' />
        <div className='relative mx-auto max-w-7xl'>
          <div className='grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center'>
            <div className='space-y-6'>
              <p className='inline-flex rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300'>About InterviewIQ</p>
              <h1 className='max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl'>Modern AI interview practice built for confident, career-ready performance.</h1>
              <p className='max-w-2xl text-base leading-8 text-emerald-100/72 sm:text-lg'>InterviewIQ combines resume intelligence, custom question generation, and feedback loops so you can prepare faster, speak with clarity, and track progress after every practice round.</p>
              <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                <div className='rounded-3xl border border-emerald-400/12 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur-xl'>
                  <p className='text-sm uppercase tracking-[0.3em] text-emerald-100/45'>Speed</p>
                  <p className='mt-4 text-3xl font-semibold text-white'>5 min</p>
                  <p className='mt-2 text-sm text-emerald-100/65'>Quick resume analysis</p>
                </div>
                <div className='rounded-3xl border border-emerald-400/12 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur-xl'>
                  <p className='text-sm uppercase tracking-[0.3em] text-emerald-100/45'>Focus</p>
                  <p className='mt-4 text-3xl font-semibold text-white'>15+</p>
                  <p className='mt-2 text-sm text-emerald-100/65'>Tailored AI questions</p>
                </div>
                <div className='rounded-3xl border border-emerald-400/12 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur-xl'>
                  <p className='text-sm uppercase tracking-[0.3em] text-emerald-100/45'>Feedback</p>
                  <p className='mt-4 text-3xl font-semibold text-white'>Real-time</p>
                  <p className='mt-2 text-sm text-emerald-100/65'>Voice and written review</p>
                </div>
              </div>
            </div>

            <div className='rounded-3xl border border-emerald-400/12 bg-[#061110]/88 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl'>
              <div className='overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6'>
                <div className='relative mx-auto h-40 w-40 overflow-hidden rounded-full border-4 border-emerald-400/40 bg-slate-700'>
                  <img src={aboutPhoto} alt='Your photo' className='h-full w-full object-cover' />
                </div>
                <div className='mt-6 text-center'>
                  <p className='text-xl font-semibold text-white'>Dhiraj Singh</p>
                  <p className='mt-2 text-sm uppercase tracking-[0.25em] text-emerald-300'>Founder • AI Interview Coach</p>
                </div>
                <p className='mt-6 text-sm leading-7 text-emerald-100/68'>I design intelligent tools that replicate real interview pressure, turn resume insights into better questions, and help candidates practice with honest, actionable feedback.</p>
                <div className='mt-6 flex items-center justify-center gap-4 text-emerald-100/75'>
                  <a href='https://github.com/DeveloperDhiraj1' target='_blank' rel='noreferrer' className='transition hover:text-white'>
                    <FiGithub size={24} />
                  </a>
                  <a href='https://www.linkedin.com/in/dhirajkumar-btech/' target='_blank' rel='noreferrer' className='transition hover:text-white'>
                    <FiLinkedin size={24} />
                  </a>
                  <a href='https://twitter.com/yourhandle' target='_blank' rel='noreferrer' className='transition hover:text-white'>
                    <FiTwitter size={24} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='border-t border-white/10 bg-[#04100f]/80 px-4 py-16 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='grid gap-8 lg:grid-cols-[1.2fr_0.8fr]'>
            <div className='space-y-8'>
              <div className='rounded-3xl border border-emerald-400/12 bg-white/5 p-8 shadow-2xl shadow-black/30'>
                <h2 className='text-3xl font-semibold text-white'>Why InterviewIQ stands out</h2>
                <p className='mt-4 max-w-2xl text-sm leading-7 text-emerald-100/70'>InterviewIQ is built to make interview prep feel modern, focused, and meaningful. From resume signals to AI-generated questions, every step helps candidates improve faster.</p>
                <div className='mt-10 grid gap-4 sm:grid-cols-2'>
                  <div className='rounded-3xl border border-white/10 bg-black/15 p-6'>
                    <p className='text-sm uppercase tracking-[0.3em] text-emerald-100/45'>Resume smart</p>
                    <p className='mt-4 text-xl font-semibold text-white'>AI extracts your strongest skills</p>
                  </div>
                  <div className='rounded-3xl border border-white/10 bg-black/15 p-6'>
                    <p className='text-sm uppercase tracking-[0.3em] text-emerald-100/45'>Realistic rounds</p>
                    <p className='mt-4 text-xl font-semibold text-white'>Questions mirror actual interviews</p>
                  </div>
                  <div className='rounded-3xl border border-white/10 bg-black/15 p-6'>
                    <p className='text-sm uppercase tracking-[0.3em] text-emerald-100/45'>Performance insights</p>
                    <p className='mt-4 text-xl font-semibold text-white'>Clear feedback after every answer</p>
                  </div>
                  <div className='rounded-3xl border border-white/10 bg-black/15 p-6'>
                    <p className='text-sm uppercase tracking-[0.3em] text-emerald-100/45'>Progress tracking</p>
                    <p className='mt-4 text-xl font-semibold text-white'>See your skills improve over time</p>
                  </div>
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <div className='rounded-3xl border border-white/10 bg-white/5 p-6 text-center'>
                  <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950'>
                    <FiTrendingUp size={20} />
                  </div>
                  <p className='mt-5 text-3xl font-semibold text-white'>+90%</p>
                  <p className='mt-2 text-sm text-emerald-100/50'>Confidence gain</p>
                </div>
                <div className='rounded-3xl border border-white/10 bg-white/5 p-6 text-center'>
                  <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950'>
                    <FiClock size={20} />
                  </div>
                  <p className='mt-5 text-3xl font-semibold text-white'>5 min</p>
                  <p className='mt-2 text-sm text-emerald-100/50'>Fast results</p>
                </div>
                <div className='rounded-3xl border border-white/10 bg-white/5 p-6 text-center'>
                  <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950'>
                    <FiAward size={20} />
                  </div>
                  <p className='mt-5 text-3xl font-semibold text-white'>10+</p>
                  <p className='mt-2 text-sm text-emerald-100/50'>Insight categories</p>
                </div>
                <div className='rounded-3xl border border-white/10 bg-white/5 p-6 text-center'>
                  <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white'>
                    <FiShield size={20} />
                  </div>
                  <p className='mt-5 text-3xl font-semibold text-white'>Secure</p>
                  <p className='mt-2 text-sm text-emerald-100/50'>Private practice</p>
                </div>
              </div>
            </div>

            <aside className='space-y-6'>
              <div className='rounded-3xl border border-emerald-400/12 bg-white/5 p-8 shadow-2xl shadow-black/30'>
                <h3 className='text-xl font-semibold text-white'>What makes us unique</h3>
                <ul className='mt-6 space-y-4 text-sm leading-7 text-emerald-100/70'>
                  <li className='rounded-3xl border border-white/10 bg-black/15 p-4'>
                    <strong className='text-white'>Resume powered</strong>
                    <p className='mt-2 text-emerald-100/55'>We convert your resume into personalized interview prompts.</p>
                  </li>
                  <li className='rounded-3xl border border-white/10 bg-black/15 p-4'>
                    <strong className='text-white'>AI-backed feedback</strong>
                    <p className='mt-2 text-emerald-100/55'>Each response gets a score and improvement suggestions.</p>
                  </li>
                  <li className='rounded-3xl border border-white/10 bg-black/15 p-4'>
                    <strong className='text-white'>Goal-oriented</strong>
                    <p className='mt-2 text-emerald-100/55'>Practice with a plan and see your strengths build over time.</p>
                  </li>
                </ul>
              </div>
              <div className='rounded-3xl border border-emerald-400/12 bg-emerald-500/10 p-8 text-slate-100'>
                <p className='text-sm uppercase tracking-[0.3em] text-emerald-200'>Ready to level up?</p>
                <h4 className='mt-4 text-2xl font-semibold text-white'>Transform your interview prep today.</h4>
                <p className='mt-4 text-sm leading-7 text-emerald-100/75'>Start with your resume, practice smart questions, and review your performance with confidence.</p>
                <Link to='/' className='mt-6 inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-emerald-400'>Begin practice</Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

export default About
