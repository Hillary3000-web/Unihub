import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login, studentLogin } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('student') // 'student' | 'advisor'
  const [regNumber, setRegNumber] = useState('')
  const [staffId, setStaffId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStudentLogin = async (e) => {
    e.preventDefault()
    if (!regNumber.trim()) { toast.error('Please enter your registration number.'); return }
    setLoading(true)
    try {
      const user = await studentLogin(regNumber.trim())
      toast.success(`Welcome back, ${user.first_name}!`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your registration number.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleAdvisorLogin = async (e) => {
    e.preventDefault()
    if (!staffId.trim() || !password) { toast.error('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const user = await login(staffId.trim(), password)
      toast.success(`Welcome back, ${user.first_name}!`)
      navigate('/advisor')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid Staff ID or password.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-navy p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-display font-bold text-lg">U</span>
          </div>
          <span className="font-display text-white text-2xl font-semibold">UniHub</span>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-white text-4xl leading-tight mb-4">
            Your Academic<br />
            Life, <span className="text-gold">Simplified.</span>
          </h1>
          <p className="text-navy-200 font-body text-lg leading-relaxed mb-10">
            Access your results, study materials, and department announcements — all in one secure portal.
          </p>

          <div className="space-y-5">
            {[
              { icon: '📊', text: 'View results & CGPA instantly' },
              { icon: '📁', text: 'Download past questions & notes' },
              { icon: '📢', text: 'Stay updated with announcements' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg
                                group-hover:bg-gold/20 transition-colors duration-300">
                  {icon}
                </div>
                <span className="text-navy-100 font-body">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-navy-300 font-body text-sm relative z-10">
          © {new Date().getFullYear()} UniHub · FUTO, Dept. of Computer Science
        </p>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 dot-grid gradient-mesh">
        <div className="w-full max-w-md animate-fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold">U</span>
            </div>
            <span className="font-display text-navy text-xl font-semibold">UniHub</span>
          </div>

          <h2 className="font-display text-navy text-3xl font-semibold mb-1">Welcome back</h2>
          <p className="text-navy-300 font-body mb-8">Sign in to your account to continue</p>

          {/* ── Tab switcher ── */}
          <div className="flex bg-navy-50 rounded-xl p-1 mb-8">
            <button
              onClick={() => setTab('student')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-body font-medium transition-all duration-300
                ${tab === 'student'
                  ? 'bg-white text-navy shadow-md'
                  : 'text-navy-300 hover:text-navy'
                }`}
            >
              🎒 Student
            </button>
            <button
              onClick={() => setTab('advisor')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-body font-medium transition-all duration-300
                ${tab === 'advisor'
                  ? 'bg-white text-navy shadow-md'
                  : 'text-navy-300 hover:text-navy'
                }`}
            >
              🎓 Course Advisor
            </button>
          </div>

          {/* ── Student form ── */}
          {tab === 'student' && (
            <form onSubmit={handleStudentLogin} className="space-y-5 animate-fade-in">
              <div>
                <label className="label">Registration Number</label>
                <input
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="e.g. 20231351234"
                  required
                  className="input text-lg tracking-wider"
                  autoComplete="off"
                />
                <p className="text-navy-200 text-xs font-body mt-2">
                  Your reg number is both your username and password
                </p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>

              <div className="bg-navy-50 rounded-xl p-4 mt-4">
                <p className="text-navy-300 font-body text-xs leading-relaxed">
                  💡 <span className="font-medium text-navy">Don't have an account?</span> Your account is created
                  automatically when your Course Advisor uploads your results. Contact your advisor if you can't log in.
                </p>
              </div>
            </form>
          )}

          {/* ── Advisor form ── */}
          {tab === 'advisor' && (
            <form onSubmit={handleAdvisorLogin} className="space-y-5 animate-fade-in">
              <div>
                <label className="label">Staff ID</label>
                <input
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. STAFF/001"
                  required
                  className="input"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>

              <p className="text-center text-navy-300 font-body text-sm mt-4">
                Don't have an account?{' '}
                <Link to="/register" className="text-gold font-medium hover:text-gold-dark transition-colors">
                  Register here
                </Link>
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}