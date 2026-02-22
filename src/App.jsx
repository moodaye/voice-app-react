import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

function App() {
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [responseText, setResponseText] = useState('Click the button to enter voice mode.')
  const [errorMessage, setErrorMessage] = useState('')
  const [history, setHistory] = useState([])

  const recognitionRef = useRef(null)
  const isMountedRef = useRef(true)
  const voiceModeRef = useRef(false)
  const processingRef = useRef(false)
  const shouldAutoRestartRef = useRef(false)
  const manuallyStoppedRef = useRef(false)

  const startListening = () => {
    const recognition = recognitionRef.current
    if (!recognition) {
      setErrorMessage('Speech recognition is not initialized yet. Refresh and try again.')
      return false
    }

    try {
      manuallyStoppedRef.current = false
      recognition.start()
      return true
    } catch {
      setErrorMessage('Could not start microphone capture. Check browser mic permissions.')
      return false
    }
  }

  const speechRecognitionSupported = useMemo(() => {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  }, [])

  const speechSynthesisSupported = useMemo(() => {
    return Boolean(window.speechSynthesis)
  }, [])

  const micReady = speechRecognitionSupported

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    voiceModeRef.current = voiceModeEnabled
  }, [voiceModeEnabled])

  useEffect(() => {
    processingRef.current = isProcessing
  }, [isProcessing])

  const speak = (text) => {
    if (!speechSynthesisSupported || !text) {
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  const callBackend = async (query) => {
    const request = await fetch(`${API_BASE_URL}/api/voice-command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    if (!request.ok) {
      throw new Error('Backend request failed.')
    }

    const data = await request.json()
    return data.reply || 'I could not find a response.'
  }

  const processVoiceQuery = async (query) => {
    const normalized = query.trim()
    if (!normalized) {
      setErrorMessage('I could not understand that. Please try again.')
      return
    }

    setTranscript(normalized)
    setErrorMessage('')
    setIsProcessing(true)

    try {
      const reply = await callBackend(normalized)
      if (!isMountedRef.current) {
        return
      }
      setResponseText(reply)
      speak(reply)
      setHistory((existing) => [{ query: normalized, reply }, ...existing].slice(0, 6))
    } catch {
      if (!isMountedRef.current) {
        return
      }
      const fallback = 'I could not connect to the backend service. Please try again.'
      setErrorMessage(fallback)
      setResponseText(fallback)
      speak(fallback)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (!speechRecognitionSupported) {
      return undefined
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setErrorMessage('')
      setResponseText('Listening...')
    }

    recognition.onresult = async (event) => {
      shouldAutoRestartRef.current = false
      const spokenText = event.results?.[event.resultIndex]?.[0]?.transcript ?? ''
      await processVoiceQuery(spokenText)
    }

    recognition.onnomatch = () => {
      setErrorMessage('I could not understand that. Please try speaking again.')
      setResponseText('No match found. Click Enter Voice Mode and try again.')
    }

    recognition.onerror = (event) => {
      setIsListening(false)

      if (event?.error === 'no-speech') {
        shouldAutoRestartRef.current = true
        setErrorMessage('')
        setResponseText('No speech detected. Listening again...')
        return
      }

      if (event?.error === 'aborted' && manuallyStoppedRef.current) {
        setErrorMessage('')
        return
      }

      const reason = event?.error ? ` (${event.error})` : ''
      setErrorMessage(`Unable to capture voice right now${reason}. Please try again.`)
      setVoiceModeEnabled(false)
    }

    recognition.onend = () => {
      setIsListening(false)

      if (manuallyStoppedRef.current) {
        return
      }

      if (voiceModeRef.current && shouldAutoRestartRef.current && !processingRef.current) {
        shouldAutoRestartRef.current = false
        window.setTimeout(() => {
          startListening()
        }, 250)
        return
      }

      if (voiceModeRef.current) {
        setVoiceModeEnabled(false)
        if (!processingRef.current) {
          setResponseText('Voice mode finished. Click Enter Voice Mode to ask again.')
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [speechRecognitionSupported])

  const toggleVoiceMode = () => {
    setErrorMessage('')

    if (!voiceModeEnabled) {
      shouldAutoRestartRef.current = false
      const didStart = startListening()
      if (didStart) {
        setVoiceModeEnabled(true)
        setResponseText('Voice mode enabled. Listening for your request.')
      }
      return
    }

    manuallyStoppedRef.current = true
    shouldAutoRestartRef.current = false
    recognitionRef.current?.stop()
    setIsListening(false)
    setVoiceModeEnabled(false)
    setResponseText('Voice mode off. Click the button to start again.')
  }

  return (
    <main className="voice-app-shell">
      <section className="voice-card">
        <p className="badge">Voice Banking Assistant</p>
        <h1>Ask by voice</h1>
        <p className="subtitle">
          Example: &ldquo;What is my account balance?&rdquo;
        </p>

        <p className={`mic-indicator ${micReady ? 'ready' : 'blocked'}`}>
          {micReady ? 'Mic ready' : 'Mic unavailable in this browser'}
        </p>

        <button
          className={`voice-toggle ${voiceModeEnabled ? 'active' : ''}`}
          onClick={toggleVoiceMode}
          disabled={!speechRecognitionSupported}
        >
          {voiceModeEnabled ? 'Exit Voice Mode' : 'Enter Voice Mode'}
        </button>

        <div className="status-grid">
          <article>
            <h2>Status</h2>
            <p>{isListening ? 'Listening…' : isProcessing ? 'Processing…' : 'Idle'}</p>
          </article>
          <article>
            <h2>Last command</h2>
            <p>{transcript || 'No command yet.'}</p>
          </article>
        </div>

        <article className="response-box">
          <h2>Assistant response</h2>
          <p>{responseText}</p>
        </article>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        {!speechRecognitionSupported ? (
          <p className="warning-text">
            Your browser does not support speech recognition. Try Chrome or Edge.
          </p>
        ) : null}

        {!speechSynthesisSupported ? (
          <p className="warning-text">
            Voice playback is not available in this browser. Text responses still work.
          </p>
        ) : null}

        <section className="history">
          <h2>Recent interactions</h2>
          {history.length === 0 ? (
            <p>No interactions yet.</p>
          ) : (
            <ul>
              {history.map((item, index) => (
                <li key={`${item.query}-${index}`}>
                  <strong>You:</strong> {item.query}
                  <br />
                  <strong>Assistant:</strong> {item.reply}
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
