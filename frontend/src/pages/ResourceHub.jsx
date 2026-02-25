import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const MATERIAL_TYPES = ['ALL', 'PAST_QUESTION', 'LECTURE_NOTE', 'OTHER']
const TYPE_LABELS    = { ALL: 'All', PAST_QUESTION: 'Past Questions', LECTURE_NOTE: 'Lecture Notes', OTHER: 'Other' }
const TYPE_ICONS     = { PAST_QUESTION: '📝', LECTURE_NOTE: '📖', OTHER: '📁' }

export default function ResourceHub() {
  const { user } = useAuth()
  const fileRef  = useRef()

  const [materials, setMaterials]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [typeFilter, setTypeFilter]   = useState('ALL')
  const [courseFilter, setCourseFilter] = useState('')
  const [showUpload, setShowUpload]   = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [form, setForm] = useState({ title: '', course_code: '', material_type: 'PAST_QUESTION' })

  const fetchMaterials = (type = 'ALL', course = '') => {
    const params = new URLSearchParams()
    if (type   !== 'ALL') params.append('type', type)
    if (course)           params.append('course', course)
    setLoading(true)
    api.get(`/materials/?${params}`)
      .then(({ data }) => setMaterials(data))
      .catch(() => toast.error('Failed to load materials.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMaterials() }, [])

  const handleFilter = () => fetchMaterials(typeFilter, courseFilter)

  const handleUpload = async (e) => {
    e.preventDefault()
    const file = fileRef.current?.files[0]
    if (!file) { toast.error('Please select a file.'); return }

    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('course_code', form.course_code.toUpperCase())
    fd.append('material_type', form.material_type)
    fd.append('file', file)

    setUploading(true)
    try {
      await api.post('/materials/upload/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Material uploaded!')
      setShowUpload(false)
      setForm({ title: '', course_code: '', material_type: 'PAST_QUESTION' })
      if (fileRef.current) fileRef.current.value = ''
      fetchMaterials(typeFilter, courseFilter)
    } catch (err) {
      toast.error(err.response?.data?.file?.[0] || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this material?')) return
    try {
      await api.delete(`/materials/${id}/delete/`)
      toast.success('Deleted.')
      fetchMaterials(typeFilter, courseFilter)
    } catch {
      toast.error('Delete failed.')
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-navy text-3xl font-semibold">Resource Hub</h1>
            <p className="text-navy-300 font-body mt-1">Past questions, lecture notes, and study materials</p>
          </div>
          <button onClick={() => setShowUpload(!showUpload)} className="btn-gold">
            {showUpload ? '✕ Cancel' : '+ Upload'}
          </button>
        </div>

        {/* Upload form */}
        {showUpload && (
          <div className="card mb-6 animate-fade-up border-gold border">
            <h2 className="font-display text-navy text-lg mb-4">Upload Study Material</h2>
            <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="COS101 Past Questions 2023" required className="input" />
              </div>
              <div>
                <label className="label">Course Code</label>
                <input value={form.course_code} onChange={(e) => setForm({ ...form, course_code: e.target.value })}
                  placeholder="COS101" required className="input" />
              </div>
              <div>
                <label className="label">Type</label>
                <select value={form.material_type} onChange={(e) => setForm({ ...form, material_type: e.target.value })} className="input">
                  <option value="PAST_QUESTION">Past Question</option>
                  <option value="LECTURE_NOTE">Lecture Note</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="label">File</label>
                <input ref={fileRef} type="file" className="input !py-2 cursor-pointer" accept=".pdf,.doc,.docx,.ppt,.pptx" />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={uploading} className="btn-primary">
                  {uploading ? 'Uploading...' : 'Upload Material'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-2 overflow-x-auto">
            {MATERIAL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); fetchMaterials(t, courseFilter) }}
                className={`px-4 py-2 rounded-xl text-sm font-medium font-body whitespace-nowrap transition-all duration-200
                  ${typeFilter === t
                    ? 'bg-navy text-white shadow'
                    : 'bg-white text-navy-400 border border-navy-100 hover:text-navy'
                  }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <input
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              placeholder="Filter by course (e.g. COS101)"
              className="input !py-2 text-sm !w-52"
            />
            <button onClick={handleFilter} className="btn-outline !py-2 !px-4 text-sm">Go</button>
          </div>
        </div>

        {/* Materials grid */}
        {loading ? (
          <div className="text-center py-16 font-body text-navy-300 animate-pulse">Loading materials...</div>
        ) : materials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m, i) => (
              <div
                key={m.id}
                className="card hover:shadow-lg transition-all duration-200 animate-fade-up group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{TYPE_ICONS[m.material_type] ?? '📁'}</span>
                  <span className="badge-normal text-xs">{m.course_code}</span>
                </div>
                <h3 className="font-body font-semibold text-navy text-sm leading-snug mb-1 line-clamp-2">{m.title}</h3>
                <p className="font-body text-navy-200 text-xs mb-4">
                  {TYPE_LABELS[m.material_type]} · Uploaded by {m.uploaded_by_name}
                </p>
                <div className="flex items-center gap-2 mt-auto">
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center text-sm font-body font-medium text-navy border border-navy-100 py-2 rounded-lg hover:bg-navy hover:text-white transition-all duration-200"
                  >
                    Download
                  </a>
                  {(m.uploaded_by_name === `${user?.first_name} ${user?.last_name}` || user?.role === 'ADVISOR') && (
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="font-display text-navy text-xl mb-2">No materials found</h3>
            <p className="text-navy-300 font-body text-sm">
              {typeFilter !== 'ALL' || courseFilter
                ? 'Try clearing your filters.'
                : 'Be the first to upload a study material!'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}