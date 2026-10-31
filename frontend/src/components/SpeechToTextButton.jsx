import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, AlertCircle } from 'lucide-react'

export default function SpeechToTextButton({ onTranscript, disabled = false }) {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
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
          onTranscript(finalTranscript.trim())
        }
      }

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please check your browser permissions.')
        } else if (event.error !== 'no-speech') {
          // Normal timeout if user was silent
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`)
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // ignore
        }
      }
    }
  }, [onTranscript])

  const toggleListening = () => {
    if (!isSupported || disabled) return
    setErrorMessage(null)

    if (isListening) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // ignore
      }
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        setErrorMessage('Could not activate microphone. Please try again.')
        setIsListening(false)
      }
    }
  }

  if (!isSupported) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        <MicOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        <span>Speech-to-text unsupported in this browser</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition shadow-sm ${isListening
            ? 'bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 animate-pulse'
            : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isListening ? 'Click to stop listening' : 'Click to dictate your answer'}
      >
        {isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <Mic className="w-3.5 h-3.5 text-rose-500" />
            <span>Listening... (Click to stop)</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-brand-violet dark:text-brand-cyan" />
            <span>Voice Dictation</span>
          </>
        )}
      </button>

      {errorMessage && (
        <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
