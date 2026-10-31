import React from 'react'
import { Link } from '../../context/RouterContext'
import {
  FileText,
  Target,
  Mic,
  Sparkles,
  Award,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import PublicNavbar from '../../components/public/PublicNavbar'
import PublicFooter from '../../components/public/PublicFooter'

const STEPS = [
  {
    step: '01',
    title: 'Upload Resume & Extract Verified Skills',
    icon: FileText,
    tagline: 'In-Memory PDF Parsing',
    description: 'Upload your existing PDF resume. PyMuPDF extracts normalized skills across 120+ software engineering domains in memory. Your raw PDF is never stored on public servers.',
    output: 'Structured Candidate Profile with verified technical competencies.',
  },
  {
    step: '02',
    title: 'Align Against Target Job Description',
    icon: Target,
    tagline: 'Gap Radar Matching',
    description: 'Paste any job posting. The matching engine compares the requirements against your resume, calculating an instant coverage score and identifying missing gaps.',
    output: 'Match breakdown highlighting core gaps to practice.',
  },
  {
    step: '03',
    title: 'Run Adaptive Multi-Modal Simulations',
    icon: Mic,
    tagline: 'Voice & Text with Real Telemetry',
    description: 'Practice answering technical, behavioral, and situational questions. Answer with your microphone or type in text mode. The difficulty scales dynamically to challenge you.',
    output: 'Live duration timing, speaking pace (WPM), and filler word counts.',
  },
  {
    step: '04',
    title: 'Study STAR Rubric & Model Exemplars',
    icon: Sparkles,
    tagline: 'Actionable Coaching Guidance',
    description: 'Every answer receives an instant content depth score and STAR rubric breakdown. Open the AI Coach Hub to review high-scoring model exemplars with 1-click clipboard copy.',
    output: 'Model exemplars, senior follow-up probes, and step-by-step advice.',
  },
  {
    step: '05',
    title: 'Track Readiness & Execute Daily Roadmap',
    icon: TrendingUp,
    tagline: 'Scheduled Milestone Velocity',
    description: 'Follow your personalized preparation roadmap. Track your Interview Readiness Index (0–100%) and export formatted executive candidate PDF reports for mentors.',
    output: 'Certified readiness index and downloadable executive PDF report.',
  },
]

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#070A12] text-slate-900 dark:text-white transition-colors">
      <PublicNavbar />

      {/* Header */}
      <section className="pt-16 pb-12 border-b border-slate-200 dark:border-slate-800 bg-grid-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
            Preparation Methodology
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            From raw anxiety to <span className="text-gradient-brand">interview ready.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            A transparent, 5-phase structured workflow engineered to eliminate blind spots
            and elevate candidate performance before real interview loops.
          </p>
        </div>
      </section>

      {/* 5-Step Visual Timeline */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="space-y-12 relative before:absolute before:inset-0 before:left-8 before:w-0.5 before:bg-gradient-to-b before:from-brand-violet before:via-brand-cyan before:to-brand-pink md:before:left-1/2">
            {STEPS.map((s, idx) => {
              const Icon = s.icon
              const isEven = idx % 2 === 0
              return (
                <div
                  key={s.step}
                  className={`relative flex flex-col md:flex-row items-center gap-8 ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Center Milestone Node */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-900 border-4 border-brand-violet text-white font-extrabold text-xs flex items-center justify-center z-10 shadow-lg shadow-brand-violet/30">
                    {s.step}
                  </div>

                  {/* Content Card */}
                  <div className="ml-16 md:ml-0 md:w-1/2 p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-brand-violet/10 text-brand-violet">
                        <Icon className="w-4 h-4 text-brand-cyan" />
                      </div>
                      <span className="text-xs font-bold text-brand-violet dark:text-brand-cyan uppercase tracking-wider">
                        {s.tagline}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {s.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {s.description}
                    </p>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{s.output}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA Banner */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-brand-violet/10 via-brand-cyan/10 to-brand-pink/10 border border-brand-violet/30 text-center space-y-4 shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Ready to begin Step 01?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
              Upload your resume and launch your first adaptive interview simulation in under 2 minutes.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-brand-violet hover:bg-brand-violet-dark text-white shadow-lg shadow-brand-violet/25 transition"
              >
                <span>Start Preparation Workflow</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

