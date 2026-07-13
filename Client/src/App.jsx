import React from 'react'
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

function App() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/home' element={<Home />} />
        <Route path='/auth' element={<Auth />} />
        <Route path='/interview' element={<Interview />} />
        <Route path='/history' element={<History />} />
        <Route path='/pricing' element={<Pricing />} />
        <Route path='/about' element={<About />} />
        <Route path='/privacy' element={<Privacy />} />
        <Route path='/terms' element={<Terms />} />
        <Route path='/admin' element={<Admin />} />
        <Route path='/gd/lobby' element={<GDLobby />} />
        <Route path='/gd/room/:id' element={<GDRoom />} />
      </Routes>
      <SiteFooter />
    </div>
  )
}

export default App
