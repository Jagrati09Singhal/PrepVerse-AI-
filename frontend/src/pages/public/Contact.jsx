import React, { useState } from 'react'
import { Link } from '../../context/RouterContext'
import {
  MessageSquare,
  HelpCircle,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Server,
  Database,
  RefreshCw,
} from 'lucide-react'
import PublicNavbar from '../../components/public/PublicNavbar'
import PublicFooter from '../../components/public/PublicFooter'
import { API_BASE_URL } from '../../config/api'

const FAQS = [
  {
    question: 'Does PrepVerse AI require internet access or paid Gemini API keys?',
    answer: 'No. PrepVerse AI is built with an offline-first deterministic heuristic engine. It operates 100% locally with zero internet dependency and zero external API keys. If you optionally configure a Gemini API key in backend/.env, the system seamlessly uses it, but gracefully falls back to the deterministic engine whenever keys are absent.',
  },
  {
    question: 'Where is my uploaded resume and audio recorded data stored?',
    answer: 'Your resume is parsed in memory using PyMuPDF and strictly associated with your authenticated user UUID. Speech analytics are computed from browser-level speech tokens and recording duration without uploading raw audio files to third-party cloud servers.',
  },
  {
    question: 'What types of interview formats are supported?',
    answer: 'PrepVerse AI supports Technical Architecture (System Design & Code), Behavioral STAR Storytelling (evaluating Situation, Task, Action, Result), and Situational Incident Response.',
  },
  {
    question: 'How does the PDF interview report generation work?',
    answer: 'Upon completing an interview simulation, a server-side ReportLab document generator compiles your scores, STAR rubric metrics, speaking pace telemetry, and question feedback into an executive PDF report that can be downloaded instantly.',
  },
  {
    question: 'What is the Interview Readiness Index?',
    answer: 'The Interview Readiness Index is an empirical composite score (0–100%) weighted across four readiness pillars: Resume Intelligence, Technical Simulations, Behavioral STAR Performance, and Strategic Roadmap Velocity.',
  },
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Feedback & Inquiry',
    message: '',
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return
    setFormSubmitted(true)
  }

  const toggleFaq = (idx) => {
    setExpandedFaq(expandedFaq === idx ? -1 : idx)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#070A12] text-slate-900 dark:text-white transition-colors">
      <PublicNavbar />

      {/* Header */}
      <section className="pt-16 pb-12 border-b border-slate-200 dark:border-slate-800 bg-grid-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
            Support & Community
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            We are here to <span className="text-gradient-brand">help you succeed.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Have questions about how PrepVerse AI evaluates candidate answers or need assistance setting up local databases?
          </p>
        </div>
      </section>

      {/* Main Content Grid: Contact Form + FAQ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-violet" />
                  <span>Send a Note or Feedback</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Share feature requests, teacher demo feedback, or deployment questions.
                </p>
              </div>

              {formSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Note Received Locally</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Thank you, {formData.name}! Your message has been logged for this session.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false)
                      setFormData({ name: '', email: '', subject: 'Feedback', message: '' })
                    }}
                    className="text-xs font-bold text-brand-violet hover:underline pt-2 block mx-auto"
                  >
                    Send another note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Johnson"
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet transition"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex@example.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet transition"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-violet transition"
                    >
                      <option>General Feedback</option>
                      <option>Academic Demo Inquiry</option>
                      <option>Bug Report / Feature Request</option>
                      <option>Database Configuration Assistance</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Message</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we make PrepVerse AI better for your preparation?"
                      className="w-full p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-violet transition leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl text-xs font-bold bg-brand-violet hover:bg-brand-violet-dark text-white shadow-md shadow-brand-violet/20 transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Message</span>
                  </button>
                </form>
              )}
            </div>

            {/* Interactive FAQ Accordion */}
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-brand-cyan" />
                  <span>Frequently Asked Questions</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Transparent details on how PrepVerse AI operates under the hood.
                </p>
              </div>

              <div className="space-y-3">
                {FAQS.map((faq, idx) => {
                  const isOpen = expandedFaq === idx
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1526] overflow-hidden transition"
                    >
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full p-4 text-left font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition"
                      >
                        <span>{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-brand-violet shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-950/40">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

