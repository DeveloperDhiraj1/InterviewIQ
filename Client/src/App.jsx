import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Interview from './pages/Interview'
import History from './pages/History'
import Pricing from './pages/Pricing'

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/home' element={<Home />} />
      <Route path='/auth' element={<Auth />} />
      <Route path='/interview' element={<Interview />} />
      <Route path='/history' element={<History />} />
      <Route path='/pricing' element={<Pricing />} />
    </Routes>
  )
}

export default App
