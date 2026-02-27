import { useState, useRef, useCallback, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function AdvisorDashboard() {
  const { user } = useAuth()

  // ── Upload state ──────────────────────────────────────────────────────────
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  // ── Announcements state ───────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState([])
  const [annLoading, setAnnLoading] = useState(true)
  const [showAnnForm, setShowAnnForm] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', content: '', priority: 'NORMAL' })
  const [annPosting, setAnnPosting] = useState(false)

  // ── Active tab ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'announcements'

  // ── Fetch announcements ───────────────────────────────────────────────────
  useEffect(() => {
    api.get('/announcements/')
      .then(({ data }) => setAnnouncements(Array.isArray(data) ? data : data.results || []))
      .catch(() => { })
      .finally(() => setAnnLoading(false))
  }, [])

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const onDragOver = useCallback((e) => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback((e) => { e.preventDefault(); setDragging(false) }, [])
  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [])

  const onFileChange = (e) => {
    const file = e.target.files[0]
    if (file) handleUpload(file)
  }

  // ── Upload handler ────────────────────────────────────────────────────────
  const handleUpload = async (file) => {
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf')
    const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    if (!isPDF && !isXLSX) {
      toast.error('Please upload a PDF or Excel file.')
      return
    }

    setUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const endpoint = isPDF ? '/results/upload-pdf/' : '/results/upload/'
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      toast.success(`Upload complete! ${data.students_created ?? 0} student(s) created.`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed. Please try again.'
      toast.error(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Post announcement ─────────────────────────────────────────────────────
  const handlePostAnnouncement = async (e) => {
    e.preventDefault()
    setAnnPosting(true)
    try {
      const { data } = await api.post('/announcements/create/', annForm)
      toast.success('Announcement posted!')
      setAnnouncements(prev => [data.data || data, ...prev])
      setAnnForm({ title: '', content: '', priority: 'NORMAL' })
      setShowAnnForm(false)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to post announcement.')
    } finally {
      setAnnPosting(false)
    }
  }

  // ── Delete announcement ───────────────────────────────────────────────────
  const handleDeleteAnn = async (id) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await api.delete(`/announcements/${id}/`)
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      toast.success('Announcement deleted.')
    } catch {
      toast.error('Delete failed.')
    }
  }

  const priorityColors = {
    NORMAL: 'bg-navy-50 text-navy-400 border-navy-100',
    IMPORTANT: 'bg-amber-50 text-amber-700 border-amber-200',
    URGENT: 'bg-red-50 text-red-700 border-red-200',
  }
  const priorityIcons = { NORMAL: '📌', IMPORTANT: '⚠️', URGENT: '🚨' }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Welcome header ── */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-navy text-3xl font-semibold">
            Welcome, {user?.first_name} 👋
          </h1>
          <p className="text-navy-300 font-body mt-1">
            {user?.identifier} · Course Advisor Dashboard
          </p>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-2 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {[
            { id: 'upload', label: 'Upload Results', icon: '📤' },
            { id: 'announcements', label: 'Announcements', icon: '📢' },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-300
                ${activeTab === id
                  ? 'bg-navy text-white shadow-lg'
                  : 'bg-white text-navy-400 border border-navy-100 hover:text-navy hover:border-navy-200'
                }`}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>

        {/* ── Upload Results Tab ── */}
        {activeTab === 'upload' && (
          <div className="animate-fade-in">
            {/* Upload card */}
            <div className="card mb-6">
              <h2 className="font-display text-navy text-xl font-semibold mb-1">Upload Results</h2>
              <p className="text-navy-300 font-body text-sm mb-5">
                Upload a PDF or Excel results sheet. Student accounts will be created automatically.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
                  transition-all duration-300 select-none
                  ${dragging
                    ? 'border-gold bg-gold/5 scale-[1.01] shadow-glow'
                    : 'border-navy-200 hover:border-navy hover:bg-navy-50'
                  }
                  ${uploading ? 'pointer-events-none opacity-60' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  className="hidden"
                  onChange={onFileChange}
                />

                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
                    <p className="text-navy font-body font-medium">Processing file...</p>
                    <p className="text-navy-300 font-body text-sm">This may take a moment</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-navy-50 rounded-2xl flex items-center justify-center text-3xl">
                      {dragging ? '📂' : '📄'}
                    </div>
                    <div>
                      <p className="text-navy font-body font-medium">
                        {dragging ? 'Drop to upload' : 'Drag & drop your file here'}
                      </p>
                      <p className="text-navy-300 font-body text-sm mt-1">
                        or <span className="text-gold font-medium cursor-pointer">click to browse</span>
                      </p>
                    </div>
                    <p className="text-navy-300 font-body text-xs">Supports PDF and Excel (.xlsx)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Results table */}
            {result && (
              <div className="card animate-fade-up">
                {/* Summary pills */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <StatPill label="Students Created" value={result.students_created ?? 0} color="green" />
                  <StatPill label="Results Added" value={result.results_created ?? 0} color="blue" />
                  <StatPill label="Results Updated" value={result.results_updated ?? 0} color="gold" />
                  <StatPill label="Skipped" value={result.students_skipped ?? 0} color="red" />
                </div>

                {/* Students table */}
                {result.students && result.students.length > 0 ? (
                  <>
                    <h3 className="font-display text-navy font-semibold mb-3">Students Created</h3>
                    <div className="overflow-x-auto rounded-xl border border-navy-100">
                      <table className="w-full text-sm font-body">
                        <thead className="bg-navy-50">
                          <tr>
                            {['#', 'Reg Number', 'Name', 'Department', 'Default Password'].map((h) => (
                              <th key={h} className="text-left px-4 py-3 text-navy-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.students.map((s, i) => (
                            <tr key={s.identifier} className="border-t border-navy-100 hover:bg-navy-50/50 transition-colors">
                              <td className="px-4 py-3 text-navy-300">{i + 1}</td>
                              <td className="px-4 py-3 text-navy font-medium">{s.identifier}</td>
                              <td className="px-4 py-3 text-navy">{s.name}</td>
                              <td className="px-4 py-3 text-navy-300">{s.department ?? '—'}</td>
                              <td className="px-4 py-3">
                                <code className="bg-navy-50 text-navy px-2 py-1 rounded-lg text-xs font-mono">
                                  {s.identifier}
                                </code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 p-3 bg-navy-50 rounded-xl">
                      <p className="text-navy-400 font-body text-xs">
                        💡 Students can login with their registration number. The reg number is both their username and password.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-navy-300 font-body text-sm">
                    No new student accounts were created (they may already exist).
                  </p>
                )}

                {/* Errors */}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-red-600 font-body font-medium text-sm mb-2">⚠️ Warnings</p>
                    <ul className="space-y-1">
                      {result.errors.map((e, i) => (
                        <li key={i} className="text-red-500 font-body text-xs">• {e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Announcements Tab ── */}
        {activeTab === 'announcements' && (
          <div className="animate-fade-in">
            {/* Create button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAnnForm(!showAnnForm)}
                className={showAnnForm ? 'btn-outline' : 'btn-gold'}
              >
                {showAnnForm ? '✕ Cancel' : '+ New Announcement'}
              </button>
            </div>

            {/* Create form */}
            {showAnnForm && (
              <div className="card mb-6 border-gold/30 border animate-fade-up">
                <h3 className="font-display text-navy text-lg mb-4">Post Announcement</h3>
                <form onSubmit={handlePostAnnouncement} className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input
                      value={annForm.title}
                      onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                      placeholder="e.g. Mid-Semester Exam Schedule"
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Content</label>
                    <textarea
                      value={annForm.content}
                      onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                      placeholder="Write your announcement here..."
                      required
                      rows={4}
                      className="input !py-3 resize-none"
                    />
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <div className="flex gap-2">
                      {['NORMAL', 'IMPORTANT', 'URGENT'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAnnForm({ ...annForm, priority: p })}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-body font-medium border transition-all duration-200
                            ${annForm.priority === p
                              ? priorityColors[p] + ' border-current shadow-sm'
                              : 'bg-white text-navy-300 border-navy-100 hover:border-navy-200'
                            }`}
                        >
                          {priorityIcons[p]} {p.charAt(0) + p.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={annPosting} className="btn-primary">
                    {annPosting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Posting...
                      </span>
                    ) : 'Post Announcement'}
                  </button>
                </form>
              </div>
            )}

            {/* Announcements list */}
            {annLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card">
                    <div className="skeleton h-5 w-1/3 mb-3" />
                    <div className="skeleton h-3 w-full mb-2" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((ann, i) => (
                  <div
                    key={ann.id}
                    className="card hover-glow animate-fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${priorityColors[ann.priority]} text-xs font-medium px-2.5 py-1 rounded-full border`}>
                            {priorityIcons[ann.priority]} {ann.priority}
                          </span>
                          <span className="text-navy-200 text-xs font-body">
                            {new Date(ann.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="font-body font-semibold text-navy mb-1">{ann.title}</h3>
                        <p className="text-navy-300 font-body text-sm leading-relaxed">{ann.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAnn(ann.id)}
                        className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex-shrink-0"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">📢</div>
                <h3 className="font-display text-navy text-xl mb-2">No announcements yet</h3>
                <p className="text-navy-300 font-body text-sm">Post your first announcement to keep students informed.</p>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}

// ── Small helper component ─────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gold: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  }
  return (
    <div className={`${colors[color]} px-4 py-2.5 rounded-xl text-sm font-body font-semibold border`}>
      {value} <span className="font-normal opacity-75">{label}</span>
    </div>
  )
}