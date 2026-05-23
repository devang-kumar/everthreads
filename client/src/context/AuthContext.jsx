import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bc_user') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    if (data.success) {
      localStorage.setItem('bc_token', data.token)
      localStorage.setItem('bc_user', JSON.stringify(data.user))
      setUser(data.user)
    }
    return data
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    if (data.success) {
      localStorage.setItem('bc_token', data.token)
      localStorage.setItem('bc_user', JSON.stringify(data.user))
      setUser(data.user)
    }
    return data
  }

  const logout = () => {
    localStorage.removeItem('bc_token')
    localStorage.removeItem('bc_user')
    localStorage.removeItem('bc_cart')
    setUser(null)
  }

  const updateUser = (u) => {
    localStorage.setItem('bc_user', JSON.stringify(u))
    setUser(u)
  }

  const isAdmin = () => user?.role === 'admin'
  const isLoggedIn = () => !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
