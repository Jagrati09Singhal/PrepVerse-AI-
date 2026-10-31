import React, { useState, useEffect } from 'react'
import {
  Briefcase,
  Layers,
  ArrowRight,
  Loader2,
  Calendar,
  AlertCircle,
  Building,
  CheckCircle2,
  Trash2,
  Sparkles,
  FileText,
} from 'lucide-react'
import { ENDPOINTS } from '../config/api'
import { useAuth } from '../context/AuthContext'
import SkillGapResults from './SkillGapResults'

const SAMPLE_JDS = [
  {
    label: 'Full Stack Engineer',
    badge: 'React + Node + SQL',
    role: 'Full Stack Engineer',
    company: 'TechCorp Solutions',
    level: 'mid',
    text: 'We are looking for a Full Stack Engineer proficient in React, JavaScript, Node.js, and SQL. Responsibilities include architecting responsive UI components, building RESTful APIs, optimizing database queries, and participating in agile sprints. Requirements: 2+ years experience in modern web development, Git, and automated testing.',
  },
  {
    label: 'Backend Engineer',
    badge: 'Python + FastAPI + Docker',
    role: 'Backend Systems Engineer',
    company: 'CloudScale Labs',
    level: 'senior',
    text: 'Seeking a Backend Engineer skilled in Python, FastAPI, Docker, and PostgreSQL. You will design scalable microservices, manage asynchronous worker pipelines, and maintain API documentation. Required: Strong understanding of OOP, data structures, REST architectures, and containerization.',
  },
  {
    label: 'Frontend Specialist',
    badge: 'React + TypeScript + Tailwind',
    role: 'Frontend UI/UX Engineer',
    company: 'Fintech Nexus',
    level: 'mid',
    text: 'Looking for a Frontend Specialist with deep knowledge of React, Next.js, TypeScript, and Tailwind CSS. You will build high-performance client interfaces, optimize web vitals, and work closely with product designers. Bonus points for Redux and Postman proficiency.',
  },
  {
    label: 'Data / AI Analyst',
    badge: 'Python + SQL + Tableau',
    role: 'Data & Systems Analyst',
    company: 'Enterprise Data AI',
    level: 'entry',
    text: 'We are hiring a Data Analyst proficient in Python, SQL, Pandas, Tableau, and Machine Learning basics. Responsibilities include building automated data dashboards, cleaning large datasets, and collaborating with business intelligence leads.',
  },
]

export default function JobWorkspace({ resumes = [] }) {
  const { authFetch } = useAuth()
  const [localResumes, setLocalResumes] = useState(resumes)
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [roleTitle, setRoleTitle] = useState(() => localStorage.getItem('prepverse_target_role') || '')
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('prepverse_target_company') || '')
  const [experienceLevel, setExperienceLevel] = useState('')

  const [analyzing, setAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [activeAnalysis, setActiveAnalysis] = useState(null)

  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Fetch resumes independently so this workspace never depends on whether user visited Resumes tab first
  const fetchResumesList = async () => {
    try {
      const response = await authFetch(ENDPOINTS.RESUMES)
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setLocalResumes(data)
          if (data.length > 0 && !selectedResumeId) {
            setSelectedResumeId(data[0].id)
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load resumes in JobWorkspace:', err)
    }
  }

  const fetchAnalyses = async () => {
    try {
      const response = await authFetch(ENDPOINTS.JOB_ANALYSES)
      if (response.ok) {
        const data = await response.json()
        setSavedAnalyses(data)
      }
    } catch (err) {
      console.error('Failed to load past analyses:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchResumesList()
    fetchAnalyses()
  }, [])

  useEffect(() => {
    if (resumes && resumes.length > 0) {
      setLocalResumes(resumes)
      if (!selectedResumeId) {
        setSelectedResumeId(resumes[0].id)
      }
    }
  }, [resumes])

  const activeResumes = localResumes.length > 0 ? localResumes : resumes

  const handleStartAnalysis = async (e) => {
    e.preventDefault()
    setErrorMessage(null)

    const resumeIdToUse = selectedResumeId || (activeResumes[0] ? activeResumes[0].id : null)

    if (!resumeIdToUse) {
      setErrorMessage('Please upload or select a resume to analyze against.')
      return
    }

    const effectiveRole = roleTitle.trim() || 'Software Engineer'
    const effectiveJd = jobDescription.trim().length >= 3
      ? jobDescription.trim()
      : `We are looking for a skilled ${effectiveRole} with hands-on proficiency in core technical stacks, problem solving, software design, testing, and team collaboration. Responsibilities include building scalable services, collaborating with product teams, and writing clean, maintainable code.`

    if (!jobDescription.trim()) {
      setJobDescription(effectiveJd)
    }

    setAnalyzing(true)

    try {
      const response = await authFetch(ENDPOINTS.JOB_ANALYSES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_id: resumeIdToUse,
          job_description_raw: effectiveJd,
          job_description: effectiveJd,
          role_title: effectiveRole,
          company_name: companyName.trim() || null,
          experience_level: experienceLevel.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.detail || 'Analysis could not be completed.')
      } else {
        setActiveAnalysis(data)
        await fetchAnalyses()
      }
    } catch (err) {
      setErrorMessage('Network error while analyzing job description.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDeleteAnalysis = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this saved job analysis?')) return

    try {
      const response = await authFetch(ENDPOINTS.JOB_ANALYSIS_DETAIL(id), {
        method: 'DELETE',
      })
      if (response.ok) {
        setSavedAnalyses((prev) => prev.filter((a) => a.id !== id))
        if (activeAnalysis?.id === id) {
          setActiveAnalysis(null)
        }
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err)
    }
  }

  if (activeAnalysis) {
    return (
      <SkillGapResults
        analysis={activeAnalysis}
        onBack={() => {
          setActiveAnalysis(null)
          fetchAnalyses()
        }}
      />
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-violet/10 text-xs font-semibold text-brand-violet">
          <Briefcase className="w-3.5 h-3.5 text-brand-cyan" />
          <span>Job Description Intelligence</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          Job Description & Skill Gap Analysis
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Paste any software engineering or technical job posting to evaluate requirement coverage,
          uncover missing competencies, and receive prioritized recommendations for interview preparation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleStartAnalysis}
            className="p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] space-y-5 shadow-sm"
          >
            {/* Step 1: Resume Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Select Resume for Alignment Matching
              </label>
              {activeResumes.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
                  <span>No resumes uploaded yet. Upload a PDF in the Resume Portfolio tab first.</span>
                  <button
                    type="button"
                    onClick={fetchResumesList}
                    className="underline font-bold text-brand-violet hover:opacity-80 shrink-0"
                  >
                    Refresh Resumes
                  </button>
                </div>
              ) : (
                <select
                  value={selectedResumeId || (activeResumes[0] ? activeResumes[0].id : '')}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet font-medium"
                >
                  {activeResumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.filename} &bull; ({r.total_skills ?? (r.parsed_skills?.all_skills?.length || 0)} skills detected)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Optional Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Target Role Title (Optional)
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google, Stripe"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Experience Level (Optional)
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet"
                >
                  <option value="">Auto-Detect</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead / Staff</option>
                </select>
              </div>
            </div>

            {/* Step 2: Job Description Text & 1-Click Templates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  2. Target Job Description (Paste or Pick a Template)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {jobDescription.length} characters
                </span>
              </div>

              {/* 1-Click Sample JD Chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5 pb-1">
                {SAMPLE_JDS.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRoleTitle(tpl.role)
                      setCompanyName(tpl.company)
                      setExperienceLevel(tpl.level)
                      setJobDescription(tpl.text)
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-brand-violet/15 dark:bg-slate-800/80 hover:dark:bg-brand-violet/25 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-brand-violet dark:hover:text-brand-cyan transition"
                    title={`Click to load ${tpl.role} requirements`}
                  >
                    <Sparkles className="w-3 h-3 text-brand-violet dark:text-brand-cyan shrink-0" />
                    <span>{tpl.label}</span>
                    <span className="text-[10px] opacity-60 font-mono hidden sm:inline">({tpl.badge})</span>
                  </button>
                ))}
              </div>

              <textarea
                rows={7}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste any target job description or click a template above (even a short role or 1 sentence works seamlessly)..."
                className="w-full rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet resize-y"
              />
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={analyzing || activeResumes.length === 0}
              className="w-full py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-brand-violet to-brand-blue hover:opacity-95 text-white shadow-md shadow-brand-violet/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Keyword Alignment & Skill Gaps...</span>
                </>
              ) : (
                <>
                  <span>Evaluate Job Match</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Col: Past Analyses History */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-violet" />
            <span>Saved Job Analyses</span>
          </h3>

          {loadingHistory ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-violet mx-auto" />
              <p className="text-xs text-slate-500">Loading analysis history...</p>
            </div>
          ) : savedAnalyses.length === 0 ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-sm">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">No job analyses yet.</p>
              <p className="text-[11px] text-slate-400">Paste your first job posting on the left to evaluate requirement match.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedAnalyses.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveAnalysis(item)}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-brand-violet/40 transition cursor-pointer group shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-violet dark:group-hover:text-brand-cyan transition block truncate">
                        {item.role_title || 'Software Engineer'}
                      </span>
                      {item.company_name && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                          {item.company_name}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleDeleteAnalysis(item.id, e)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                      title="Delete analysis"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Coverage Match:</span>
                    <span className="font-bold text-brand-violet dark:text-brand-cyan font-mono">
                      {item.match_results?.overall_coverage_pct ?? 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
