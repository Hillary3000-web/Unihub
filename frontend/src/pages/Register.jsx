import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [universities, setUniversities] = useState([])
  const [form, setForm] = useState({
    first_name: '', last_name: '',
    identifier: '', password: '', password2: '',
    university: '', department: '',
  })

  // Fetch universities on mount
  useEffect(() => {
    api.get('/universities/')
      .then(({ data }) => setUniversities(data))
      .catch(() => { })
  }, [])

  const selectedUni = universities.find(u => u.id === Number(form.university))
  const departments = selectedUni?.departments || []

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      // Reset department when university changes
      if (name === 'university') updated.department = ''
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) {
      toast.error('Passwords do not match!')
      return
    }
    if (!form.university) {
      toast.error('Please select your university.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register/', {
        ...form,
        university: Number(form.university),
      })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const firstError = Object.values(data)[0]
        toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError))
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-navy p-12 relative overflow-hidden">
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
            Manage Your<br />
            Department, <span className="text-gold">Effortlessly.</span>
          </h1>
          <p className="text-navy-200 font-body text-lg leading-relaxed mb-10">
            Upload results, manage study materials, and keep your students informed — all from one dashboard.
          </p>

          <div className="space-y-5">
            {[
              { icon: '🏫', text: 'Works for any Nigerian university' },
              { icon: '📤', text: 'Upload results via PDF or Excel — students auto-created' },
              { icon: '📊', text: 'CGPA calculated automatically for all students' },
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
          © {new Date().getFullYear()} UniHub · Student Academic Portal
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 dot-grid gradient-mesh">
        <div className="w-full max-w-lg animate-fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold">U</span>
            </div>
            <span className="font-display text-navy text-xl font-semibold">UniHub</span>
          </div>

          <h2 className="font-display text-navy text-3xl font-semibold mb-1">Create your account</h2>
          <p className="text-navy-300 font-body mb-6">Register as a Course Advisor to get started</p>

          {/* Advisor badge */}
          <div className="flex items-center justify-center gap-2 bg-navy-50 rounded-xl py-2.5 px-4 mb-6">
            <span className="text-lg">🎓</span>
            <span className="text-navy font-medium font-body text-sm">Course Advisor Registration</span>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Ade"
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Bello"
                    required
                    className="input"
                  />
                </div>
              </div>

              {/* University dropdown */}
              <div>
                <label className="label">University</label>
                <select
                  name="university"
                  value={form.university}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">Select your university</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.short_name} — {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="label">Department</label>
                {departments.length > 0 ? (
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select or type a department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                    className="input"
                  />
                )}
                <p className="text-navy-200 text-xs font-body mt-1">
                  Your department will be created if it doesn't exist
                </p>
              </div>

              <div>
                <label className="label">Staff ID</label>
                <input
                  name="identifier"
                  value={form.identifier}
                  onChange={handleChange}
                  placeholder="STAFF/001"
                  required
                  className="input"
                />
                <p className="text-navy-200 text-xs font-body mt-1">
                  You'll use this to log in
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="label">Confirm Password</label>
                  <input
                    name="password2"
                    type="password"
                    value={form.password2}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="input"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Student notice */}
          <div className="mt-4 p-4 bg-navy-50 rounded-xl text-center">
            <p className="text-navy-300 font-body text-sm">
              🎒 <span className="font-medium text-navy">Are you a student?</span> Your account is created
              automatically when your advisor uploads your results. Login with your
              <span className="font-medium text-navy"> registration number</span>.
            </p>
          </div>

          <p className="text-center text-navy-300 font-body text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-gold font-medium hover:text-gold-dark transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}