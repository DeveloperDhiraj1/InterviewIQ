import React, { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Interview from './pages/Interview'
import History from './pages/History'
import Pricing from './pages/Pricing'
import Admin from './pages/Admin'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import SiteFooter from './components/SiteFooter'
import GDLobby from './pages/GDLobby'
import GDRoom from './pages/GDRoom'
import InstallPrompt from './components/InstallPrompt'
import MobileBottomNav from './components/MobileBottomNav'
import AppLaunchScreen from './components/AppLaunchScreen'
import RequireAuth from './components/RequireAuth'
import EnglishCoach from './pages/EnglishCoach'
import { useLocation } from 'react-router-dom'

function App() {
  const location = useLocation()
  const [pageKey, setPageKey] = useState(location.pathname)
  const showMobileNav = ['/', '/home', '/interview', '/english', '/gd/lobby', '/history'].some((path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )

  useEffect(() => {
    setPageKey(location.pathname)
  }, [location.pathname])

  return (
    <div className={`flex min-h-screen flex-col ${showMobileNav ? 'mobile-app-shell' : ''}`}>
      <div key={pageKey} className='page-transition flex min-h-0 flex-1 flex-col'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/home' element={<Home />} />
          <Route path='/auth' element={<Auth />} />
          <Route path='/interview' element={<Interview />} />
          <Route path='/english' element={<EnglishCoach />} />
          <Route path='/history' element={<History />} />
          <Route path='/pricing' element={<Pricing />} />
          <Route path='/about' element={<About />} />
          <Route path='/privacy' element={<Privacy />} />
          <Route path='/terms' element={<Terms />} />
          <Route path='/admin' element={<Admin />} />
          <Route path='/gd/lobby' element={<RequireAuth><GDLobby /></RequireAuth>} />
          <Route path='/gd/room/:id' element={<RequireAuth><GDRoom /></RequireAuth>} />
        </Routes>
      </div>
      <AppLaunchScreen />
      <InstallPrompt />
      {showMobileNav && <MobileBottomNav />}
      <SiteFooter />
    </div>
  )
}

export default App
