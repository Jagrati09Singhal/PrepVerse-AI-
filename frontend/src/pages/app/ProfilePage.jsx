import React, { useState, useEffect } from 'react'
import {
  User,
  Briefcase,
  Target,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Search,
  Building,
  GraduationCap,
  Layers,
  ChevronRight,
  Sliders,
  Check,
  AlertCircle,
  HelpCircle,
  X,
  Compass,
  BookOpen,
  Plus,
  Laptop,
  Code,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from '../../context/RouterContext'
import { ENDPOINTS } from '../../config/api'

// Comprehensive role library across diverse disciplines and campus hiring
const ROLE_CATEGORIES = [
  { id: 'all', label: 'All Popular' },
  { id: 'freshers', label: 'Freshers & Campus' },
  { id: 'software', label: 'Software & Web' },
  { id: 'data_ai', label: 'AI & Data Science' },
  { id: 'product_design', label: 'Product & Design' },
  { id: 'business_ops', label: 'Business & Ops' },
  { id: 'marketing_sales', label: 'Marketing & Sales' },
  { id: 'finance_hr', label: 'Finance & HR' },
]

// Detailed Academic Years
const ACADEMIC_YEARS = [
  {
    id: '1st_year',
    title: '1st Year (Freshman)',
    badge: 'Foundations',
    desc: 'Building basic programming logic, C/C++/Python, variables, loops & basic math.',
  },
  {
    id: '2nd_year',
    title: '2nd Year (Sophomore)',
    badge: 'Core DSA & OOP',
    desc: 'Data Structures (Arrays, Stacks, Queues, Linked Lists), OOP (Java/C++), and basic SQL.',
  },
  {
    id: '3rd_year',
    title: '3rd Year (Pre-Final Year)',
    badge: 'Placement Season',
    desc: 'Core semester subjects (DBMS, OS, CN), trees, graphs, internship tests & frameworks.',
  },
  {
    id: '4th_year',
    title: '4th Year (Final Year)',
    badge: 'Active Hiring',
    desc: 'Campus recruitment drives, System Design, Full-Stack architecture & capstone projects.',
  },
  {
    id: 'graduate',
    title: 'Recent Graduate / Pro',
    badge: 'Industry Ready',
    desc: 'Production codebase standards, scalable APIs, microservices & corporate interviews.',
  },
]

const COLLEGE_BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'AI & Data Science (AI/DS)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'BCA / MCA',
  'Mechanical / Civil Engineering',
]

const POPULAR_SUBJECTS = [
  'Operating Systems (OS)',
  'Database Management Systems (DBMS)',
  'Computer Networks (CN)',
  'Data Structures & Algorithms (DSA)',
  'Object-Oriented Programming (OOP)',
  'Full-Stack Web Development',
  'Cloud Computing & DevOps',
  'Software Engineering & Agile',
  'Machine Learning & AI',
  'Compiler Design & TOC',
]

const POPULAR_INTERESTS = [
  'Full-Stack Web (React / Node / Python)',
  'Backend Systems & Microservices',
  'Artificial Intelligence & GenAI',
  'Cloud Infrastructure & DevOps',
  'Data Analytics & SQL Engineering',
  'Mobile App Development (Flutter/React Native)',
  'Cybersecurity & Network Defense',
  'Competitive Programming & Advanced DSA',
]

const ROLE_SUGGESTIONS = [
  // Freshers & Campus
  { title: 'Software Engineer Fresher / Intern', category: 'freshers' },
  { title: 'Graduate Engineer Trainee (GET)', category: 'freshers' },
  { title: 'Junior Frontend Developer', category: 'freshers' },
  { title: 'Associate Software Engineer', category: 'freshers' },
  { title: 'Junior Data Analyst', category: 'freshers' },
  { title: 'Campus Placement Candidate', category: 'freshers' },

  // Software & Web
  { title: 'Full Stack Software Engineer', category: 'software' },
  { title: 'Frontend Developer (React / Next.js)', category: 'software' },
  { title: 'Backend Systems Engineer (Python / Node / Java)', category: 'software' },
  { title: 'DevOps & Cloud Engineer (AWS / Docker / K8s)', category: 'software' },
  { title: 'Mobile App Developer (Flutter / React Native)', category: 'software' },
  { title: 'QA & Automation Test Engineer (SDET)', category: 'software' },
  { title: 'Cybersecurity & InfoSec Analyst', category: 'software' },
  { title: 'Golang Systems Engineer', category: 'software' },

  // AI & Data
  { title: 'Data Analyst (SQL / Power BI / Tableau)', category: 'data_ai' },
  { title: 'Data Scientist (Machine Learning / Python)', category: 'data_ai' },
  { title: 'Machine Learning / AI Engineer', category: 'data_ai' },
  { title: 'AI Prompt & LLM Application Engineer', category: 'data_ai' },
  { title: 'Business Intelligence (BI) Developer', category: 'data_ai' },
  { title: 'Big Data & Pipeline Engineer', category: 'data_ai' },

  // Product & Design
  { title: 'Product Manager (PM)', category: 'product_design' },
  { title: 'Associate Product Manager (APM)', category: 'product_design' },
  { title: 'UI / UX Designer', category: 'product_design' },
  { title: 'Product Designer (Figma & Prototyping)', category: 'product_design' },
  { title: 'Technical Program Manager (TPM)', category: 'product_design' },
  { title: 'Scrum Master & Agile Coach', category: 'product_design' },

  // Business & Operations
  { title: 'Business Analyst (BA)', category: 'business_ops' },
  { title: 'Operations Manager', category: 'business_ops' },
  { title: 'Project Coordinator / Manager', category: 'business_ops' },
  { title: 'Management Trainee', category: 'business_ops' },
  { title: 'Strategy & Management Consultant', category: 'business_ops' },

  // Marketing & Sales
  { title: 'Digital Marketing & Growth Lead', category: 'marketing_sales' },
  { title: 'Performance Marketer / SEO Specialist', category: 'marketing_sales' },
  { title: 'Business Development Executive (BDE)', category: 'marketing_sales' },
  { title: 'Account Executive / SaaS Sales Rep', category: 'marketing_sales' },
  { title: 'Content & Social Media Strategist', category: 'marketing_sales' },

  // Finance & HR
  { title: 'Financial Analyst (FP&A / Valuation)', category: 'finance_hr' },
  { title: 'HR Specialist / Talent Acquisition', category: 'finance_hr' },
  { title: 'Chartered Accountant / Auditor', category: 'finance_hr' },
  { title: 'Investment Banking Analyst', category: 'finance_hr' },
]

const SENIORITY_LEVELS = [
  {
    id: 'fresher',
    label: 'Student / Fresher / Intern (0–1 yrs)',
    badge: 'Campus & Early',
    desc: 'Focus on core programming fundamentals, academic projects, basic problem solving & behavioral storytelling.',
  },
  {
    id: 'junior',
    label: 'Early Career / Junior (1–3 yrs)',
    badge: '1-3 Years',
    desc: 'Emphasis on production code quality, debugging, practical framework usage & feature delivery experience.',
  },
  {
    id: 'mid',
    label: 'Mid-Level Professional (3–5 yrs)',
    badge: '3-5 Years',
    desc: 'System design fundamentals, clean code patterns, automated testing & structured STAR behavioral examples.',
  },
  {
    id: 'senior',
    label: 'Senior Specialist / Lead (5–8 yrs)',
    badge: '5-8 Years',
    desc: 'Distributed systems, performance scaling, technical tradeoffs & mentorship/cross-functional collaboration.',
  },
  {
    id: 'staff',
    label: 'Staff / Principal / Manager (8+ yrs)',
    badge: '8+ Years',
    desc: 'High-scale resiliency, long-term technical vision, organizational influence & executive leadership.',
  },
]

const TARGET_COMPANIES = [
  'Top Product & Big Tech (FAANG / Tier-1)',
  'High-Growth Startups & Unicorns',
  'IT Services & Consultancies (TCS, Infosys, Accenture)',
  'FinTech & Banking Institutions',
  'Remote Global Tech Teams',
]

export default function ProfilePage({ isFirstTime = false }) {
  const { user, authFetch } = useAuth()
  const { navigate } = useRouter()

  // Form State
  const [targetRole, setTargetRole] = useState('')
  const [roleCategory, setRoleCategory] = useState('all')
  const [roleSearchFilter, setRoleSearchFilter] = useState('')
  const [seniority, setSeniority] = useState('fresher')
  const [timelineWeeks, setTimelineWeeks] = useState(4)
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(30)
  const [targetCompany, setTargetCompany] = useState('High-Growth Startups & Unicorns')
  const [customCompany, setCustomCompany] = useState('')

  // Academic Standing & College Studies
  const [academicYear, setAcademicYear] = useState('3rd_year')
  const [branch, setBranch] = useState('Computer Science & Engineering (CSE)')
  const [customBranch, setCustomBranch] = useState('')
  const [ongoingSubjects, setOngoingSubjects] = useState([
    'Operating Systems (OS)',
    'Database Management Systems (DBMS)',
    'Data Structures & Algorithms (DSA)',
  ])
  const [customSubjectInput, setCustomSubjectInput] = useState('')
  const [coreInterests, setCoreInterests] = useState([
    'Full-Stack Web (React / Node / Python)',
    'Backend Systems & Microservices',
  ])
  const [customInterestInput, setCustomInterestInput] = useState('')

  // UI status
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  // Fetch existing plan on load to pre-populate current candidate settings
  useEffect(() => {
    let isMounted = true

    async function loadCurrentPlan() {
      try {
        const res = await authFetch(ENDPOINTS.ROADMAP_PLAN)
        if (res.ok) {
          const plan = await res.json()
          if (isMounted && plan) {
            if (plan.target_role) setTargetRole(plan.target_role)
            if (plan.daily_prep_minutes) setDailyGoalMinutes(plan.daily_prep_minutes)
            if (plan.academic_year) setAcademicYear(plan.academic_year)
            if (plan.branch) {
              if (COLLEGE_BRANCHES.includes(plan.branch)) {
                setBranch(plan.branch)
              } else {
                setCustomBranch(plan.branch)
              }
            }
            if (plan.ongoing_subjects) {
              const list = plan.ongoing_subjects.split(',').map((s) => s.trim()).filter(Boolean)
              if (list.length > 0) setOngoingSubjects(list)
            }
            if (plan.core_interests) {
              const list = plan.core_interests.split(',').map((s) => s.trim()).filter(Boolean)
              if (list.length > 0) setCoreInterests(list)
            }
            if (plan.target_interview_date) {
              const diffMs = new Date(plan.target_interview_date) - new Date()
              const diffWeeks = Math.max(1, Math.round(diffMs / (7 * 24 * 60 * 60 * 1000)))
              if ([2, 4, 8].includes(diffWeeks)) {
                setTimelineWeeks(diffWeeks)
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not load existing plan, using defaults:', err)
      } finally {
        if (isMounted) setLoadingInitial(false)
      }
    }

    loadCurrentPlan()
    return () => {
      isMounted = false
    }
  }, [authFetch])

  // Filtered role chips
  const filteredRoles = ROLE_SUGGESTIONS.filter((item) => {
    const matchesCategory = roleCategory === 'all' || item.category === roleCategory
    const matchesSearch =
      !roleSearchFilter.trim() ||
      item.title.toLowerCase().includes(roleSearchFilter.toLowerCase().trim())
    return matchesCategory && matchesSearch
  })

  const handleSelectRole = (title) => {
    setTargetRole(title)
  }

  const toggleSubject = (subj) => {
    setOngoingSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]
    )
  }

  const handleAddCustomSubject = (e) => {
    if (e) e.preventDefault()
    const trimmed = customSubjectInput.trim()
    if (trimmed && !ongoingSubjects.includes(trimmed)) {
      setOngoingSubjects((prev) => [...prev, trimmed])
      setCustomSubjectInput('')
    }
  }

  const toggleInterest = (interest) => {
    setCoreInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const handleAddCustomInterest = (e) => {
    if (e) e.preventDefault()
    const trimmed = customInterestInput.trim()
    if (trimmed && !coreInterests.includes(trimmed)) {
      setCoreInterests((prev) => [...prev, trimmed])
      setCustomInterestInput('')
    }
  }

  const handleSaveProfile = async () => {
    const roleToSave = targetRole.trim() || 'Software Engineer'
    const finalBranch = customBranch.trim() || branch
    setSaving(true)
    setErrorMessage(null)

    try {
      const targetInterviewDate = new Date(
        Date.now() + timelineWeeks * 7 * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0]

      const response = await authFetch(ENDPOINTS.ROADMAP_PLAN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: roleToSave,
          target_interview_date: targetInterviewDate,
          daily_prep_minutes: dailyGoalMinutes,
          academic_year: academicYear,
          branch: finalBranch,
          ongoing_subjects: ongoingSubjects.join(', '),
          core_interests: coreInterests.join(', '),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Could not save profile settings.')
      }

      // Save local preferences
      localStorage.setItem('prepverse_target_role', roleToSave)
      localStorage.setItem('prepverse_seniority', seniority)
      localStorage.setItem('prepverse_target_company', customCompany.trim() || targetCompany)
      localStorage.setItem('prepverse_academic_year', academicYear)
      localStorage.setItem('prepverse_branch', finalBranch)
      localStorage.setItem('prepverse_ongoing_subjects', JSON.stringify(ongoingSubjects))
      localStorage.setItem('prepverse_core_interests', JSON.stringify(coreInterests))

      setSavedSuccess(true)
      setTimeout(() => {
        navigate('/app/dashboard', { replace: true })
      }, 700)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const candidateInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'PV'

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        {/* Top Greeting Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-brand-violet/15 via-brand-cyan/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-violet via-brand-cyan to-brand-pink flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-xl shadow-brand-violet/20 shrink-0">
                {candidateInitials}
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-violet/10 text-brand-violet dark:text-brand-cyan">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Personalized Candidate Profile</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Welcome, {user?.name || 'Candidate'}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                  Set your exact target role, career level, and preparation goals. PrepVerse AI tailors every mock simulation, speech evaluation, and adaptive question to match your exact selection.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex sm:flex-col gap-2">
              <button
                onClick={() => navigate('/app/dashboard')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
              >
                Skip to Dashboard &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: Target Career Role (Roles Mere According - Unlimited!) */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand-violet/10 text-brand-violet flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Your Target Career Role
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-8">
                Type <strong className="text-slate-800 dark:text-slate-200">ANY role you want</strong>, or pick from popular career paths below. No limitations!
              </p>
            </div>

            {targetRole && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 self-start sm:self-auto">
                <Check className="w-3.5 h-3.5" />
                Active Target: {targetRole}
              </span>
            )}
          </div>

          {/* Primary Custom Role Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Enter or customize your exact role title:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Briefcase className="w-5 h-5 text-brand-violet" />
              </div>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Developer, Data Analyst, Flutter Specialist, BCA Fresher, Product Manager..."
                className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-brand-violet transition"
              />
              {targetRole && (
                <button
                  onClick={() => setTargetRole('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
              <span>You can type any specific stack or domain: e.g. "React + Node Developer", "Cybersecurity Specialist", "Financial Analyst", etc.</span>
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Or pick from popular roles by domain:
              </span>
              <div className="relative w-44 sm:w-56">
                <input
                  type="text"
                  value={roleSearchFilter}
                  onChange={(e) => setRoleSearchFilter(e.target.value)}
                  placeholder="Filter suggestions..."
                  className="w-full pl-7 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-violet"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5 pb-2">
              {ROLE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setRoleCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    roleCategory === cat.id
                      ? 'bg-brand-violet text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Filtered role clickable chips */}
            <div className="flex flex-wrap gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
              {filteredRoles.map((item) => {
                const isSelected = targetRole.trim().toLowerCase() === item.title.toLowerCase()
                return (
                  <button
                    key={item.title}
                    onClick={() => handleSelectRole(item.title)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-brand-violet/15 border-brand-violet text-brand-violet dark:text-brand-cyan shadow-sm font-bold'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-violet/40 hover:text-brand-violet dark:hover:text-white'
                    }`}
                  >
                    <span>{item.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-violet dark:text-brand-cyan" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Section 2: College Academic Journey & Ongoing Studies ("Know You Better") */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-8">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-cyan/15 text-brand-cyan flex items-center justify-center text-xs font-bold">
                2
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-brand-cyan" />
                <span>College Standing, Branch & Ongoing Subjects</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-8">
              Tell us what year you are in, your engineering branch, and the subjects you are studying right now. PrepVerse AI tailors mock questions to your semester level so you practice effectively without burnout.
            </p>
          </div>

          {/* Sub-section A: Studying Year / Academic Year */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Which college year are you studying in?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ACADEMIC_YEARS.map((yr) => {
                const isSelected = academicYear === yr.id
                return (
                  <div
                    key={yr.id}
                    onClick={() => setAcademicYear(yr.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-brand-violet/10 border-brand-violet ring-1 ring-brand-violet/30 text-slate-900 dark:text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {yr.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {yr.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {yr.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold text-brand-violet dark:text-brand-cyan">
                        {isSelected ? '✓ Selected' : 'Click to select'}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-brand-violet bg-brand-violet text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sub-section B: College Branch / Department */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Your Branch / Academic Department:
            </label>
            <div className="flex flex-wrap gap-2">
              {COLLEGE_BRANCHES.map((b) => {
                const isSelected = branch === b && !customBranch
                return (
                  <button
                    key={b}
                    onClick={() => {
                      setBranch(b)
                      setCustomBranch('')
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-brand-cyan/15 border-brand-cyan text-brand-cyan dark:text-brand-cyan font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span>{b}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-cyan" />}
                  </button>
                )
              })}
            </div>

            <div className="pt-2">
              <input
                type="text"
                value={customBranch}
                onChange={(e) => {
                  setCustomBranch(e.target.value)
                  if (e.target.value) setBranch('')
                }}
                placeholder="Or type custom branch / degree: e.g. Mechatronics, Biotechnology, Data Science B.Sc..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-cyan"
              />
            </div>
          </div>

          {/* Sub-section C: Ongoing Semester Subjects */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Ongoing Semester Subjects (What are you studying right now?):
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your current subjects so your practice simulations test questions relevant to your semester exams & interviews.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-violet/10 text-brand-violet dark:text-brand-cyan border border-brand-violet/20 shrink-0">
                {ongoingSubjects.length} Selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {POPULAR_SUBJECTS.map((subj) => {
                const isSelected = ongoingSubjects.includes(subj)
                return (
                  <button
                    key={subj}
                    onClick={() => toggleSubject(subj)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-brand-violet/15 border-brand-violet text-brand-violet dark:text-brand-cyan font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span>{subj}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-violet dark:text-brand-cyan" />}
                  </button>
                )
              })}
            </div>

            {/* Custom Subject Addition Form */}
            <form onSubmit={handleAddCustomSubject} className="flex gap-2 pt-2">
              <input
                type="text"
                value={customSubjectInput}
                onChange={(e) => setCustomSubjectInput(e.target.value)}
                placeholder="Add custom college subject: e.g. Cryptography, Compiler Design, Embedded Systems..."
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-violet"
              />
              <button
                type="submit"
                disabled={!customSubjectInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-violet text-white hover:opacity-90 disabled:opacity-50 transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
            </form>
          </div>

          {/* Sub-section D: Core Tech Interests */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Primary Tech Interests & Specializations:
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  What areas of engineering excite you the most?
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-pink/10 text-brand-pink border border-brand-pink/20 shrink-0">
                {coreInterests.length} Selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {POPULAR_INTERESTS.map((interest) => {
                const isSelected = coreInterests.includes(interest)
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-brand-pink/15 border-brand-pink text-brand-pink dark:text-pink-300 font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span>{interest}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-pink dark:text-pink-300" />}
                  </button>
                )
              })}
            </div>

            {/* Custom Interest Addition Form */}
            <form onSubmit={handleAddCustomInterest} className="flex gap-2 pt-2">
              <input
                type="text"
                value={customInterestInput}
                onChange={(e) => setCustomInterestInput(e.target.value)}
                placeholder="Add other tech interest: e.g. Quantum Computing, Blockchain, Game Engine Dev..."
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-pink"
              />
              <button
                type="submit"
                disabled={!customInterestInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-pink text-white hover:opacity-90 disabled:opacity-50 transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Interest</span>
              </button>
            </form>
          </div>

          {/* Sub-section E: AI Adaptive Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-violet/10 via-brand-cyan/10 to-brand-pink/10 border border-brand-cyan/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                🎓 Candidate Academic Profile Active: {ACADEMIC_YEARS.find((y) => y.id === academicYear)?.title} &bull; {customBranch.trim() || branch}
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Ongoing Subjects: <strong className="text-slate-800 dark:text-slate-200">{ongoingSubjects.join(', ') || 'General Foundations'}</strong>. 
                PrepVerse AI will calibrate your mock questions to test your semester subjects, ensuring you are thoroughly prepared for campus placement drives!
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Seniority & Experience Level (Spacious, Uncongested Cards) */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-cyan/15 text-brand-cyan flex items-center justify-center text-xs font-bold">
                3
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Experience Tier & Seniority
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-8">
              Calibrates simulation depth, system design complexity, and STAR behavioral rubrics.
            </p>
          </div>

          <div className="space-y-3">
            {SENIORITY_LEVELS.map((tier) => {
              const isSelected = seniority === tier.id
              return (
                <div
                  key={tier.id}
                  onClick={() => setSeniority(tier.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-brand-cyan/10 border-brand-cyan ring-1 ring-brand-cyan/30 text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {tier.label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {tier.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {tier.desc}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-brand-cyan bg-brand-cyan text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 4: Target Prep Timeline & Daily Velocity */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-pink/15 text-brand-pink flex items-center justify-center text-xs font-bold">
                4
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Preparation Velocity & Timeline
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-8">
              We structure your preparation curriculum and daily practice goals around your target interview loop date.
            </p>
          </div>

          {/* Timeline Sprint Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              When is your target interview?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { weeks: 2, label: 'Fast Sprint', time: '2 Weeks' },
                { weeks: 4, label: 'Standard Prep', time: '4 Weeks' },
                { weeks: 8, label: 'Deep Prep', time: '8 Weeks' },
                { weeks: 12, label: 'Continuous', time: 'Flexible' },
              ].map((t) => (
                <button
                  key={t.weeks}
                  onClick={() => setTimelineWeeks(t.weeks)}
                  className={`p-4 rounded-2xl border text-center transition ${
                    timelineWeeks === t.weeks
                      ? 'bg-brand-violet/10 border-brand-violet text-brand-violet dark:text-brand-cyan ring-1 ring-brand-violet/30 font-bold'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold block">{t.time}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Goal Slider */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Daily Practice Target:
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Consistent practice builds natural interview fluency.
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono text-brand-violet dark:text-brand-cyan">
                  {dailyGoalMinutes} Mins / Day
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  (~{Math.round((dailyGoalMinutes * 7) / 60)} hrs / week)
                </span>
              </div>
            </div>

            <input
              type="range"
              min={15}
              max={90}
              step={15}
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
              className="w-full accent-brand-violet cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />

            <div className="grid grid-cols-4 text-center text-[11px] text-slate-500 dark:text-slate-400">
              <span className={dailyGoalMinutes === 15 ? 'font-bold text-brand-violet' : ''}>15m (Breezy)</span>
              <span className={dailyGoalMinutes === 30 ? 'font-bold text-brand-violet' : ''}>30m (Recommended)</span>
              <span className={dailyGoalMinutes === 60 ? 'font-bold text-brand-violet' : ''}>60m (Focused)</span>
              <span className={dailyGoalMinutes === 90 ? 'font-bold text-brand-violet' : ''}>90m (Intensive)</span>
            </div>
          </div>

          {/* Target Company / Sector preference (Optional) */}
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Dream Company or Sector (Optional):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TARGET_COMPANIES.map((company) => (
                <button
                  key={company}
                  onClick={() => {
                    setTargetCompany(company)
                    setCustomCompany('')
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    targetCompany === company && !customCompany
                      ? 'bg-brand-violet/10 border-brand-violet text-brand-violet dark:text-white font-bold'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {company}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <input
                type="text"
                value={customCompany}
                onChange={(e) => {
                  setCustomCompany(e.target.value)
                  if (e.target.value) setTargetCompany('')
                }}
                placeholder="Or type specific company: e.g. Google, Swiggy, TCS, Microsoft, Razorpay..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-violet"
              />
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bottom Live Summary & Primary Action Buttons */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-violet/10 via-brand-cyan/10 to-brand-pink/10 border border-brand-violet/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Configured Target Profile
            </span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {targetRole.trim() || 'Software Engineer'} &bull;{' '}
              <span className="text-brand-violet dark:text-brand-cyan font-normal">
                {ACADEMIC_YEARS.find((y) => y.id === academicYear)?.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {customBranch.trim() || branch} &bull; {ongoingSubjects.length} Active Subjects &bull; {dailyGoalMinutes}m daily goal
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800 transition"
            >
              Skip to Dashboard
            </button>

            <button
              onClick={handleSaveProfile}
              disabled={saving || savedSuccess}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand-violet to-brand-cyan hover:opacity-95 text-white shadow-xl shadow-brand-violet/25 hover:shadow-brand-violet/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Configuring Profile...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile Saved! Launching...</span>
                </>
              ) : (
                <>
                  <span>Save Profile & Launch PrepVerse</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
