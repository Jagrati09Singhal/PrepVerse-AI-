import React, { useState } from 'react'
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Mic,
  Activity,
  Layers,
  Download,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ENDPOINTS } from '../config/api'
import AICoachModal from './AICoachModal'

export default function InterviewReport({ report, onBack }) {
  const { authFetch } = useAuth()
  const [expandedQuestions, setExpandedQuestions] = useState({})
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [coachModalData, setCoachModalData] = useState(null)

  if (!report) return null

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true)
    setPdfError(null)
    try {
      const res = await authFetch(ENDPOINTS.INTERVIEW_REPORT_PDF(report.session_id))
      if (!res.ok) {
        throw new Error('Failed to generate PDF report from server.')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const roleSlug = (report.role_title || 'report').replace(/\s+/g, '_').toLowerCase()
      a.download = `prepverse_report_${roleSlug}_${String(report.session_id).slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('PDF download error:', err)
      setPdfError('Could not export PDF report. Please try again.')
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  const toggleQuestion = (id) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const formattedDate = report.completed_at
    ? new Date(report.completed_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'In Progress'

  const isVoiceMode = report.interview_mode === 'voice'
  const speechSummary = report.speech_analytics_summary

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition border border-slate-200 dark:border-slate-700"
            title="Return to Interview Setup"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-violet/10 dark:bg-brand-violet/20 text-brand-violet border border-brand-violet/20 uppercase tracking-wide">
                Evaluation Report
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${report.status === 'completed'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                }`}>
                {report.status.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                {isVoiceMode ? 'Voice Mode' : 'Text Mode'}
              </span>
              {report.is_adaptive && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                  Adaptive Difficulty
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {report.role_title || 'Software Engineer'} Interview Summary
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
            title="Download formatted PDF interview report"
          >
            {isDownloadingPDF ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isDownloadingPDF ? 'Exporting PDF...' : 'Download PDF Report'}</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {pdfError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{pdfError}</span>
        </div>
      )}

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Score</span>
            <Award className="w-4 h-4 text-brand-violet" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {report.overall_score !== null ? `${report.overall_score}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">weighted avg</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-violet h-full rounded-full transition-all duration-500"
              style={{ width: `${report.overall_score || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Content Score Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Content Mastery</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {report.average_content_score !== null ? `${report.average_content_score}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">relevance & correctness</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${report.average_content_score || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Text Communication Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Communication</span>
            <MessageSquare className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">
              {report.average_communication_score !== null ? `${report.average_communication_score}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">clarity & structure</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${report.average_communication_score || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Questions Evaluated Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Evaluated</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {report.evaluated_count}
              <span className="text-lg font-normal text-slate-500 dark:text-slate-400"> / {report.total_questions}</span>
            </span>
            {report.pending_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                {report.pending_count} pending
              </span>
            )}
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(report.evaluated_count / (report.total_questions || 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Speech Analytics Section */}
      {speechSummary && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-violet" />
                <span>Speech & Delivery Analytics</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verifiable delivery metrics derived from recorded speech duration and spoken transcript tokens.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 border border-slate-200 dark:border-slate-700">
              Evidence-Based
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Speaking Pace */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Speaking Pace</span>
              {speechSummary.speaking_pace_status === 'available' ? (
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{speechSummary.average_speaking_pace_wpm} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">WPM</span></div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Measured across audio responses</p>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400">Unavailable</div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{speechSummary.speaking_pace_reason}</p>
                </div>
              )}
            </div>

            {/* Filler Words */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Filler Word Rate</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{speechSummary.average_filler_rate_per_100}%</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{speechSummary.total_filler_words} filler terms across {speechSummary.total_words_spoken} words</p>
            </div>

            {/* Word Volume */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Spoken Word Count</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{speechSummary.total_words_spoken}</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Total words articulated</p>
            </div>

            {/* Pause Analysis */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Pause Tracking</span>
              {speechSummary.pause_tracking_status === 'available' ? (
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">Active</div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Audio-level silence tracking</p>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400">Unavailable</div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{speechSummary.pause_tracking_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Adaptive Difficulty Progression Timeline */}
      {report.difficulty_progression && report.difficulty_progression.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-violet" />
                <span>Adaptive Difficulty Progression</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Displays the difficulty trajectory and backend adaptation reason for each interview question.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.difficulty_progression.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Question #{item.order_index + 1}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.difficulty === 'hard'
                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                      : item.difficulty === 'medium'
                        ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'
                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                    }`}>
                    {item.difficulty}
                  </span>
                </div>
                {item.target_skill && (
                  <span className="text-[10px] text-brand-violet font-semibold block">Skill: {item.target_skill}</span>
                )}
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{item.adaptation_reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Behavioral STAR Breakdown Card (if behavioral questions were scored) */}
      {report.star_breakdown && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-violet" />
                <span>Behavioral STAR Rubric Performance</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluates situational storytelling across Situation, Task, Action, and Result components.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-violet/10 text-brand-violet border border-brand-violet/20">
              STAR Verified
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Situation */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">1. Situation (20%)</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{report.star_breakdown.situation}%</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${report.star_breakdown.situation}%` }}
                ></div>
              </div>
            </div>

            {/* Task */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">2. Task (20%)</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{report.star_breakdown.task}%</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: `${report.star_breakdown.task}%` }}
                ></div>
              </div>
            </div>

            {/* Action */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">3. Action (35%)</span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{report.star_breakdown.action}%</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${report.star_breakdown.action}%` }}
                ></div>
              </div>
            </div>

            {/* Result */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">4. Result (25%)</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{report.star_breakdown.result}%</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full"
                  style={{ width: `${report.star_breakdown.result}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Knowledge Verification & Growth Breakdown */}
      {(report.verified_skills?.length > 0 || report.weak_skills_detected?.length > 0) && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-violet/5 via-brand-cyan/5 to-transparent border border-brand-violet/20 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-violet dark:text-brand-cyan" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Resume Knowledge Verification & Growth Sheet
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Adaptive Skill Calibration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Verified Skills */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0F19] border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Strong Resume Competencies</span>
              </div>
              {report.verified_skills && report.verified_skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {report.verified_skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{s}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Continue practicing to verify claimed skills.</p>
              )}
            </div>

            {/* Identified Weak Skills to Revise */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0F19] border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Topics Flagged for Conceptual Revision</span>
              </div>
              {report.weak_skills_detected && report.weak_skills_detected.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {report.weak_skills_detected.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>{s}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No significant weak points detected.</p>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <strong>Mentor Note:</strong> Identifying concepts you may have forgotten is the most effective way to revise. Reviewing these specific topics before your real interview ensures you speak with genuine confidence!
          </p>
        </div>
      )}

      {/* Strengths & Actionable Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strongest Areas */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Strongest Demonstrated Areas</span>
          </h3>
          <ul className="space-y-2.5">
            {report.strongest_areas && report.strongest_areas.length > 0 ? (
              report.strongest_areas.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                  <span>{str}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 dark:text-slate-400">No specific strengths captured yet.</li>
            )}
          </ul>
        </div>

        {/* Improvement & Recommendations */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Preparation Recommendations</span>
          </h3>
          <ul className="space-y-2.5">
            {report.actionable_recommendations && report.actionable_recommendations.length > 0 ? (
              report.actionable_recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                  <span>{rec}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 dark:text-slate-400">Complete more questions to generate tailored recommendations.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Question-by-Question Detailed Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Question-by-Question Performance</h3>

        <div className="space-y-3">
          {report.questions_feedback && report.questions_feedback.map((q, idx) => {
            const isExpanded = expandedQuestions[q.question_id] !== false // Default open
            return (
              <div
                key={q.question_id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] overflow-hidden transition shadow-sm"
              >
                {/* Header Row */}
                <button
                  onClick={() => toggleQuestion(q.question_id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-900/60 transition gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                          {q.type}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase">
                          {q.difficulty}
                        </span>
                        {q.target_skill && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-violet/10 text-brand-violet">
                            {q.target_skill}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{q.question_text}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {q.content_score !== null ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        {q.content_score}%
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {q.evaluation_status}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
                    <div>
                      <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                        Full Question
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">{q.question_text}</p>
                      {q.adaptation_reason && (
                        <p className="text-[11px] text-brand-violet dark:text-brand-cyan italic mt-1">
                          Adaptation: {q.adaptation_reason}
                        </p>
                      )}
                    </div>

                    {q.has_answer ? (
                      <>
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              Candidate Submitted Answer
                            </span>
                            {q.audio_duration_seconds && (
                              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                                Audio duration: {q.audio_duration_seconds}s
                              </span>
                            )}
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{q.answer_text}</p>
                        </div>

                        {/* Scores & Feedback */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Content Score</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{q.content_score}%</span>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                              Communication Score
                            </span>
                            <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{q.communication_score}%</span>
                          </div>
                        </div>

                        {/* Speech Analytics Card for this question */}
                        {q.speech_analytics && (
                          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block text-[11px]">
                              Speech & Delivery Metrics
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Speaking Pace</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {q.speech_analytics.speaking_pace?.status === 'available'
                                    ? `${q.speech_analytics.speaking_pace.value} WPM`
                                    : 'N/A'}
                                </span>
                              </div>
                              <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Filler Rate</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {q.speech_analytics.filler_words?.rate_per_100_words || 0}%
                                </span>
                              </div>
                              <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Word Count</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {q.speech_analytics.word_count?.value || 0}
                                </span>
                              </div>
                            </div>
                            {q.speech_analytics.actionable_suggestion && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-300 italic pt-1">
                                Tip: {q.speech_analytics.actionable_suggestion}
                              </p>
                            )}
                          </div>
                        )}

                        {/* STAR Component Scores if behavioral */}
                        {q.star_component_scores && (
                          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block text-[11px]">
                              STAR Rubric Breakdown
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                              <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Situation</span>
                                <span className="font-bold text-slate-900 dark:text-white">{q.star_component_scores.situation}%</span>
                              </div>
                              <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Task</span>
                                <span className="font-bold text-slate-900 dark:text-white">{q.star_component_scores.task}%</span>
                              </div>
                              <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Action</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{q.star_component_scores.action}%</span>
                              </div>
                              <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Result</span>
                                <span className="font-bold text-slate-900 dark:text-white">{q.star_component_scores.result}%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Strengths & Missing Elements */}
                        {q.strengths && q.strengths.length > 0 && (
                          <div className="space-y-1">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 block">Key Strengths</span>
                            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                              {q.strengths.map((str, sIdx) => (
                                <li key={sIdx}>{str}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {q.suggestions && q.suggestions.length > 0 && (
                          <div className="space-y-1">
                            <span className="font-semibold text-amber-700 dark:text-amber-400 block">Actionable Suggestions</span>
                            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                              {q.suggestions.map((sug, sIdx) => (
                                <li key={sIdx}>{sug}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Ask AI Coach Action Button */}
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Want personalized strengths, weaknesses, and a model exemplar?
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setCoachModalData({
                                sessionId: report.session_id,
                                questionId: q.question_id,
                                questionText: q.question_text,
                                questionType: q.type,
                                targetSkill: q.target_skill,
                                answerText: q.answer_text,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm transition"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Ask AI Coach</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 italic">No answer was submitted for this question.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Disclaimers & Methodology */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-brand-violet" />
          <span>Methodology & Assessment Disclaimer</span>
        </div>
        <p>{report.scoring_methodology}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-1">{report.disclaimer}</p>
      </div>

      {/* AI Coach Modal if open */}
      {coachModalData && (
        <AICoachModal data={coachModalData} onClose={() => setCoachModalData(null)} />
      )}
    </div>
  )
}
