import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login }        = useAuth()
  const navigate         = useNavigate()
  const [form, setForm]  = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.first_name}!`)
      navigate(user.role === 'ADVISOR' ? '/advisor' : '/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dot-grid flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-navy p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
            <span className="text-white font-display font-bold">U</span>
          </div>
          <span className="font-display text-white text-2xl font-semibold">UniHub</span>
        </div>

        <div>
          <h1 className="font-display text-white text-4xl leading-tight mb-4">
            Your Academic<br />
            Life, <span className="text-gold">Simplified.</span>
          </h1>
          <p className="text-navy-200 font-body text-lg leading-relaxed mb-8">
            Access your results, study materials, and department announcements — all in one secure portal.
          </p>

          <div className="space-y-4">
            {[
              { icon: '📊', text: 'View results & CGPA instantly' },
              { icon: '📁', text: 'Download past questions & notes' },
              { icon: '📢', text: 'Stay updated with announcements' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-navy-100 font-body">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-navy-300 font-body text-sm">
          © {new Date().getFullYear()} UniHub · FUTO, Dept. of Computer Science
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="input"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-navy-300 font-body text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold font-medium hover:text-gold-dark transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}