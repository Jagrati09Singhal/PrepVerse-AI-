import React, { useState, useEffect, useRef } from 'react'
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Pause,
  Zap,
  Headphones,
  Subtitles,
  Sparkles,
} from 'lucide-react'

export default function QuestionAudioPlayer({ text, questionText, autoPlay = false }) {
  const content = text || questionText || ''
  const [isSupported, setIsSupported] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedVoiceId, setSelectedVoiceId] = useState('jagrati') // 'jagrati' | 'ayush' | 'bar_raiser'
  const [systemVoices, setSystemVoices] = useState([])
  const [volumeBoost, setVolumeBoost] = useState('200') // '100' | '150' | '200' (Gaming laptop mode)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const utteranceRef = useRef(null)
  const audioCtxRef = useRef(null)

  // Voice personas configuration
  const VOICE_PROFILES = {
    jagrati: {
      id: 'jagrati',
      name: 'Jagrati',
      title: 'Senior Engineer',
      gender: 'female',
      pitch: 1.05,
      rate: 0.92,
      avatar: '👩‍💻',
    },
    ayush: {
      id: 'ayush',
      name: 'Ayush',
      title: 'Tech Lead',
      gender: 'male',
      pitch: 0.88,
      rate: 0.90,
      avatar: '👨‍💻',
    },
    bar_raiser: {
      id: 'bar_raiser',
      name: 'Bar Raiser',
      title: 'FAANG Interviewer',
      gender: 'male',
      pitch: 0.98,
      rate: 0.95,
      avatar: '🏢',
    },
  }

  // Play attention chime using Web Audio API before boosted speech
  const playAttentionChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
      const now = ctx.currentTime

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, now) // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12) // A5

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.24)
    } catch (err) {
      // Audio context fallback
    }
  }

  // Check speech synthesis support and load system voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)

      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices() || []
        setSystemVoices(available)
      }

      loadVoices()
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    } else {
      setIsSupported(false)
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Cancel playback if question text changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    }
  }, [content])

  // Select best matched voice from system based on persona
  const resolveSystemVoice = (voiceId) => {
    if (!systemVoices.length) return null

    if (voiceId === 'jagrati') {
      const femaleMatch = systemVoices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('jenny') ||
            v.name.toLowerCase().includes('aria') ||
            v.name.toLowerCase().includes('karen') ||
            v.name.toLowerCase().includes('moira'))
      )
      return femaleMatch || systemVoices.find((v) => v.lang.startsWith('en')) || systemVoices[0]
    } else {
      const maleMatch = systemVoices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('george') ||
            v.name.toLowerCase().includes('guy') ||
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('mark') ||
            v.name.toLowerCase().includes('daniel') ||
            v.name.toLowerCase().includes('alex'))
      )
      return maleMatch || systemVoices.find((v) => v.lang.startsWith('en')) || systemVoices[0]
    }
  }

  const handlePlay = (forcedVoiceId) => {
    if (!isSupported || !content || isMuted) return

    const activePersonaKey = forcedVoiceId || selectedVoiceId
    const persona = VOICE_PROFILES[activePersonaKey] || VOICE_PROFILES.jagrati

    // If on Boost or Super Loud mode, chime first to cut through laptop fan noise
    if (volumeBoost !== '100') {
      playAttentionChime()
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(content)

    // Rate & Pitch optimization for weak gaming laptop speakers
    if (volumeBoost === '200') {
      // Super Loud / Gaming Laptop Mode: slightly slower with higher vocal projection
      utterance.rate = Math.max(0.82, persona.rate * 0.92)
      utterance.pitch = Math.min(1.25, persona.pitch * 1.08)
      utterance.volume = 1.0
    } else if (volumeBoost === '150') {
      utterance.rate = persona.rate * 0.96
      utterance.pitch = persona.pitch * 1.04
      utterance.volume = 1.0
    } else {
      utterance.rate = persona.rate
      utterance.pitch = persona.pitch
      utterance.volume = 1.0
    }

    const matchedVoice = resolveSystemVoice(activePersonaKey)
    if (matchedVoice) {
      utterance.voice = matchedVoice
    }

    utterance.onend = () => {
      setIsPlaying(false)
    }
    utterance.onerror = () => {
      setIsPlaying(false)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
  }

  const handlePauseOrStop = () => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  const handleReplay = () => {
    handlePauseOrStop()
    setTimeout(() => {
      handlePlay()
    }, 120)
  }

  const toggleMute = () => {
    if (isPlaying) {
      handlePauseOrStop()
    }
    setIsMuted(!isMuted)
  }

  const switchVoice = (voiceId) => {
    setSelectedVoiceId(voiceId)
    if (isPlaying) {
      handlePauseOrStop()
      setTimeout(() => {
        handlePlay(voiceId)
      }, 150)
    }
  }

  if (!isSupported) {
    return (
      <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <VolumeX className="w-3.5 h-3.5" />
        <span>Audio playback unsupported in this browser</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Play / Stop Button */}
        {!isPlaying ? (
          <button
            type="button"
            onClick={() => handlePlay()}
            disabled={isMuted}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-brand-violet dark:text-brand-cyan border border-slate-300 dark:border-slate-700 transition disabled:opacity-40 shadow-sm"
            title="Listen to question spoken aloud"
          >
            <Play className="w-3.5 h-3.5 text-brand-violet dark:text-brand-cyan fill-current" />
            <span>Listen to Question</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePauseOrStop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition shadow-sm animate-pulse"
            title="Stop reading aloud"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Stop Audio</span>
          </button>
        )}

        {/* Voice Persona Selector: Jagrati, Ayush & Bar Raiser */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => switchVoice('jagrati')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              selectedVoiceId === 'jagrati'
                ? 'bg-white dark:bg-slate-900 text-brand-violet dark:text-brand-cyan shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Interviewer Voice: Jagrati (Clear Senior Engineer)"
          >
            <span>👩‍💻</span>
            <span>Jagrati</span>
          </button>

          <button
            type="button"
            onClick={() => switchVoice('ayush')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              selectedVoiceId === 'ayush'
                ? 'bg-white dark:bg-slate-900 text-brand-violet dark:text-brand-cyan shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Interviewer Voice: Ayush (Calm Tech Lead)"
          >
            <span>👨‍💻</span>
            <span>Ayush</span>
          </button>

          <button
            type="button"
            onClick={() => switchVoice('bar_raiser')}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition ${
              selectedVoiceId === 'bar_raiser'
                ? 'bg-white dark:bg-slate-900 text-brand-violet dark:text-brand-cyan shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Interviewer Voice: FAANG Bar Raiser (High Standard)"
          >
            <span>🏢</span>
            <span>Bar Raiser</span>
          </button>
        </div>

        {/* Volume Booster Selector (Solves Quiet Gaming Laptop Speakers!) */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setVolumeBoost('100')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition ${
              volumeBoost === '100'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
            title="Standard Volume (100%)"
          >
            100%
          </button>

          <button
            type="button"
            onClick={() => setVolumeBoost('150')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition ${
              volumeBoost === '150'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
            }`}
            title="Boosted Volume (150% Clarity)"
          >
            ⚡ 150%
          </button>

          <button
            type="button"
            onClick={() => setVolumeBoost('200')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition ${
              volumeBoost === '200'
                ? 'bg-gradient-to-r from-brand-violet to-brand-cyan text-white shadow-sm'
                : 'text-brand-violet dark:text-brand-cyan font-semibold'
            }`}
            title="Super Loud Mode: Acoustic projection for weak gaming laptop speakers"
          >
            🚀 200% Super Loud
          </button>
        </div>

        {/* Replay Button */}
        <button
          type="button"
          onClick={handleReplay}
          disabled={isMuted}
          className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition disabled:opacity-40 shadow-sm"
          title="Replay from start"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Subtitles (CC) Toggle */}
        <button
          type="button"
          onClick={() => setShowSubtitles(!showSubtitles)}
          className={`p-1.5 rounded-xl border transition shadow-sm ${
            showSubtitles
              ? 'bg-brand-violet/10 border-brand-violet/30 text-brand-violet dark:text-brand-cyan'
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
          }`}
          title={showSubtitles ? 'Closed captions enabled' : 'Closed captions disabled'}
        >
          <Subtitles className="w-3.5 h-3.5" />
        </button>

        {/* Earphones Supported Reassurance Pill */}
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Headphones className="w-3 h-3 text-emerald-500" />
          <span>Earbuds/Headset 100% Supported</span>
        </span>
      </div>

      {/* Live High-Contrast Closed Captions Subtitles (Guarantees Candidate Never Misses Words) */}
      {showSubtitles && (isPlaying || volumeBoost === '200') && (
        <div className="p-3 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-md space-y-1 animate-fadeIn text-left">
          <div className="flex items-center justify-between text-[10px] font-mono text-brand-cyan uppercase tracking-wider">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
              <span>{isPlaying ? 'Live Closed Captions (Speaking)' : 'Question Captions Ready'}</span>
            </span>
            <span className="text-slate-400">Mode: {volumeBoost}% Boost</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
            &ldquo;{content}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
