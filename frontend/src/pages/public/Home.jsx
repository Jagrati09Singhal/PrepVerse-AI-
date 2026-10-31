import React, { useState } from 'react'
import { Link } from '../../context/RouterContext'
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  TrendingUp,
  Activity,
  Award,
  Layers,
  Cpu,
  Mic,
  FileText,
  Target,
  ShieldCheck,
  ChevronRight,
  Flame,
  Check,
  Zap,
} from 'lucide-react'
import PublicNavbar from '../../components/public/PublicNavbar'
import PublicFooter from '../../components/public/PublicFooter'

// Sample Interactive Demo Data for Visitors (No account required)
const DEMO_QUESTIONS = [
  {
    id: 1,
    title: 'Behavioral STAR',
    skill: 'Cross-Functional Conflict',
    type: 'Behavioral',
    difficulty: 'Medium',
    question: 'Tell me about a time you strongly disagreed with a senior engineer or product manager on an architectural trade-off. How did you resolve it?',
    sampleAnswer: 'In my last role as a backend engineer, our PM wanted to bypass caching to rush a holiday feature. I analyzed our database load metrics, created a minimal 2-hour POC using Redis read-replicas, and demonstrated that without caching, p99 latency would spike to 3.4 seconds during peak checkout. We reached consensus on the hybrid cache approach, launching on time with zero database degradation.',
    eval: {
      contentScore: 88,
      commScore: 92,
      star: { situation: 90, task: 85, action: 92, result: 85 },
      speechPace: '138 WPM (Optimal)',
      feedback: 'Outstanding STAR structure. Situation and actionable resolution metrics clearly articulated.',
      exemplarSnippet: 'A senior response balances business urgency with architectural safety, backing disagreements with benchmarked latency numbers rather than subjective opinions.'
    }
  },
  {
    id: 2,
    title: 'System Design',
    skill: 'Distributed Caching',
    type: 'Technical',
    difficulty: 'Hard',
    question: 'How would you architect a global leaderboard system handling 100,000 writes per second with sub-50ms reads?',
    sampleAnswer: 'I would decouple write ingestion from read querying using an event stream like Kafka. A worker pool processes score updates into Redis Sorted Sets (ZADD) partitioned across consistent hash rings. Read requests query Redis ZREVRANGEBYSCORE directly with a local memory cache for top 100 rankings.',
    eval: {
      contentScore: 94,
      commScore: 89,
      star: null,
      speechPace: '142 WPM (Optimal)',
      feedback: 'Superb technical depth. Correctly leveraged Redis Sorted Sets and partitioned event queues.',
      exemplarSnippet: 'At 100k writes/sec, direct DB writes saturate I/O. Decoupled in-memory ranking with write-behind persistence is the standard scalable paradigm.'
    }
  },
  {
    id: 3,
    title: 'Situational',
    skill: 'Incident Response',
    type: 'Situational',
    difficulty: 'Hard',
    question: 'Your production payment gateway begins throwing 500 errors during a high-profile product launch. Walk me through your first 10 minutes.',
    sampleAnswer: 'Minute 1-3: Declare an incident in our bridge channel and assign Incident Commander. Minute 4-6: Check APM traces to identify if errors are network timeouts or gateway 502s. Minute 7-8: Enable graceful degradation by routing checkouts to our secondary fallback payment processor. Minute 9-10: Post status page updates to keep candidates informed while isolating root cause.',
    eval: {
      contentScore: 91,
      commScore: 95,
      star: null,
      speechPace: '130 WPM (Composed)',
      feedback: 'Excellent crisis protocol. Prioritized customer containment and fallback routing before deep debugging.',
      exemplarSnippet: 'Senior interviewers look for emotional composure, clear team delegation, and fallback routing before investigating the bug.'
    }
  }
]

export default function Home() {
  const [selectedDemoIdx, setSelectedDemoIdx] = useState(0)
  const [demoInput, setDemoInput] = useState(DEMO_QUESTIONS[0].sampleAnswer)
  const [showDemoEval, setShowDemoEval] = useState(true)

  // Interactive Readiness Calculator State
  const [calcRole, setCalcRole] = useState('fullstack')
  const [selectedSkills, setSelectedSkills] = useState(['python', 'react', 'system_design'])

  const activeDemo = DEMO_QUESTIONS[selectedDemoIdx]

  const handleSelectDemo = (idx) => {
    setSelectedDemoIdx(idx)
    setDemoInput(DEMO_QUESTIONS[idx].sampleAnswer)
    setShowDemoEval(true)
  }

  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skillId))
    } else {
      setSelectedSkills([...selectedSkills, skillId])
    }
  }

  const estimatedReadiness = Math.min(96, Math.max(45, 50 + selectedSkills.length * 8))

  return (
    <div className="min-h-screen bg-white dark:bg-[#070A12] text-slate-900 dark:text-white transition-colors selection:bg-brand-violet selection:text-white">
      <PublicNavbar />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-grid-mesh">
        {/* Abstract Background Radial Lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-brand-violet/25 via-brand-cyan/20 to-brand-pink/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-brand-cyan/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-sm animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-brand-violet animate-pulse"></span>
              <span className="text-slate-700 dark:text-slate-300">The Next-Gen Interview Intelligence Platform</span>
              <span className="text-brand-violet font-bold">&bull; Real Telemetry</span>
            </div>

            {/* Editorial Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-slate-950 dark:text-white">
              Your next interview deserves a{' '}
              <span className="text-gradient-brand">better you.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              PrepVerse AI transforms chaotic preparation anxiety into structured engineering confidence.
              Real speech pacing telemetry, adaptive dynamic questions, and instant model exemplars.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold bg-brand-violet hover:bg-brand-violet-dark text-white shadow-xl shadow-brand-violet/30 hover:shadow-brand-violet/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/features"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-semibold bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <span>Explore the Toolkit</span>
                <Sparkles className="w-4 h-4 text-brand-cyan" />
              </Link>
            </div>

            {/* Trust Micro-Metrics */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>100% Deterministic Fallback</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-cyan" />
                <span>Verified Speaking Pace (WPM)</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-violet" />
                <span>STAR Rubric Behavioral Scoring</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* HERO VISUAL MOCKUP — FLOATING INTERACTIVE PREVIEW */}
          {/* ========================================================================= */}
          <div className="mt-14 max-w-5xl mx-auto relative animate-fadeIn">
            {/* Glowing border frame */}
            <div className="p-1 rounded-3xl bg-gradient-to-r from-brand-violet via-brand-cyan to-brand-pink shadow-2xl shadow-brand-violet/20">
              <div className="rounded-[22px] bg-slate-950 p-4 sm:p-7 text-white space-y-6">
                {/* Simulator Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="h-4 w-px bg-slate-800"></div>
                    <span className="text-xs font-mono text-slate-400">
                      prepverse.simulator // session_staff_eng_042
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live Simulation Active
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-violet/20 text-brand-violet border border-brand-violet/30">
                      Adaptive Hard
                    </span>
                  </div>
                </div>

                {/* Simulator Content Preview Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Question & Active Speech Waveform */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider">
                        Question 3 of 5 &bull; Technical Architecture
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                        "How would you eliminate a single point of failure in an active PostgreSQL database while ensuring strict linearizability for financial transactions?"
                      </h3>
                    </div>

                    {/* Animated Mock Audio Waveform */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                          <Mic className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Voice Stream Active</div>
                          <div className="text-[10px] text-slate-400">Speaking duration: 00:42 &bull; 136 WPM</div>
                        </div>
                      </div>

                      {/* Mock Waveform Bars */}
                      <div className="flex items-center gap-1">
                        {[40, 70, 95, 60, 85, 100, 75, 45, 90, 65, 80, 50, 95, 40].map((h, i) => (
                          <div
                            key={i}
                            style={{ height: `${h * 0.28}px` }}
                            className="w-1 rounded-full bg-gradient-to-t from-brand-violet to-brand-cyan animate-pulse"
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Candidate Transcription Snippet */}
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans">
                      <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">
                        Real-time Candidate Voice Transcription:
                      </span>
                      "...I would configure synchronous replication with Patroni and Raft-based consensus so failovers guarantee zero transaction loss under split-brain network partitions..."
                    </div>
                  </div>

                  {/* Right Col: Instant Live Telemetry Card */}
                  <div className="space-y-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Telemetry
                        </span>
                        <span className="text-xs font-bold text-emerald-400">92% Index</span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Content Depth</span>
                            <span className="text-white font-bold">94%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Communication</span>
                            <span className="text-white font-bold">89%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-cyan rounded-full" style={{ width: '89%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Filler Words</span>
                            <span className="text-emerald-400 font-bold">0.8% (Elite)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-violet rounded-full" style={{ width: '20%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                      <span className="text-brand-violet font-bold block">AI Coach Exemplar Ready</span>
                      1-click study available upon answer submission.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. REAL INTERACTIVE PLAYGROUND (NO ACCOUNT REQUIRED) */}
      {/* ========================================================================= */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#070A12]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
              Interactive Test Drive
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Try the evaluation engine right now.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Select an interview scenario below to examine real answer evaluation, STAR scoring,
              and model coaching exemplars — no account needed.
            </p>
          </div>

          {/* Interactive Scenario Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
            {DEMO_QUESTIONS.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => handleSelectDemo(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedDemoIdx === idx
                    ? 'bg-brand-violet text-white shadow-md shadow-brand-violet/25'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-brand-violet/50'
                }`}
              >
                {q.title} &bull; {q.skill}
              </button>
            ))}
          </div>

          {/* Interactive Card */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            {/* Question Display */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activeDemo.type}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                  {activeDemo.difficulty} Difficulty
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold text-brand-cyan bg-brand-cyan/10">
                  Skill: {activeDemo.skill}
                </span>
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {activeDemo.question}
              </p>
            </div>

            {/* Candidate Sample Answer Input / Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Candidate Submitted Response</span>
                <span>{demoInput.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <textarea
                rows={4}
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-brand-violet transition font-sans"
              />
            </div>

            {/* Real Instant Evaluation Panel */}
            {showDemoEval && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-5 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-brand-violet" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Evaluation Breakdown
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400">
                    Pacing: {activeDemo.eval.speechPace}
                  </span>
                </div>

                {/* Score Meters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block">Content Depth</span>
                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {activeDemo.eval.contentScore}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block">Clarity & Style</span>
                    <span className="text-xl font-extrabold text-brand-cyan">
                      {activeDemo.eval.commScore}%
                    </span>
                  </div>
                  {activeDemo.eval.star ? (
                    <>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase block">STAR: Action</span>
                        <span className="text-xl font-extrabold text-brand-violet">
                          {activeDemo.eval.star.action}%
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase block">STAR: Result</span>
                        <span className="text-xl font-extrabold text-white">
                          {activeDemo.eval.star.result}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase block">Structure</span>
                        <span className="text-xl font-extrabold text-brand-violet">90%</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase block">Trade-Offs</span>
                        <span className="text-xl font-extrabold text-white">95%</span>
                      </div>
                    </>
                  )}
                </div>

                {/* AI Coach Exemplar Preview Box */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-brand-violet/10 to-brand-cyan/10 border border-brand-violet/20 space-y-1.5">
                  <span className="text-xs font-bold text-brand-violet dark:text-brand-cyan flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Coach Exemplar Takeaway
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{activeDemo.eval.exemplarSnippet}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THE PROBLEM VS THE PREPVERSE APPROACH */}
      {/* ========================================================================= */}
      <section className="py-24 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-pink/10 text-brand-pink border border-brand-pink/20">
              The Paradigm Shift
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
              Why traditional interview prep fails.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Most candidates fail not from lack of intelligence, but from lack of structured real-time telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="p-8 rounded-3xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 space-y-6">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 font-bold text-xs uppercase">
                  Old Way
                </span>
                <h3 className="text-xl font-bold">Passive Memorization & Guesswork</h3>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">&times;</span>
                  <span>Cramming 500-question cheat sheets with zero feedback on how you actually sound.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">&times;</span>
                  <span>Submitting generic resumes without knowing exact keyword gaps against target roles.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">&times;</span>
                  <span>Rambling without knowing your speaking pace or filler word frequency.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">&times;</span>
                  <span>No understanding of what senior-level STAR exemplar answers look like.</span>
                </li>
              </ul>
            </div>

            {/* The PrepVerse Approach */}
            <div className="p-8 rounded-3xl bg-violet-50/50 dark:bg-brand-violet/5 border border-brand-violet/30 space-y-6 shadow-lg shadow-brand-violet/5">
              <div className="flex items-center gap-3 text-brand-violet">
                <span className="p-2 rounded-xl bg-brand-violet/10 font-bold text-xs uppercase text-brand-violet">
                  PrepVerse AI
                </span>
                <h3 className="text-xl font-bold">Active Telemetry & Model Exemplars</h3>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>PyMuPDF deep extraction analyzing real skills against target job descriptions.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Real audio pacing telemetry measuring exact WPM and filler word frequency.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Instant STAR behavioral component rubrics for Situation, Task, Action, and Result.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Dedicated AI Coach Hub providing 1-click model exemplar answers to model success.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE READINESS ESTIMATOR */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-50 dark:bg-[#070A12]/80 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-violet/10 text-brand-violet border border-brand-violet/20">
              Interactive Estimator
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Estimate your current Interview Readiness Index.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Select your core skills to calculate an estimated baseline index before your first simulation.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-left">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-2">Select Your Target Skills</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'python', label: 'Python / Backend' },
                  { id: 'fastapi', label: 'FastAPI / REST' },
                  { id: 'react', label: 'React / Frontend' },
                  { id: 'system_design', label: 'System Design' },
                  { id: 'docker', label: 'Docker & K8s' },
                  { id: 'postgres', label: 'PostgreSQL' },
                  { id: 'redis', label: 'Redis Caching' },
                  { id: 'star_behavioral', label: 'STAR Behavioral Storytelling' },
                ].map((s) => {
                  const isSelected = selectedSkills.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSkill(s.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-brand-violet text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Live Calculated Gauge */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Calculated Baseline Index</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-gradient-brand">
                  {estimatedReadiness}%
                </span>
              </div>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-violet hover:bg-brand-violet-dark text-white transition flex items-center gap-1.5 shadow-md shadow-brand-violet/20"
              >
                <span>Verify Through Simulation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FINAL HIGH-ENERGY CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-[#070A12] dark:to-[#04060B] border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Stop guessing. <br className="hidden sm:inline" />
            <span className="text-gradient-brand">Start dominating your interviews.</span>
          </h2>
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            Create your candidate profile in under 60 seconds and experience executive-grade career intelligence.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-brand-violet hover:bg-brand-violet-dark text-white shadow-xl shadow-brand-violet/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <span>Sign In to Existing Portal</span>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

