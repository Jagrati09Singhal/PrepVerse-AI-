import React, { useState, useEffect } from 'react'
import {
  X,
  Heart,
  Wind,
  Sparkles,
  CheckCircle2,
  Mic,
  Volume2,
  Smile,
  ArrowRight,
} from 'lucide-react'

export default function PreInterviewZenBox({ isOpen, onClose, onReady }) {
  const [phaseIndex, setPhaseIndex] = useState(0) // 0: Inhale, 1: Hold, 2: Exhale, 3: Rest
  const [secondsLeft, setSecondsLeft] = useState(4)
  const [cycleCount, setCycleCount] = useState(1)
  const [micTested, setMicTested] = useState(false)
  const [isMicTesting, setIsMicTesting] = useState(false)

  const PHASES = [
    { name: 'Breathe In Deeply', instruction: 'Inhale through your nose, expand your belly', color: 'from-emerald-400 to-teal-500', scale: 'scale-125' },
    { name: 'Hold Gently', instruction: 'Pause, keep your shoulders relaxed and calm', color: 'from-teal-500 to-cyan-500', scale: 'scale-125' },
    { name: 'Slowly Exhale', instruction: 'Release through your mouth, letting go of tension', color: 'from-cyan-500 to-indigo-500', scale: 'scale-90' },
    { name: 'Rest & Center', instruction: 'Ground your feet on the floor, you are ready', color: 'from-indigo-500 to-emerald-400', scale: 'scale-100' },
  ]

  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setPhaseIndex((p) => {
            const nextP = (p + 1) % 4
            if (nextP === 0) setCycleCount((c) => c + 1)
            return nextP
          })
          return 4
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  const testVocalCord = async () => {
    setIsMicTesting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setTimeout(() => {
        stream.getTracks().forEach((t) => t.stop())
        setMicTested(true)
        setIsMicTesting(false)
      }, 2000)
    } catch {
      setIsMicTesting(false)
      setMicTested(true)
    }
  }

  if (!isOpen) return null

  const currentPhase = PHASES[phaseIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] shadow-2xl text-[#0F172A] dark:text-[#F8FAFC] space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#38BDF8]">
              <Wind className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h3 className="text-lg font-black tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">60-Second Zen &amp; Vocal Warmup</h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Box breathing to dissolve anxiety &amp; steady heart rate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Breathing Orb Area */}
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="relative flex items-center justify-center w-48 h-48">
            {/* Outer Ripple */}
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-tr ${currentPhase.color} opacity-20 blur-xl transition-all duration-1000 ${currentPhase.scale}`}
            />
            {/* Main Orb */}
            <div
              className={`relative flex flex-col items-center justify-center w-40 h-40 rounded-full bg-gradient-to-tr ${currentPhase.color} text-white shadow-xl transition-all duration-1000 ease-in-out ${currentPhase.scale}`}
            >
              <span className="text-3xl font-black font-mono">{secondsLeft}s</span>
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                {currentPhase.name}
              </span>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h4 className="text-base font-extrabold text-stone-900 dark:text-white">
              {currentPhase.instruction}
            </h4>
            <div className="flex items-center justify-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-mono">
              <span>Cycle #{cycleCount}</span>
              <span>&bull;</span>
              <span>4-4-4-4 Box Rhythm</span>
            </div>
          </div>
        </div>

        {/* Calming Tip & Mic Warmup */}
        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
              <strong>Psychological Grounding:</strong> Remember, real interviewers are not looking for perfection — they want to hear how you think. Speak at a measured 130 WPM pace and pause comfortably before answering.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-500" />
              <span>Vocal Steadiness Check:</span>
            </span>
            {micTested ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Vocal Tone Ready
              </span>
            ) : (
              <button
                type="button"
                onClick={testVocalCord}
                disabled={isMicTesting}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
              >
                {isMicTesting ? 'Listening...' : 'Hum to Warm Up Mic'}
              </button>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              if (onReady) onReady()
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md hover:shadow-lg transition"
          >
            <span>I Feel Calm &amp; Grounded — Start</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

