import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

function CGPABadge({ cgpa }) {
  const color =
    cgpa >= 4.5 ? 'text-emerald-600' :
    cgpa >= 3.5 ? 'text-blue-600' :
    cgpa >= 2.5 ? 'text-amber-600' : 'text-red-600'

  const label =
    cgpa >= 4.5 ? 'First Class' :
    cgpa >= 3.5 ? 'Second Class Upper' :
    cgpa >= 2.5 ? 'Second Class Lower' :
    cgpa >= 1.5 ? 'Third Class' : 'Pass'

  return (
    <div className="text-center">
      <div className={`font-display text-6xl font-bold ${color} leading-none`}>{cgpa.toFixed(2)}</div>
      <div className="font-body text-navy-300 text-sm mt-1">{label}</div>
    </div>
  )
}

function GradeCell({ grade }) {
  return <span className={`grade-${grade}`}>{grade}</span>
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
        setAnnouncements(ann.data)
      })
      .catch(() => toast.error('Failed to load data.'))
      .finally(() => setLoading(false))
  }, [])

  const priorityClass = { NORMAL: 'badge-normal', IMPORTANT: 'badge-important', URGENT: 'badge-urgent' }
  const priorityIcon  = { NORMAL: '📌', IMPORTANT: '⚠️', URGENT: '🚨' }

  if (loading) return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="text-navy font-body animate-pulse">Loading your results...</div>
      </div>
    </div>
  )

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
            {user?.identifier} · {user?.student_profile?.department} · {user?.student_profile?.level} Level
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column: Results */}
          <div className="lg:col-span-2 space-y-6">

            {/* CGPA card */}
            <div className="card animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-navy text-xl">Academic Standing</h2>
                <span className="text-xs font-body text-navy-300 bg-navy-50 px-3 py-1 rounded-full">
                  2023/2024 — Harmattan
                </span>
              </div>

              {resultsData?.cgpa !== undefined ? (
                <div className="flex items-center gap-8">
                  <CGPABadge cgpa={resultsData.cgpa} />
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="bg-navy-50 rounded-xl p-4 text-center">
                      <div className="font-display text-navy text-2xl font-semibold">{resultsData.results?.length ?? 0}</div>
                      <div className="font-body text-navy-300 text-xs mt-0.5">Courses</div>
                    </div>
                    <div className="bg-navy-50 rounded-xl p-4 text-center">
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

            {/* Results table */}
            <div className="card animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="font-display text-navy text-xl mb-5">Course Results</h2>
              {resultsData?.results?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-navy-50">
                        <th className="text-left py-3 px-2 text-xs font-medium text-navy-300 font-body uppercase tracking-wider">Course</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-navy-300 font-body uppercase tracking-wider">Units</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-navy-300 font-body uppercase tracking-wider">Grade</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-navy-300 font-body uppercase tracking-wider">Points</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-navy-300 font-body uppercase tracking-wider">Weighted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultsData.results.map((r, i) => (
                        <tr key={r.id} className="border-b border-navy-50 hover:bg-navy-50/50 transition-colors" style={{ animationDelay: `${i * 0.05}s` }}>
                          <td className="py-3 px-2">
                            <div className="font-medium text-navy font-body text-sm">{r.course.code}</div>
                            <div className="text-navy-300 text-xs font-body truncate max-w-[180px]">{r.course.title}</div>
                          </td>
                          <td className="text-center py-3 px-2 text-navy font-body text-sm">{r.course.unit}</td>
                          <td className="text-center py-3 px-2"><GradeCell grade={r.grade} /></td>
                          <td className="text-center py-3 px-2 text-navy font-body text-sm">{r.grade_point}</td>
                          <td className="text-center py-3 px-2 text-navy font-body text-sm font-medium">
                            {(r.grade_point * r.course.unit).toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
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
                    <div key={ann.id} className="border-l-4 border-navy-100 pl-4 py-1 hover:border-gold transition-colors duration-200">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-body font-medium text-navy text-sm leading-snug">{ann.title}</p>
                        <span className={priorityClass[ann.priority]}>
                          {priorityIcon[ann.priority]} {ann.priority}
                        </span>
                      </div>
                      <p className="text-navy-300 font-body text-xs leading-relaxed line-clamp-2">{ann.content}</p>
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