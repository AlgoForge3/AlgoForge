import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { Home } from './pages/Home'
import { Assessment } from './pages/Assessment'
import { Dashboard } from './pages/Dashboard'
import { Problem } from './pages/Problem'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
        <Navbar />
        <main className="w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/problem/:id" element={<Problem />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
