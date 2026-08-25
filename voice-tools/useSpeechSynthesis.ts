import { useCallback, useEffect, useState } from 'react'

function canSpeak() {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof SpeechSynthesisUtterance !== 'undefined'
}

function friendlySpeechError(error: string) {
  if (error === 'not-allowed') return 'Text-to-speech is blocked by this browser or device.'
  if (error === 'audio-busy') return 'Audio is busy. Stop other playback and try again.'
  if (error === 'audio-hardware') return 'No audio output is available.'
  if (error === 'language-unavailable' || error === 'voice-unavailable') return 'A matching speech voice is not available on this device.'
  return `Read aloud stopped (${error}).`
}

export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const available = canSpeak()
    setSupported(available)
    return () => {
      if (available) window.speechSynthesis.cancel()
    }
  }, [])

  const stop = useCallback(() => {
    if (!canSpeak()) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback((text: string) => {
    const value = text.trim()
    if (!value) {
      setError('Type or dictate something before using read aloud.')
      return false
    }
    if (!canSpeak()) {
      setError('Text-to-speech is not available in this browser.')
      return false
    }

    window.speechSynthesis.cancel()
    setError('')

    const utterance = new SpeechSynthesisUtterance(value)
    utterance.lang = navigator.language || 'en-US'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = (event) => {
      setSpeaking(false)
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setError(friendlySpeechError(event.error))
      }
    }

    window.speechSynthesis.speak(utterance)
    return true
  }, [])

  const reset = useCallback(() => setError(''), [])

  return { supported, speaking, error, speak, stop, reset }
}
