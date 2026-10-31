import React from 'react'

/**
 * PrepVerse AI Official Logo Component
 * Combines an abstract letter P, cosmic orbital arc, and forward-moving pathway.
 *
 * Variants:
 * - 'full': Symbol + PrepVerse AI Wordmark + optional Tagline
 * - 'compact': Symbol + PrepVerse AI Wordmark (inline)
 * - 'symbol': Symbol mark only
 */
export default function Logo({
  variant = 'full',
  size = 'md',
  theme = 'dark',
  showTagline = false,
  className = '',
}) {
  // Scale dimensions
  const symbolSizes = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 44, height: 44 },
    xl: { width: 56, height: 56 },
  }

  const textSizes = {
    sm: { title: 'text-base', tag: 'text-[9px]' },
    md: { title: 'text-lg', tag: 'text-[10px]' },
    lg: { title: 'text-xl', tag: 'text-xs' },
    xl: { title: 'text-2xl', tag: 'text-xs' },
  }

  const { width, height } = symbolSizes[size] || symbolSizes.md
  const textStyle = textSizes[size] || textSizes.md

  const isLight = theme === 'light'
  const textColor = isLight ? 'text-slate-900' : 'text-slate-900 dark:text-white'
  const tagColor = isLight ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'

  const SymbolSVG = (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 transition-transform duration-300 hover:scale-105"
      aria-label="PrepVerse AI Icon"
    >
      <defs>
        {/* Core Electric Violet Gradient */}
        <linearGradient id="pv-violet" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="60%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        {/* Radiant Cyan Gradient */}
        <linearGradient id="pv-cyan" x1="90" y1="20" x2="10" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Dynamic Forward Beam Gradient */}
        <linearGradient id="pv-beam" x1="20" y1="85" x2="60" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Ambient Glow Filter */}
        <filter id="pv-glow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Subtle Rounded Hexagon / Shield */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="22"
        fill="#0B132B"
        stroke="url(#pv-violet)"
        strokeWidth="2.5"
        strokeOpacity="0.5"
      />

      {/* Cosmic Orbiting Ring (The "Verse") */}
      <ellipse
        cx="54"
        cy="44"
        rx="34"
        ry="18"
        transform="rotate(-25 54 44)"
        stroke="url(#pv-cyan)"
        strokeWidth="3.5"
        strokeDasharray="6 3"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Orbital Radiant Energy Node */}
      <circle cx="80" cy="32" r="4.5" fill="#38BDF8" filter="url(#pv-glow)" />

      {/* Vertical Ascending Stem of the Letter 'P' with Forward Arrow Notch */}
      <path
        d="M28 80V24C28 21.7909 29.7909 20 32 20H38C40.2091 20 42 21.7909 42 24V58L50 66L42 74V80C42 82.2091 40.2091 84 38 84H32C29.7909 84 28 82.2091 28 80Z"
        fill="url(#pv-beam)"
      />

      {/* Loop of the Letter 'P' — Modern Geometric Arc */}
      <path
        d="M38 20H56C68.1503 20 78 29.8497 78 42C78 54.1503 68.1503 64 56 64H38"
        stroke="url(#pv-violet)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner AI Precision Core Dot */}
      <circle cx="56" cy="42" r="5" fill="#38BDF8" />
    </svg>
  )

  if (variant === 'symbol') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{SymbolSVG}</div>
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {SymbolSVG}

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight ${textStyle.title} ${textColor}`}>
            Prep<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">Verse</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm">
            AI
          </span>
        </div>

        {showTagline && (
          <span className={`mt-1 font-medium tracking-normal ${textStyle.tag} ${tagColor}`}>
            Prepare Smarter. Practice Deeper. Become Interview-Ready.
          </span>
        )}
      </div>
    </div>
  )
}

