import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Database,
  Activity,
  Cpu,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Play,
  Briefcase,
  Users,
  Key,
  Lock,
  Unlock,
  Layers,
  Award,
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
  TrendingUp,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from '../../context/RouterContext'
import { ENDPOINTS } from '../../config/api'

export default function AdminControlPage() {
  const { user, authFetch } = useAuth()
  const { navigate } = useRouter()

  // Admin authorization state
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return sessionStorage.getItem('prepverse_admin_authorized') === 'true'
  })
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [authenticating, setAuthenticating] = useState(false)

  // Real Platform Data
  const [overview, setOverview] = useState(null)
  const [students, setStudents] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Action states
  const [seedingDemo, setSeedingDemo] = useState(false)
  const [seedSuccess, setSeedSuccess] = useState(false)
  const [clearingSessions, setClearingSessions] = useState(false)
  const [clearSuccess, setClearSuccess] = useState(false)
  const [actionError, setActionError] = useState(null)

  const activeAdminPasscode = sessionStorage.getItem('prepverse_admin_passcode') || 'PrepVerseAdmin2026!'

  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault()
    setAuthError(null)
    setAuthenticating(true)

    try {
      const res = await fetch(ENDPOINTS.ADMIN_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid administrator passcode.')
      }

      sessionStorage.setItem('prepverse_admin_authorized', 'true')
      sessionStorage.setItem('prepverse_admin_passcode', passcode)
      setIsAuthorized(true)
      loadAdminData(passcode)
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthenticating(false)
    }
  }

  const handleQuickUnlock = () => {
    setPasscode('PrepVerseAdmin2026!')
    setTimeout(() => {
      sessionStorage.setItem('prepverse_admin_authorized', 'true')
      sessionStorage.setItem('prepverse_admin_passcode', 'PrepVerseAdmin2026!')
      setIsAuthorized(true)
      loadAdminData('PrepVerseAdmin2026!')
    }, 100)
  }

  const handleAdminLock = () => {
    sessionStorage.removeItem('prepverse_admin_authorized')
    sessionStorage.removeItem('prepverse_admin_passcode')
    setIsAuthorized(false)
    setPasscode('')
    setOverview(null)
    setStudents([])
  }

  const loadAdminData = async (codeToUse) => {
    setLoadingData(true)
    const code = codeToUse || activeAdminPasscode
    try {
      const [resOverview, resStudents] = await Promise.all([
        fetch(ENDPOINTS.ADMIN_OVERVIEW, {
          headers: { 'X-Admin-Passcode': code },
        }).catch(() => null),
        fetch(ENDPOINTS.ADMIN_STUDENTS, {
          headers: { 'X-Admin-Passcode': code },
        }).catch(() => null),
      ])

      if (resOverview && resOverview.ok) {
        const oData = await resOverview.json()
        setOverview(oData)
      }

      if (resStudents && resStudents.ok) {
        const sData = await resStudents.json()
        setStudents(sData)
      }
    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      loadAdminData(activeAdminPasscode)
    }
  }, [isAuthorized])

  // 1-Click Teacher Demo Seeder
  const handleSeedDemoData = async () => {
    setSeedingDemo(true)
    setActionError(null)
    setSeedSuccess(false)
    try {
      const targetDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      await authFetch(ENDPOINTS.ROADMAP_PLAN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: 'Senior Full Stack Software Engineer',
          target_interview_date: targetDate,
          daily_prep_minutes: 45,
        }),
      })

      await authFetch(ENDPOINTS.ROADMAP_GENERATE, { method: 'POST' }).catch(() => null)

      localStorage.setItem('prepverse_target_role', 'Senior Full Stack Software Engineer')
      localStorage.setItem('prepverse_seniority', 'senior')

      setSeedSuccess(true)
      await loadAdminData(activeAdminPasscode)
      setTimeout(() => setSeedSuccess(false), 4000)
    } catch (err) {
      setActionError('Failed to seed sample teacher demo profile: ' + err.message)
    } finally {
      setSeedingDemo(false)
    }
  }

  // Clear demo interview sessions
  const handleClearSessions = async () => {
    if (!window.confirm('Clear all completed interview records for a fresh student evaluation?')) return
    setClearingSessions(true)
    setActionError(null)
    try {
      const res = await authFetch(ENDPOINTS.INTERVIEWS)
      if (res.ok) {
        const sessions = await res.json()
        for (const s of sessions) {
          await authFetch(ENDPOINTS.INTERVIEW_DETAIL(s.id), { method: 'DELETE' }).catch(() => null)
        }
      }
      setClearSuccess(true)
      await loadAdminData(activeAdminPasscode)
      setTimeout(() => setClearSuccess(false), 3000)
    } catch (err) {
      setActionError('Failed to reset interview sessions: ' + err.message)
    } finally {
      setClearingSessions(false)
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 1. GATEKEEPER LOCK SCREEN (If not authorized)
  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-2xl relative overflow-hidden text-left space-y-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-violet/20 via-brand-cyan/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-cyan flex items-center justify-center text-white shadow-lg shadow-brand-violet/25">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <ShieldCheck className="w-3 h-3" />
              <span>Restricted Platform Console</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              Admin & Evaluator Gatekeeper
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Only authorized teachers and administrators can inspect student data rosters and institutional telemetry.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Administrator Passcode
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter security key..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 pr-10 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authenticating || !passcode.trim()}
              className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-blue hover:opacity-95 text-white shadow-md shadow-brand-violet/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              <span>{authenticating ? 'Verifying Credentials...' : 'Authenticate as Admin'}</span>
            </button>
          </form>

          {/* Teacher Demo Quick Bypass */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={handleQuickUnlock}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Teacher 1-Click Demo Unlock</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. AUTHORIZED EXECUTIVE ADMIN DASHBOARD
  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto text-left">
      {/* Top Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-brand-violet/10 via-brand-cyan/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-cyan flex items-center justify-center text-white shadow-lg shadow-brand-violet/20 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>Authorized Administrator Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Executive Admin & Student Analytics Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Inspect registered student rosters, monitor cohort-wide weak skills, and manage evaluation telemetry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAdminData(activeAdminPasscode)}
              disabled={loadingData}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-brand-violet' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleAdminLock}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:opacity-80 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {seedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Teacher demo profile successfully seeded with targets and roadmap milestones.</span>
        </div>
      )}
      {clearSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Interview sessions reset cleanly for fresh demonstration.</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Registered Students</span>
            <Users className="w-4 h-4 text-brand-violet" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {overview ? overview.total_students : '...'}
          </div>
          <p className="text-[11px] text-slate-400">Total verified candidate accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Resumes Analyzed</span>
            <FileText className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {overview ? overview.total_resumes : '...'}
          </div>
          <p className="text-[11px] text-slate-400">PDF portfolios extracted</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Practice Sessions</span>
            <Play className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {overview ? overview.total_interviews : '...'}
          </div>
          <p className="text-[11px] text-slate-400">
            {overview ? `${overview.completed_interviews} completed` : '...'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cohort Average Score</span>
            <TrendingUp className="w-4 h-4 text-brand-violet" />
          </div>
          <div className="text-2xl font-black text-brand-violet dark:text-brand-cyan">
            {overview ? `${overview.cohort_average_readiness}%` : '...'}
          </div>
          <p className="text-[11px] text-slate-400">Mean readiness index</p>
        </div>
      </div>

      {/* Cohort Weak Points Card */}
      {overview && overview.cohort_weak_topics && overview.cohort_weak_topics.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Cohort Knowledge Gaps & Common Weak Topics
              </h3>
            </div>
            <span className="text-xs text-slate-400">Identified from struggling student evaluations</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {overview.cohort_weak_topics.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-1"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {item.skill}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  {item.struggling_instances} student evaluations flagged
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Roster Table */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-violet" />
              <span>Registered Student Candidates</span>
            </h3>
            <p className="text-xs text-slate-500">
              Inspect student practice attempts, detected weak topics, and readiness status.
            </p>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name or email..."
            className="w-full sm:w-64 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet"
          />
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            No students found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Year & Branch</th>
                  <th className="py-3 px-3">Resumes</th>
                  <th className="py-3 px-3">Sessions</th>
                  <th className="py-3 px-3">Average Score</th>
                  <th className="py-3 px-3">Readiness Tier</th>
                  <th className="py-3 px-3">Identified Weak Areas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{st.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{st.email}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {st.academic_year ? st.academic_year.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : '3rd Year'}
                      </div>
                      <div className="text-[11px] text-brand-violet dark:text-brand-cyan truncate max-w-[160px]">
                        {st.branch || 'Computer Science'}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {st.resumes_uploaded}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {st.interviews_attempted} ({st.completed_sessions} completed)
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {st.average_score !== null ? `${st.average_score}%` : '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          st.readiness_tier === 'Interview Ready'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : st.readiness_tier === 'In Progress'
                            ? 'bg-brand-violet/10 text-brand-violet border border-brand-violet/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {st.readiness_tier}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {st.identified_weak_skills && st.identified_weak_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {st.identified_weak_skills.map((ws, wIdx) => (
                            <span
                              key={wIdx}
                              className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-semibold border border-amber-500/20"
                            >
                              {ws}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No weak areas flagged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Institutional Teacher Demo Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-violet" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Seed Teacher Demo Candidate Profile
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            Initializes complete sample targets (Senior Full Stack Engineer) and roadmap milestones.
          </p>
          <button
            onClick={handleSeedDemoData}
            disabled={seedingDemo}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-violet/10 hover:bg-brand-violet/20 text-brand-violet dark:text-brand-cyan transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {seedingDemo ? 'Seeding Profile...' : 'Execute Profile Seed'}
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Reset Demonstration Records
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            Clears completed interview records to demonstrate live evaluation from a clean slate.
          </p>
          <button
            onClick={handleClearSessions}
            disabled={clearingSessions}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {clearingSessions ? 'Resetting Records...' : 'Clear Demo Sessions'}
          </button>
        </div>
      </div>
    </div>
  )
}
