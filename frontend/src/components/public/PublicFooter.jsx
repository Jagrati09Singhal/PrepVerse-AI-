import React from 'react'
import { Link } from '../../context/RouterContext'
import { ShieldCheck, Cpu, Sparkles, Terminal, Activity, ArrowUpRight } from 'lucide-react'
import Logo from '../Logo'

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#04070E] transition-colors relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand-violet/10 dark:bg-brand-violet/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="full" size="md" showTagline={true} />
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Empowering ambitious candidates with deep resume intelligence, adaptive multi-modal simulations,
              real-time speech delivery metrics, and senior interviewer exemplars.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                FastAPI Engine Online
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                v2.0 Stable
              </span>
            </div>
          </div>

          {/* Platform Toolkit */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Career Toolkit
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/features" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Resume Intelligence
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Job Skill Gap Radar
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Adaptive Simulator
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  AI Coach Exemplars
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Speech Analytics (WPM)
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Daily Prep Planner
                </Link>
              </li>
            </ul>
          </div>

          {/* Methodology & Science */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Methodology
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/how-it-works" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  STAR Rubric Framework
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Adaptive Difficulty
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Speaking Pace Science
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Tenant Isolation
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Deterministic Heuristics
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              PrepVerse AI
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Candidate Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-slate-600 dark:text-slate-400 hover:text-brand-violet dark:hover:text-white transition">
                  Create Account
                </Link>
              </li>
              <li>
                <a
                  href="http://127.0.0.1:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-violet hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <span>FastAPI Docs</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p>© {new Date().getFullYear()} PrepVerse AI. All rights reserved. Built for ambitious candidates.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero-Tracking Privacy</span>
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-brand-violet" />
              <span>Evidence-Grounding</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

