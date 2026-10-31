import React from 'react'
import { FileText, Cpu, Shield, Database, ListChecks, LogIn, Sparkles, Compass } from 'lucide-react'
import Logo from './Logo'

export default function EmptyState({ onOpenAuth }) {
  const foundationPillars = [
    {
      icon: Database,
      title: 'Database & Multi-User Security',
      desc: 'Candidates, Resumes, Sessions, Questions, Answers, Roadmaps, and Job Analyses schemas with UUIDs and JSONB.',
      status: 'Ready',
    },
    {
      icon: Shield,
      title: 'Authentication & Tenant Isolation',
      desc: 'Salted bcrypt hashing, JWT access tokens, and strict per-candidate data isolation.',
      status: 'Ready',
    },
    {
      icon: Cpu,
      title: 'Resume & Job Intelligence',
      desc: 'PDF parsing, skill normalization, job requirement extraction, and explainable gap analysis.',
      status: 'Active',
    },
    {
      icon: Compass,
      title: 'Adaptive Simulation & AI Coach',
      desc: 'Dynamic multi-mode interviews, speech analytics, STAR evaluation, and strategic roadmaps.',
      status: 'Active',
    },
  ]

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        <div className="flex justify-center">
          <Logo variant="compact" size="lg" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Prepare Smarter. Practice Deeper. Become Interview-Ready.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            PrepVerse AI empowers candidates with intelligent resume analysis, job matching,
            adaptive technical and behavioral simulations, and personalized coaching roadmaps.
          </p>
        </div>

        {/* Call to action */}
        {onOpenAuth && (
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth('register')}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-brand-violet hover:bg-brand-violet/90 text-white shadow-md shadow-brand-violet/20 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Free Candidate Account</span>
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              <span>Sign In</span>
            </button>
          </div>
        )}

        {/* Informational Readiness Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-4">
          {foundationPillars.map((item, idx) => {
            const Icon = item.icon
            const isNext = item.status === 'Next'
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-brand-violet/30 flex items-start gap-3.5 transition-colors"
              >
                <div
                  className={`p-2 rounded-lg mt-0.5 ${
                    isNext
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                      : 'bg-violet-50 dark:bg-slate-800 text-brand-violet border border-violet-100 dark:border-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-brand-cyan" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</span>
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded ${
                        isNext
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
