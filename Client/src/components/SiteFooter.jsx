import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail, Shield, Sparkles } from 'lucide-react'

const quickLinks = [
  { label: 'Interview', to: '/interview' },
  { label: 'About', to: '/about' },
  { label: 'Reports', to: '/history' },
  { label: 'Pricing', to: '/pricing' },
]

const legalLinks = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
]

function SiteFooter() {
  return (
    <footer className='footer-shell mt-auto px-4 py-10 text-sm text-emerald-50 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl'>
        <div className='grid gap-8 border-b border-white/8 pb-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]'>
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <span className='icon-tile h-11 w-11 rounded-2xl text-emerald-300'>
                <Sparkles size={18} />
              </span>
              <div>
                <p className='text-base font-semibold tracking-tight text-white'>InterviewIQ</p>
                <p className='text-xs text-emerald-100/70'>Premium AI interview practice</p>
              </div>
            </div>
            <p className='max-w-sm leading-6 text-emerald-100/72'>
              A focused interview workspace for candidates who want sharper feedback, cleaner reports, and less template noise.
            </p>
          </div>

          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/70'>Quick links</p>
            <div className='mt-4 grid gap-3'>
              {quickLinks.map((item) => (
                <Link key={item.label} to={item.to} className='footer-link inline-flex items-center gap-2 leading-6'>
                  <ArrowUpRight size={14} className='text-emerald-400' />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/70'>Legal</p>
            <div className='mt-4 grid gap-3'>
              {legalLinks.map((item) => (
                <Link key={item.label} to={item.to} className='footer-link leading-6'>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className='space-y-4'>
            <p className='text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/70'>Contact</p>
            <a href='mailto:support@interviewiq.ai' className='footer-link flex items-center gap-2 leading-6'>
              <Mail size={14} className='text-emerald-400' />
              dhirajsingh13758@gmail.com
            </a>
            <div className='inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100'>
              <Shield size={14} className='text-emerald-300' />
              Private practice, persistent progress
            </div>
          </div>
        </div>

        <div className='flex flex-col gap-3 pt-6 text-xs text-emerald-100/55 md:flex-row md:items-center md:justify-between'>
          <p>© {new Date().getFullYear()} InterviewIQ. All rights reserved.</p>
          <p>Built for serious interview prep, not generic templates.</p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter