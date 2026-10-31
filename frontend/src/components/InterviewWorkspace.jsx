import React, { useState, useEffect } from 'react'
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Award,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Briefcase,
  FileText,
  Sliders,
  Send,
  Loader2,
  Trash2,
  BarChart3,
  Lightbulb,
  Mic,
  Volume2,
  Activity,
  TrendingUp,
  Gauge,
  Edit3,
  Target,
  Zap,
  Check,
} from 'lucide-react'
import { ENDPOINTS } from '../config/api'
import { useAuth } from '../context/AuthContext'
import SpeechToTextButton from './SpeechToTextButton'
import InterviewReport from './InterviewReport'
import QuestionAudioPlayer from './QuestionAudioPlayer'
import VoiceAnswerRecorder from './VoiceAnswerRecorder'
import AICoachModal from './AICoachModal'

export default function InterviewWorkspace({
  initialPracticeParams,
  onResetPracticeParams,
  initialSessionId,
  initialViewMode,
}) {
  const { authFetch } = useAuth()

  // AI Coach Modal State
  const [coachModalData, setCoachModalData] = useState(null)

  // Data sources
  const [resumes, setResumes] = useState([])
  const [jobAnalyses, setJobAnalyses] = useState([])
  const [pastSessions, setPastSessions] = useState([])
  const [loadingInitial, setLoadingInitial] = useState(true)

  // Creation form state
  const [practiceMode, setPracticeMode] = useState('mock_interview') // 'mock_interview', 'quick_practice', 'weak_area', 'focused_technical'
  const [targetFocus, setTargetFocus] = useState('')
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [sourceType, setSourceType] = useState('analysis') // 'analysis' or 'custom_jd'
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('')
  const [customJobDesc, setCustomJobDesc] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [selectedTypes, setSelectedTypes] = useState(['technical', 'behavioral', 'situational'])
  const [interviewMode, setInterviewMode] = useState('voice') // 'voice' or 'text'
  const [isAdaptive, setIsAdaptive] = useState(true)
  const [studentLevel, setStudentLevel] = useState(() => {
    return localStorage.getItem('prepverse_academic_year') || '3rd_year'
  })

  // Session & Simulation state
  const [activeSession, setActiveSession] = useState(null)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [answerDraft, setAnswerDraft] = useState('')
  const [audioDurationSeconds, setAudioDurationSeconds] = useState(null)
  const [inputModeTab, setInputModeTab] = useState('voice') // 'voice' or 'text'
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Report state
  const [activeReport, setActiveReport] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)

  // Timer for active question
  useEffect(() => {
    if (!activeSession) return
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [activeSession, activeQuestionIndex])

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Sync initialPracticeParams from Dashboard recommendations & URL query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const modeParam = params.get('mode')
    const resumeParam = params.get('resume')
    if (modeParam === 'skill_assessment') {
      setPracticeMode('skill_assessment')
      setQuestionCount(5)
    }
    if (resumeParam) {
      setSelectedResumeId(resumeParam)
    }

    if (initialPracticeParams) {
      if (initialPracticeParams.mode) setPracticeMode(initialPracticeParams.mode)
      if (initialPracticeParams.focus) setTargetFocus(initialPracticeParams.focus)
      if (initialPracticeParams.difficulty) setDifficulty(initialPracticeParams.difficulty)
      if (initialPracticeParams.mode === 'quick_practice') setQuestionCount(3)
      if (initialPracticeParams.mode === 'focused_technical') setSelectedTypes(['technical'])
      if (initialPracticeParams.mode === 'skill_assessment') setPracticeMode('skill_assessment')
      if (onResetPracticeParams) onResetPracticeParams()
    }
  }, [initialPracticeParams, onResetPracticeParams])

  // Fetch initial data
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    setLoadingInitial(true)
    try {
      const [resResumes, resAnalyses, resSessions] = await Promise.all([
        authFetch(ENDPOINTS.RESUMES),
        authFetch(ENDPOINTS.JOB_ANALYSES),
        authFetch(ENDPOINTS.INTERVIEWS),
      ])

      if (resResumes.ok) {
        const resumesData = await resResumes.json()
        setResumes(resumesData)
        if (resumesData.length > 0 && !selectedResumeId) {
          setSelectedResumeId(resumesData[0].id)
        }
      }

      if (resAnalyses.ok) {
        const analysesData = await resAnalyses.json()
        setJobAnalyses(analysesData)
        if (analysesData.length > 0 && !selectedAnalysisId) {
          setSelectedAnalysisId(analysesData[0].id)
          setRoleTitle(analysesData[0].role_title || '')
        }
      }

      if (resSessions.ok) {
        const sessionsData = await resSessions.json()
        setPastSessions(sessionsData)
      }
    } catch (err) {
      console.error('Error fetching interview context data:', err)
      setErrorMessage('Could not load resumes or past sessions.')
    } finally {
      setLoadingInitial(false)
    }
  }

  // Handle Type Toggles
  const handleTypeToggle = (type) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return // Keep at least one
      setSelectedTypes(selectedTypes.filter((t) => t !== type))
    } else {
      setSelectedTypes([...selectedTypes, type])
    }
  }

  // Create Interview Session
  const handleCreateInterview = async (e) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!selectedResumeId) {
      setErrorMessage('Please select a candidate resume to generate questions from.')
      return
    }

    if (practiceMode === 'focused_technical' && !targetFocus.trim()) {
      setErrorMessage('Please enter a target technical topic or skill focus.')
      return
    }

    setIsCreatingSession(true)

    try {
      const effectiveRole = roleTitle.trim() || 'Software Engineer'
      const effectiveJd = (sourceType === 'custom_jd' ? customJobDesc.trim() : '') ||
        `Comprehensive interview preparation for ${effectiveRole}`

      const payload = {
        resume_id: selectedResumeId,
        job_analysis_id: sourceType === 'analysis' ? (selectedAnalysisId || null) : null,
        job_description: effectiveJd,
        job_description_raw: effectiveJd,
        role_title: effectiveRole,
        question_count: practiceMode === 'quick_practice' ? 3 : Number(questionCount) || 5,
        difficulty,
        question_types: practiceMode === 'focused_technical' ? ['technical'] : selectedTypes,
        interview_mode: interviewMode,
        is_adaptive: isAdaptive,
        practice_mode: practiceMode,
        target_focus: targetFocus.trim() || null,
        student_level: studentLevel,
      }

      const res = await authFetch(ENDPOINTS.INTERVIEWS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to create interview session.')
      }

      const created = await res.json()
      await handleOpenSession(created.id)
    } catch (err) {
      console.error('Session creation error:', err)
      setErrorMessage(err.message)
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Open an Existing Session
  const handleOpenSession = async (sessionId) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setAnswerDraft('')
    setAudioDurationSeconds(null)
    setElapsedSeconds(0)

    try {
      const res = await authFetch(ENDPOINTS.INTERVIEW_DETAIL(sessionId))
      if (!res.ok) throw new Error('Could not retrieve interview session.')
      const sessionData = await res.json()
      setActiveSession(sessionData)

      // Find first unanswered question or default to 0
      const answeredIds = (sessionData.answers || []).map((a) => a.question_id)
      const firstUnanswered = sessionData.questions.findIndex((q) => !answeredIds.includes(q.id))
      const targetIndex = firstUnanswered !== -1 ? firstUnanswered : 0
      setActiveQuestionIndex(targetIndex)

      // If already answered, populate draft
      const targetQuestion = sessionData.questions[targetIndex]
      const existingAnswer = sessionData.answers?.find((a) => a.question_id === targetQuestion?.id)
      if (existingAnswer) {
        setAnswerDraft(existingAnswer.answer_text)
        setAudioDurationSeconds(existingAnswer.audio_duration_seconds)
      } else {
        setAnswerDraft('')
      }
    } catch (err) {
      setErrorMessage(err.message)
    }
  }

  // Open Report
  const handleOpenReport = async (sessionId) => {
    setLoadingReport(true)
    setErrorMessage(null)
    try {
      const res = await authFetch(ENDPOINTS.INTERVIEW_REPORT(sessionId))
      if (!res.ok) throw new Error('Could not load interview evaluation report.')
      const reportData = await res.json()
      setActiveReport(reportData)
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setLoadingReport(false)
    }
  }

  // Handle URL deep-linking to session or report
  useEffect(() => {
    if (initialSessionId) {
      if (initialViewMode === 'report') {
        handleOpenReport(initialSessionId)
      } else {
        handleOpenSession(initialSessionId)
      }
    }
  }, [initialSessionId, initialViewMode])

  // Navigate between questions in active session
  const handleNavigateQuestion = (newIndex) => {
    if (!activeSession) return
    if (newIndex < 0 || newIndex >= activeSession.questions.length) return
    setActiveQuestionIndex(newIndex)
    setErrorMessage(null)
    setSuccessMessage(null)
    setAudioDurationSeconds(null)
    setElapsedSeconds(0)

    const nextQ = activeSession.questions[newIndex]
    const existing = activeSession.answers?.find((a) => a.question_id === nextQ.id)
    if (existing) {
      setAnswerDraft(existing.answer_text)
      setAudioDurationSeconds(existing.audio_duration_seconds)
    } else {
      setAnswerDraft('')
    }
  }

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!activeSession || !answerDraft.trim()) return
    const currentQ = activeSession.questions[activeQuestionIndex]

    if (currentQ?.format !== 'mcq' && answerDraft.trim().length < 10) {
      setErrorMessage('Answer is too short. Please provide at least 10 characters to evaluate.')
      return
    }

    setIsSubmittingAnswer(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const payload = {
        question_id: currentQ.id,
        answer_text: answerDraft.trim(),
        audio_duration_seconds: audioDurationSeconds,
      }

      const res = await authFetch(ENDPOINTS.INTERVIEW_ANSWERS(activeSession.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || 'Evaluation failed.')
      }

      const evaluatedAnswer = await res.json()

      // Refresh session
      const resRefresh = await authFetch(ENDPOINTS.INTERVIEW_DETAIL(activeSession.id))
      if (resRefresh.ok) {
        const refreshed = await resRefresh.json()
        setActiveSession(refreshed)
      }

      setSuccessMessage('Answer evaluated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  // Complete Interview
  const handleFinishInterview = async () => {
    if (!activeSession) return
    setLoadingReport(true)
    try {
      const res = await authFetch(ENDPOINTS.INTERVIEW_COMPLETE(activeSession.id), {
        method: 'POST',
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || 'Failed to complete interview.')
      }
      await handleOpenReport(activeSession.id)
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setLoadingReport(false)
    }
  }

  // Delete an Interview
  const handleDeleteInterview = async (sessionId, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this interview record?')) return
    try {
      const res = await authFetch(ENDPOINTS.INTERVIEW_DETAIL(sessionId), {
        method: 'DELETE',
      })
      if (res.ok) {
        setPastSessions((prev) => prev.filter((s) => s.id !== sessionId))
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  // Exit with draft protection
  const handleExitSimulator = () => {
    const currentQ = activeSession?.questions[activeQuestionIndex]
    const currentAns = activeSession?.answers?.find((a) => a.question_id === currentQ?.id)
    if (answerDraft && answerDraft.trim().length >= 10 && !currentAns) {
      if (!window.confirm('You have an unsubmitted answer draft. Are you sure you want to exit?')) {
        return
      }
    }
    setActiveSession(null)
    fetchUserData()
  }

  // Render Report View
  if (activeReport) {
    return (
      <InterviewReport
        report={activeReport}
        onBack={() => {
          setActiveReport(null)
          fetchUserData()
        }}
      />
    )
  }

  // Render Dedicated Simulator View
  if (activeSession) {
    const currentQ = activeSession.questions[activeQuestionIndex]
    const currentAns = activeSession.answers.find((a) => a.question_id === currentQ?.id)
    const progress = Math.round(
      (activeSession.answers.length / (activeSession.questions.length || 1)) * 100
    )
    const isVoiceMode = activeSession.interview_mode === 'voice'

    return (
      <div className="space-y-6 animate-fadeIn text-left">
        {/* Simulator Top Header */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                Live Simulator
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                {isVoiceMode ? '🎙️ Voice Mode' : '📝 Text Mode'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-violet/10 text-brand-violet border border-brand-violet/20 uppercase">
                {activeSession.practice_mode ? activeSession.practice_mode.replace('_', ' ') : 'mock interview'}
              </span>
              {activeSession.is_adaptive && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ⚡ Adaptive
                </span>
              )}
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{activeSession.role_title}</span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Question {activeQuestionIndex + 1} of {activeSession.questions.length}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-brand-violet" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>

            <button
              onClick={handleExitSimulator}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700"
            >
              Exit
            </button>

            <button
              onClick={handleFinishInterview}
              disabled={loadingReport}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-blue hover:opacity-95 text-white shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {loadingReport ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BarChart3 className="w-3.5 h-3.5" />
              )}
              <span>Complete & View Report</span>
            </button>
          </div>
        </div>

        {/* Interactive Question Stepper Bar */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            {activeSession.questions.map((q, idx) => {
              const isAns = activeSession.answers?.some((a) => a.question_id === q.id)
              const isCur = idx === activeQuestionIndex
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleNavigateQuestion(idx)}
                  className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold transition shrink-0 ${
                    isCur
                      ? 'bg-gradient-to-r from-brand-violet to-brand-blue text-white shadow-md shadow-brand-violet/30 ring-2 ring-brand-violet/50'
                      : isAns
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`Question ${idx + 1}: ${isAns ? 'Evaluated' : 'Unanswered'}`}
                >
                  {isAns ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                </button>
              )
            })}
          </div>

          <div className="text-right shrink-0 hidden sm:block">
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              {activeSession.answers.length} of {activeSession.questions.length} Answered ({progress}%)
            </span>
          </div>
        </div>

        {/* Question Panel */}
        {currentQ && (
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  currentQ.type === 'behavioral'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : currentQ.type === 'technical'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                }`}>
                  {currentQ.type === 'behavioral' ? 'Behavioral (STAR)' : currentQ.type}
                </span>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                  currentQ.difficulty === 'hard'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : currentQ.difficulty === 'medium'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}>
                  {currentQ.difficulty}
                </span>

                {currentQ.target_skill && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-violet/10 text-brand-violet border border-brand-violet/20">
                    Target Skill: {currentQ.target_skill}
                  </span>
                )}
              </div>

              {/* Spoken Audio Player */}
              <QuestionAudioPlayer questionText={currentQ.question_text} autoPlay={false} />
            </div>

            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question_text}
            </p>

            {/* Interactive Multiple Choice Option Cards */}
            {currentQ.format === 'mcq' && currentQ.options && currentQ.options.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-violet dark:text-brand-cyan" />
                  <span>Interactive Skill Check — Select Your Choice:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQ.options.map((opt, optIdx) => {
                    const optLetter = opt.trim().charAt(0).toUpperCase()
                    const isSelected = answerDraft.trim().toUpperCase().startsWith(optLetter)
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => setAnswerDraft(opt)}
                        className={`p-3.5 rounded-2xl border text-left text-xs font-medium transition flex items-center gap-3 ${
                          isSelected
                            ? 'bg-brand-violet/15 border-brand-violet text-brand-violet dark:text-brand-cyan shadow-sm font-bold ring-2 ring-brand-violet/40'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-violet/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-brand-violet text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {optLetter}
                        </span>
                        <span className="flex-1 leading-snug">{opt.replace(/^[A-D]\)\s*/, '')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Adaptive Explanation Callout */}
            {currentQ.adaptation_reason && (
              <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                currentQ.adaptation_reason.includes('Reinforcement')
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                  : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-900 dark:text-purple-200'
              }`}>
                <TrendingUp className="w-4 h-4 text-brand-violet shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase tracking-wide text-[10px] block mb-0.5">
                    {currentQ.adaptation_reason.includes('Reinforcement') ? '🎯 Targeted Weak Topic Practice' : 'Adaptive Progression Notice'}
                  </span>
                  <span>{currentQ.adaptation_reason}</span>
                </div>
              </div>
            )}

            {currentQ.type === 'behavioral' && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Behavioral Tip:</strong> Structure your answer using the STAR methodology: <strong>Situation</strong> (context), <strong>Task</strong> (your specific challenge), <strong>Action</strong> (your exact contributions), and <strong>Result</strong> (quantifiable impact).
                </span>
              </div>
            )}
          </div>
        )}

        {/* Answer Answering Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Candidate Answer Submission
              </label>
              {audioDurationSeconds !== null && audioDurationSeconds > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-50 dark:bg-cyan-950 text-brand-cyan border border-cyan-200 dark:border-cyan-800">
                  Audio: {audioDurationSeconds.toFixed(1)}s
                </span>
              )}
            </div>

            {/* Toggle Input Mode */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInputModeTab('voice')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  inputModeTab === 'voice'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-brand-violet" />
                <span>Voice Recorder</span>
              </button>
              <button
                type="button"
                onClick={() => setInputModeTab('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  inputModeTab === 'text'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Manual Text</span>
              </button>
            </div>
          </div>

          {/* Voice Recorder View */}
          {inputModeTab === 'voice' && (
            <div className="space-y-3">
              <VoiceAnswerRecorder
                transcript={answerDraft}
                onTranscriptChange={(newVal) => setAnswerDraft(newVal)}
                onDurationChange={(secs) => setAudioDurationSeconds(secs)}
                onRecordingComplete={({ durationSeconds, transcript }) => {
                  if (durationSeconds) setAudioDurationSeconds(durationSeconds)
                  if (transcript) setAnswerDraft(transcript)
                }}
                disabled={isSubmittingAnswer}
              />
            </div>
          )}

          {/* Editable Transcript Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">
                {inputModeTab === 'voice'
                  ? 'Editable Transcript (Review, refine, or enrich before evaluation)'
                  : 'Typed Response'}
              </span>
              {inputModeTab === 'text' && (
                <SpeechToTextButton
                  onTranscript={(transcript) => {
                    setAnswerDraft((prev) => (prev ? `${prev} ${transcript}` : transcript))
                  }}
                  disabled={isSubmittingAnswer}
                />
              )}
            </div>

            <div className="relative">
              <textarea
                rows={6}
                value={answerDraft}
                onChange={(e) => setAnswerDraft(e.target.value)}
                disabled={isSubmittingAnswer}
                placeholder={
                  inputModeTab === 'voice'
                    ? 'Spoken transcript appears here in real time. You can freely edit or augment it before submitting...'
                    : 'Type your answer here (minimum 10 characters)...'
                }
                className="w-full rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition disabled:opacity-60 resize-y shadow-sm"
              />
              <div className="absolute bottom-3 right-4 text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 bg-slate-100/90 dark:bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span>{answerDraft.trim() ? answerDraft.trim().split(/\s+/).length : 0} words</span>
                <span>•</span>
                <span>{answerDraft.length} / 5000 chars</span>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavigateQuestion(activeQuestionIndex - 1)}
                disabled={activeQuestionIndex === 0 || isSubmittingAnswer}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition flex items-center gap-1 border border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigateQuestion(activeQuestionIndex + 1)}
                disabled={activeQuestionIndex === activeSession.questions.length - 1 || isSubmittingAnswer}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition flex items-center gap-1 border border-slate-200 dark:border-slate-700"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isSubmittingAnswer || answerDraft.trim().length < 10}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-brand-violet to-brand-blue hover:opacity-95 text-white shadow-md shadow-brand-violet/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmittingAnswer ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{currentAns ? 'Re-Evaluate Answer' : 'Submit & Evaluate Answer'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Existing Evaluation Feedback Card */}
        {currentAns && currentAns.evaluation_status === 'completed' && (
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Answer Evaluation
                </span>
                <span className="text-xs text-slate-400">({currentAns.evaluation_details?.engine || 'deterministic'} engine)</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Content Score: {currentAns.content_score}%
                </div>
                <div className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-brand-cyan">
                  Communication: {currentAns.communication_score}%
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {currentAns.feedback_text}
            </p>

            {/* Speech Analytics Section */}
            {currentAns.speech_analytics && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-cyan uppercase tracking-wider flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Speech Delivery Analytics</span>
                  </span>
                  {currentAns.audio_duration_seconds && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Duration: {currentAns.audio_duration_seconds.toFixed(1)}s
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase block">Speaking Pace</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {currentAns.speech_analytics.speaking_pace_wpm?.words_per_minute !== null &&
                      currentAns.speech_analytics.speaking_pace_wpm?.words_per_minute !== undefined
                        ? `${Math.round(currentAns.speech_analytics.speaking_pace_wpm.words_per_minute)} WPM`
                        : 'Unavailable'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase block">Pace Category</span>
                    <span className="text-xs font-bold text-brand-cyan">
                      {currentAns.speech_analytics.speaking_pace_wpm?.category || 'N/A'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase block">Filler Words</span>
                    <span className="text-xs font-bold text-amber-500">
                      {currentAns.speech_analytics.filler_words?.total_filler_count || 0} (
                      {currentAns.speech_analytics.filler_words?.filler_rate_percentage || 0}%)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase block">Pause Events</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {currentAns.speech_analytics.pause_statistics?.pause_count !== null &&
                      currentAns.speech_analytics.pause_statistics?.pause_count !== undefined
                        ? `${currentAns.speech_analytics.pause_statistics.pause_count} pauses`
                        : 'Unavailable'}
                    </span>
                  </div>
                </div>

                {currentAns.speech_analytics.clarity_feedback && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 italic pt-1">
                    {currentAns.speech_analytics.clarity_feedback}
                  </p>
                )}
              </div>
            )}

            {/* STAR Breakdown */}
            {currentAns.star_component_scores && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  STAR Rubric Breakdown
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Situation</span>
                    <span className="font-bold text-slate-900 dark:text-white">{currentAns.star_component_scores.situation}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Task</span>
                    <span className="font-bold text-slate-900 dark:text-white">{currentAns.star_component_scores.task}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Action</span>
                    <span className="font-bold text-emerald-500">{currentAns.star_component_scores.action}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Result</span>
                    <span className="font-bold text-slate-900 dark:text-white">{currentAns.star_component_scores.result}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Strengths & Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              {currentAns.evaluation_details?.strengths && currentAns.evaluation_details.strengths.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Key Strengths</span>
                  </span>
                  <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                    {currentAns.evaluation_details.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentAns.evaluation_details?.suggestions && currentAns.evaluation_details.suggestions.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Actionable Improvements</span>
                  </span>
                  <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                    {currentAns.evaluation_details.suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Ask AI Coach Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Want personalized strengths, weaknesses, and a model exemplar answer?
              </span>
              <button
                type="button"
                onClick={() =>
                  setCoachModalData({
                    sessionId: activeSession.id,
                    questionId: currentQ.id,
                    questionText: currentQ.question_text,
                    questionType: currentQ.type,
                    targetSkill: currentQ.target_skill,
                    answerText: currentAns.answer_text,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-violet to-indigo-600 hover:opacity-95 text-white shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Coach</span>
              </button>
            </div>
          </div>
        )}

        {/* AI Coach Modal if open */}
        {coachModalData && (
          <AICoachModal data={coachModalData} onClose={() => setCoachModalData(null)} />
        )}
      </div>
    )
  }

  // Render Setup & History View
  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-violet/10 text-xs font-semibold text-brand-violet">
          <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
          <span>PrepVerse AI Adaptive Simulation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          Interview Simulation & Practice Modes
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Configure an interview tailored to your uploaded resume and target job requirements.
          Choose between Mock Interview, Quick Practice, Weak-Area Focus, or Focused Technical drills with synthesized speech, live transcript editing, and delivery analytics.
        </p>
      </div>

      {/* Main Grid: Setup Form + Past Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Setup Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleCreateInterview} className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-violet" />
              <span>Configure Interview Practice</span>
            </h3>

            {/* Practice Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">1. Select Practice Mode</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPracticeMode('mock_interview')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    practiceMode === 'mock_interview'
                      ? 'bg-brand-violet/10 border-brand-violet text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5 text-brand-violet" />
                    <span>Mock Interview</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Comprehensive full session with technical, behavioral & situational questions.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPracticeMode('quick_practice')
                    setQuestionCount(3)
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    practiceMode === 'quick_practice'
                      ? 'bg-brand-violet/10 border-brand-violet text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Practice</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    3 rapid questions targeting role or skill for fast, targeted feedback.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPracticeMode('weak_area')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    practiceMode === 'weak_area'
                      ? 'bg-brand-violet/10 border-brand-violet text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Weak-Area Focus</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Auto-targets historical low-scoring skills and identified job gaps.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPracticeMode('focused_technical')
                    setSelectedTypes(['technical'])
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    practiceMode === 'focused_technical'
                      ? 'bg-brand-violet/10 border-brand-violet text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                    <Activity className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Focused Technical</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Pure technical questions strictly targeting a chosen skill or technology.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPracticeMode('skill_assessment')
                    setQuestionCount(5)
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between col-span-2 sm:col-span-4 ${
                    practiceMode === 'skill_assessment'
                      ? 'bg-gradient-to-r from-brand-violet/15 via-brand-cyan/15 to-brand-violet/15 border-brand-violet text-slate-900 dark:text-white shadow-md ring-2 ring-brand-violet/40'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-violet dark:text-brand-cyan" />
                      <span className="text-sm">Resume Skill Verification & Revision Test</span>
                    </div>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-brand-violet/20 text-brand-violet dark:text-brand-cyan font-extrabold">
                      Adaptive Knowledge Check
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tests you strictly on the skills listed on your resume to verify claimed competencies, refresh forgotten concepts, and remember your weak points with interactive MCQs and bite-sized code logic problems. Automatically gives extra questions on weak topics so you master them!
                  </span>
                </button>
              </div>
            </div>

            {/* Student College Year & Level Calibration (Only shown for skill assessment) */}
            {practiceMode === 'skill_assessment' && (
              <div className="p-4 rounded-2xl bg-brand-violet/5 dark:bg-brand-violet/10 border border-brand-violet/20 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-violet" />
                    <span>Select Student College Year / Experience Tier (Calibrates Question Depth)</span>
                  </label>
                  <span className="text-[10px] text-brand-violet font-medium">Friendly & Non-Depressing Questions</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { key: '1st_year', label: '1st Year', desc: 'Syntax, variables & basic logic' },
                    { key: '2nd_year', label: '2nd Year', desc: 'Core DSA (Arrays, Stacks), OOP' },
                    { key: '3rd_year', label: '3rd Year', desc: 'Semester CS (OS, DBMS, CN)' },
                    { key: '4th_year', label: '4th Year', desc: 'System Design & Web stacks' },
                    { key: 'graduate', label: 'Graduate', desc: 'Architecture & production code' },
                  ].map((tier) => {
                    const isSelected = studentLevel === tier.key || (tier.key === '3rd_year' && studentLevel === '3rd_4th_year') || (tier.key === '1st_year' && studentLevel === '1st_2nd_year')
                    return (
                      <button
                        key={tier.key}
                        type="button"
                        onClick={() => setStudentLevel(tier.key)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-white dark:bg-[#0B0F19] border-brand-violet text-brand-violet shadow-sm font-bold ring-2 ring-brand-violet/40'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{tier.label}</div>
                        <div className="text-[10px] opacity-75 font-normal mt-0.5 leading-tight">{tier.desc}</div>
                      </button>
                    )
                  })}
                </div>

                {/* Active Semester Subjects Detected Notification */}
                {(() => {
                  try {
                    const subs = JSON.parse(localStorage.getItem('prepverse_ongoing_subjects')) || []
                    if (subs.length > 0) {
                      return (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-brand-violet/10 border border-brand-violet/20 flex items-center justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                            <span><strong>Active Semester Subjects:</strong> {subs.slice(0, 3).join(', ')}{subs.length > 3 ? ` +${subs.length - 3} more` : ''}</span>
                          </span>
                          <span className="text-[10px] font-bold text-brand-violet dark:text-brand-cyan uppercase">Auto-Integrated</span>
                        </div>
                      )
                    }
                  } catch {
                    return null
                  }
                  return null
                })()}
              </div>
            )}

            {/* Target Skill Focus Input */}
            {(practiceMode === 'focused_technical' || practiceMode === 'weak_area' || practiceMode === 'quick_practice') && (
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Topic / Skill Focus ({practiceMode === 'weak_area' ? 'Optional Priority' : 'Required for Focus'})
                  </label>
                  {targetFocus && (
                    <button
                      type="button"
                      onClick={() => setTargetFocus('')}
                      className="text-[10px] text-slate-400 hover:text-rose-500"
                    >
                      Clear Focus
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={targetFocus}
                  onChange={(e) => setTargetFocus(e.target.value)}
                  placeholder="e.g. PostgreSQL, Distributed Systems, System Design, Docker"
                  className="w-full rounded-xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet"
                />
              </div>
            )}

            {/* Resume Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">2. Select Candidate Resume</label>
              {resumes.length === 0 ? (
                <p className="text-xs text-amber-500 italic">
                  No resumes uploaded yet. Please upload a PDF in the Resume Workspace tab first.
                </p>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.filename || 'PDF Resume'} ({r.parsed_skills ? r.parsed_skills.length : 0} skills extracted)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Target Job Source Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">3. Target Job Requirements Context</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSourceType('analysis')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                    sourceType === 'analysis'
                      ? 'bg-brand-violet/10 border-brand-violet text-brand-violet'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Use Saved Job Analysis
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('custom_jd')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                    sourceType === 'custom_jd'
                      ? 'bg-brand-violet/10 border-brand-violet text-brand-violet'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Paste Job Description
                </button>
              </div>

              {sourceType === 'analysis' ? (
                jobAnalyses.length === 0 ? (
                  <p className="text-xs text-amber-500 italic pt-1">
                    No job analyses saved yet. Run an analysis in the Job Workspace tab or switch to "Paste Job Description".
                  </p>
                ) : (
                  <select
                    value={selectedAnalysisId}
                    onChange={(e) => {
                      setSelectedAnalysisId(e.target.value)
                      const ja = jobAnalyses.find((a) => a.id === e.target.value)
                      if (ja && ja.role_title) setRoleTitle(ja.role_title)
                    }}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet mt-1"
                  >
                    {jobAnalyses.map((ja) => (
                      <option key={ja.id} value={ja.id}>
                        {ja.role_title || 'Software Engineer'} ({ja.company_name || 'Target Role'})
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <div className="space-y-1.5 mt-1">
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: 'Full Stack', role: 'Full Stack Engineer', text: 'Proficiency in React, Node.js, REST APIs, SQL, system design, and testing.' },
                      { label: 'Python Backend', role: 'Backend Engineer', text: 'FastAPI, Python, Docker, PostgreSQL microservices, caching, and database design.' },
                      { label: 'Frontend UI', role: 'Frontend Engineer', text: 'React, TypeScript, Tailwind CSS, component architecture, state management, and performance.' },
                      { label: 'Data / AI', role: 'Data Analyst', text: 'Python, SQL, data pipelines, statistical analysis, visualization, and ML fundamentals.' },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCustomJobDesc(p.text)
                          setRoleTitle(p.role)
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-brand-violet/15 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                      >
                        ⚡ {p.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={4}
                    value={customJobDesc}
                    onChange={(e) => setCustomJobDesc(e.target.value)}
                    placeholder="Paste the target job description text here, or click a quick preset above..."
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet"
                  />
                </div>
              )}
            </div>

            {/* Role Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">4. Target Role Title</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet"
              />
            </div>

            {/* Interaction Mode Selection */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">5. Interview Interaction Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setInterviewMode('voice')}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    interviewMode === 'voice'
                      ? 'bg-brand-violet/10 border-brand-violet text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${interviewMode === 'voice' ? 'bg-brand-violet text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-bold block">Voice Interview Mode</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block">
                      Spoken questions, microphone recording, editable transcript, and delivery pace analytics.
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setInterviewMode('text')}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    interviewMode === 'text'
                      ? 'bg-brand-violet/10 border-brand-violet text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${interviewMode === 'text' ? 'bg-brand-violet text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-bold block">Text Interview Mode</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block">
                      Read written questions and type structured answers at your own focused pace.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Adaptive Difficulty Progression Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5 text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Performance-Based Adaptive Difficulty</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically scales upcoming question complexity based on your evaluation scores.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isAdaptive}
                  onChange={(e) => setIsAdaptive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-violet" />
              </label>
            </div>

            {/* Question Count Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Question Count: {practiceMode === 'quick_practice' ? '3 (Quick)' : questionCount}
                  </label>
                  <span className="text-[10px] text-brand-cyan font-mono font-bold">Up to 50</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={practiceMode === 'quick_practice' ? 3 : Math.min(Number(questionCount) || 5, 30)}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                    disabled={practiceMode === 'quick_practice'}
                    className="w-full accent-brand-violet cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={practiceMode === 'quick_practice' ? 3 : questionCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (!isNaN(val) && val >= 1 && val <= 50) setQuestionCount(val)
                    }}
                    disabled={practiceMode === 'quick_practice'}
                    className="w-14 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 text-center text-xs text-slate-900 dark:text-white font-mono focus:border-brand-violet outline-none disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {[3, 5, 10, 15, 20, 25, 30].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={practiceMode === 'quick_practice'}
                      onClick={() => setQuestionCount(preset)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition ${
                        Number(questionCount) === preset && practiceMode !== 'quick_practice'
                          ? 'bg-brand-violet text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {preset}Q
                    </button>
                  ))}
                </div>
              </div>

              {/* Starting Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Starting Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Question Types */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Question Types</label>
                <div className="flex flex-col gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={practiceMode === 'focused_technical' ? true : selectedTypes.includes('technical')}
                      onChange={() => handleTypeToggle('technical')}
                      disabled={practiceMode === 'focused_technical'}
                      className="rounded text-brand-violet"
                    />
                    <span>Technical</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={practiceMode === 'focused_technical' ? false : selectedTypes.includes('behavioral')}
                      onChange={() => handleTypeToggle('behavioral')}
                      disabled={practiceMode === 'focused_technical'}
                      className="rounded text-brand-violet"
                    />
                    <span>Behavioral (STAR)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={practiceMode === 'focused_technical' ? false : selectedTypes.includes('situational')}
                      onChange={() => handleTypeToggle('situational')}
                      disabled={practiceMode === 'focused_technical'}
                      className="rounded text-brand-violet"
                    />
                    <span>Situational</span>
                  </label>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isCreatingSession || resumes.length === 0}
              className="w-full py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-brand-violet to-brand-blue hover:opacity-95 text-white shadow-md shadow-brand-violet/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreatingSession ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Tailored Interview Questions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Interview Simulation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Col: Past Sessions History */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-violet" />
            <span>Interview History</span>
          </h3>

          {pastSessions.length === 0 ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">No interview sessions recorded yet.</p>
              <p className="text-[11px] text-slate-400">Configure parameters on the left to launch your first session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    if (session.status === 'completed') {
                      handleOpenReport(session.id)
                    } else {
                      handleOpenSession(session.id)
                    }
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] hover:border-brand-violet/40 border border-slate-200 dark:border-slate-800 transition cursor-pointer group space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-violet dark:group-hover:text-brand-cyan transition truncate">
                      {session.role_title || 'Software Engineer'}
                    </span>
                    <button
                      onClick={(e) => handleDeleteInterview(session.id, e)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete interview session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        session.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {session.status.toUpperCase()}
                      </span>
                      {session.practice_mode === 'skill_assessment' ? (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-brand-violet/10 text-brand-violet dark:text-brand-cyan text-[10px] border border-brand-violet/20">
                          🎓 Skill Check
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                          {session.interview_mode === 'voice' ? '🎙️ Voice' : '📝 Text'}
                        </span>
                      )}
                    </div>

                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {session.answered_count} / {session.question_count}
                    </span>
                  </div>

                  {session.overall_score !== null && (
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Score:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{session.overall_score}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
