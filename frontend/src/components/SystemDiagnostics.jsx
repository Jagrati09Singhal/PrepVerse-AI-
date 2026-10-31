import React from 'react'
import { Server, Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { API_BASE_URL } from '../config/api'

export default function SystemDiagnostics({ health, onRefresh }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <Server className="w-5 h-5 text-brand-violet" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">System Diagnostics & Connectivity</h3>
        </div>

        <button
          onClick={onRefresh}
          disabled={health.loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition disabled:opacity-50 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${health.loading ? 'animate-spin' : ''}`} />
          <span>Probe Status</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Backend API Target */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Configured API Base URL</span>
          <div className="text-sm font-mono text-slate-900 dark:text-white truncate" title={API_BASE_URL}>
            {API_BASE_URL}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">Configurable via VITE_API_URL</div>
        </div>

        {/* API Health Status */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">FastAPI Engine</span>
            {health.connected ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Unreachable
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {health.loading ? 'Testing...' : health.connected ? '200 OK — Healthy' : 'Offline'}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {health.latency !== null ? `Latency: ${health.latency}ms` : 'Waiting for probe'}
          </div>
        </div>

        {/* Database Connectivity Status */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Database Layer</span>
            <Database className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white capitalize">
            {health.data?.database || (health.connected ? 'Connected' : 'Unavailable')}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {health.data?.version ? `Version: ${health.data.version}` : 'SQLite / PostgreSQL configured'}
          </div>
        </div>
      </div>

      {health.error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <span className="font-semibold text-rose-800 dark:text-rose-200">Diagnostics Notice: </span>
            {health.error}
          </div>
        </div>
      )}
    </div>
  )
}
