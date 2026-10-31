import React, { useState } from 'react'
import { Link } from '../../context/RouterContext'
import {
  FileText,
  Target,
  Mic,
  Activity,
  Sparkles,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Layers,
  Award,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import PublicNavbar from '../../components/public/PublicNavbar'
import PublicFooter from '../../components/public/PublicFooter'

const FEATURES = [
  {
    id: 'resume',
    icon: FileText,
    badge: 'PyMuPDF Engine',
    title: 'Deep Resume Intelligence',
    tagline: 'Instant skill normalization without hallucinations.',
    desc: 'Unlike generic keyword scanners, PrepVerse AI parses your raw PDF resume in-memory, extracting programming languages, frameworks, cloud databases, and DevOps tools into a structured skill profile.',
    bullets: [
      'Zero-storage memory extraction using PyMuPDF',
      'Taxonomy normalization across 120+ software engineering skills',
      'Instant breakdown of strengths and unverified domains',
      'One-click alignment against any job description',
    ],
    demoPill: 'Skills Parsed: Python, FastAPI, Docker, PostgreSQL',
  },
  {
    id: 'job-match',
    icon: Target,
    badge: 'Gap Radar',
    title: 'Job Description Matching',
    tagline: 'Know exactly what you lack before applying.',
    desc: 'Paste any job posting from LinkedIn, Greenhouse, or Lever. Our gap radar compares required qualifications against your extracted resume profile, calculating coverage percentages and highlighting missing critical skills.',
    bullets: [
      'Real-time keyword coverage scoring (0–100%)',
      'Missing core requirements versus optional nice-to-haves',
      'Tailored question generation targeting your specific skill gaps',
      'Saved history of past job analyses for longitudinal comparison',
    ],
    demoPill: 'Coverage Score: 82% &bull; Gap: Redis Caching',
  },
  {
    id: 'simulator',
    icon: Mic,
    badge: 'Dynamic Difficulty',
    title: 'Adaptive Multi-Modal Simulator',
    tagline: 'An interviewer that adjusts to your depth in real-time.',
    desc: 'Simulate high-pressure technical, behavioral, and situational interviews. Choose between browser voice recording or structured text mode. Our adaptive engine scales difficulty from Medium to Hard when you demonstrate mastery.',
    bullets: [
      'Question stepper with category and difficulty badges',
      'Unsaved draft protection preventing accidental loss',
      'Speech-to-text recording with Web Speech API integration',
      'Audio question playback for realistic conversational practice',
    ],
    demoPill: 'Question 3/5 &bull; Adaptive Difficulty Escalated to Hard',
  },
  {
    id: 'speech',
    icon: Activity,
    badge: 'Evidence-Based',
    title: 'Speech Delivery Analytics',
    tagline: 'Eliminate filler words and erratic speech pace.',
    desc: 'Speaking too fast communicates anxiety; speaking too slow loses attention. PrepVerse AI calculates your exact speaking pace in Words Per Minute (WPM) and tracks filler term frequency across every spoken response.',
    bullets: [
      'Speaking pace assessment (130–160 WPM optimal window)',
      'Filler word frequency tracking (um, uh, like, basically)',
      'Audio duration telemetry and silence pause tracking',
      'Zero audio uploads required — calculated on your machine',
    ],
    demoPill: 'Speaking Pace: 142 WPM &bull; Filler Rate: 0.8% (Elite)',
  },
  {
    id: 'coach',
    icon: Sparkles,
    badge: '1-Click Copy',
    title: 'AI Coach Hub & Exemplars',
    tagline: 'Study senior-level model answers with one click.',
    desc: 'Never wonder what a 10/10 answer sounds like. Our AI Coach analyzes your answer against the question, breaks down strengths and constructive weaknesses, and constructs a model exemplar answer you can copy to study.',
    bullets: [
      'Model exemplar answers for both behavioral STAR and system design',
      '1-click clipboard copy button for rapid study and review',
      'Anticipated senior interviewer follow-up probe questions',
      'Immutable evaluation guarantee: scores never shift unfairly',
    ],
    demoPill: 'Model Exemplar: 1,650 Chars &bull; 1-Click Copy Ready',
  },
  {
    id: 'roadmap',
    icon: Calendar,
    badge: 'Strategic Execution',
    title: 'Preparation Roadmap & Planner',
    tagline: 'Dynamic daily goals scheduled around your interview date.',
    desc: 'Set your target interview date and daily prep goals. PrepVerse AI builds an evidence-grounded milestone roadmap with customized tasks, tracking velocity, task filters, and target date countdowns.',
    bullets: [
      'Live target date countdown clock',
      'Daily prep velocity tracking and completion meters',
      'Interactive task management with instant checkbox toggling',
      'Tailored weak-area focus items auto-generated from test history',
    ],
    demoPill: 'Countdown: 14 Days Remaining &bull; 8/12 Tasks Completed',
  },
]

export default function Features() {
  const [activeTab, setActiveTab] = useState(0)
  const currentFeature = FEATURES[activeTab]
  const Icon = currentFeature.icon

  return (
    <div className="min-h-screen bg-white dark:bg-[#070A12] text-slate-900 dark:text-white transition-colors">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="pt-16 pb-12 border-b border-slate-200 dark:border-slate-800 bg-grid-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-violet/10 text-brand-violet border border-brand-violet/20">
            Career Preparation Toolkit
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Engineered for <span className="text-gradient-brand">exceptional candidates.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Explore the 6 core pillars of PrepVerse AI. Every tool is grounded in real telemetry,
            evidence-based scoring, and candidate-first privacy.
          </p>
        </div>
      </section>

      {/* Interactive Feature Deep Dive */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Feature Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {FEATURES.map((f, idx) => (
              <button
                key={f.id}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === idx
                    ? 'bg-brand-violet text-white shadow-lg shadow-brand-violet/25'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>{f.title}</span>
              </button>
            ))}
          </div>

          {/* Active Feature Showcase Showcase */}
          <div className="max-w-5xl mx-auto bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 sm:p-12 shadow-xl space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                  {currentFeature.badge}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {currentFeature.title}
                </h2>
                <p className="text-sm font-semibold text-brand-violet dark:text-brand-cyan">
                  {currentFeature.tagline}
                </p>
              </div>

              <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300">
                {currentFeature.demoPill}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentFeature.desc}
                </p>
                <ul className="space-y-2.5">
                  {currentFeature.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-violet hover:bg-brand-violet-dark text-white shadow-md shadow-brand-violet/20 transition"
                  >
                    <span>Try This Feature Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Decorative Visual Illustration */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">module://prepverse_core</span>
                  <span className="text-emerald-500 font-bold">● Active</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 space-y-2 border border-slate-100 dark:border-slate-800">
                  <div className="h-2 w-24 bg-brand-violet rounded-full"></div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-white">
                    100% Deterministic
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-white">
                    Tenant Isolated
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid of All Features */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#070A12]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Complete Feature Architecture
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Built on clean FastAPI services, SQLAlchemy models, and real-time frontend reactivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((item, idx) => {
              const ItemIcon = item.icon
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 hover:border-brand-violet/40 transition shadow-sm space-y-3"
                >
                  <div className="p-2.5 rounded-xl bg-brand-violet/10 text-brand-violet w-fit">
                    <ItemIcon className="w-5 h-5 text-brand-cyan" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

