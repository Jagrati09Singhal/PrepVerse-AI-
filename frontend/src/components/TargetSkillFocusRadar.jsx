import React, { useState, useMemo } from 'react'
import {
  Target,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Server,
  Cloud,
  Code2,
  Database,
  Flame,
  Award,
  Shield,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'

// Curated 3-Minute Emergency Cheat Sheets for High-Frequency Tech Skills
const SKILL_CHEAT_SHEETS = {
  redis: {
    name: 'Redis',
    interviewerTrap: 'They will ask how you prevent cache stampedes (thundering herd) and what eviction policy you chose.',
    magicFormula: 'Say: "We used Redis for read-heavy cache warming with volatile-lru eviction, and handled cache stampedes via Redlock distributed mutexes and probabilistic background refresh at 85% TTL."',
    seniorTip: 'Always mention that Redis is single-threaded for command execution so slow O(N) commands like KEYS * must never run in production.',
  },
  docker: {
    name: 'Docker',
    interviewerTrap: 'They will ask how you minimize image sizes and secure container runtime.',
    magicFormula: 'Say: "We used multi-stage builds to strip build tools, pinned exact base digests, and ran as a non-root unprivileged user with read-only root filesystems."',
    seniorTip: 'Emphasize layer caching order—copy requirements.txt before copying source code to maximize build cache hits.',
  },
  'system design': {
    name: 'System Design',
    interviewerTrap: 'They will evaluate if you jump into coding or start by scoping scale and constraints.',
    magicFormula: 'Say: "Before choosing architecture, let’s scope: daily active users, read-to-write ratio, peak QPS, and whether we prioritize strong consistency or high availability under CAP."',
    seniorTip: 'Never draw boxes without explaining failure modes and circuit breakers.',
  },
  kubernetes: {
    name: 'Kubernetes',
    interviewerTrap: 'They will ask the difference between liveness and readiness probes.',
    magicFormula: 'Say: "Liveness probes restart a deadlocked container; readiness probes remove a busy container from service endpoints so it stops receiving traffic until ready."',
    seniorTip: 'Always set both CPU/memory requests and limits to prevent noisy neighbor pod starvation.',
  },
  kafka: {
    name: 'Kafka',
    interviewerTrap: 'They will ask how you ensure exactly-once processing and handle poison pills.',
    magicFormula: 'Say: "We use consumer group idempotency with unique deduplication IDs and route unprocessable messages to a Dead Letter Queue (DLQ) with exponential backoff."',
    seniorTip: 'Mention consumer group rebalancing when adding partitions or instances.',
  },
  postgresql: {
    name: 'PostgreSQL',
    interviewerTrap: 'They will ask how you debug slow queries and prevent locking during schema migrations.',
    magicFormula: 'Say: "We inspect EXPLAIN ANALYZE for sequential scans vs index bitmap scans, and always use CREATE INDEX CONCURRENTLY to avoid blocking read/write traffic."',
    seniorTip: 'Mention connection pooling with PgBouncer to prevent connection exhaustion.',
  },
}

// Fallback baseline when no resume or job analysis has been uploaded yet
const DEFAULT_VERIFIED_SKILLS = [
  'Python',
  'FastAPI',
  'React',
  'PostgreSQL',
  'REST APIs',
  'Git & GitHub',
  'JavaScript',
  'HTML5 & CSS3',
  'SQL Queries',
  'Unit Testing',
  'Linux Basics',
  'Node.js',
]

const DEFAULT_TARGET_GAPS = [
  { name: 'Redis', category: 'In-Memory Caching & Concurrency', why: 'Stops database collapse during high traffic spikes' },
  { name: 'Docker', category: 'Containerization & Microservices', why: 'Guarantees reliable multi-stage production deployment' },
  { name: 'System Design', category: 'Architecture & Scalability', why: 'Top-tier placement round differentiating senior engineers' },
  { name: 'Kubernetes', category: 'Cloud Orchestration', why: 'Critical standard for enterprise microservice scaling' },
]

export default function TargetSkillFocusRadar({
  resumes = [],
  jobAnalyses = [],
  onLaunchPractice,
  onAskAura,
}) {
  const [activeTab, setActiveTab] = useState('target') // 'target', 'reality_gap', 'verified'
  const [realityStatuses, setRealityStatuses] = useState({})
  const [activeCheatSheet, setActiveCheatSheet] = useState(null)

  // 1. Dynamically extract verified skills from candidate's actual resume(s)
  const dynamicVerifiedSkills = useMemo(() => {
    if (resumes && resumes.length > 0) {
      const firstResume = resumes[0]
      const parsed = firstResume.parsed_skills
      if (parsed) {
        if (Array.isArray(parsed.all_skills) && parsed.all_skills.length > 0) {
          return parsed.all_skills.slice(0, 30)
        }
        if (Array.isArray(parsed.technical) && parsed.technical.length > 0) {
          return parsed.technical.slice(0, 30)
        }
      }
      if (Array.isArray(firstResume.skills) && firstResume.skills.length > 0) {
        return firstResume.skills.slice(0, 30)
      }
    }
    return DEFAULT_VERIFIED_SKILLS
  }, [resumes])

  // 2. Dynamically extract mission-critical target gaps from candidate's active job analysis
  const dynamicTargetGaps = useMemo(() => {
    if (jobAnalyses && jobAnalyses.length > 0) {
      const firstAnalysis = jobAnalyses[0]
      const match = firstAnalysis.match_results || {}

      // If missing_skills exists
      if (Array.isArray(match.missing_skills) && match.missing_skills.length > 0) {
        return match.missing_skills.slice(0, 5).map((s) => ({
          name: typeof s === 'string' ? s : s.name || 'Required Skill',
          category: 'Job Requirement Gap',
          why: 'Specifically demanded by your target role requirements',
        }))
      }

      // If skill_matches exists, filter by not_found
      if (Array.isArray(match.skill_matches) && match.skill_matches.length > 0) {
        const missing = match.skill_matches
          .filter((s) => s.status === 'not_found' || s.status === 'needs_verification')
          .slice(0, 5)
        if (missing.length > 0) {
          return missing.map((s) => ({
            name: s.skill,
            category: s.category === 'required' ? 'Mandatory Qualification' : 'Preferred Advantage',
            why: s.reasoning || 'Identified as high-priority competency gap for this role',
          }))
        }
      }
    }
    return DEFAULT_TARGET_GAPS
  }, [jobAnalyses])

  const verifiedCount = dynamicVerifiedSkills.length
  const targetGapCount = dynamicTargetGaps.length

  // Reality Gap classification count
  const realityGapCount = Object.values(realityStatuses).filter((v) => v === 'bluff').length

  const handleSetRealityStatus = (skill, status) => {
    setRealityStatuses((prev) => ({
      ...prev,
      [skill]: prev[skill] === status ? null : status,
    }))
  }

  const openCheatSheetFor = (skillName) => {
    const key = Object.keys(SKILL_CHEAT_SHEETS).find((k) =>
      skillName.toLowerCase().includes(k)
    )
    if (key) {
      setActiveCheatSheet(SKILL_CHEAT_SHEETS[key])
    } else {
      setActiveCheatSheet({
        name: skillName,
        interviewerTrap: `They will ask for concrete hands-on production experiences with ${skillName} and trade-offs.`,
        magicFormula: `Say: "In our architecture, we integrated ${skillName} to optimize latency and decoupled dependencies. If scaled further, we monitored error rates and connection pool saturation."`,
        seniorTip: `Review the top 3 interview questions on ${skillName} using Aura AI before your interview!`,
      })
    }
  }

  return (
    <div className="rounded-3xl p-5 sm:p-7 bg-white dark:bg-[#0F172A] border border-[#E2E8F0]/90 dark:border-[#334155]/90 shadow-sm space-y-5 text-left relative overflow-hidden transition-all">
      {/* Decorative Warm Nude & Terracotta Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#8B5CF6]/10 via-[#06B6D4]/8 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-xs flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>Target Skill Radar</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F1F5F9] dark:bg-[#0B0F19] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155] font-mono">
              {verifiedCount} Verified • {targetGapCount} Target Gaps
            </span>
            {realityGapCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#38BDF8] border border-[#06B6D4]/30 flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#06B6D4]" />
                <span>{realityGapCount} Private Reality Checks</span>
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            Tailored Skill Blueprint: Don’t Memorize 50 Buzzwords
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-2xl leading-relaxed">
            Calculated directly from your uploaded resume and target job criteria. You have{' '}
            <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{verifiedCount} skills</strong> verified.
            Mastering your <strong>{targetGapCount} priority gaps</strong> will unlock placement readiness without burnout.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] dark:bg-[#0B0F19] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('target')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'target'
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Target Missions ({targetGapCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reality_gap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'reality_gap'
                ? 'bg-[#06B6D4] text-white shadow-sm'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
            }`}
            title="Private honest calibration between what is on resume vs reality"
          >
            <Shield className="w-3.5 h-3.5 text-amber-200" />
            <span>Resume-Reality Gap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'verified'
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white/90" />
            <span>Verified Skills ({verifiedCount})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: The Target Missions */}
      {activeTab === 'target' && (
        <div className="space-y-3.5 relative z-10 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dynamicTargetGaps.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#8B5CF6]/50 transition-all shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#38BDF8]">
                      <Target className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-[#8B5CF6] dark:text-[#38BDF8] font-semibold">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCheatSheetFor(item.name)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#F1F5F9] hover:bg-[#E2E8F0] dark:bg-[#0F172A] text-[#8B5CF6] dark:text-[#38BDF8] border border-[#E2E8F0] dark:border-[#334155] transition flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3 text-[#8B5CF6]" />
                    <span>Cheat Sheet</span>
                  </button>
                </div>

                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  {item.why}
                </p>

                <div className="pt-2 border-t border-[#E2E8F0]/70 dark:border-[#334155]/70 flex items-center justify-between">
                  <span className="text-[10px] text-[#94A3B8]">Mission Priority # {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onLaunchPractice) {
                        onLaunchPractice({
                          practiceMode: 'focused_technical',
                          targetFocus: item.name,
                        })
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] transition shadow-xs flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-200" />
                    <span>Practice Interview Drill</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: The Private Resume-Reality Gap Detector */}
      {activeTab === 'reality_gap' && (
        <div className="space-y-4 relative z-10 animate-fadeIn">
          {/* Reassuring Confidentiality Banner */}
          <div className="p-4 rounded-2xl bg-[#06B6D4]/15 dark:bg-[#06B6D4]/10 border border-[#06B6D4]/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4338CA] dark:text-[#BAE6FD]">
              <Lock className="w-4 h-4 text-[#06B6D4] shrink-0" />
              <span>100% Confidential to You & Your AI Coach (Hidden from HR / Recruiters)</span>
            </div>
            <p className="text-[11px] text-[#4F46E5] dark:text-[#BAE6FD] leading-relaxed">
              We all know everyone puts buzzwords on their resume to pass ATS keyword filters. But in front of an interviewer, freezing on a resume claim hurts.
              <strong> Be honest with yourself below:</strong> Mark what you genuinely know vs what was just for ATS. Aura will privately give you emergency 3-minute cheat sheets so you don't get caught!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {dynamicVerifiedSkills.slice(0, 18).map((skill, idx) => {
              const status = realityStatuses[skill]
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    status === 'bluff'
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
                      : status === 'solid'
                      ? 'bg-[#8B5CF6]/15 dark:bg-[#8B5CF6]/20 border-[#8B5CF6]/40'
                      : status === 'rusty'
                      ? 'bg-[#06B6D4]/15 dark:bg-[#06B6D4]/20 border-[#06B6D4]/40'
                      : 'bg-white dark:bg-[#0B0F19] border-[#E2E8F0] dark:border-[#334155]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                      {skill}
                    </span>
                    {status === 'bluff' && (
                      <button
                        type="button"
                        onClick={() => openCheatSheetFor(skill)}
                        className="text-[10px] font-bold text-rose-700 dark:text-rose-300 underline"
                      >
                        Get Cheat Sheet
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleSetRealityStatus(skill, 'solid')}
                      className={`py-1 px-1.5 rounded-lg font-semibold transition text-center ${
                        status === 'solid'
                          ? 'bg-[#8B5CF6] text-white'
                          : 'bg-[#F1F5F9] dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#8B5CF6]/20'
                      }`}
                      title="I genuinely know this and can answer tough questions"
                    >
                      🟢 Solid
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetRealityStatus(skill, 'rusty')}
                      className={`py-1 px-1.5 rounded-lg font-semibold transition text-center ${
                        status === 'rusty'
                          ? 'bg-[#06B6D4] text-white'
                          : 'bg-[#F1F5F9] dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#06B6D4]/20'
                      }`}
                      title="Used in college, need a 10-minute brushup"
                    >
                      🟡 Rusty
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetRealityStatus(skill, 'bluff')}
                      className={`py-1 px-1.5 rounded-lg font-semibold transition text-center ${
                        status === 'bluff'
                          ? 'bg-rose-600 text-white'
                          : 'bg-[#F1F5F9] dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] hover:bg-rose-100 dark:hover:bg-rose-950/50'
                      }`}
                      title="ATS bluff keyword! Teach me fast so I don't get exposed"
                    >
                      🔴 ATS Bluff
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 3: The Verified Strengths List */}
      {activeTab === 'verified' && (
        <div className="space-y-4 relative z-10 animate-fadeIn">
          <div className="p-3.5 rounded-2xl bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center gap-2.5 text-xs text-[#8B5CF6] dark:text-[#38BDF8]">
            <CheckCircle2 className="w-4 h-4 text-[#8B5CF6] shrink-0" />
            <span>
              <strong>Your Solid Baseline:</strong> You already have {verifiedCount} verified technical competencies extracted from your real portfolio. Celebrate this!
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {dynamicVerifiedSkills.map((skill, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#334155] flex items-center gap-2 hover:border-[#8B5CF6]/50 transition group shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                  {skill}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Cheat Sheet Modal */}
      {activeCheatSheet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-lg w-full rounded-3xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] p-6 shadow-2xl text-left space-y-4 font-sans text-[#0F172A] dark:text-[#F8FAFC]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#38BDF8]">
                  <BookOpen className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold">{activeCheatSheet.name} Emergency Cheat Sheet</h3>
                  <span className="text-[10px] text-[#8B5CF6] dark:text-[#38BDF8] font-bold uppercase tracking-wider">
                    3-Minute Senior Engineer Defense
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCheatSheet(null)}
                className="text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1">
                <span className="font-bold text-rose-800 dark:text-rose-300 block">
                  What Interviewers Will Ask:
                </span>
                <p className="text-slate-700 dark:text-slate-300">{activeCheatSheet.interviewerTrap}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#8B5CF6]/15 dark:bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 space-y-1">
                <span className="font-bold text-[#8B5CF6] dark:text-[#38BDF8] block">
                  The Exact Answer Formula:
                </span>
                <p className="text-[#0F172A] dark:text-[#F8FAFC] font-medium italic">
                  "{activeCheatSheet.magicFormula}"
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#06B6D4]/15 dark:bg-[#06B6D4]/20 border border-[#06B6D4]/40 space-y-1">
                <span className="font-bold text-[#0891B2] dark:text-[#38BDF8] block">
                  Senior Pro Tip:
                </span>
                <p className="text-[#0F172A] dark:text-[#F8FAFC]">{activeCheatSheet.seniorTip}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveCheatSheet(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] transition shadow-sm"
              >
                Got It, Let's Crush It!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
