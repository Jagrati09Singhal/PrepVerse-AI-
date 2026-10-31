import React from 'react'
import { LogOut, User } from 'lucide-react'
import { APP_ENV } from '../config/api'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Header({ systemHealth, onOpenAuth }) {
  const { user, logout, isAuthenticated } = useAuth()

  const getStatusBadge = () => {
    if (systemHealth.loading) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          Checking backend...
        </span>
      )
    }
    if (systemHealth.connected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          API Connected
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        API Offline
      </span>
    )
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Logo variant="compact" size="md" />
          <span className="hidden xl:inline-block text-[11px] text-slate-500 dark:text-slate-400 pl-3 border-l border-slate-200 dark:border-slate-800">
            Prepare Smarter. Practice Deeper. Become Interview-Ready.
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden lg:inline-block">
            env: <span className="text-slate-700 dark:text-slate-200">{APP_ENV}</span>
          </span>

          {getStatusBadge()}

          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-violet/20 border border-brand-violet/40 flex items-center justify-center text-xs font-bold text-brand-violet">
                  {getInitials(user?.name)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{user?.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{user?.email}</div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-violet hover:bg-brand-violet/90 text-white shadow-sm transition"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
