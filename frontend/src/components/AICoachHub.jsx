import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Send,
  PlayCircle,
  MessageSquare,
  BookOpen,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ENDPOINTS } from '../config/api'

export default function AICoachHub({ onLaunchPractice }) {
  const { authFetch } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [sessionDetail, setSessionDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selectedQuestionId, setSelectedQuestionId] = useState('')

  // Coach response state
  const [feedback, setFeedback] = useState(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [coachError, setCoachError] = useState(null)
  const [userNote, setUserNote] = useState('')
  const [copied, setCopied] = useState(false)

  // 1. Fetch all past interview sessions
  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setLoadingSessions(true)
    try {
      const res = await authFetch(ENDPOINTS.INTERVIEWS)
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
        if (data.length > 0) {
          setSelectedSessionId(data[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to load past sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  // 2. Fetch session detail when selectedSessionId changes
  useEffect(() => {
    if (!selectedSessionId) return
    fetchSessionDetail(selectedSessionId)
  }, [selectedSessionId])

  const fetchSessionDetail = async (sessionId) => {
    setLoadingDetail(true)
    setFeedback(null)
    setCoachError(null)
    try {
      const res = await authFetch(ENDPOINTS.INTERVIEW_DETAIL(sessionId))
      if (res.ok) {
        const data = await res.json()
        setSessionDetail(data)
        // Select first answered question by default
        const firstAnswered = data.answers && data.answers.length > 0 ? data.answers[0].question_id : (data.questions[0]?.id || '')
        setSelectedQuestionId(firstAnswered)
      }
    } catch (err) {
      console.error('Failed to load session detail:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // 3. Request coaching feedback for selected question
  const requestCoachFeedback = async (questionId, note = '') => {
    if (!selectedSessionId || !questionId) return
    setLoadingFeedback(true)
    setCoachError(null)
    try {
      const res = await authFetch(ENDPOINTS.COACH_FEEDBACK(selectedSessionId, questionId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_focus_note: note.trim() || null }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || 'Could not retrieve coaching feedback. Please ensure the question has an answered submission.')
      }
      const data = await res.json()
      setFeedback(data)
    } catch (err) {
      setCoachError(err.message)
      setFeedback(null)
    } finally {
      setLoadingFeedback(false)
    }
  }

  // Trigger feedback when selectedQuestionId changes
  useEffect(() => {
    if (selectedQuestionId && sessionDetail) {
      const currentAns = sessionDetail.answers?.find((a) => a.question_id === selectedQuestionId)
      if (currentAns) {
        requestCoachFeedback(selectedQuestionId)
      } else {
        setFeedback(null)
        setCoachError('This question has not been answered yet. Complete this question in the interview simulator to unlock personalized coaching.')
      }
    }
  }, [selectedQuestionId, sessionDetail])

  const handleCopyExemplar = () => {
    if (feedback?.exemplar_answer) {
      navigator.clipboard.writeText(feedback.exemplar_answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const activeQuestion = sessionDetail?.questions?.find((q) => q.id === selectedQuestionId)
  const activeAnswer = sessionDetail?.answers?.find((a) => a.question_id === selectedQuestionId)

  if (loadingSessions) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-violet animate-spin" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Loading interview sessions for coaching analysis...
        </p>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-brand-violet/10 border border-brand-violet/20 flex items-center justify-center text-brand-violet">
          <Sparkles className="w-8 h-8 text-brand-cyan" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            No Interview Sessions Recorded Yet
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            The AI Coach analyzes your real interview answers to provide objective STAR rubrics,
            constructive weakness breakdowns, and model exemplar responses. Complete your first practice simulation to unlock coaching.
          </p>
        </div>
        {onLaunchPractice && (
          <button
            onClick={() => onLaunchPractice()}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-brand-violet to-brand-blue text-white shadow-md shadow-brand-violet/20 hover:opacity-95 transition inline-flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch First Interview</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-violet/10 text-brand-violet text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span>PrepVerse AI Guided Coaching</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            AI Interview Coach & Model Exemplars
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Review detailed coaching guidance for any past interview answer. Deepen narrative structure,
            review senior interviewer follow-up probes, and study exemplar responses without altering your scores.
          </p>
        </div>
      </div>

      {/* Main Grid: Session/Question Selector on Left, Coach Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Selector */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                1. Select Interview Session
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-brand-violet"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.role_title || 'Software Engineer'} ({s.answered_count}/{s.question_count} answered) &mdash; {new Date(s.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {loadingDetail ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-violet" />
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  2. Select Question to Coach
                </label>
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {sessionDetail?.questions?.map((q, idx) => {
                    const isAnswered = sessionDetail.answers?.some((a) => a.question_id === q.id)
                    const isSelected = q.id === selectedQuestionId

                    return (
                      <div
                        key={q.id}
                        onClick={() => setSelectedQuestionId(q.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-brand-violet/10 dark:bg-brand-violet/20 border-brand-violet text-slate-900 dark:text-white font-semibold shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold">Q{idx + 1} &bull; {q.type.toUpperCase()}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isAnswered
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {isAnswered ? 'Answered' : 'Unanswered'}
                          </span>
                        </div>
                        <p className="text-xs line-clamp-2">{q.question_text}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Coach Output & Actions */}
        <div className="lg:col-span-2 space-y-4">
          {activeQuestion && (
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                  {activeQuestion.type}
                </span>
                {activeQuestion.target_skill && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-violet/10 text-brand-violet border border-brand-violet/20">
                    Target Skill: {activeQuestion.target_skill}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {activeQuestion.question_text}
              </h3>

              {activeAnswer ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Your Submitted Answer:
                  </span>
                  <p className="italic leading-relaxed">{activeAnswer.answer_text}</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                  You haven't submitted an answer for this question yet. You can practice this session in the Interview Simulator to receive coaching.
                </div>
              )}
            </div>
          )}

          {/* Coach Feedback Container */}
          {loadingFeedback ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-3">
              <Loader2 className="w-8 h-8 text-brand-violet animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Generating personalized coaching analysis...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Examining narrative structure, trade-offs, and generating a senior-level model exemplar answer.
              </p>
            </div>
          ) : coachError ? (
            <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-bold">Coaching Notice</p>
                <p className="mt-0.5">{coachError}</p>
              </div>
            </div>
          ) : feedback ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Engine Attribution */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-violet" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {feedback.engine === 'gemini' ? 'Gemini AI Coach Engine' : 'PrepVerse AI Heuristics Engine'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{feedback.disclaimer}</span>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Identified Strengths</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {feedback.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Constructive Improvements</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {feedback.weaknesses.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Model Exemplar */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-violet uppercase tracking-wider">
                    <BookOpen className="w-4 h-4 text-brand-cyan" />
                    <span>Model Exemplar Answer</span>
                  </div>
                  <button
                    onClick={handleCopyExemplar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Exemplar'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {feedback.exemplar_answer}
                </div>
              </div>

              {/* Follow-up Question */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4" />
                  <span>Interviewer Follow-Up Probe</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-900 dark:text-white font-medium italic">
                  "{feedback.contextual_follow_up}"
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Anticipate this probe in real interviews to demonstrate depth, resilience, and edge-case handling.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

