import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const PRIORITY_OPTIONS = ['NORMAL', 'IMPORTANT', 'URGENT']
const priorityClass    = { NORMAL: 'badge-normal', IMPORTANT: 'badge-important', URGENT: 'badge-urgent' }

export default function AdvisorDashboard() {
  const { user }   = useAuth()
  const fileRef    = useRef()

  const [uploading, setUploading]         = useState(false)
  const [uploadResult, setUploadResult]   = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [allResults, setAllResults]       = useState([])
  const [tab, setTab]                     = useState('upload')
  const [annForm, setAnnForm]             = useState({ title: '', content: '', priority: 'NORMAL' })
  const [annLoading, setAnnLoading]       = useState(false)
  const [matricFilter, setMatricFilter]   = useState('')

  const fetchAnnouncements = () =>
    api.get('/announcements/').then(({ data }) => setAnnouncements(data))

  const fetchResults = (matric = '') =>
    api.get(`/results/all/${matric ? `?matric=${matric}` : ''}`)
      .then(({ data }) => setAllResults(data))

  useEffect(() => {
    fetchAnnouncements()
    fetchResults()
  }, [])

  // ── Excel Upload ──────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault()
    const file = fileRef.current?.files[0]
    if (!file) { toast.error('Please select a file.'); return }

    const fd = new FormData()
    fd.append('file', file)
    setUploading(true)
    setUploadResult(null)
    try {
      const { data } = await api.post('/results/upload/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadResult(data)
      toast.success(`Upload complete! ${data.results_created} results created.`)
      fetchResults()
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  // ── Announcements ─────────────────────────────────────────────────────────
  const handlePostAnnouncement = async (e) => {
    e.preventDefault()
    setAnnLoading(true)
    try {
      await api.post('/announcements/create/', annForm)
      toast.success('Announcement posted!')
      setAnnForm({ title: '', content: '', priority: 'NORMAL' })
      fetchAnnouncements()
    } catch {
      toast.error('Failed to post announcement.')
    } finally {
      setAnnLoading(false)
    }
  }

  const handleDeleteAnn = async (id) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await api.delete(`/announcements/${id}/`)
      toast.success('Deleted.')
      fetchAnnouncements()
    } catch {
      toast.error('Delete failed.')
    }
  }

  // ── Results filter ────────────────────────────────────────────────────────
  const handleFilterResults = (e) => {
    e.preventDefault()
    fetchResults(matricFilter)
  }

  const tabs = [
    { key: 'upload',        label: '📤 Upload Results' },
    { key: 'results',       label: '📊 View Results' },
    { key: 'announcements', label: '📢 Announcements' },
  ]

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-navy text-3xl font-semibold">
            Advisor Dashboard
          </h1>
          <p className="text-navy-300 font-body mt-1">
            {user?.first_name} {user?.last_name} · {user?.identifier}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium font-body whitespace-nowrap transition-all duration-200
                ${tab === key
                  ? 'bg-navy text-white shadow-md'
                  : 'bg-white text-navy-400 border border-navy-100 hover:border-navy-200 hover:text-navy'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Upload Results ── */}
        {tab === 'upload' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="card">
              <h2 className="font-display text-navy text-xl mb-1">Upload Result Sheet</h2>
              <p className="text-navy-300 font-body text-sm mb-6">
                Upload the FUTO Excel template with student grades. The system will process it automatically.
              </p>

              <form onSubmit={handleUpload} className="space-y-4">
                <div
                  className="border-2 border-dashed border-navy-100 rounded-xl p-8 text-center hover:border-gold transition-colors duration-200 cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  <div className="text-4xl mb-3">📂</div>
                  <p className="font-body text-navy font-medium text-sm">Click to select Excel file</p>
                  <p className="font-body text-navy-200 text-xs mt-1">.xlsx or .xls — max 20MB</p>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" />
                </div>

                <button type="submit" disabled={uploading} className="btn-primary w-full">
                  {uploading ? 'Processing...' : 'Upload & Process'}
                </button>
              </form>

              {/* Upload result summary */}
              {uploadResult && (
                <div className="mt-5 p-4 bg-navy-50 rounded-xl animate-fade-in">
                  <p className="font-body font-semibold text-navy text-sm mb-3">{uploadResult.message}</p>
                  <div className="grid grid-cols-3 gap-3 text-center mb-3">
                    <div>
                      <div className="font-display text-emerald-600 text-xl font-bold">{uploadResult.results_created}</div>
                      <div className="font-body text-navy-300 text-xs">Created</div>
                    </div>
                    <div>
                      <div className="font-display text-blue-600 text-xl font-bold">{uploadResult.results_updated}</div>
                      <div className="font-body text-navy-300 text-xs">Updated</div>
                    </div>
                    <div>
                      <div className="font-display text-amber-600 text-xl font-bold">{uploadResult.students_skipped}</div>
                      <div className="font-body text-navy-300 text-xs">Skipped</div>
                    </div>
                  </div>
                  {uploadResult.errors?.length > 0 && (
                    <div className="mt-2">
                      <p className="font-body text-red-600 text-xs font-medium mb-1">Errors:</p>
                      {uploadResult.errors.map((e, i) => (
                        <p key={i} className="font-body text-red-500 text-xs">{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="card bg-navy text-white">
              <h3 className="font-display text-xl mb-4">Upload Instructions</h3>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Download the FUTO Results Template from the Resource Hub' },
                  { step: '2', text: 'Fill in REG. NO., student names, and letter grades (A–F) for each course' },
                  { step: '3', text: 'Make sure REG. NO. values match exactly what students used during registration' },
                  { step: '4', text: 'Save as .xlsx and upload using this form' },
                  { step: '5', text: 'Review the summary — any skipped students need to register first' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex gap-3">
                    <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold font-body">{step}</span>
                    </div>
                    <p className="font-body text-navy-100 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: View Results ── */}
        {tab === 'results' && (
          <div className="card animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-navy text-xl">All Student Results</h2>
              <form onSubmit={handleFilterResults} className="flex gap-2">
                <input
                  value={matricFilter}
                  onChange={(e) => setMatricFilter(e.target.value)}
                  placeholder="Filter by REG. NO."
                  className="input !w-48 !py-2 text-sm"
                />
                <button type="submit" className="btn-primary !py-2 !px-4 text-sm">Filter</button>
                {matricFilter && (
                  <button type="button" onClick={() => { setMatricFilter(''); fetchResults() }}
                    className="btn-outline !py-2 !px-3 text-sm">
                    Clear
                  </button>
                )}
              </form>
            </div>

            {allResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-navy-50">
                      {['Student', 'REG. NO.', 'Course', 'Units', 'Grade', 'GP', 'Uploaded'].map((h) => (
                        <th key={h} className="text-left py-3 px-2 text-xs font-medium text-navy-300 font-body uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allResults.map((r) => (
                      <tr key={r.id} className="border-b border-navy-50 hover:bg-navy-50/50 transition-colors">
                        <td className="py-3 px-2 font-body text-navy font-medium">{r.student_name}</td>
                        <td className="py-3 px-2 font-body text-navy-300 text-xs">{r.matric_number}</td>
                        <td className="py-3 px-2">
                          <div className="font-body text-navy font-medium">{r.course.code}</div>
                          <div className="font-body text-navy-200 text-xs">{r.course.title}</div>
                        </td>
                        <td className="py-3 px-2 font-body text-navy text-center">{r.course.unit}</td>
                        <td className="py-3 px-2 text-center"><span className={`grade-${r.grade}`}>{r.grade}</span></td>
                        <td className="py-3 px-2 font-body text-navy text-center">{r.grade_point}</td>
                        <td className="py-3 px-2 font-body text-navy-200 text-xs">
                          {new Date(r.uploaded_at).toLocaleDateString('en-NG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-navy-300 font-body">No results found.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Announcements ── */}
        {tab === 'announcements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">

            {/* Post announcement form */}
            <div className="card">
              <h2 className="font-display text-navy text-xl mb-5">Post Announcement</h2>
              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <div>
                  <label className="label">Title</label>
                  <input
                    value={annForm.title}
                    onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                    placeholder="Exam Timetable Released"
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
                    className="input resize-none"
                  />
                </div>
                <div>
                  <label className="label">Priority</label>
                  <div className="flex gap-2">
                    {PRIORITY_OPTIONS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAnnForm({ ...annForm, priority: p })}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium font-body transition-all
                          ${annForm.priority === p ? 'bg-navy text-white' : 'bg-navy-50 text-navy-400 hover:bg-navy-100'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={annLoading} className="btn-gold w-full">
                  {annLoading ? 'Posting...' : 'Post Announcement'}
                </button>
              </form>
            </div>

            {/* Existing announcements */}
            <div className="card">
              <h2 className="font-display text-navy text-xl mb-5">
                Posted Announcements
                <span className="ml-2 text-sm font-body font-normal text-navy-300">({announcements.length})</span>
              </h2>
              {announcements.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="border border-navy-100 rounded-xl p-4 hover:border-navy-200 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-body font-semibold text-navy text-sm">{ann.title}</p>
                        <div className="flex items-center gap-2">
                          <span className={priorityClass[ann.priority]}>{ann.priority}</span>
                          <button
                            onClick={() => handleDeleteAnn(ann.id)}
                            className="text-red-400 hover:text-red-600 text-xs transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <p className="text-navy-300 font-body text-xs leading-relaxed line-clamp-2">{ann.content}</p>
                      <p className="text-navy-200 font-body text-xs mt-2">
                        {new Date(ann.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2">📢</div>
                  <p className="text-navy-300 font-body text-sm">No announcements posted yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}