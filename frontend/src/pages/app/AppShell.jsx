import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import Dashboard from '../../components/Dashboard'
import InterviewWorkspace from '../../components/InterviewWorkspace'
import AICoachHub from '../../components/AICoachHub'
import RoadmapPlanner from '../../components/RoadmapPlanner'
import AnalyticsDashboard from '../../components/AnalyticsDashboard'
import ResumeWorkspace from '../../components/ResumeWorkspace'
import JobWorkspace from '../../components/JobWorkspace'
import SettingsPage from './SettingsPage'
import ProfilePage from './ProfilePage'
import AdminControlPage from './AdminControlPage'
import { useRouter, useParams, useLocation } from '../../context/RouterContext'
import { useAuth } from '../../context/AuthContext'
import { ENDPOINTS } from '../../config/api'
import { X, LayoutDashboard, PlayCircle, Sparkles, Compass, TrendingUp, FileText, Briefcase, Sliders, User, ShieldCheck } from 'lucide-react'
import Logo from '../../components/Logo'

const TAB_ROUTES = {
  overview: '/app/dashboard',
  profile: '/app/profile',
  interviews: '/app/interviews',
  coach: '/app/coach',
  roadmap: '/app/roadmap',
  analytics: '/app/analytics',
  resumes: '/app/resume',
  job_analysis: '/app/job-analysis',
  settings: '/app/settings',
  admin: '/app/admin',
}

export default function AppShell({ view: explicitView }) {
  const { navigate } = useRouter()
  const { authFetch } = useAuth()
  const location = useLocation()
  const params = useParams()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [resumesList, setResumesList] = useState([])
  const [practiceLaunchParams, setPracticeLaunchParams] = useState(null)

  // Pre-load resumes so that JobWorkspace and others have resumes immediately
  useEffect(() => {
    let isMounted = true
    async function loadResumes() {
      try {
        const res = await authFetch(ENDPOINTS.RESUMES)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setResumesList(data)
        }
      } catch (err) {
        console.warn('Initial resumes load in AppShell:', err)
      }
    }
    loadResumes()
    return () => {
      isMounted = false
    }
  }, [authFetch])

  // Derive active tab from path or explicit prop
  const currentPath = location.pathname
  let activeTab = explicitView || 'overview'

  if (!explicitView) {
    if (currentPath.startsWith('/app/profile')) activeTab = 'profile'
    else if (currentPath.startsWith('/app/admin')) activeTab = 'admin'
    else if (currentPath.startsWith('/app/interview')) activeTab = 'interviews'
    else if (currentPath.startsWith('/app/coach')) activeTab = 'coach'
    else if (currentPath.startsWith('/app/roadmap')) activeTab = 'roadmap'
    else if (currentPath.startsWith('/app/analytics')) activeTab = 'analytics'
    else if (currentPath.startsWith('/app/resume')) activeTab = 'resumes'
    else if (currentPath.startsWith('/app/job-analysis')) activeTab = 'job_analysis'
    else if (currentPath.startsWith('/app/settings')) activeTab = 'settings'
    else activeTab = 'overview'
  }

  const isReportView = currentPath.endsWith('/report')
  const sessionId = params.sessionId

  // System Health Telemetry
  const [systemHealth, setSystemHealth] = useState({
    loading: true,
    connected: false,
    latency: null,
    data: null,
    error: null,
  })

  const checkHealth = useCallback(async () => {
    setSystemHealth((prev) => ({ ...prev, loading: true, error: null }))
    const startTime = performance.now()
    try {
      const response = await fetch(ENDPOINTS.HEALTH, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      const latency = Math.round(performance.now() - startTime)
      const data = await response.json()
      if (response.ok) {
        setSystemHealth({
          loading: false,
          connected: true,
          latency,
          data,
          error: null,
        })
      } else {
        setSystemHealth({
          loading: false,
          connected: false,
          latency,
          data,
          error: data.error || `HTTP ${response.status}`,
        })
      }
    } catch (err) {
      setSystemHealth({
        loading: false,
        connected: false,
        latency: null,
        data: null,
        error: `Backend unreachable at ${ENDPOINTS.HEALTH}`,
      })
    }
  }, [])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  const handleSelectTab = (tab) => {
    const route = TAB_ROUTES[tab] || '/app/dashboard'
    navigate(route)
    setMobileMenuOpen(false)
  }

  const handleLaunchPractice = (customParams) => {
    setPracticeLaunchParams(customParams || null)
    navigate('/app/interviews')
  }

  const mobileNavItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Career Profile & Role', icon: User },
    { id: 'interviews', label: 'Interview Simulator', icon: PlayCircle },
    { id: 'coach', label: 'AI Coach Hub', icon: Sparkles },
    { id: 'roadmap', label: 'Preparation Roadmap', icon: Compass },
    { id: 'analytics', label: 'Performance Analytics', icon: TrendingUp },
    { id: 'resumes', label: 'Resume Portfolio', icon: FileText },
    { id: 'job_analysis', label: 'Job Intelligence', icon: Briefcase },
    { id: 'admin', label: 'Admin & System Control', icon: ShieldCheck },
    { id: 'settings', label: 'Settings & Status', icon: Sliders },
  ]

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#080C15] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0A0F1D] shadow-2xl p-4 flex flex-col z-50 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <Logo variant="compact" size="md" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {mobileNavItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-violet to-brand-cyan text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Sticky Topbar */}
        <Topbar
          activeTab={activeTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onFastLaunchPractice={() => handleLaunchPractice(null)}
          systemHealth={systemHealth}
        />

        {/* Tab Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <Dashboard
              onSelectTab={handleSelectTab}
              onLaunchPractice={handleLaunchPractice}
            />
          )}

          {activeTab === 'interviews' && (
            <InterviewWorkspace
              initialPracticeParams={practiceLaunchParams}
              onResetPracticeParams={() => setPracticeLaunchParams(null)}
              initialSessionId={sessionId}
              initialViewMode={isReportView ? 'report' : 'session'}
            />
          )}

          {activeTab === 'coach' && (
            <AICoachHub
              onLaunchPractice={handleLaunchPractice}
            />
          )}

          {activeTab === 'roadmap' && (
            <RoadmapPlanner
              onLaunchPractice={handleLaunchPractice}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              onLaunchPractice={handleLaunchPractice}
            />
          )}

          {activeTab === 'resumes' && (
            <ResumeWorkspace
              onResumesUpdated={(resumes) => setResumesList(resumes)}
              onLaunchPractice={handleLaunchPractice}
            />
          )}

          {activeTab === 'job_analysis' && (
            <JobWorkspace resumes={resumesList} />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}

          {activeTab === 'profile' && (
            <ProfilePage />
          )}

          {activeTab === 'admin' && (
            <AdminControlPage />
          )}
        </main>
      </div>
    </div>
  )
}

