import { useEffect, useState } from 'react'
import { Mic } from 'lucide-react'

function AppLaunchScreen() {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem('interviewiq-launch-seen')
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (!visible) return undefined

    const timer = window.setTimeout(() => {
      setVisible(false)
      try {
        sessionStorage.setItem('interviewiq-launch-seen', '1')
      } catch {
        // Storage may be unavailable in private browsing.
      }
    }, 900)

    return () => window.clearTimeout(timer)
  }, [visible])

  if (!visible) return null

  return (
    <div className='app-launch-screen' role='status' aria-label='Loading InterviewIQ'>
      <div className='app-launch-mark'>
        <Mic size={30} strokeWidth={2.4} />
      </div>
      <p className='mt-5 text-xl font-bold tracking-tight text-white'>InterviewIQ</p>
      <p className='mt-2 text-xs font-medium uppercase tracking-[0.24em] text-emerald-200/55'>Practice smarter</p>
      <span className='app-launch-loader mt-8' />
    </div>
  )
}

export default AppLaunchScreen
