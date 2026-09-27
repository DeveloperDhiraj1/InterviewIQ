import { BarChart3, Home, Mic, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const items = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Practice', to: '/interview', icon: Mic },
  { label: 'Group', to: '/gd/lobby', icon: Users },
  { label: 'Reports', to: '/history', icon: BarChart3 },
]

function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav className='mobile-bottom-nav md:hidden' aria-label='Mobile navigation'>
      <div className='mx-auto grid max-w-md grid-cols-4 gap-1'>
        {items.map(({ label, to, icon: Icon }) => {
          const active = to === '/' ? location.pathname === '/' || location.pathname === '/home' : location.pathname.startsWith(to)

          return (
            <Link
              key={to}
              to={to}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors ${
                active ? 'bg-emerald-400/15 text-emerald-300' : 'text-emerald-100/55 hover:bg-white/5 hover:text-emerald-100'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileBottomNav
