import React from 'react'
import { Link } from '../../context/RouterContext'
import {
  ShieldCheck,
  Cpu,
  Target,
  Sparkles,
  ArrowRight,
  Heart,
  Award,
  Terminal,
} from 'lucide-react'
import PublicNavbar from '../../components/public/PublicNavbar'
import PublicFooter from '../../components/public/PublicFooter'

export default function About() {
  const principles = [
    {
      icon: Cpu,
      title: 'Deterministic Grounding',
      desc: 'We reject black-box guesswork. Every evaluation, score, and rubric feedback is backed by observable candidate tokens and deterministic evaluation algorithms.',
    },
    {
      icon: ShieldCheck,
      title: 'Candidate-First Privacy',
      desc: 'Your resume, speech tokens, and evaluation history are strictly isolated to your authenticated profile. We never sell data or train public models on your career materials.',
    },
    {
      icon: Sparkles,
      title: 'Actionable Model Exemplars',
      desc: 'Constructive criticism without an exemplar is incomplete. We believe every weak area must be accompanied by an actionable, senior-level model response you can study.',
    },
    {
      icon: Target,
      title: 'Relentless Practice Over Passive Cramming',
      desc: 'Reading interview answers passively creates false confidence. True mastery comes from speaking aloud under timed pressure and receiving objective delivery telemetry.',
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#070A12] text-slate-900 dark:text-white transition-colors">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="pt-16 pb-14 border-b border-slate-200 dark:border-slate-800 bg-grid-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-violet/10 text-brand-violet border border-brand-violet/20">
            Our Purpose & Manifesto
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Democratizing <span className="text-gradient-brand">elite interview intelligence.</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            PrepVerse AI was built to replace arbitrary interview stress with structured,
            verifiable, multi-modal preparation.
          </p>
        </div>
      </section>

      {/* The Problem Narrative */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-4 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
              The modern technical interview process is broken.
            </h2>
            <p>
              Candidates spend weeks memorizing algorithms and rehearsing behavioral stories in isolation,
              never knowing whether their delivery sounds confident or disorganized. When rejection emails
              arrive with zero feedback, they are left guessing which answers missed the mark.
            </p>
            <p>
              Executive candidates and senior leaders frequently pay thousands of dollars for private speech
              coaches and mock interviewers. Meanwhile, early and mid-career engineers are left with generic
              cheat sheets and static blog posts.
            </p>
            <p className="font-semibold text-brand-violet dark:text-brand-cyan text-base">
              PrepVerse AI bridges this gap. We combine high-speed PDF resume intelligence, adaptive interview
              simulations, objective speaking pace telemetry, and senior interviewer exemplars into a single,
              accessible SaaS platform.
            </p>
          </div>
        </div>
      </section>

      {/* Core Principles Grid */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0E1526]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Our Core Architectural Principles
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              The foundational design choices that govern every feature inside PrepVerse AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((p, idx) => {
              const Icon = p.icon
              return (
                <div
                  key={idx}
                  className="p-8 rounded-3xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-md space-y-3"
                >
                  <div className="p-3 rounded-2xl bg-brand-violet/10 text-brand-violet w-fit">
                    <Icon className="w-5 h-5 text-brand-cyan" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{p.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 text-center space-y-6">
        <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Become Interview-Ready Today.
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Start practicing with zero setup. Experience real multi-modal simulations right now.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-xs font-bold bg-brand-violet hover:bg-brand-violet-dark text-white shadow-xl shadow-brand-violet/25 transition"
        >
          <span>Create Free Account</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <PublicFooter />
    </div>
  )
}

