import React, { useState, useEffect } from 'react'
import {
  User,
  Shield,
  Key,
  Moon,
  Sun,
  Activity,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Sliders,
  Database,
  Cpu,
  Lock,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useRouter } from '../../context/RouterContext'
import { ENDPOINTS } from '../../config/api'

export default function SettingsPage() {
  const { user, logout, authFetch } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const { navigate } = useRouter()

  const [healthStatus, setHealthStatus] = useState({
    loading: false,
    data: null,
    latency: null,
    error: null,
  })

  const [audioSettings, setAudioSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('prepverse_audio_settings')
      return saved ? JSON.parse(saved) : { autoPlayAudio: true, speechRate: 1.0 }
    } catch {
      return { autoPlayAudio: true, speechRate: 1.0 }
    }
  })

  const [savedNotice, setSavedNotice] = useState(false)

  const testConnection = async () => {
    setHealthStatus({ loading: true, data: null, latency: null, error: null })
    const start = performance.now()
    try {
      const res = await fetch(ENDPOINTS.HEALTH)
      const latency = Math.round(performance.now() - start)
      if (res.ok) {
        const data = await res.json()
        setHealthStatus({ loading: false, data, latency, error: null })
      } else {
        setHealthStatus({ loading: false, data: null, latency, error: `HTTP ${res.status}` })
      }
    } catch (err) {
      setHealthStatus({
        loading: false,
        data: null,
        latency: null,
        error: 'Backend unreachable. Verify local FastAPI server on port 8000.',
      })
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  const handleToggleAutoPlay = () => {
    const updated = { ...audioSettings, autoPlayAudio: !audioSettings.autoPlayAudio }
    setAudioSettings(updated)
    localStorage.setItem('prepverse_audio_settings', JSON.stringify(updated))
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2000)
  }

  const handleRateChange = (rate) => {
    const updated = { ...audioSettings, speechRate: rate }
    setAudioSettings(updated)
    localStorage.setItem('prepverse_audio_settings', JSON.stringify(updated))
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2000)
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-brand-violet" />
            Candidate Settings & System Preferences
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure your prep experience, interface preferences, audio settings, and inspect system telemetry.
          </p>
        </div>

        {savedNotice && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Preferences Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-violet via-brand-cyan to-brand-pink flex items-center justify-center text-xl font-black text-white shadow-lg shadow-brand-violet/20">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PV'}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || 'PrepVerse Candidate'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-3 h-3" /> Active Candidate
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Account ID</span>
                <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-200">
                  {user?.id ? `${user.id.slice(0, 8)}...` : 'demo-user'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Security Scheme</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  JWT Bearer + BCrypt
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Tenant Isolation</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Enforced
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition border border-rose-200 dark:border-rose-900/40"
              >
                <LogOut className="w-4 h-4" />
                Sign Out of PrepVerse
              </button>
            </div>
          </div>

          {/* Quick Nav Card */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Preparation Shortcuts
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => navigate('/onboarding')}
                className="w-full text-left px-3 py-2 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-brand-violet transition flex items-center justify-between"
              >
                <span>Re-run Onboarding Questionnaire</span>
                <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              </button>
              <button
                onClick={() => navigate('/app/roadmap')}
                className="w-full text-left px-3 py-2 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-brand-violet transition flex items-center justify-between"
              >
                <span>Target Interview Roadmap</span>
                <Clock className="w-3.5 h-3.5 text-brand-violet" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full text-left px-3 py-2 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-brand-violet transition flex items-center justify-between"
              >
                <span>PrepVerse Public Homepage</span>
                <span className="text-slate-400">&rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appearance & Theme */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isDark ? <Moon className="w-5 h-5 text-brand-cyan" /> : <Sun className="w-5 h-5 text-amber-500" />}
                Theme & Interface Appearance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Customize your visual preference. Dual dark and light modes with optimized contrast for extended prep sessions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => theme === 'light' || toggleTheme()}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between h-28 ${
                  !isDark
                    ? 'border-brand-violet bg-brand-violet/5 ring-2 ring-brand-violet/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Sun className="w-5 h-5 text-amber-500" />
                  {!isDark && <span className="w-2 h-2 rounded-full bg-brand-violet" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Editorial Light</p>
                  <p className="text-[10px] text-slate-500">Bright, high-contrast crisp daytime view</p>
                </div>
              </button>

              <button
                onClick={() => theme === 'dark' || toggleTheme()}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between h-28 ${
                  isDark
                    ? 'border-brand-cyan bg-brand-cyan/5 ring-2 ring-brand-cyan/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Moon className="w-5 h-5 text-brand-cyan" />
                  {isDark && <span className="w-2 h-2 rounded-full bg-brand-cyan" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Midnight Cyber Dark</p>
                  <p className="text-[10px] text-slate-500">Deep midnight navy, cyan accents, low eye-strain</p>
                </div>
              </button>
            </div>
          </div>

          {/* Audio & Speech Synthesizer Preferences */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-brand-pink" />
                Audio & Speech Simulation Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Fine-tune simulated interviewer voice playback and speech recognition responsiveness.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Auto-Play Interviewer Audio</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Automatically speak questions when transitioning between interview prompt steps
                  </p>
                </div>
                <button
                  onClick={handleToggleAutoPlay}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    audioSettings.autoPlayAudio ? 'bg-brand-violet' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      audioSettings.autoPlayAudio ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Interviewer Speech Pace</p>
                  <span className="text-xs font-mono font-bold text-brand-violet dark:text-brand-cyan">
                    {audioSettings.speechRate}x
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[0.85, 1.0, 1.15, 1.25].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition border ${
                        audioSettings.speechRate === rate
                          ? 'bg-brand-violet text-white border-brand-violet'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-violet/40'
                      }`}
                    >
                      {rate === 1.0 ? '1.0x (Normal)' : `${rate}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Telemetry & Diagnostics */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Live Platform Diagnostics & Telemetry
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Real-time connectivity to the local FastAPI backend and SQLite/PostgreSQL storage.
                </p>
              </div>
              <button
                onClick={testConnection}
                disabled={healthStatus.loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${healthStatus.loading ? 'animate-spin text-brand-violet' : ''}`} />
                <span>Test Ping</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                <div className="mt-1 flex items-center gap-1.5">
                  {healthStatus.error ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-xs font-bold text-rose-500">Unreachable</span>
                    </>
                  ) : healthStatus.loading ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs font-bold text-amber-500">Pinging...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-500">Healthy (200 OK)</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Round-trip Latency</span>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white font-mono">
                  {healthStatus.latency !== null ? `${healthStatus.latency} ms` : '—'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Database Engine</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-brand-violet" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {healthStatus.data?.database || 'SQLite / Postgres'}
                  </span>
                </div>
              </div>
            </div>

            {healthStatus.error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{healthStatus.error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

