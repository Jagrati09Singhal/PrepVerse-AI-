import React, { useState, useEffect, useRef } from 'react'
import {
  Mic,
  Square,
  RotateCcw,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

export default function VoiceAnswerRecorder({
  transcript = '',
  onTranscriptChange,
  onTranscript,
  onDurationChange,
  onRecordingComplete,
  disabled = false,
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isSupported, setIsSupported] = useState(true)

  const timerRef = useRef(null)
  const recognitionRef = useRef(null)
  const startTimeRef = useRef(null)
  const elapsedRef = useRef(0)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
      setIsSupported(false)
    }
  }, [])

  // Timer updater during active recording
  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now() - elapsedRef.current * 1000
      timerRef.current = setInterval(() => {
        const delta = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsedSeconds(delta)
        elapsedRef.current = delta
        if (onDurationChange) {
          onDurationChange(delta)
        }
      }, 500)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording, onDurationChange])

  const startRecording = () => {
    setErrorMessage(null)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setErrorMessage(
        'Speech recognition API is not supported in this browser. You can still record and type answers manually.'
      )
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          }
        }
        if (finalTranscript.trim()) {
          const piece = finalTranscript.trim()
          if (onTranscriptChange) {
            onTranscriptChange(transcript ? `${transcript} ${piece}` : piece)
          }
          if (onTranscript) {
            onTranscript(piece)
          }
        }
      }

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in browser settings.')
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Audio capture error: ${event.error}`)
        }
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
    } catch (err) {
      setErrorMessage('Could not initialize microphone. Please check permissions and try again.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // ignore
      }
    }
    setIsRecording(false)
    const finalSecs = elapsedRef.current
    if (onRecordingComplete) {
      onRecordingComplete({ durationSeconds: finalSecs, transcript: transcript })
    }
  }

  const handleResetRecording = () => {
    stopRecording()
    setElapsedSeconds(0)
    elapsedRef.current = 0
    if (onDurationChange) onDurationChange(0)
    if (onTranscriptChange) onTranscriptChange('')
    if (onRecordingComplete) onRecordingComplete({ durationSeconds: 0, transcript: '' })
    setErrorMessage(null)
  }

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900 dark:text-white block">Voice Recording Unavailable</span>
          <span>Your browser does not support the Web Speech recognition API. You can continue seamlessly using text input mode.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Recording Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition disabled:opacity-40"
            >
              <Mic className="w-4 h-4" />
              <span>{elapsedSeconds > 0 ? 'Resume Speaking' : 'Start Speaking'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition animate-pulse"
            >
              <Square className="w-4 h-4" />
              <span>Stop Recording</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetRecording}
            disabled={isRecording || (!transcript && elapsedSeconds === 0)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition disabled:opacity-30"
            title="Clear and reset recording"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-3">
          {isRecording ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-500">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>Recording live audio...</span>
            </div>
          ) : elapsedSeconds > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Audio captured ({elapsedSeconds}s)</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">Microphone ready</span>
          )}

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
