import React, { useState } from 'react'
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Mic,
  Compass,
  TrendingUp,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Layers,
  ChevronDown,
  Activity,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Logo from './Logo'
import SystemDiagnostics from './SystemDiagnostics'

export default function LandingAuth({ systemHealth, onRefreshHealth }) {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [clientError, setClientError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  const { login, register, authError, setAuthError } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const handleSwitchMode = (newMode) => {
    setMode(newMode)
    setClientError('')
    setAuthError(null)
  }

  const validate = () => {
    setClientError('')
    if (mode === 'register') {
      if (!name.trim()) {
        setClientError('Please enter your full name.')
        return false
      }
      if (name.trim().length < 2) {
        setClientError('Name must be at least 2 characters.')
        return false
      }
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setClientError('Please enter a valid email address.')
      return false
    }

    if (password.length < 8) {
      setClientError('Password must contain at least 8 characters.')
      return false
    }

    if (mode === 'register' && password !== confirmPassword) {
      setClientError('Passwords do not match.')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setAuthError(null)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const activeError = clientError || authError

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C15] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Simple Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 max-w-7xl mx-auto w-full">
        <Logo variant="compact" size="md" />

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-violet" />}
          </button>

          <button
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
          >
            <Activity className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="hidden sm:inline">System Health</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showDiagnostics ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      {/* Collapsible Diagnostics if opened */}
      {showDiagnostics && (
        <div className="max-w-7xl mx-auto px-6 py-4 w-full animate-fadeIn">
          <SystemDiagnostics health={systemHealth} onRefresh={onRefreshHealth} />
        </div>
      )}

      {/* Main Hero & Auth Split */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-12 w-full">
        {/* Left Hero Section */}
        <div className="flex-1 space-y-6 text-left max-w-xl lg:max-w-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-violet/10 dark:bg-brand-violet/20 border border-brand-violet/30 text-xs font-semibold text-brand-violet dark:text-violet-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span>AI Career Readiness & Interview Simulator</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Prepare Smarter.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-violet via-indigo-500 to-brand-cyan">
              Practice Deeper.
            </span>{' '}
            Become Interview-Ready.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            PrepVerse AI is your enterprise-grade career preparation suite. Match your real resume against
            target job postings, practice with multimodal text and voice simulations, and sharpen responses
            with evidence-grounded STAR feedback and personalized study roadmaps.
          </p>

          {/* Pillars List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-start gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 text-brand-violet shrink-0 mt-0.5">
                <Mic className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Multimodal Simulator</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block">
                  Voice & text interviews with speaking pace (WPM) and filler word analytics.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-brand-cyan shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">STAR Rubric Grading</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block">
                  Objective behavioral and technical scoring with actionable improvements.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Personalized Roadmap</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block">
                  Dynamic curriculum scheduled around your target interview date.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">AI Interview Coach</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block">
                  Instant strengths, weaknesses, follow-up probes, and model exemplars.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="w-full max-w-md shrink-0">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Subtle Top Glow in Dark Mode */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-violet via-indigo-500 to-brand-cyan" />

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Title / Description */}
            <div className="text-left space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {mode === 'login' ? 'Welcome Back' : 'Get Interview-Ready'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'login'
                  ? 'Sign in to access your interview roadmap and practice history.'
                  : 'Create your candidate profile to begin personalized preparation.'}
              </p>
            </div>

            {/* Error Message Alert */}
            {activeError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-snug">{activeError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {mode === 'register' && (
                    <span className="text-[10px] text-slate-400">Min. 8 characters</span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-brand-violet via-indigo-600 to-brand-blue hover:opacity-95 text-white shadow-md shadow-brand-violet/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create Candidate Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Multi-user tenant isolation & bcrypt encrypted</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-4 text-center text-xs text-slate-500 dark:text-slate-400 max-w-7xl mx-auto w-full px-4">
        <span>PrepVerse AI &copy; {new Date().getFullYear()} &mdash; Prepare Smarter. Practice Deeper. Become Interview-Ready.</span>
      </footer>
    </div>
  )
}

