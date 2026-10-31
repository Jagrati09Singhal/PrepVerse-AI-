import React, { useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export default function SkillGapResults({ analysis, onBack }) {
  const [activeTab, setActiveTab] = useState('all') // 'all', 'required', 'preferred'
  const [expandedIndex, setExpandedIndex] = useState(null)

  if (!analysis) return null

  const matchResults = analysis.match_results || {}
  const skillMatches = matchResults.skill_matches || []
  const recommendations = matchResults.recommendations || []
  const coveragePct = matchResults.overall_coverage_pct ?? 0
  const reqCoveragePct = matchResults.required_coverage_pct ?? 0
  const prefCoveragePct = matchResults.preferred_coverage_pct ?? 0

  const filteredMatches = skillMatches.filter((s) => {
    if (activeTab === 'required') return s.category === 'required'
    if (activeTab === 'preferred') return s.category === 'preferred'
    return true
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'evidence_found':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Evidence Found
          </span>
        )
      case 'possible_match':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-brand-cyan border border-cyan-500/20">
            <Sparkles className="w-3 h-3 text-brand-cyan" />
            Possible Match
          </span>
        )
      case 'needs_verification':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <HelpCircle className="w-3 h-3 text-amber-500" />
            Needs Verification
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <XCircle className="w-3 h-3 text-slate-400" />
            Not Found
          </span>
        )
    }
  }

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx)
  }

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Top Banner & Score */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-violet/10 text-xs font-semibold text-brand-violet mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Job Description Analysis Results</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {analysis.role_title || 'Target Role'}{' '}
              {analysis.company_name && (
                <span className="text-slate-500 dark:text-slate-400 font-normal">at {analysis.company_name}</span>
              )}
            </h2>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition w-fit"
            >
              Back to Job Analysis
            </button>
          )}
        </div>

        {/* Coverage Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Overall Keyword Coverage</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">{coveragePct}%</div>
            <span className="text-[10px] text-slate-400">Weighted: 70% Req / 30% Pref</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Required Skills Coverage</span>
            <div className="text-2xl font-extrabold text-brand-violet dark:text-brand-cyan mt-1 font-mono">{reqCoveragePct}%</div>
            <span className="text-[10px] text-slate-400">Foundational criteria</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Preferred Skills Coverage</span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{prefCoveragePct}%</div>
            <span className="text-[10px] text-slate-400">Differentiating qualifications</span>
          </div>
        </div>

        {/* Methodology Note */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-violet shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">Methodology Note: </strong>
            {matchResults.formula_explanation ||
              'This score reflects textual alignment and keyword coverage between the uploaded resume and the specified job description. It is NOT an appraisal of innate candidate competence or potential.'}
          </p>
        </div>
      </div>

      {/* Recommendations Card */}
      {recommendations.length > 0 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-6 space-y-3 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Targeted Next-Step Recommendations</span>
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-violet shrink-0 mt-1.5" />
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Skill Gap Breakdown */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Skill Evidence & Gap Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluated {skillMatches.length} skills from the job description
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              All ({skillMatches.length})
            </button>
            <button
              onClick={() => setActiveTab('required')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'required'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Required
            </button>
            <button
              onClick={() => setActiveTab('preferred')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'preferred'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Preferred
            </button>
          </div>
        </div>

        {/* Skill Matches List */}
        <div className="space-y-2.5">
          {filteredMatches.map((item, idx) => {
            const isExpanded = expandedIndex === idx
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 overflow-hidden transition"
              >
                <div
                  onClick={() => toggleExpand(idx)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{item.skill}</span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                        item.category === 'required'
                          ? 'bg-violet-500/10 text-brand-violet border border-violet-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed pt-2">{item.explanation}</p>
                    {item.evidence && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        <span className="text-slate-400 font-sans block mb-0.5 text-[10px] uppercase font-bold">
                          Resume Excerpt Evidence:
                        </span>
                        "{item.evidence}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
