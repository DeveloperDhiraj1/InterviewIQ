import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault()
      setInstallEvent(event)
      setVisible(true)
    }

    const handleInstalled = () => {
      setInstallEvent(null)
      setVisible(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    setInstallEvent(null)
    setVisible(false)
  }

  if (!visible || !installEvent) return null

  return (
    <div className='fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-emerald-400/20 bg-[#071311]/95 p-3 text-emerald-50 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-5 sm:bottom-5'>
      <span className='icon-tile h-10 w-10 shrink-0 rounded-xl text-emerald-300'>
        <Download size={18} />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-semibold'>Install InterviewIQ</p>
        <p className='truncate text-xs text-emerald-100/60'>Quick access from your home screen</p>
      </div>
      <button onClick={installApp} className='btn-primary rounded-xl px-3 py-2 text-xs font-bold'>Install</button>
      <button onClick={() => setVisible(false)} aria-label='Dismiss install prompt' className='rounded-lg p-2 text-emerald-100/60 hover:bg-white/10 hover:text-white'>
        <X size={16} />
      </button>
    </div>
  )
}

export default InstallPrompt
