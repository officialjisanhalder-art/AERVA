'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppNavbar } from '@/components/app/AppNavbar'
import { useEmergencyState } from '@/lib/demo-state'
import { MOCK_HOSPITALS } from '@/lib/demo-data'
import { Send, Mic, Play, Phone, ArrowLeft, Square } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const QUICK_MESSAGES = [
  'I am on the way',
  'I have reached',
  'Please call me',
  'Location updated',
]

export default function PatientMessagePage() {
  const router = useRouter()
  const { state, addMessage } = useEmergencyState()
  const messages = state.messages

  const [inputText, setInputText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Voice recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const now = () =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendText = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    addMessage({ sender: 'patient', text: trimmed, time: now() })
    setInputText('')
  }

  const handleQuickMessage = (text: string) => {
    addMessage({ sender: 'patient', text, time: now() })
  }

  const handleSend = () => sendText(inputText)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend()
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        const duration = recordSeconds;
        reader.onloadend = () => {
          const base64Url = (reader.result as string) || "";
          addMessage({
            sender: 'patient',
            text: 'Voice note from Patient',
            time: now(),
            isVoice: true,
            voiceDataUrl: base64Url,
            voiceDuration: duration,
          });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
        setRecordSeconds(0);
        setIsRecording(false);
      };

      recorder.start()
      setIsRecording(true)
      setRecordSeconds(0)
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } catch {
      alert('Microphone access is required to send a voice message.')
    }
  }

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current)
      recordTimerRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Hospital name from mock hospitals or default
  const hospitalObj = MOCK_HOSPITALS.find((h) => h.id === state.hospitalId)
  const hospitalName = hospitalObj ? hospitalObj.name : 'Hospital Staff'

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 h-16">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-1">
            <Image
              src="/nearer-mark.png"
              alt="NearER"
              width={28}
              height={18}
              className="h-6 w-auto object-contain"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[#050B18] text-base leading-tight truncate">
              {hospitalName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {state.caseId && (
                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {state.caseId}
                </span>
              )}
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Emergency Active
              </span>
            </div>
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#0052FF]">
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-[72px] pb-[160px] px-4 bg-white"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm font-semibold text-gray-400">No messages yet</p>
            <p className="text-xs text-gray-300 mt-1">Use quick messages below to communicate</p>
          </div>
        )}

        <div className="space-y-2 py-4">
          {messages.map((msg) => {
            const isPatient = msg.sender === 'patient'
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isPatient ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                    isPatient
                      ? 'bg-[#0052FF] text-white rounded-br-sm'
                      : 'bg-white border border-gray-100 text-[#050B18] rounded-bl-sm'
                  }`}
                >
                  {msg.isVoice ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const speakFallback = () => {
                            if (typeof window !== "undefined" && window.speechSynthesis) {
                              window.speechSynthesis.cancel();
                              const text = msg.text || `Voice message received from ${msg.sender === 'patient' ? 'patient' : 'hospital desk'}`;
                              window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
                            }
                          };

                          if (msg.voiceDataUrl) {
                            try {
                              const audio = new Audio(msg.voiceDataUrl);
                              audio.onerror = speakFallback;
                              audio.play().catch(speakFallback);
                            } catch {
                              speakFallback();
                            }
                          } else {
                            speakFallback();
                          }
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isPatient ? 'bg-white/20 hover:bg-white/30' : 'bg-[#0052FF]/10 hover:bg-[#0052FF]/20'
                        } transition-colors`}
                      >
                        <Play
                          className={`w-4 h-4 fill-current ml-0.5 ${isPatient ? 'text-white' : 'text-[#0052FF]'}`}
                        />
                      </button>
                      <span className={`text-sm font-semibold ${isPatient ? 'text-white' : 'text-[#050B18]'}`}>
                        ▶ {formatDuration(msg.voiceDuration ?? 0)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}
                  <p
                    className={`text-[10px] mt-1 text-right ${
                      isPatient ? 'text-white/60' : 'text-gray-400'
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Bottom bar: Quick messages + Input */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#F8FAFC] border-t border-gray-100">
        {/* Quick message chips */}
        <div className="flex gap-2 px-4 pt-3 pb-1 overflow-x-auto scrollbar-none">
          {QUICK_MESSAGES.map((msg) => (
            <button
              key={msg}
              onClick={() => handleQuickMessage(msg)}
              className="flex-shrink-0 text-xs font-semibold border border-[#0052FF]/30 text-[#0052FF] bg-[#0052FF]/5 px-3 py-1.5 rounded-full hover:bg-[#0052FF]/10 transition-colors whitespace-nowrap"
            >
              {msg}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="flex-1 bg-transparent text-sm text-[#050B18] placeholder-gray-400 focus:outline-none"
            />
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() && !isRecording}
            className="w-10 h-10 rounded-full bg-[#0052FF] flex items-center justify-center text-white shadow-md hover:bg-blue-600 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>

          {/* Mic / Stop */}
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md animate-pulse hover:bg-red-600 transition-colors flex-shrink-0"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 px-6 pb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-500">
              Recording {formatDuration(recordSeconds)} — tap ■ to send
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
