import React, { useState } from 'react'
import { Link, useRouter, Navigate } from '../../context/RouterContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Sun,
  Moon,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import Logo from '../../components/Logo'

export default function Register() {
  const { navigate } = useRouter()
  const { register, authError, setAuthError, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />
  }

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [clientError, setClientError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setClientError('')
    setAuthError(null)

    if (!name.trim() || name.trim().length < 2) {
      setClientError('Please enter your full name (at least 2 characters).')
      return
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setClientError('Please provide a valid email address.')
      return
    }

    if (password.length < 8) {
      setClientError('Password must contain at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setClientError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const result = await register(name.trim(), email.trim(), password)
    setSubmitting(false)

    if (result.success) {
      // Forward to personalized career profile setup
      navigate('/profile', { replace: true })
    }
  }

  const activeError = clientError || authError

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-white flex flex-col justify-between transition-colors">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#070A12]/70 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <Logo variant="compact" size="md" />
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            to="/login"
            className="text-xs font-bold text-brand-violet dark:text-brand-cyan hover:underline"
          >
            Existing Candidate Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Main Split Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Hero Card */}
          <div className="hidden lg:flex flex-col space-y-6 p-8 rounded-3xl bg-gradient-to-br from-brand-violet/15 via-brand-cyan/10 to-brand-pink/15 border border-brand-violet/20">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-cyan text-slate-950 w-fit">
              100% Free Candidate Access
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Start practicing with <br />
              <span className="text-gradient-brand">verifiable telemetry.</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Create your candidate account to unlock in-memory resume parsing, real audio speech pacing,
              STAR rubric evaluation, and senior interviewer exemplars.
            </p>

            <div className="space-y-3 pt-2">
              {[
                'Zero credit card required — runs fully offline',
                'Deep resume intelligence via PyMuPDF',
                'Real-time speaking pace (WPM) & filler word tracking',
                'STAR behavioral evaluation & exemplar answers',
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Your career data is never shared or used to train public models.</span>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Create Candidate Account
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Join PrepVerse AI to elevate your interview confidence.
              </p>
            </div>

            {/* Error Alert */}
            {activeError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{activeError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet transition text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet transition text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Password (min 8 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet transition text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet transition text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold bg-brand-violet hover:bg-brand-violet-dark text-white shadow-lg shadow-brand-violet/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-violet font-bold hover:underline">
                Sign in to existing portal
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800/60">
        PrepVerse AI &bull; Prepare Smarter. Practice Deeper. Become Interview-Ready.
      </footer>
    </div>
  )
}
