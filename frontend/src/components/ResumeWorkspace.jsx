import React, { useState, useEffect, useRef } from 'react'
import {
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  Layers,
  GraduationCap,
  Briefcase,
  X,
  FileCheck,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  Play,
} from 'lucide-react'
import { ENDPOINTS } from '../config/api'
import { useAuth } from '../context/AuthContext'
import { useRouter } from '../context/RouterContext'

export default function ResumeWorkspace({ onResumesUpdated, onLaunchPractice }) {
  const { authFetch } = useAuth()
  const { navigate } = useRouter()
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [selectedResume, setSelectedResume] = useState(null)
  const [fetchingDetail, setFetchingDetail] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const fetchResumes = async () => {
    try {
      const response = await authFetch(ENDPOINTS.RESUMES)
      if (response.ok) {
        const data = await response.json()
        setResumes(data)
        if (onResumesUpdated) onResumesUpdated(data)
      }
    } catch (err) {
      console.error('Failed to load resumes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  const processFile = async (file) => {
    if (!file) return

    setErrorMessage(null)
    setSuccessMessage(null)

    // Client-side file extension check
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Unsupported file format. Please upload a standard PDF (.pdf) document.')
      return
    }

    // Client-side file size check (5 MB limit)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setErrorMessage('File size exceeds the 5 MB limit. Please upload an optimized PDF.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await authFetch(ENDPOINTS.RESUMES, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.detail || 'Failed to process resume. Please verify the document format.')
      } else {
        const skillCount = data.parsed_skills?.all_skills?.length || data.total_skills || 0
        setSuccessMessage(`Successfully uploaded and parsed "${data.filename}" (${skillCount} technical skills extracted).`)
        if (data.parsing_status === 'scanned_image_no_text') {
          setErrorMessage(data.error_message)
        }
        await fetchResumes()
      }
    } catch (err) {
      setErrorMessage('Network error while uploading resume. Please verify backend is running.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) processFile(file)
  }

  // Quick 1-click sample resume creator for instant demonstration without external PDF files
  const handleLoadSampleResume = () => {
    const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 320 >> stream
BT
/F1 12 Tf
72 720 Td
(Candidate: Rohan Sharma) Tj
0 -22 Td
(Education: B.Tech in Computer Science and Engineering, 3rd Year) Tj
0 -22 Td
(Technical Skills: Python, React, SQL, Docker, JavaScript, Git, Operating Systems, DBMS, DSA) Tj
0 -22 Td
(Experience: Software Development Intern - Developed REST APIs with FastAPI and React) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000616 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
687
%%EOF`
    const blob = new Blob([pdfContent], { type: 'application/pdf' })
    const demoFile = new File([blob], 'Rohan_Sharma_Campus_Resume.pdf', { type: 'application/pdf' })
    processFile(demoFile)
  }

  const handleDeleteResume = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return

    try {
      const response = await authFetch(ENDPOINTS.RESUME_DETAIL(id), {
        method: 'DELETE',
      })
      if (response.ok) {
        setSuccessMessage(`Deleted "${filename}".`)
        await fetchResumes()
        if (selectedResume?.id === id) {
          setSelectedResume(null)
        }
      } else {
        setErrorMessage('Failed to delete resume.')
      }
    } catch (err) {
      setErrorMessage('Network error while deleting resume.')
    }
  }

  const handleViewDetail = async (id) => {
    setFetchingDetail(true)
    try {
      const response = await authFetch(ENDPOINTS.RESUME_DETAIL(id))
      if (response.ok) {
        const data = await response.json()
        setSelectedResume(data)
      } else {
        setErrorMessage('Unable to load resume details.')
      }
    } catch (err) {
      setErrorMessage('Failed to fetch resume details.')
    } finally {
      setFetchingDetail(false)
    }
  }

  const handleLaunchSkillTest = (resume) => {
    localStorage.setItem('prepverse_target_resume', resume.id)
    if (onLaunchPractice) {
      onLaunchPractice({
        practice_mode: 'skill_assessment',
        resume_id: resume.id,
      })
    } else {
      navigate('/app/interviews?mode=skill_assessment&resume=' + resume.id)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-violet/10 text-xs font-semibold text-brand-violet dark:text-brand-cyan">
              <FileCheck className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Resume Intelligence Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Candidate Resume Portfolio
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Upload PDF resumes to automatically extract technical skill taxonomies, educational credentials,
              and experience highlights. Extracted competencies ground all interview simulations and diagnostic tests.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={handleLoadSampleResume}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-violet dark:text-brand-cyan bg-brand-violet/10 hover:bg-brand-violet/20 border border-brand-violet/20 transition shadow-sm"
              title="Upload a pre-built sample resume with Python, React, SQL, and Docker"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Load Sample Resume</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-3xl border-2 border-dashed p-8 sm:p-10 text-center transition-all ${
          isDragging
            ? 'border-brand-violet bg-brand-violet/5 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0B0F19]/70 hover:border-brand-violet/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf"
          className="hidden"
          id="resume-upload-input"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-violet/10 text-brand-violet dark:text-brand-cyan flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-brand-violet" />
            ) : (
              <UploadCloud className="w-7 h-7 text-brand-cyan" />
            )}
          </div>

          <div>
            <label
              htmlFor="resume-upload-input"
              className="text-sm font-bold text-slate-900 dark:text-white hover:text-brand-violet dark:hover:text-brand-cyan cursor-pointer transition"
            >
              Click to select a PDF resume
            </label>
            <span className="text-sm text-slate-500 dark:text-slate-400"> or drag and drop file here</span>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Standard PDF documents only &bull; Maximum file size: 5 MB
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Resumes List Card */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0B0F19] p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-violet dark:text-brand-cyan" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Uploaded Resumes</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {resumes.length} {resumes.length === 1 ? 'document' : 'documents'}
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand-violet" />
            <span>Loading resume library...</span>
          </div>
        ) : resumes.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              No resumes uploaded yet. Upload your PDF resume above or generate a sample candidate resume.
            </p>
            <button
              onClick={handleLoadSampleResume}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-violet to-brand-cyan shadow-md hover:opacity-90 transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Load Sample Resume Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-brand-violet/40 transition flex flex-col justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate" title={resume.filename}>
                      {resume.filename}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        resume.parsing_status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {resume.parsing_status === 'completed' ? 'Parsed' : 'Warning'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(resume.uploaded_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-brand-violet dark:text-brand-cyan">
                      <Layers className="w-3 h-3" />
                      {resume.total_skills} skills detected
                    </span>
                  </div>

                  {/* Skill Badges preview */}
                  {resume.skills && resume.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {resume.skills.slice(0, 5).map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {sk}
                        </span>
                      ))}
                      {resume.skills.length > 5 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-400">
                          +{resume.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {resume.error_message && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400/90 leading-tight pt-1">
                      {resume.error_message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    onClick={() => handleLaunchSkillTest(resume)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-violet/10 hover:bg-brand-violet/20 text-brand-violet dark:text-brand-cyan border border-brand-violet/20 transition"
                    title="Take adaptive knowledge check on skills from this resume"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Skill Test</span>
                  </button>
                  <button
                    onClick={() => handleViewDetail(resume.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-brand-violet" />
                    <span>View Analysis</span>
                  </button>
                  <button
                    onClick={() => handleDeleteResume(resume.id, resume.filename)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resume Detail Modal */}
      {selectedResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedResume.filename}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Uploaded {new Date(selectedResume.uploaded_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedResume(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300">
              {/* Skills section */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand-violet" />
                  <span>Detected Technical Skills ({selectedResume.parsed_skills?.all_skills?.length || 0})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedResume.parsed_skills?.all_skills?.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium border border-slate-200 dark:border-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education section */}
              {selectedResume.structured_data?.education?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                    <span>Education Credentials</span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedResume.structured_data.education.map((edu, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white">{edu.degree}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{edu.raw_entry}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience section */}
              {selectedResume.structured_data?.experience?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-amber-500" />
                    <span>Experience Highlights</span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedResume.structured_data.experience.map((exp, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white">{exp.role_headline}</div>
                        {exp.duration && <div className="text-[11px] text-slate-500 dark:text-slate-400">{exp.duration}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw text preview */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Extracted Text Preview</h4>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {selectedResume.raw_text}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
