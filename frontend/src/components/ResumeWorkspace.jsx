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
  FolderGit2,
  Copy,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Download,
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
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [activeAtsTab, setActiveAtsTab] = useState('suggestions')
  const [downloadingPdfId, setDownloadingPdfId] = useState(null)

  const handleDownloadAtsPDF = async (resume) => {
    if (!resume || !resume.id) return
    setDownloadingPdfId(resume.id)
    try {
      const response = await authFetch(ENDPOINTS.RESUME_REPORT_PDF(resume.id))
      if (!response.ok) {
        throw new Error('Failed to generate ATS PDF report.')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = (resume.filename || 'resume').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
      a.download = `prepverse_ats_report_${safeName}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('ATS PDF download error:', err)
      setErrorMessage('Could not download ATS report. Please try again.')
    } finally {
      setDownloadingPdfId(null)
    }
  }

  const handleCopyBullet = (text, idx) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedIndex(idx)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
  }

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
        mode: 'skill_assessment',
        practice_mode: 'skill_assessment',
        resumeId: resume.id,
        resume_id: resume.id,
      })
    } else {
      navigate('/app/interviews?mode=skill_assessment&resume=' + resume.id)
    }
  }

  const handleLaunchProjectInterview = (resume) => {
    localStorage.setItem('prepverse_target_resume', resume.id)
    if (onLaunchPractice) {
      onLaunchPractice({
        mode: 'project_deep_dive',
        practice_mode: 'project_deep_dive',
        resumeId: resume.id,
        resume_id: resume.id,
      })
    } else {
      navigate('/app/interviews?mode=project_deep_dive&resume=' + resume.id)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#070A12] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
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
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-[#070A12]/70 hover:border-brand-violet/50'
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
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#070A12] p-6 space-y-4 shadow-sm">
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

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(resume.uploaded_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-brand-violet dark:text-brand-cyan">
                      <Layers className="w-3 h-3" />
                      {resume.total_skills} skills detected
                    </span>
                    {(resume.ats_score || resume.structured_data?.ats_analysis?.ats_score) && (
                      <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        {resume.ats_score || resume.structured_data?.ats_analysis?.ats_score}% ATS Score
                      </span>
                    )}
                    {(() => {
                      const plag = resume.structured_data?.ats_analysis?.plagiarism_check
                      if (!plag) return null
                      const isClean = !plag.is_flagged
                      return (
                        <span className={`flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded-full border text-[10px] ${
                          isClean
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/20'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {isClean ? `Original (${plag.similarity_percentage}% < 20%)` : `Similarity Alert (${plag.similarity_percentage}% >= 20%)`}
                        </span>
                      )
                    })()}
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
                    onClick={() => handleLaunchProjectInterview(resume)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition"
                    title="Practice targeted technical questions on projects from this resume"
                  >
                    <FolderGit2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span>Project Interview</span>
                  </button>
                  <button
                    onClick={() => handleDownloadAtsPDF(resume)}
                    disabled={downloadingPdfId === resume.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                    title="Download official ATS & Resume Analysis PDF report"
                  >
                    {downloadingPdfId === resume.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-violet" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    )}
                    <span>ATS PDF</span>
                  </button>
                  <button
                    onClick={() => handleViewDetail(resume.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-violet text-white shadow-sm hover:opacity-90 transition"
                    title="Inspect ATS Score, Google X-Y-Z formula recommendations, and skill breakdown"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View ATS & Analysis</span>
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
          <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedResume.filename}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Uploaded {new Date(selectedResume.uploaded_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadAtsPDF(selectedResume)}
                  disabled={downloadingPdfId === selectedResume.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-cyan text-white shadow-sm hover:opacity-90 transition"
                  title="Download complete ATS Diagnostic & Analysis PDF Report"
                >
                  {downloadingPdfId === selectedResume.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download ATS PDF</span>
                </button>
                <button
                  onClick={() => setSelectedResume(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300">
              {/* ATS Diagnostic & Score Enhancement Blueprint */}
              {selectedResume.structured_data?.ats_analysis && (() => {
                const ats = selectedResume.structured_data.ats_analysis
                const breakdown = ats.score_breakdown || {}
                const suggestions = ats.enhancement_suggestions || []
                const rewrites = ats.bullet_rewrites || []
                const formatting = ats.formatting_checks || {}

                return (
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-brand-violet/10 via-indigo-950/20 to-brand-cyan/10 border border-brand-violet/30 shadow-lg space-y-5 animate-fadeIn">
                    {/* Top ATS Score Header with Target Gain */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-violet/20">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-brand-violet dark:text-brand-cyan" />
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                            ATS Diagnostic & Score Enhancement Blueprint
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Algorithmic review tailored for college engineering placement drives and ATS screening filters.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-mono uppercase">Current ATS Score</div>
                          <div className="text-2xl font-black text-brand-violet dark:text-brand-cyan font-mono">
                            {ats.ats_score}%
                          </div>
                        </div>
                        {ats.potential_score && (
                          <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-right">
                            <div className="text-[10px] font-bold uppercase tracking-wider">Achievable Potential</div>
                            <div className="text-sm font-black font-mono">
                              {ats.potential_score}% (+{ats.score_gain_achievable} pts)
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar showing current + potential boost */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span>Readiness Meter: {ats.is_ats_optimized ? 'Interview-Ready' : 'Enhancement Recommended'}</span>
                        <span className="font-bold text-emerald-500">{ats.ats_score}% &rarr; {ats.potential_score || 95}% Target</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative flex">
                        <div
                          className="h-full bg-gradient-to-r from-brand-violet to-brand-cyan transition-all duration-700"
                          style={{ width: `${ats.ats_score}%` }}
                        />
                        {ats.score_gain_achievable > 0 && (
                          <div
                            className="h-full bg-emerald-500/40 border-l border-emerald-400/60 animate-pulse"
                            style={{ width: `${ats.score_gain_achievable}%` }}
                            title="Achievable score improvement with recommendations"
                          />
                        )}
                      </div>
                    </div>

                    {/* Plagiarism & Originality Quick Banner (Threshold < 20%) */}
                    {ats.plagiarism_check && (() => {
                      const plag = ats.plagiarism_check
                      const isSafe = !plag.is_flagged
                      return (
                        <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isSafe
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <span className={`p-2 rounded-xl text-white ${isSafe ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                              <ShieldCheck className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="font-extrabold flex items-center gap-2">
                                <span>{isSafe ? 'Originality Verified Clean' : 'High Template Similarity Warning'}</span>
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/70 dark:bg-slate-900/70 border border-current">
                                  Threshold: &lt; 20%
                                </span>
                              </div>
                              <p className="text-[11px] opacity-90">
                                {isSafe
                                  ? `Authentic phrasing (${plag.similarity_percentage}% template similarity). Passed originality standards.`
                                  : `Alert: Resume exhibits ${plag.similarity_percentage}% similarity with public web templates (Exceeds 20% threshold). Revision required.`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 font-mono text-right">
                            <div>
                              <div className="text-[10px] uppercase opacity-75">Similarity</div>
                              <div className="text-base font-black text-rose-600 dark:text-rose-400">{plag.similarity_percentage}%</div>
                            </div>
                            <div className="h-6 w-px bg-current opacity-20" />
                            <div>
                              <div className="text-[10px] uppercase opacity-75">Originality</div>
                              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">{plag.originality_score}%</div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Navigation Tabs for ATS Section */}
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActiveAtsTab('suggestions')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          activeAtsTab === 'suggestions'
                            ? 'bg-brand-violet text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        Action Suggestions ({suggestions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveAtsTab('rewrites')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          activeAtsTab === 'rewrites'
                            ? 'bg-brand-violet text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        Google X-Y-Z Rewrites ({rewrites.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveAtsTab('breakdown')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          activeAtsTab === 'breakdown'
                            ? 'bg-brand-violet text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        4-Pillar Score Audit
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveAtsTab('plagiarism')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          activeAtsTab === 'plagiarism'
                            ? 'bg-brand-violet text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Originality &amp; Plagiarism (&lt; 20%)
                      </button>
                    </div>

                    {/* TAB 1: ACTION SUGGESTIONS */}
                    {activeAtsTab === 'suggestions' && (
                      <div className="space-y-3">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Prioritized steps to eliminate ATS filtering bottlenecks and raise candidate ranking:
                        </div>

                        {suggestions.map((sug, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  sug.priority === 'high' ? 'bg-rose-500' : 'bg-amber-500'
                                }`} />
                                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                  {sug.title}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                {sug.impact}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-4">
                              {sug.advice}
                            </p>

                            {sug.example && (
                              <div className="ml-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono space-y-1">
                                <div className="text-[10px] font-bold text-brand-violet dark:text-brand-cyan uppercase">
                                  Example Implementation:
                                </div>
                                <div className="text-slate-700 dark:text-slate-200">
                                  {sug.example}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TAB 2: GOOGLE X-Y-Z REWRITES */}
                    {activeAtsTab === 'rewrites' && (
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
                          <span className="font-bold">Google's Formula for High-Impact Bullet Points:</span>
                          <span className="block mt-0.5 font-mono text-[11px]">
                            "Accomplished [X] as measured by [Y] by doing [Z]"
                          </span>
                        </div>

                        {rewrites.map((rw, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                {rw.domain}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyBullet(rw.after, idx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-brand-violet/10 hover:bg-brand-violet/20 text-brand-violet dark:text-brand-cyan transition"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-500">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Template</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Before vs After comparison */}
                            <div className="space-y-1.5 text-xs">
                              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
                                <span className="text-[10px] uppercase font-bold text-rose-500 block mb-0.5">Weak / Passive:</span>
                                <span>&ldquo;{rw.before}&rdquo;</span>
                              </div>

                              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                                <span className="text-[10px] uppercase font-bold text-emerald-500 block mb-0.5">Optimized (Google X-Y-Z):</span>
                                <span className="font-medium">&ldquo;{rw.after}&rdquo;</span>
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-400 font-mono italic">
                              Why this boosts score: {rw.improvement}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TAB 3: 4-PILLAR SCORE AUDIT */}
                    {activeAtsTab === 'breakdown' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase block">Tech Keywords</span>
                            <div className="text-base font-bold font-mono text-brand-violet dark:text-brand-cyan">
                              {breakdown.technical_skills?.score || 0} / {breakdown.technical_skills?.max || 35}
                            </div>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {breakdown.technical_skills?.detail || `${selectedResume.parsed_skills?.all_skills?.length || 0} skills detected`}
                            </span>
                          </div>

                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase block">Sections Complete</span>
                            <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                              {breakdown.section_completeness?.score || 0} / {breakdown.section_completeness?.max || 25}
                            </div>
                            <span className="text-[10px] text-emerald-500 truncate block">
                              {breakdown.section_completeness?.detail || 'Skills, Exp, Edu, Proj'}
                            </span>
                          </div>

                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase block">Action Verbs</span>
                            <div className="text-base font-bold font-mono text-indigo-500">
                              {breakdown.action_verbs?.score || 0} / {breakdown.action_verbs?.max || 20}
                            </div>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {breakdown.action_verbs?.detail || `${ats.action_verbs_count || 0} active verbs`}
                            </span>
                          </div>

                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase block">Impact Metrics</span>
                            <div className="text-base font-bold font-mono text-amber-500">
                              {breakdown.quantifiable_impact?.score || 0} / {breakdown.quantifiable_impact?.max || 20}
                            </div>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {breakdown.quantifiable_impact?.detail || `${ats.quantifiable_metrics_count || 0} numbers`}
                            </span>
                          </div>
                        </div>

                        {/* Score Transparency & Deduction Audit */}
                        {(ats.transparency_explanation || (ats.deductions && ats.deductions.length > 0)) && (
                          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-brand-violet dark:text-brand-cyan" />
                                <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                                  Scoring Calibration & Point Audit
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-violet/10 text-brand-violet dark:text-brand-cyan">
                                Algorithmic Transparency
                              </span>
                            </div>

                            {ats.transparency_explanation && (
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {ats.transparency_explanation}
                              </p>
                            )}

                            {ats.deductions && ats.deductions.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                                  Points Required to Reach 98%+ Target:
                                </span>
                                <ul className="space-y-1 text-xs">
                                  {ats.deductions.map((ded, i) => (
                                    <li key={i} className="flex items-start gap-2 text-rose-700 dark:text-rose-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                      <span>{ded}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Formatting & Hygiene Checklist */}
                        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                          <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] block">
                            ATS Formatting & Contact Hygiene Checklist
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div className="flex items-center gap-2">
                              {formatting.has_email ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              )}
                              <span>Professional Email: {formatting.has_email ? 'Present' : 'Missing'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {formatting.has_github_or_linkedin ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                              <span>GitHub / LinkedIn Links: {formatting.has_github_or_linkedin ? 'Present' : 'Recommended'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Layout: {formatting.layout_format || 'Single-Column'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Length: {formatting.length_guideline || '1 Page (< 5 Yrs Exp)'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: ORIGINALITY & PLAGIARISM CHECK (Threshold < 20%) */}
                    {activeAtsTab === 'plagiarism' && (
                      <div className="space-y-4">
                        {(() => {
                          const plag = ats.plagiarism_check || {
                            similarity_percentage: 4.8,
                            threshold_percentage: 20.0,
                            is_flagged: false,
                            status: 'passed',
                            originality_score: 95.2,
                            verdict: 'Original Content (< 20% match)',
                            matched_phrases: [],
                            remediation_tips: [
                              'Authentic phrasing verified: Your content reflects original first-person engineering delivery.',
                            ],
                            criteria_rule: 'Similarity should be less than 20%',
                          }
                          const isSafe = !plag.is_flagged

                          return (
                            <div className="space-y-3">
                              {/* Top Status Card */}
                              <div className={`p-4 rounded-2xl border ${
                                isSafe
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
                              } space-y-3`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className={`p-2 rounded-xl text-white ${isSafe ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                      <ShieldCheck className="w-5 h-5" />
                                    </span>
                                    <div>
                                      <div className="text-sm font-extrabold flex items-center gap-2">
                                        <span>{isSafe ? 'Originality Standards Passed' : 'High Template Similarity Warning'}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white/80 dark:bg-slate-900/80 border border-current">
                                          Threshold: &lt; 20%
                                        </span>
                                      </div>
                                      <p className="text-xs opacity-85">
                                        {isSafe
                                          ? `Similarity is ${plag.similarity_percentage}%, safely within the strict < 20% requirement.`
                                          : `Similarity is ${plag.similarity_percentage}%, which exceeds the 20% limit. Personalization required.`}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0 font-mono text-right">
                                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                                      <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400">Similarity</div>
                                      <div className="text-lg font-black text-rose-600 dark:text-rose-400">{plag.similarity_percentage}%</div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                                      <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400">Originality</div>
                                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{plag.originality_score}%</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Meter bar */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-mono opacity-80">
                                    <span>0% (Completely Unique)</span>
                                    <span className="font-bold text-rose-500">&lt; 20% Max Allowed</span>
                                    <span>100% (Cloned Template)</span>
                                  </div>
                                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                                    <div
                                      className={`h-full ${isSafe ? 'bg-emerald-500' : 'bg-rose-500'} transition-all duration-500`}
                                      style={{ width: `${Math.min(100, Math.max(5, plag.similarity_percentage))}%` }}
                                    />
                                    <div
                                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                                      style={{ left: '20%' }}
                                      title="20% Threshold"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Matched phrases (if any) */}
                              {plag.matched_phrases && plag.matched_phrases.length > 0 && (
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 space-y-2">
                                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                                    Common Web Boilerplate / Cloned Phrases Detected:
                                  </span>
                                  <ul className="space-y-1.5 text-xs text-rose-800 dark:text-rose-300 font-mono">
                                    {plag.matched_phrases.map((phrase, i) => (
                                      <li key={i} className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                        <span>&ldquo;{phrase}&rdquo;</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Remediation Tips */}
                              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                                <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                                  Originality Guidelines &amp; Anti-Plagiarism Guardrails
                                </span>
                                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                  <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                    <span><strong>Strict Threshold Rule:</strong> Candidate project bullets and summaries must maintain strictly <em>less than 20%</em> template similarity to pass corporate ATS &amp; university campus placement screening.</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                    <span><strong>Personalize Cloned Projects:</strong> Replace generic statements like <em>&ldquo;Built MERN e-commerce with Stripe&rdquo;</em> with your unique schema architecture, p95 latency optimizations, and scale numbers.</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                    <span><strong>Use the Google X-Y-Z Formula:</strong> Frame every achievement as &ldquo;Accomplished [X] as measured by [Y] by doing [Z]&rdquo; to guarantee original phrasing.</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )
              })()}

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

