import React, { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, RotateCcw, Play, Pause } from 'lucide-react'

export default function QuestionAudioPlayer({ text, questionText, autoPlay = false }) {
  const content = text || questionText || ''
  const [isSupported, setIsSupported] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedVoiceId, setSelectedVoiceId] = useState('jagrati') // 'jagrati' or 'ayush'
  const [systemVoices, setSystemVoices] = useState([])
  const utteranceRef = useRef(null)

  // Voice personas configuration (Jagrati & Ayush)
  const VOICE_PROFILES = {
    jagrati: {
      id: 'jagrati',
      name: 'Jagrati',
      gender: 'female',
      pitch: 1.05,
      rate: 0.95,
      avatar: '👩‍💻',
    },
    ayush: {
      id: 'ayush',
      name: 'Ayush',
      gender: 'male',
      pitch: 0.86,
      rate: 0.92,
      avatar: '👨‍💻',
    },
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
      // Find female / natural voices
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
      // Find male / deeper voices
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

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = persona.rate
    utterance.pitch = persona.pitch

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
    }, 100)
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

      {/* Voice Persona Selector: Jagrati & Ayush */}
      <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => switchVoice('jagrati')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
            selectedVoiceId === 'jagrati'
              ? 'bg-white dark:bg-slate-900 text-brand-violet dark:text-brand-cyan shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title="Interviewer Voice: Jagrati"
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
          title="Interviewer Voice: Ayush"
        >
          <span>👨‍💻</span>
          <span>Ayush</span>
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

      {/* Mute Toggle */}
      <button
        type="button"
        onClick={toggleMute}
        className={`p-1.5 rounded-xl border transition shadow-sm ${
          isMuted
            ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300'
            : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
        title={isMuted ? 'Unmute question audio' : 'Mute question audio'}
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
