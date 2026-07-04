import React, { createContext, useContext, useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreateQuestionnaire from './pages/CreateQuestionnaire'
import FillQuestionnaire from './pages/FillQuestionnaire'
import Results from './pages/Results'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminLog from './pages/AdminLog'

export const UserContext = createContext()

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token") || null)

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        setUser({ id: payload.id, email: payload.email })
      } catch(e) {
        setToken(null)
        localStorage.removeItem("token")
      }
    }
  }, [token])

  const login = (newToken, userData) => {
    setToken(newToken)
    setUser(userData)
    localStorage.setItem("token", newToken)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
  }

  return (
    <UserContext.Provider value={{ user, token, login, logout }}>
      <div className="app">
        <div style={{ position: "fixed", bottom: 8, right: 12, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", zIndex: 9999 }}>
          v2.0.0
        </div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateQuestionnaire />} />
          <Route path="/fill/:id" element={<FillQuestionnaire />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/:id" element={<AdminLog />} />
        </Routes>
      </div>
    </UserContext.Provider>
  )
}

export default App
