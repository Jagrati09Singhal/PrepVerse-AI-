import React, { useState, useEffect } from 'react'
import {
  Target,
  PlayCircle,
  Compass,
  FileText,
  Briefcase,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  Check,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ENDPOINTS } from '../config/api'

export default function Dashboard({ onSelectTab, onLaunchPractice }) {
  const { user, authFetch } = useAuth()
  const [stats, setStats] = useState({
    resumesCount: 0,
    jobsCount: 0,
    sessionsCount: 0,
    completedCount: 0,
    avgScore: 0,
    recentSessions: [],
    weakSkills: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resResumes, resJobs, resInterviews, resAnalytics] = await Promise.all([
        authFetch(ENDPOINTS.RESUMES).catch(() => null),
        authFetch(ENDPOINTS.JOB_ANALYSES).catch(() => null),
        authFetch(ENDPOINTS.INTERVIEWS).catch(() => null),
        authFetch(ENDPOINTS.ANALYTICS_OVERVIEW).catch(() => null),
      ])

      let resumesData = []
      let jobsData = []
      let sessionsData = []
      let analyticsData = null

      if (resResumes && resResumes.ok) resumesData = await resResumes.json()
      if (resJobs && resJobs.ok) jobsData = await resJobs.json()
      if (resInterviews && resInterviews.ok) sessionsData = await resInterviews.json()
      if (resAnalytics && resAnalytics.ok) analyticsData = await resAnalytics.json()

      const completed = sessionsData.filter((s) => s.status === 'completed')
      const scored = completed.filter((s) => typeof s.overall_score === 'number')
      const avg = scored.length > 0
        ? Math.round(scored.reduce((acc, curr) => acc + curr.overall_score, 0) / scored.length)
        : 0

      // Extract skills needing improvement from analytics or lowest score sessions
      const weak = analyticsData?.weakest_skills || []

      setStats({
        resumesCount: resumesData.length,
        jobsCount: jobsData.length,
        sessionsCount: sessionsData.length,
        completedCount: completed.length,
        avgScore: avg,
        recentSessions: sessionsData.slice(0, 4),
        weakSkills: weak,
      })
    } catch (err) {
      console.warn('Dashboard fetch error:', err)
      setError('Unable to load latest dashboard metrics. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Calculate Interview Readiness Index (0 - 100%)
  const hasResume = stats.resumesCount > 0
  const hasJob = stats.jobsCount > 0
  const hasInterview = stats.completedCount > 0
  const masteryBonus = stats.avgScore > 0 ? Math.round((stats.avgScore / 100) * 25) : 0
  const readinessScore = Math.min(
    100,
    (hasResume ? 25 : 0) + (hasJob ? 25 : 0) + (hasInterview ? 25 : 0) + masteryBonus
  )

  let readinessTier = { label: 'Getting Started', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  if (readinessScore >= 80) {
    readinessTier = { label: 'Interview-Ready', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
  } else if (readinessScore >= 50) {
    readinessTier = { label: 'Progressing Strong', color: 'text-brand-cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' }
  } else if (readinessScore >= 25) {
    readinessTier = { label: 'Foundation Built', color: 'text-brand-violet', bg: 'bg-violet-500/10', border: 'border-violet-500/20' }
  }

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  // SVG Circular progress math
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (readinessScore / 100) * circumference

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Welcome & Readiness Index Hero Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800/90 shadow-sm relative overflow-hidden transition-colors">
        {/* Decorative subtle ambient gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-brand-violet/10 via-brand-cyan/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Greeting info */}
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {formattedDate}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${readinessTier.bg} ${readinessTier.color} ${readinessTier.border}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {readinessTier.label}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Prepare Smarter. Practice Deeper. Become Interview-Ready. Your personalized workspace is ready
              with adaptive interview drills, real-time speech pace analytics, and an evidence-grounded study roadmap.
            </p>
          </div>

          {/* Circular Readiness Gauge */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shrink-0">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Animated Gradient Stroke */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="url(#readiness-gradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="readiness-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {readinessScore}%
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Index</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Readiness Index
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[140px] leading-tight">
                Calculated across verified resume skills, job matches, and simulations.
              </p>
              <button
                onClick={() => onSelectTab && onSelectTab('analytics')}
                className="text-[11px] font-bold text-brand-violet hover:text-brand-violet-dark dark:text-brand-cyan transition inline-flex items-center gap-1 pt-1"
              >
                <span>Full Analytics</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Readiness Pillars Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/80">
          {/* Pillar 1 */}
          <div
            onClick={() => onSelectTab && onSelectTab('resumes')}
            className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
              hasResume
                ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-violet/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-xl ${hasResume ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                {hasResume ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              <div className="min-w-0 truncate">
                <span className="text-xs font-bold block text-slate-900 dark:text-white truncate">Resume Portfolio</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{hasResume ? `${stats.resumesCount} active` : 'Missing (+25%)'}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Pillar 2 */}
          <div
            onClick={() => onSelectTab && onSelectTab('job_analysis')}
            className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
              hasJob
                ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-violet/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-xl ${hasJob ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                {hasJob ? <Check className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
              </div>
              <div className="min-w-0 truncate">
                <span className="text-xs font-bold block text-slate-900 dark:text-white truncate">Target Job Match</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{hasJob ? `${stats.jobsCount} analyzed` : 'Missing (+25%)'}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Pillar 3 */}
          <div
            onClick={() => onSelectTab && onSelectTab('interviews')}
            className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
              hasInterview
                ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-violet/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-xl ${hasInterview ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                {hasInterview ? <Check className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              </div>
              <div className="min-w-0 truncate">
                <span className="text-xs font-bold block text-slate-900 dark:text-white truncate">Mock Simulation</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{hasInterview ? `${stats.completedCount} completed` : 'Missing (+25%)'}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Pillar 4 */}
          <div
            onClick={() => onSelectTab && onSelectTab('analytics')}
            className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
              stats.avgScore >= 70
                ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-violet/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-xl ${stats.avgScore >= 70 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                {stats.avgScore >= 70 ? <Check className="w-4 h-4" /> : <Award className="w-4 h-4" />}
              </div>
              <div className="min-w-0 truncate">
                <span className="text-xs font-bold block text-slate-900 dark:text-white truncate">Mastery Score</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{stats.avgScore > 0 ? `${stats.avgScore}% average` : 'Untested (+25%)'}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Action 1 */}
        <div
          onClick={() => onSelectTab && onSelectTab('interviews')}
          className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-brand-violet/50 shadow-sm hover:shadow-md transition cursor-pointer space-y-3 group"
        >
          <div className="p-2.5 rounded-2xl bg-violet-500/10 text-brand-violet w-fit group-hover:scale-105 transition-transform">
            <PlayCircle className="w-5 h-5 text-brand-cyan" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-violet dark:group-hover:text-brand-cyan transition">
              Launch Interview Simulation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Adaptive text or voice interview sessions targeting your resume and target role criteria.
            </p>
          </div>
        </div>

        {/* Action 2 */}
        <div
          onClick={() => onSelectTab && onSelectTab('roadmap')}
          className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-brand-violet/50 shadow-sm hover:shadow-md transition cursor-pointer space-y-3 group"
        >
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 w-fit group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition">
              Preparation Roadmap
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Targeted curriculum scheduled around your real interview deadline and daily study pace.
            </p>
          </div>
        </div>

        {/* Action 3 */}
        <div
          onClick={() => onSelectTab && onSelectTab('coach')}
          className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-brand-violet/50 shadow-sm hover:shadow-md transition cursor-pointer space-y-3 group"
        >
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 w-fit group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition">
              AI Interview Coach
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Access granular STAR rubrics, constructive weaknesses, and model exemplar answers.
            </p>
          </div>
        </div>

        {/* Action 4 */}
        <div
          onClick={() => onSelectTab && onSelectTab('job_analysis')}
          className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-brand-violet/50 shadow-sm hover:shadow-md transition cursor-pointer space-y-3 group"
        >
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-brand-cyan w-fit group-hover:scale-105 transition-transform">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-cyan transition">
              Analyze Job Posting
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Extract required qualifications, evaluate keyword match rate, and pinpoint missing skills.
            </p>
          </div>
        </div>
      </div>

      {/* Main Bottom Section: Recent Sessions + Performance Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Recent Interview Simulations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-violet" />
              <span>Recent Simulation History</span>
            </h2>

            {stats.sessionsCount > 0 && (
              <button
                onClick={() => onSelectTab && onSelectTab('interviews')}
                className="text-xs font-semibold text-brand-violet dark:text-brand-cyan hover:underline inline-flex items-center gap-1"
              >
                <span>View all ({stats.sessionsCount})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-brand-violet mx-auto" />
              <p className="text-xs text-slate-500">Loading interview sessions...</p>
            </div>
          ) : stats.recentSessions.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-brand-violet/10 text-brand-violet flex items-center justify-center mx-auto">
                <PlayCircle className="w-6 h-6 text-brand-cyan" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  No Interview Simulations Completed Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Launch your first mock interview to practice answering technical and behavioral questions
                  with real-time evaluation and speech pace analytics.
                </p>
              </div>
              <button
                onClick={() => onSelectTab && onSelectTab('interviews')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-blue text-white shadow-sm hover:opacity-95 transition inline-flex items-center gap-1.5"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Launch First Interview</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectTab && onSelectTab('interviews')}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-brand-violet/40 transition cursor-pointer shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-violet dark:group-hover:text-brand-cyan transition truncate">
                        {session.role_title || 'Software Engineer'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          session.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {session.status.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {session.interview_mode === 'voice' ? '🎙️ Voice' : '📝 Text'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{session.answered_count || 0} of {session.question_count} answered</span>
                      <span>•</span>
                      <span>{new Date(session.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {session.overall_score !== null && (
                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                          {session.overall_score}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">Overall</span>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recommendations & Quick Diagnostics */}
        <div className="space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Recommended Focus</span>
          </h2>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Target Next Milestone
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {!hasResume
                  ? 'Upload your resume to extract validated skills and match against target engineering roles.'
                  : !hasJob
                  ? 'Paste or analyze a job description to discover exact requirement gaps and interview angles.'
                  : !hasInterview
                  ? 'Run a 3-question Quick Practice drill to calibrate your baseline interview score.'
                  : 'Practice your weak areas and study model exemplars in the AI Coach to reach 85%+ readiness.'}
              </p>
            </div>

            <button
              onClick={() => {
                if (!hasResume) onSelectTab('resumes')
                else if (!hasJob) onSelectTab('job_analysis')
                else onSelectTab('interviews')
              }}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition flex items-center justify-center gap-1.5"
            >
              <span>Take Next Action</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Platform Isolation Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="space-y-0.5 text-left">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                Multi-User Tenant Protection
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                All resume embeddings, evaluations, and roadmaps are strictly scoped to your JWT cryptographic session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
