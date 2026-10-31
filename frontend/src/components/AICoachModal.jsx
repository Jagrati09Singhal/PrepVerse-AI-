import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Copy,
  Check,
  Cpu,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Send,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ENDPOINTS } from '../config/api'

export default function AICoachModal({ data, onClose }) {
  const { authFetch } = useAuth()
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState(null)
  const [userFocusNote, setUserFocusNote] = useState('')
  const [copied, setCopied] = useState(false)

  const fetchCoaching = async (note = '') => {
    if (!data?.sessionId || !data?.questionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(ENDPOINTS.COACH_FEEDBACK(data.sessionId, data.questionId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_focus_note: note.trim() || null }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || 'Failed to retrieve AI coaching feedback.')
      }
      const resData = await res.json()
      setFeedback(resData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoaching()
  }, [data?.sessionId, data?.questionId])

  const handleCopyExemplar = () => {
    if (feedback?.exemplar_answer) {
      navigator.clipboard.writeText(feedback.exemplar_answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefineSubmit = (e) => {
    e.preventDefault()
    fetchCoaching(userFocusNote)
  }

  if (!data) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-violet to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>PrepVerse AI Coach Guidance</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-violet/10 dark:bg-brand-violet/20 text-brand-violet border border-brand-violet/30 uppercase">
                  Personalized
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Actionable feedback, STAR analysis, and exemplar answers without mutating your scores.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Question Context Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                {data.questionType || 'General'}
              </span>
              {data.targetSkill && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-violet/10 text-brand-violet">
                  {data.targetSkill}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">{data.questionText}</p>
          </div>

          {/* Optional Focus Note Input */}
          <form onSubmit={handleRefineSubmit} className="flex gap-2">
            <input
              type="text"
              value={userFocusNote}
              onChange={(e) => setUserFocusNote(e.target.value)}
              placeholder="Ask coach for specific guidance (e.g. 'How can I quantify the impact?')..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-violet"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-brand-violet hover:bg-brand-violet/90 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="w-8 h-8 text-brand-violet animate-spin" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">Formulating coaching guidance & exemplar...</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Examining delivery structure, STAR narrative elements, engineering trade-offs, and constructing a model response.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Coaching Analysis Unavailable</p>
                <p>{error}</p>
                <button
                  onClick={() => fetchCoaching(userFocusNote)}
                  className="mt-2 text-rose-800 dark:text-rose-200 underline hover:no-underline font-semibold"
                >
                  Retry Analysis
                </button>
              </div>
            </div>
          )}

          {/* Coaching Content */}
          {feedback && !loading && (
            <div className="space-y-6 animate-fadeIn">
              {/* Engine Attribution Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-violet" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {feedback.engine === 'gemini' ? 'Gemini AI Coach' : 'PrepVerse AI Heuristics'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{feedback.disclaimer}</span>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Key Strengths</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {feedback.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses / Gaps */}
                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Areas to Strengthen</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {feedback.weaknesses.map((wk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                        <span>{wk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Improvements */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-cyan uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-brand-cyan" />
                  <span>Actionable Step-by-Step Improvements</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {feedback.actionable_improvements.map((imp, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{imp}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exemplar Answer Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-violet-50/70 via-white to-indigo-50/40 dark:from-slate-950 dark:to-slate-900 border border-brand-violet/30 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-violet" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Model Exemplar Answer
                    </span>
                  </div>
                  <button
                    onClick={handleCopyExemplar}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {feedback.exemplar_answer}
                </div>
              </div>

              {/* Contextual Follow-up Question */}
              <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  <span>Contextual Interviewer Follow-Up</span>
                </div>
                <p className="text-xs text-slate-900 dark:text-white font-medium italic">
                  "{feedback.contextual_follow_up}"
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Senior interviewers probe with this follow-up question to test depth, edge cases, and post-launch lessons.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Scores and answer submissions remain strictly immutable.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 transition shadow-sm"
          >
            Close Coach
          </button>
        </div>
      </div>
    </div>
  )
}
