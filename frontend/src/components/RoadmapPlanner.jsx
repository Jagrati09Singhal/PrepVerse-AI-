import React, { useState, useEffect } from 'react'
import {
  Compass,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Target,
  Sliders,
  Check,
  Award,
  ChevronRight,
  TrendingUp,
  FileText,
  Loader2,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ENDPOINTS } from '../config/api'

export default function RoadmapPlanner({ onLaunchPractice }) {
  const { authFetch } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Plan Edit State
  const [targetRole, setTargetRole] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [dailyMinutes, setDailyMinutes] = useState(30)
  const [isEditingPlan, setIsEditingPlan] = useState(false)

  // Filter State
  const [filter, setFilter] = useState('all') // 'all', 'pending', 'completed', 'high'

  // New Custom Task Modal State
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskTopic, setNewTaskTopic] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('technical')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [newTaskMinutes, setNewTaskMinutes] = useState(30)
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)

  const fetchRoadmap = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(ENDPOINTS.ROADMAP)
      if (!res.ok) {
        throw new Error('Failed to load preparation roadmap.')
      }
      const data = await res.json()
      setOverview(data)
      if (data.plan) {
        setTargetRole(data.plan.target_role || '')
        setTargetDate(data.plan.target_interview_date || '')
        setDailyMinutes(data.plan.daily_prep_minutes || 30)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoadmap()
  }, [])

  const handleRefreshRoadmap = async () => {
    setRefreshing(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await authFetch(ENDPOINTS.ROADMAP_GENERATE, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to refresh roadmap recommendations.')
      const data = await res.json()
      setOverview(data)
      setSuccessMsg('Roadmap updated with fresh recommendations based on your latest evaluations!')
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }

  const handleSavePlan = async (e) => {
    e.preventDefault()
    setSavingPlan(true)
    setError(null)
    try {
      const res = await authFetch(ENDPOINTS.ROADMAP_PLAN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: targetRole.trim() || null,
          target_interview_date: targetDate || null,
          daily_prep_minutes: parseInt(dailyMinutes, 10) || 30,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to update preparation goals.')
      }
      const updatedPlan = await res.json()
      await fetchRoadmap()
      setIsEditingPlan(false)
      setSuccessMsg('Preparation goals and target velocity saved!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPlan(false)
    }
  }

  const handleToggleTaskStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      const res = await authFetch(ENDPOINTS.ROADMAP_TASK_DETAIL(task.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update task status.')
      const updated = await res.json()

      setOverview((prev) => {
        const newTasks = prev.tasks.map((t) => (t.id === task.id ? updated : t))
        const completedCount = newTasks.filter((t) => t.status === 'completed').length
        const totalCount = newTasks.length
        const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 1000) / 10 : 0.0

        return {
          ...prev,
          tasks: newTasks,
          metrics: {
            ...prev.metrics,
            completed_tasks: completedCount,
            progress_percentage: progressPct,
            completed_minutes: newTasks
              .filter((t) => t.status === 'completed')
              .reduce((acc, t) => acc + t.estimated_minutes, 0),
          },
        }
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await authFetch(ENDPOINTS.ROADMAP_TASK_DETAIL(taskId), { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task.')
      setOverview((prev) => {
        const newTasks = prev.tasks.filter((t) => t.id !== taskId)
        const completedCount = newTasks.filter((t) => t.status === 'completed').length
        const totalCount = newTasks.length
        const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 1000) / 10 : 0.0
        return {
          ...prev,
          tasks: newTasks,
          metrics: {
            ...prev.metrics,
            total_tasks: totalCount,
            completed_tasks: completedCount,
            progress_percentage: progressPct,
          },
        }
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setCreatingTask(true)
    setError(null)
    try {
      const res = await authFetch(ENDPOINTS.ROADMAP_TASKS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          topic: newTaskTopic.trim() || null,
          category: newTaskCategory,
          priority: newTaskPriority,
          estimated_minutes: parseInt(newTaskMinutes, 10) || 30,
          description: newTaskDescription.trim() || null,
          recommended_mode: 'mock_interview',
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to create task.')
      }
      const created = await res.json()
      setOverview((prev) => ({
        ...prev,
        tasks: [...prev.tasks, created],
        metrics: {
          ...prev.metrics,
          total_tasks: prev.metrics.total_tasks + 1,
          not_started_tasks: prev.metrics.not_started_tasks + 1,
          total_estimated_minutes: prev.metrics.total_estimated_minutes + created.estimated_minutes,
        },
      }))
      setIsAddingTask(false)
      setNewTaskTitle('')
      setNewTaskTopic('')
      setNewTaskDescription('')
      setSuccessMsg('Custom preparation task added!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreatingTask(false)
    }
  }

  const handleDirectPractice = (task) => {
    if (!onLaunchPractice) return
    const mode = task.recommended_mode || (task.source === 'weak_area' ? 'weak_area' : 'mock_interview')
    onLaunchPractice({
      mode,
      focus: task.topic || task.title,
    })
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-violet animate-spin" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading preparation roadmap & goals...</p>
      </div>
    )
  }

  const plan = overview?.plan
  const metrics = overview?.metrics
  const evidence = overview?.evidence_summary
  const tasks = overview?.tasks || []

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'completed') return t.status === 'completed'
    if (filter === 'pending') return t.status !== 'completed'
    if (filter === 'high') return t.priority === 'high'
    return true
  })

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-violet/10 text-xs font-semibold text-brand-violet">
            <Compass className="w-3.5 h-3.5 text-brand-cyan" />
            <span>PrepVerse AI Guided Preparation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Preparation Roadmap & Daily Planner
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Your evidence-grounded study curriculum. Automatically prioritizes identified skill gaps (&lt;60%),
            target role competencies, and STAR behavioral narratives while protecting your completed progress.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRefreshRoadmap}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            title="Refresh recommendations based on recent interview simulations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-violet' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Tasks'}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Goal Setting & Target Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-brand-violet" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Target Interview Goal & Timeline</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure your target role and daily preparation pace.</p>
            </div>
          </div>

          <button
            onClick={() => setIsEditingPlan(!isEditingPlan)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
          >
            {isEditingPlan ? 'Cancel' : 'Edit Goal'}
          </button>
        </div>

        {isEditingPlan ? (
          <form onSubmit={handleSavePlan} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Role Title</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Interview Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Daily Prep Target (Minutes)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet"
                />
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-violet to-brand-blue text-xs font-bold text-white transition shrink-0 disabled:opacity-50"
                >
                  {savingPlan ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Target Role</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{plan?.target_role || 'Software Engineer'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Target Interview Date</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {plan?.target_interview_date ? (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-violet" />
                    <span>{plan.target_interview_date}</span>
                    {metrics?.days_remaining !== null && (
                      <span className="text-xs font-bold text-brand-cyan">
                        ({metrics.days_remaining} {metrics.days_remaining === 1 ? 'day' : 'days'} left)
                      </span>
                    )}
                  </span>
                ) : (
                  'Not set'
                )}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Daily Prep Goal</span>
              <span className="text-sm font-bold text-brand-cyan">
                {plan?.daily_prep_minutes || 30} minutes / day
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress & Velocity Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Curriculum Progress</span>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{metrics?.progress_percentage || 0}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics?.progress_percentage || 0)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {metrics?.completed_tasks || 0} of {metrics?.total_tasks || 0} tasks completed
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Preparation Effort</span>
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {metrics?.completed_minutes || 0}
            <span className="text-xs font-normal text-slate-400"> / {metrics?.total_estimated_minutes || 0} mins</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            ~{Math.round(((metrics?.total_estimated_minutes || 0) / 60) * 10) / 10} hours total practice
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-brand-violet" />
            <span>Pace & Velocity</span>
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {metrics?.estimated_days_to_complete || 0}
            <span className="text-xs font-normal text-slate-400"> days required</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            At {plan?.daily_prep_minutes || 30} mins/day target pace
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Timeline Assessment</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics?.is_overdue ? (
              <span className="text-rose-500 flex items-center gap-1.5 text-base font-bold">
                <AlertTriangle className="w-4 h-4" /> Overdue
              </span>
            ) : metrics?.days_remaining !== null ? (
              <span className="text-emerald-500 flex items-center gap-1.5 text-base font-bold">
                <CheckCircle2 className="w-4 h-4" /> On Schedule
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-300 text-base font-bold">Flexible Pace</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {metrics?.days_remaining !== null
              ? `${metrics.days_remaining} days until target interview`
              : 'Set a target date to enable schedule tracking'}
          </div>
        </div>
      </div>

      {/* Task Management Section */}
      <div className="space-y-4">
        {/* Controls: Filter Tabs + Add Task Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              All Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'pending'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Pending ({tasks.filter((t) => t.status !== 'completed').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'completed'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Completed ({tasks.filter((t) => t.status === 'completed').length})
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'high'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              High Priority ({tasks.filter((t) => t.priority === 'high').length})
            </button>
          </div>

          <button
            onClick={() => setIsAddingTask(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Task</span>
          </button>
        </div>

        {/* Task Cards Grid */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2">
              <Compass className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">No tasks match this filter</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Switch filter tabs or add a custom task above.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === 'completed'
              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 rounded-3xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-slate-50/70 dark:bg-[#0F172A]/40 border-slate-200/60 dark:border-slate-800/50 opacity-70'
                      : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 hover:border-brand-violet/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Status Checkbox */}
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-brand-violet'
                      }`}
                      title={isDone ? 'Mark as In Progress' : 'Mark as Completed'}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            task.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : task.priority === 'medium'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {task.priority} Priority
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                          {task.category}
                        </span>

                        {task.topic && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-brand-violet/10 text-brand-violet">
                            {task.topic}
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                        {task.title}
                      </h4>
                      {task.description && <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{task.description}</p>}
                    </div>
                  </div>

                  {/* Actions & Meta */}
                  <div className="flex items-center gap-3 self-end md:self-center shrink-0 pt-2 md:pt-0">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{task.estimated_minutes}m</span>
                    </span>

                    {/* Launch Practice Button */}
                    <button
                      onClick={() => handleDirectPractice(task)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-violet/10 hover:bg-brand-violet text-brand-violet hover:text-white transition"
                      title="Launch targeted practice interview for this topic"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Practice Now</span>
                    </button>

                    {/* Delete Task */}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add Custom Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-violet" />
                <span>Add Custom Preparation Task</span>
              </h3>
              <button
                onClick={() => setIsAddingTask(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Master Consistent Hashing & Distributed Cache Invalidation"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Skill / Topic</label>
                  <input
                    type="text"
                    value={newTaskTopic}
                    onChange={(e) => setNewTaskTopic(e.target.value)}
                    placeholder="e.g. Redis, System Design"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Estimated Effort (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={newTaskMinutes}
                    onChange={(e) => setNewTaskMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet"
                  >
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="situational">Situational</option>
                    <option value="foundational">Foundational</option>
                    <option value="review">Review / Simulation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description & Goals</label>
                <textarea
                  rows={2}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Outline key concepts, trade-offs, or questions to practice..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-blue text-white transition disabled:opacity-50"
                >
                  {creatingTask ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
