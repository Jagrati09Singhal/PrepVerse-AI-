import React, { useState } from 'react'
import { Link, useRouter, useLocation, Navigate } from '../../context/RouterContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  Lock,
  Mail,
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

export default function Login() {
  const { navigate } = useRouter()
  const location = useLocation()
  const { login, authError, setAuthError, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [clientError, setClientError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  // Redirect target after login: default directly to dashboard command center
  const queryParams = new URLSearchParams(location.search)
  const fromTarget = queryParams.get('from') || '/app/dashboard'

  if (isAuthenticated) {
    return <Navigate to={fromTarget} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setClientError('')
    setAuthError(null)

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setClientError('Please provide a valid email address.')
      return
    }

    if (password.length < 8) {
      setClientError('Password must contain at least 8 characters.')
      return
    }

    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)

    if (result.success) {
      navigate(fromTarget, { replace: true })
    }
  }

  const handleDemoLogin = async () => {
    setClientError('')
    setAuthError(null)
    setDemoLoading(true)
    setEmail('demo@prepverse.ai')
    setPassword('Candidate123!')
    const result = await login('demo@prepverse.ai', 'Candidate123!')
    setDemoLoading(false)

    if (result.success) {
      navigate(fromTarget, { replace: true })
    }
  }

  const activeError = clientError || authError

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors relative overflow-hidden">
      {/* Ambient Electric Blue & Violet Mesh Glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[450px] bg-gradient-to-br from-brand-violet/20 via-brand-cyan/15 to-transparent rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-0 right-10 w-[600px] h-[450px] bg-gradient-to-bl from-brand-blue/20 via-indigo-500/15 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <Logo variant="compact" size="md" />
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-violet" />}
          </button>
          <Link
            to="/register"
            className="text-xs font-bold text-brand-violet dark:text-brand-cyan hover:underline"
          >
            Create Free Account &rarr;
          </Link>
        </div>
      </header>

      {/* Main Split Grid */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Hero Card */}
          <div className="hidden lg:flex flex-col space-y-6 p-8 rounded-3xl bg-white/95 dark:bg-[#0F172A]/90 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-violet/15 text-brand-violet dark:text-brand-cyan border border-brand-violet/30 w-fit shadow-xs">
              PrepVerse AI Portal
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Welcome back to your <br />
              <span className="text-gradient-brand">
                interview command center.
              </span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Continue your adaptive preparation simulations, review model exemplar answers,
              and check off today's scheduled preparation tasks.
            </p>

            <div className="space-y-3 pt-2">
              {[
                'Resume intelligence & keyword gap tracking',
                'STAR behavioral evaluation & speech pace metrics',
                'Evidence-grounded daily preparation roadmap',
                'Downloadable executive PDF reports',
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-cyan shrink-0" />
              <span>Strict per-candidate tenant isolation & salted bcrypt hashing.</span>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-white/95 dark:bg-[#0F172A]/90 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Sign In to PrepVerse AI
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your credentials or use 1-click instant demo access.
              </p>
            </div>

            {/* 1-Click Instant Demo Access Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-violet/10 via-brand-cyan/10 to-brand-blue/10 border border-brand-violet/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-violet dark:text-brand-cyan flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant 1-Click Evaluation Access</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-violet/20 text-brand-violet dark:text-brand-cyan font-mono">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                No typing required. Log in immediately as demo candidate with loaded portfolio, interview history, and roadmap.
              </p>
              <button
                type="button"
                disabled={submitting || demoLoading}
                onClick={handleDemoLogin}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet via-brand-accent to-brand-blue hover:opacity-95 text-white shadow-md shadow-brand-violet/25 transition flex items-center justify-center gap-2"
              >
                {demoLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing in as Demo Candidate...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                    <span>1-Click Demo Login (demo@prepverse.ai)</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span>or sign in with password</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
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
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-blue hover:opacity-95 text-white shadow-lg shadow-brand-violet/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Candidate Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
              New to PrepVerse AI?{' '}
              <Link to="/register" className="text-brand-violet dark:text-brand-cyan font-bold hover:underline">
                Create a candidate account
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-400 border-t border-slate-200/80 dark:border-slate-800/80">
        PrepVerse AI &bull; Prepare Smarter. Practice Deeper. Become Interview-Ready.
      </footer>
    </div>
  )
}
