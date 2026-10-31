import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  Mic,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  FileText,
  Target,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ENDPOINTS } from '../config/api'

export default function AnalyticsDashboard({ onLaunchPractice }) {
  const { authFetch } = useAuth()

  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState(null)
  const [skills, setSkills] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resOverview, resTrends, resSkills, resRecs] = await Promise.all([
        authFetch(ENDPOINTS.ANALYTICS_OVERVIEW),
        authFetch(ENDPOINTS.ANALYTICS_TRENDS),
        authFetch(ENDPOINTS.ANALYTICS_SKILLS),
        authFetch(ENDPOINTS.ANALYTICS_RECOMMENDATIONS),
      ])

      if (resOverview.ok) {
        setOverview(await resOverview.json())
      }
      if (resTrends.ok) {
        setTrends(await resTrends.json())
      }
      if (resSkills.ok) {
        setSkills(await resSkills.json())
      }
      if (resRecs.ok) {
        setRecommendations(await resRecs.json())
      }
    } catch (err) {
      console.error('Failed to load performance analytics:', err)
      setError('Could not load performance analytics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-brand-violet mx-auto" />
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading longitudinal performance analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 transition inline-flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  // Empty State handling
  if (!overview || !overview.has_history || overview.total_sessions === 0) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-2xl mx-auto shadow-sm">
          <div className="p-3.5 rounded-2xl bg-brand-violet/10 border border-brand-violet/20 w-fit mx-auto text-brand-violet">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Historical Performance Data Yet</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Complete your first interview simulation to unlock longitudinal performance analytics,
              speaking pace tracking, and skill mastery trends.
            </p>
          </div>
          {onLaunchPractice && (
            <button
              onClick={() => onLaunchPractice()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-violet hover:bg-brand-violet/90 text-white shadow-md shadow-brand-violet/20 transition inline-flex items-center gap-2"
            >
              <span>Launch First Interview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  const timeline = trends?.timeline || []

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-dark via-slate-900 to-[#1e1b4b] border border-slate-800 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-violet/25 border border-brand-violet/40 text-xs font-semibold text-brand-cyan">
            <TrendingUp className="w-3.5 h-3.5 text-brand-cyan" />
            <span>PrepVerse AI Performance Analytics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Historical Analytics & Skill Trajectory</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Derived strictly from your persisted interview evaluations. Tracks score trajectory over time,
            topic competencies, and delivery metrics.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition flex items-center gap-1.5 self-start md:self-auto backdrop-blur-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Completed Sessions */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Completed</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{overview.completed_sessions}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">of {overview.total_sessions} total sessions</span>
        </div>

        {/* Evaluated Answers */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Evaluated Answers</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{overview.total_evaluated_answers}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">completed evaluations</span>
        </div>

        {/* Average Overall Score */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-brand-violet uppercase tracking-wider block">Avg Overall Score</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {overview.average_overall_score !== null ? `${overview.average_overall_score}%` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">weighted composite</span>
        </div>

        {/* Average Content Score */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Avg Content Score</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {overview.average_content_score !== null ? `${overview.average_content_score}%` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">technical depth & STAR</span>
        </div>

        {/* Average Communication Score */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider block">Avg Comm Score</span>
          <span className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400">
            {overview.average_communication_score !== null ? `${overview.average_communication_score}%` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">clarity & structure</span>
        </div>

        {/* Average Speaking Pace */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Speaking Pace</span>
          <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-300">
            {overview.speech_summary.average_pace_wpm !== null
              ? `${Math.round(overview.speech_summary.average_pace_wpm)}`
              : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate" title={overview.speech_summary.pace_assessment}>
            {overview.speech_summary.average_pace_wpm !== null ? 'WPM (Verified)' : 'Requires >=5s audio'}
          </span>
        </div>
      </div>

      {/* Main Grid: Score Trend Timeline + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timeline & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score Trajectory Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-violet" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Performance Trajectory Over Time
                </h3>
              </div>
              {trends?.trajectory && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  trends.trajectory === 'improving'
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                    : trends.trajectory === 'steady'
                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                      : trends.trajectory === 'declining'
                        ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                  {trends.trajectory.toUpperCase().replace('_', ' ')}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {trends?.trajectory_message || 'Chronological score trajectory across completed interview sessions.'}
            </p>

            {/* Responsive SVG Sparkline / Bar Graph */}
            {timeline.length >= 1 ? (
              <div className="pt-2">
                <div className="h-44 w-full flex items-end gap-2 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-2 px-2">
                  {timeline.map((point, idx) => {
                    const score = point.overall_score || point.content_score || 0
                    const heightPct = Math.max(10, Math.min(100, score))
                    const dateStr = new Date(point.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 text-white border border-slate-700 text-[11px] p-1.5 rounded-lg whitespace-nowrap z-10 shadow-lg">
                          <span className="font-bold">{point.role_title || 'Interview'}</span>: {score}%
                        </div>

                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{Math.round(score)}%</span>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full max-w-[48px] rounded-t-lg transition-all ${
                            score >= 80
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                              : score >= 60
                                ? 'bg-gradient-to-t from-brand-violet to-brand-cyan'
                                : 'bg-gradient-to-t from-amber-500 to-rose-400'
                          }`}
                        ></div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[60px]">{dateStr}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic py-6 text-center">No completed interview sessions available for trend visualization.</p>
            )}
          </div>

          {/* Performance Breakdown by Category & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* By Question Category */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Performance by Category
              </span>
              <div className="space-y-2">
                {trends?.performance_by_category?.map((cat, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">{cat.category}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{cat.evaluated_count} questions answered</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${
                        (cat.average_content_score || 0) >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-violet'
                      }`}>
                        {cat.average_content_score !== null ? `${cat.average_content_score}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Role Title */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Performance by Target Role
              </span>
              <div className="space-y-2">
                {trends?.performance_by_role?.length ? (
                  trends.performance_by_role.slice(0, 3).map((r, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">{r.role_title}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{r.session_count} sessions</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {r.average_overall_score !== null ? `${r.average_overall_score}%` : 'N/A'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No role breakdown available.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Rule-Based Practice Recommendations */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-violet" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recommended Practice
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Transparent, rule-based recommendations derived from your historical weak areas, unverified skills, and job gaps.
            </p>

            <div className="space-y-3 pt-1">
              {recommendations?.recommendations?.slice(0, 4).map((rec, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2 hover:border-brand-violet/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{rec.topic}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      rec.priority === 'high'
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                        : rec.priority === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                          : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{rec.reason}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {rec.recommended_mode.replace('_', ' ')} • {rec.suggested_difficulty}
                    </span>
                    {onLaunchPractice && (
                      <button
                        onClick={() => onLaunchPractice({ mode: rec.recommended_mode, focus: rec.topic, difficulty: rec.suggested_difficulty })}
                        className="text-[11px] font-bold text-brand-violet hover:text-brand-violet/80 inline-flex items-center gap-1"
                      >
                        <span>Practice</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Skill Mastery Breakdown Matrix */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-violet" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Topic & Skill Competency Matrix
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {skills?.total_skills_evaluated || 0} skills evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Confirmed Strong Skills */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmed Strengths (≥ 80%)</span>
            </div>
            {skills?.strong_skills?.length ? (
              <div className="space-y-2">
                {skills.strong_skills.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">{item.skill}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.evaluated_count} questions</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.average_score}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No skills with ≥ 80% average across multiple questions.</p>
            )}
          </div>

          {/* Developing Skills */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-violet">
              <Layers className="w-3.5 h-3.5" />
              <span>Developing Skills (60% – 79.9%)</span>
            </div>
            {skills?.developing_skills?.length ? (
              <div className="space-y-2">
                {skills.developing_skills.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">{item.skill}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.evaluated_count} questions</span>
                    </div>
                    <span className="text-xs font-bold text-brand-violet">{item.average_score}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No skills in the developing range.</p>
            )}
          </div>

          {/* Priority Focus Areas (Weak Skills) */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Priority Practice Areas (&lt; 60%)</span>
            </div>
            {skills?.weak_skills?.length ? (
              <div className="space-y-2">
                {skills.weak_skills.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">{item.skill}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.evaluated_count} questions</span>
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{item.average_score}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No recurring weak skills detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
