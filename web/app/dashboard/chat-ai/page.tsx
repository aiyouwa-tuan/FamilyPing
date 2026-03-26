'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User } from '@/lib/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickChips = [
  'How was Mom this week?',
  'Sleep patterns?',
  'Mood trend?',
  'Any health concerns?',
  'Activity summary',
]

export default function ChatAIPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [chatMessages])

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth/login'); return }

    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).limit(1).single()
    if (!userData) { setLoading(false); return }
    setCurrentUser(userData)

    // Add welcome message
    setChatMessages([{
      role: 'assistant',
      content: 'Hi! I\'m your FamilyPing AI assistant. Ask me anything about your family\'s wellbeing, health trends, or mood patterns.',
      timestamp: new Date(),
    }])

    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchData() }, [fetchData])

  async function sendMessage(message: string) {
    if (!message.trim() || !currentUser || chatLoading) return

    const userMsg: ChatMessage = { role: 'user', content: message.trim(), timestamp: new Date() }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('query-ai', {
        body: {
          message: userMsg.content,
          family_id: currentUser.family_id,
          user_id: currentUser.id,
        },
      })

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: error
          ? 'Sorry, I could not process your request right now. Please try again later.'
          : data?.response || 'No response received.',
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, assistantMsg])
    } catch {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, the AI service is not available right now. Please try again later.', timestamp: new Date() },
      ])
    }

    setChatLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(chatInput)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading AI chat...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard/insights" className="text-gray-400 hover:text-gray-600">{'\u2190'}</Link>
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#ff8a5c] flex items-center justify-center text-white font-bold">
          AI
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">FamilyPing AI</h1>
          <p className="text-xs text-gray-500">Ask about your family&apos;s wellbeing</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#FF6B35] text-white rounded-br-md'
                : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
            }`}>
              {msg.content}
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Chips */}
      {chatMessages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickChips.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="bg-white border border-gray-200 text-sm text-gray-700 px-3 py-2 rounded-full hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about your family..."
            className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm text-gray-900"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="bg-[#FF6B35] text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#e55a2b] transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  )
}
