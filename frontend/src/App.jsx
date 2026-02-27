import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AdvisorDashboard from './pages/AdvisorDashboard'
import StudentDashboard from './pages/StudentDashboard'
import ResourceHub from './pages/ResourceHub'
import Login from './pages/Login'
import Register from './pages/Register'

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
          <p className="text-navy-300 font-body text-sm animate-pulse">Loading UniHub...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'ADVISOR' ? '/advisor' : '/dashboard'} replace />
  }

  return children
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    return <Navigate to={user.role === 'ADVISOR' ? '/advisor' : '/dashboard'} replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public auth pages */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

      {/* Protected pages */}
      <Route path="/advisor" element={<ProtectedRoute allowedRole="ADVISOR"><AdvisorDashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute allowedRole="STUDENT"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/resources" element={<ProtectedRoute><ResourceHub /></ProtectedRoute>} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}