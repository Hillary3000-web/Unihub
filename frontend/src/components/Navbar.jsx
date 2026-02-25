import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout, isAdvisor } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const navLinks = isAdvisor
    ? [{ to: '/advisor',   label: 'Dashboard' }, { to: '/resources', label: 'Resources' }]
    : [{ to: '/dashboard', label: 'Dashboard' }, { to: '/resources', label: 'Resources' }]

  return (
    <nav className="bg-navy shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">U</span>
            </div>
            <span className="font-display text-white text-xl font-semibold tracking-wide">UniHub</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium font-body transition-colors duration-200
                  ${location.pathname === to
                    ? 'bg-white/10 text-white'
                    : 'text-navy-100 hover:text-white hover:bg-white/10'
                  }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* User info + logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-white text-sm font-medium font-body leading-tight">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-navy-200 text-xs font-body">
                {user?.role === 'ADVISOR' ? '🎓 Course Advisor' : `📋 ${user?.identifier}`}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white text-sm font-body font-medium px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2">
            {open ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 animate-fade-in">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-navy-100 hover:text-white hover:bg-white/10 rounded-lg font-body text-sm transition-colors"
              >
                {label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2.5 text-red-300 hover:text-red-100 font-body text-sm mt-1"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}