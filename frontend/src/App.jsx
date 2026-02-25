import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login            from './pages/Login'
import Register         from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import AdvisorDashboard from './pages/AdvisorDashboard'
import ResourceHub      from './pages/ResourceHub'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-navy font-body">Loading...</div>
  if (!user)   return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user)   return <Navigate to="/login" replace />
  return user.role === 'ADVISOR'
    ? <Navigate to="/advisor" replace />
    : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<HomeRedirect />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={
        <ProtectedRoute role="STUDENT">
          <StudentDashboard />
        </ProtectedRoute>
      } />

      <Route path="/advisor" element={
        <ProtectedRoute role="ADVISOR">
          <AdvisorDashboard />
        </ProtectedRoute>
      } />

      <Route path="/resources" element={
        <ProtectedRoute>
          <ResourceHub />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}