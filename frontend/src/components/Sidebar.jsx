import React from 'react'
import {
  LayoutDashboard,
  PlayCircle,
  Sparkles,
  Compass,
  TrendingUp,
  FileText,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Target,
  Sliders,
  User,
} from 'lucide-react'
import Logo from './Logo'

export default function Sidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  readinessScore = 0,
}) {
  const navItems = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'profile',
      label: 'Career Profile & Role',
      icon: User,
      badge: 'Target',
      badgeColor: 'bg-brand-violet/10 text-brand-violet dark:text-brand-cyan border-brand-violet/20',
    },
    {
      id: 'interviews',
      label: 'Interview Practice',
      icon: PlayCircle,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'coach',
      label: 'AI Interview Coach',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-brand-violet/10 text-brand-violet border-brand-violet/20',
    },
    {
      id: 'roadmap',
      label: 'Preparation Roadmap',
      icon: Compass,
      badge: null,
    },
    {
      id: 'analytics',
      label: 'Performance Analytics',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'resumes',
      label: 'Resume Portfolio',
      icon: FileText,
      badge: null,
    },
    {
      id: 'job_analysis',
      label: 'Job Intelligence',
      icon: Briefcase,
      badge: null,
    },
    {
      id: 'admin',
      label: 'Admin Control Hub',
      icon: ShieldCheck,
      badge: 'Console',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'settings',
      label: 'Settings & Status',
      icon: Sliders,
      badge: null,
    },
  ]

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out border-r
        bg-white dark:bg-[#0A0F1D] border-slate-200/80 dark:border-slate-800/80
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Sidebar Header with Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center overflow-hidden">
          {collapsed ? (
            <Logo variant="symbol" size="sm" />
          ) : (
            <Logo variant="compact" size="md" />
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
          {!collapsed && 'Main Menu'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-brand-violet to-brand-violet-dark text-white shadow-md shadow-brand-violet/25 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-violet dark:group-hover:text-brand-cyan'
                }`}
              />

              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${
                        isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Collapsed Tooltip fallback indicator */}
              {collapsed && isActive && (
                <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-brand-cyan" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Readiness Index Mini Widget */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80">
        {!collapsed ? (
          <div
            onClick={() => onSelectTab('overview')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 cursor-pointer hover:border-brand-violet/40 transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-brand-cyan" />
                Readiness Index
              </span>
              <span className="text-xs font-mono font-extrabold text-brand-violet dark:text-brand-cyan">
                {readinessScore}%
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-violet to-brand-cyan h-full rounded-full transition-all duration-500"
                style={{ width: `${readinessScore}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
              <span>{readinessScore >= 80 ? 'Interview Ready' : 'In Progress'}</span>
              <span className="text-brand-violet hover:underline">View details</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => onSelectTab('overview')}
            title={`Interview Readiness: ${readinessScore}%`}
            className="w-10 h-10 mx-auto rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center cursor-pointer hover:scale-105 transition border border-slate-200 dark:border-slate-800"
          >
            <span className="text-[10px] font-mono font-bold text-brand-cyan">
              {readinessScore}%
            </span>
          </div>
        )}
      </div>

      {/* Tenant Security Tag */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 text-center">
        {!collapsed ? (
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Encrypted Tenant Isolation</span>
          </div>
        ) : (
          <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto" title="Encrypted Tenant Isolation" />
        )}
      </div>
    </aside>
  )
}

