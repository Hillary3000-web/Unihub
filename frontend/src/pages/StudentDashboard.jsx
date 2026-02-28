import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

function CGPARadial({ cgpa }) {
  const maxGPA = 5.0
  const pct = Math.min((cgpa / maxGPA) * 100, 100)
  const radius = 54
  const circ = 2 * Math.PI * radius
  const offset = circ - (pct / 100) * circ

  const color =
    cgpa >= 4.5 ? '#059669' :
      cgpa >= 3.5 ? '#2563EB' :
        cgpa >= 2.5 ? '#D97706' : '#DC2626'

  const label =
    cgpa >= 4.5 ? 'First Class' :
      cgpa >= 3.5 ? 'Second Class Upper' :
        cgpa >= 2.5 ? 'Second Class Lower' :
          cgpa >= 1.5 ? 'Third Class' : 'Pass'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#E8EDF5" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-navy">{cgpa.toFixed(2)}</span>
          <span className="text-navy-300 text-xs font-body">/5.00</span>
        </div>
      </div>
      <div className="mt-2 px-3 py-1 rounded-full text-xs font-body font-medium" style={{ backgroundColor: color + '15', color }}>
        {label}
      </div>
    </div>
  )
}

function GradeCell({ grade }) {
  return <span className={`grade-${grade} text-sm`}>{grade}</span>
}

function GradeDistribution({ results }) {
  const counts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 }
  results.forEach(r => { if (counts[r.grade] !== undefined) counts[r.grade]++ })
  const max = Math.max(...Object.values(counts), 1)
  const colors = { A: '#059669', B: '#2563EB', C: '#D97706', D: '#EA580C', E: '#DC2626', F: '#991B1B' }

  return (
    <div className="flex items-end gap-2 h-20">
      {Object.entries(counts).map(([grade, count]) => (
        <div key={grade} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-lg transition-all duration-700 ease-out"
            style={{
              height: `${Math.max((count / max) * 100, 8)}%`,
              backgroundColor: colors[grade],
              opacity: count > 0 ? 1 : 0.2,
            }}
          />
          <span className="text-[10px] font-body font-semibold text-navy-400">{grade}</span>
        </div>
      ))}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card">
      <div className="skeleton h-6 w-1/3 mb-4" />
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-2/3 mb-2" />
      <div className="skeleton h-4 w-1/2" />
    </div>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [resultsData, setResultsData] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/results/me/'),
      api.get('/announcements/'),
    ])
      .then(([res, ann]) => {
        setResultsData(res.data)
        setAnnouncements(Array.isArray(ann.data) ? ann.data : ann.data.results || [])
      })
      .catch(() => toast.error('Failed to load data.'))
      .finally(() => setLoading(false))
  }, [])

  const priorityClass = { NORMAL: 'badge-normal', IMPORTANT: 'badge-important', URGENT: 'badge-urgent' }
  const priorityIcon = { NORMAL: '📌', IMPORTANT: '⚠️', URGENT: '🚨' }

  if (loading) return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-10 w-64 mb-3" />
        <div className="skeleton h-4 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      </main>
    </div>
  )

  const totalUnits = resultsData?.results?.reduce((sum, r) => sum + r.course.unit, 0) ?? 0

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-navy text-3xl font-semibold">
            Hello, {user?.first_name} 👋
          </h1>
          <p className="text-navy-300 font-body mt-1">
            {user?.identifier} · {user?.university_info?.short_name || ''} · {user?.student_profile?.department} · {user?.student_profile?.level} Level
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column: Results */}
          <div className="lg:col-span-2 space-y-6">

            {/* CGPA + Stats */}
            <div className="card animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-navy text-xl">Academic Standing</h2>
                <span className="text-xs font-body text-navy-300 bg-navy-50 px-3 py-1 rounded-full">
                  2023/2024 — Harmattan
                </span>
              </div>

              {resultsData?.cgpa !== undefined ? (
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <CGPARadial cgpa={resultsData.cgpa} />
                  <div className="flex-1 w-full grid grid-cols-3 gap-3">
                    <div className="bg-navy-50 rounded-xl p-4 text-center hover-glow">
                      <div className="font-display text-navy text-2xl font-semibold">{resultsData.results?.length ?? 0}</div>
                      <div className="font-body text-navy-300 text-xs mt-0.5">Courses</div>
                    </div>
                    <div className="bg-navy-50 rounded-xl p-4 text-center hover-glow">
                      <div className="font-display text-navy text-2xl font-semibold">{totalUnits}</div>
                      <div className="font-body text-navy-300 text-xs mt-0.5">Total Units</div>
                    </div>
                    <div className="bg-navy-50 rounded-xl p-4 text-center hover-glow">
                      <div className="font-display text-navy text-2xl font-semibold">
                        {resultsData.results?.filter(r => r.grade === 'A').length ?? 0}
                      </div>
                      <div className="font-body text-navy-300 text-xs mt-0.5">A Grades</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-navy-300 font-body text-sm">No results uploaded yet.</p>
              )}
            </div>

            {/* Grade distribution */}
            {resultsData?.results?.length > 0 && (
              <div className="card animate-fade-up" style={{ animationDelay: '0.15s' }}>
                <h2 className="font-display text-navy text-lg mb-4">Grade Distribution</h2>
                <GradeDistribution results={resultsData.results} />
              </div>
            )}

            {/* Results table */}
            <div className="card animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="font-display text-navy text-xl mb-5">Course Results</h2>
              {resultsData?.results?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-navy-50">
                        <th className="text-left py-3 px-2 text-xs font-medium text-navy-300 font-body uppercase tracking-wider">Course</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-navy-300 font-body uppercase tracking-wider">Units</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-navy-300 font-body uppercase tracking-wider">Grade</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-navy-300 font-body uppercase tracking-wider">Points</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-navy-300 font-body uppercase tracking-wider">Weighted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultsData.results.map((r) => (
                        <tr key={r.id} className="border-b border-navy-50 hover:bg-navy-50/50 transition-colors group">
                          <td className="py-3 px-2">
                            <div className="font-medium text-navy font-body text-sm group-hover:text-gold transition-colors">{r.course.code}</div>
                            <div className="text-navy-300 text-xs font-body truncate max-w-[200px]">{r.course.title}</div>
                          </td>
                          <td className="text-center py-3 px-2 text-navy font-body text-sm">{r.course.unit}</td>
                          <td className="text-center py-3 px-2"><GradeCell grade={r.grade} /></td>
                          <td className="text-center py-3 px-2 text-navy font-body text-sm">{r.grade_point}</td>
                          <td className="text-center py-3 px-2 text-navy font-body text-sm font-semibold">
                            {(r.grade_point * r.course.unit).toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-navy-100">
                        <td className="py-3 px-2 font-body font-semibold text-navy text-sm">Total</td>
                        <td className="text-center py-3 px-2 font-body font-semibold text-navy text-sm">{totalUnits}</td>
                        <td colSpan={2} />
                        <td className="text-center py-3 px-2 font-body font-bold text-navy text-sm">
                          {resultsData.results.reduce((sum, r) => sum + (r.grade_point * r.course.unit), 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-navy-300 font-body text-sm">No results have been uploaded yet.</p>
                  <p className="text-navy-200 font-body text-xs mt-1">Check back after your Course Advisor uploads results.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Announcements */}
          <div className="space-y-6">
            <div className="card animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="font-display text-navy text-xl mb-5">Announcements</h2>
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="border-l-4 border-navy-100 pl-4 py-2 hover:border-gold transition-colors duration-300">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-body font-medium text-navy text-sm leading-snug">{ann.title}</p>
                        <span className={priorityClass[ann.priority] + ' flex-shrink-0'}>
                          {priorityIcon[ann.priority]} {ann.priority}
                        </span>
                      </div>
                      <p className="text-navy-300 font-body text-xs leading-relaxed line-clamp-3">{ann.content}</p>
                      <p className="text-navy-200 font-body text-xs mt-1.5">
                        {new Date(ann.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📢</div>
                  <p className="text-navy-300 font-body text-sm">No announcements yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}