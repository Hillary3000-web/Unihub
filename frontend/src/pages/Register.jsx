import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const LEVELS = [100, 200, 300, 400, 500]

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '', first_name: '', last_name: '',
    identifier: '', role: 'STUDENT',
    password: '', password2: '',
    department: '', level: 100,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) {
      toast.error('Passwords do not match!')
      return
    }
    setLoading(true)
    try {
      const payload = { ...form }
      if (form.role === 'ADVISOR') {
        delete payload.department
        delete payload.level
      }
      await api.post('/auth/register/', payload)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const firstError = Object.values(data)[0]
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError)
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-up">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold">U</span>
            </div>
            <span className="font-display text-navy text-xl font-semibold">UniHub</span>
          </Link>
          <h2 className="font-display text-navy text-3xl font-semibold mb-1">Create your account</h2>
          <p className="text-navy-300 font-body">Join the UniHub academic portal</p>
        </div>

        <div className="card">
          {/* Role toggle */}
          <div className="flex rounded-xl bg-navy-50 p-1 mb-6">
            {['STUDENT', 'ADVISOR'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm((p) => ({ ...p, role }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium font-body transition-all duration-200
                  ${form.role === role
                    ? 'bg-navy text-white shadow'
                    : 'text-navy-400 hover:text-navy'
                  }`}
              >
                {role === 'STUDENT' ? '🎒 Student' : '🎓 Course Advisor'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Ade" required className="input" />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Bello" required className="input" />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required className="input" />
            </div>

            <div>
              <label className="label">
                {form.role === 'STUDENT' ? 'Matriculation Number' : 'Staff ID'}
              </label>
              <input
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                placeholder={form.role === 'STUDENT' ? '20231361001' : 'STAFF/001'}
                required
                className="input"
              />
            </div>

            {/* Student-only fields */}
            {form.role === 'STUDENT' && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="label">Department</label>
                  <input name="department" value={form.department} onChange={handleChange} placeholder="Computer Science" required className="input" />
                </div>
                <div>
                  <label className="label">Level</label>
                  <select name="level" value={form.level} onChange={handleChange} className="input">
                    {LEVELS.map((l) => <option key={l} value={l}>{l} Level</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required className="input" />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input name="password2" type="password" value={form.password2} onChange={handleChange} placeholder="••••••••" required className="input" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-navy-300 font-body text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-gold font-medium hover:text-gold-dark transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}