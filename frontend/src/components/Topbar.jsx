import React, { useState, useRef, useEffect } from 'react'
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Sliders,
  Globe,
} from 'lucide-react'
import { Link } from '../context/RouterContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Logo from './Logo'

export default function Topbar({
  activeTab,
  onOpenMobileMenu,
  onFastLaunchPractice,
  systemHealth,
}) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const titles = {
    overview: {
      title: 'Candidate Dashboard',
      subtitle: 'Career readiness insights, session history, and preparation progress',
    },
    interviews: {
      title: 'Interview Simulator',
      subtitle: 'Adaptive technical, behavioral, and situational interview practice',
    },
    coach: {
      title: 'AI Interview Coach',
      subtitle: 'Targeted STAR evaluations, strengths, weaknesses, and exemplar answers',
    },
    roadmap: {
      title: 'Preparation Roadmap & Planner',
      subtitle: 'Personalized curriculum scheduled around your target interview goal',
    },
    analytics: {
      title: 'Performance Analytics',
      subtitle: 'Longitudinal scoring trajectory, topic mastery, and speech pace metrics',
    },
    resumes: {
      title: 'Resume Portfolio',
      subtitle: 'Manage uploaded candidate resumes, parsed skills, and experience profiles',
    },
    job_analysis: {
      title: 'Job Description Intelligence',
      subtitle: 'Role requirement extraction, keyword coverage, and skill-gap recommendations',
    },
    settings: {
      title: 'Candidate Settings & Environment Diagnostics',
      subtitle: 'Manage candidate preferences, theme appearance, and live backend telemetry',
    },
    profile: {
      title: 'Candidate Career Profile & Target Role',
      subtitle: 'Customize your target job title, seniority tier, and preparation goals',
    },
    admin: {
      title: 'Admin & System Control Hub',
      subtitle: 'Teacher demonstration tools, database health, telemetry, and sample data seeding',
    },
  }

  const current = titles[activeTab] || titles.overview

  const getInitials = (name) => {
    if (!name) return 'C'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {current.title}
            </h1>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Quick Action: Start Simulation */}
          {activeTab !== 'interviews' && onFastLaunchPractice && (
            <button
              onClick={onFastLaunchPractice}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-blue hover:opacity-95 text-white shadow-sm shadow-brand-violet/20 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice Now</span>
            </button>
          )}

          {/* System API Status */}
          {systemHealth && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
              {systemHealth.loading ? (
                <>
                  <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                  <span className="text-slate-500 dark:text-slate-400">Connecting</span>
                </>
              ) : systemHealth.connected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ready</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">Offline</span>
                </>
              )}
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-brand-violet hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* User Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-violet to-brand-cyan flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {getInitials(user?.name)}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-fadeIn text-left">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.name || 'Candidate'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    <span className="truncate">UID: {user?.id?.slice(0, 8)}...</span>
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <User className="w-4 h-4 text-brand-violet dark:text-brand-cyan" />
                    <span>Career Profile & Role</span>
                  </Link>

                  <Link
                    to="/app/admin"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span>Admin Control Hub</span>
                  </Link>

                  <Link
                    to="/app/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Sliders className="w-4 h-4 text-brand-violet dark:text-brand-cyan" />
                    <span>Settings & Preferences</span>
                  </Link>

                  <Link
                    to="/"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span>Public Homepage</span>
                  </Link>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false)
                      logout()
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

