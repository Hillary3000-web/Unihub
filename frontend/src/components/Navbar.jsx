import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout, isAdvisor } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const navLinks = isAdvisor
    ? [{ to: '/advisor', label: 'Dashboard', icon: '📊' }, { to: '/resources', label: 'Resources', icon: '📁' }]
    : [{ to: '/dashboard', label: 'Dashboard', icon: '📊' }, { to: '/resources', label: 'Resources', icon: '📁' }]

  return (
    <nav className="bg-navy/95 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center shadow-md
                            group-hover:shadow-gold/30 transition-shadow duration-300">
              <span className="text-white font-display font-bold text-sm">U</span>
            </div>
            <span className="font-display text-white text-xl font-semibold tracking-wide">UniHub</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium font-body transition-all duration-300
                  ${location.pathname === to
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-navy-100 hover:text-white hover:bg-white/10'
                  }`}
              >
                <span className="mr-1.5">{icon}</span>
                {label}
                {location.pathname === to && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gold rounded-full" />
                )}
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
            <div className="w-px h-8 bg-white/10" />
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-red-500/80 text-white text-sm font-body font-medium
                         px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
              <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${open ? 'rotate-45 translate-y-1' : ''}`} />
              <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${open ? '-rotate-45 -translate-y-1' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-4' : 'max-h-0'}`}>
          {navLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm transition-colors
                ${location.pathname === to
                  ? 'text-white bg-white/10'
                  : 'text-navy-100 hover:text-white hover:bg-white/10'
                }`}
            >
              <span>{icon}</span> {label}
            </Link>
          ))}
          <div className="border-t border-white/10 mt-2 pt-2">
            <div className="px-4 py-1">
              <p className="text-navy-200 text-xs font-body">
                {user?.first_name} {user?.last_name} · {user?.identifier}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-red-300
                         hover:text-red-100 hover:bg-red-500/10 rounded-xl font-body text-sm transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}