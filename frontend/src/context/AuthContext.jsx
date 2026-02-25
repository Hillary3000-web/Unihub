import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on app load
  useEffect(() => {
    const access = localStorage.getItem('access')
    if (access) {
      api.get('/auth/me/')
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
  const { data } = await api.post('/auth/login/', { email, password })
  localStorage.setItem('access',  data.access)
  localStorage.setItem('refresh', data.refresh)
  
  // ✅ Pass token directly instead of relying on interceptor
  const me = await api.get('/auth/me/', {
    headers: { Authorization: `Bearer ${data.access}` }
  })
  setUser(me.data)
  return me.data
  }
  const logout = async () => {
    try {
      await api.post('/auth/logout/', { refresh: localStorage.getItem('refresh') })
    } catch { /* ignore */ }
    localStorage.clear()
    setUser(null)
  }

  const isStudent = user?.role === 'STUDENT'
  const isAdvisor = user?.role === 'ADVISOR'

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isStudent, isAdvisor }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)