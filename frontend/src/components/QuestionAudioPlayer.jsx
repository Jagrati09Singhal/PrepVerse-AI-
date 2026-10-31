import React, { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, RotateCcw, Play, Pause, AlertCircle } from 'lucide-react'

export default function QuestionAudioPlayer({ text, questionText, autoPlay = false }) {
  const content = text || questionText || ''
  const [isSupported, setIsSupported] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const utteranceRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)
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

  const handlePlay = () => {
    if (!isSupported || !content || isMuted) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = 0.95 // Natural conversational pace
    utterance.pitch = 1.0

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

  if (!isSupported) {
    return (
      <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <VolumeX className="w-3.5 h-3.5" />
        <span>Audio playback unsupported in this browser</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {!isPlaying ? (
        <button
          type="button"
          onClick={handlePlay}
          disabled={isMuted}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-brand-violet dark:text-brand-cyan border border-slate-300 dark:border-slate-700 transition disabled:opacity-40 shadow-sm"
          title="Listen to question spoken aloud"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Listen to Question</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePauseOrStop}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 transition shadow-sm"
          title="Stop reading aloud"
        >
          <Pause className="w-3.5 h-3.5" />
          <span>Stop Audio</span>
        </button>
      )}

      <button
        type="button"
        onClick={handleReplay}
        disabled={isMuted}
        className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition disabled:opacity-40 shadow-sm"
        title="Replay from start"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={toggleMute}
        className={`p-1.5 rounded-xl border transition shadow-sm ${isMuted
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
