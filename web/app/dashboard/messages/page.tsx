'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User, Message } from '@/lib/types'

type Tab = 'all' | 'family_chat'

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [newMessage, setNewMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [familyUsers, setFamilyUsers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = useCallback(async (user: User, tab: Tab) => {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('family_id', user.family_id)
      .order('created_at', { ascending: true })
      .limit(50)

    if (tab === 'family_chat') {
      query = query.eq('channel', 'family_chat')
    }

    const { data } = await query
    if (data) setMessages(data)
  }, [supabase])

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth/login'); return }

    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).limit(1).single()
    if (!userData) { setLoading(false); return }
    setCurrentUser(userData)

    // Fetch all users in the family to resolve sender names
    const { data: usersData } = await supabase.from('users').select('id, name').eq('family_id', userData.family_id)
    if (usersData) {
      const userMap: Record<string, string> = {}
      usersData.forEach((u: { id: string; name: string }) => { userMap[u.id] = u.name })
      setFamilyUsers(userMap)
    }

    await fetchMessages(userData, activeTab)
    setLoading(false)
  }, [supabase, router, activeTab, fetchMessages])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { scrollToBottom() }, [messages])

  useEffect(() => {
    if (currentUser) {
      fetchMessages(currentUser, activeTab)
    }
  }, [activeTab, currentUser, fetchMessages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return
    setSendingMsg(true)

    const { error } = await supabase.from('messages').insert({
      family_id: currentUser.family_id,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      content: newMessage.trim(),
      message_type: 'text',
      channel: activeTab === 'family_chat' ? 'family_chat' : null,
    })

    if (!error) {
      setNewMessage('')
      await fetchMessages(currentUser, activeTab)
    }
    setSendingMsg(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">{'\u2190'}</Link>
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
        </div>
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-[#FF6B35] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Messages
          </button>
          <button
            onClick={() => setActiveTab('family_chat')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'family_chat'
                ? 'bg-[#4ECDC4] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Family Chat
          </button>
        </div>
      </div>

      {/* Privacy banner for family chat */}
      {activeTab === 'family_chat' && (
        <div className="bg-[#4ECDC4]/10 border-b border-[#4ECDC4]/20 px-4 py-2 text-center">
          <p className="text-xs text-[#3a9e98] font-medium">
            {'\u{1F512}'} Parents can&apos;t see messages in Family Chat
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">{'\u{1F4AC}'}</div>
            <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%]`}>
                  {!isMe && (
                    <p className="text-xs text-gray-500 mb-1 ml-1">{msg.sender_name || familyUsers[msg.sender_id] || 'Unknown'}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-[#FF6B35] text-white rounded-br-md'
                      : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-right' : 'text-left'} text-gray-400`}>
                    {new Date(msg.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={activeTab === 'family_chat' ? 'Message family (private)...' : 'Type a message...'}
            className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm text-gray-900"
          />
          <button
            type="submit"
            disabled={sendingMsg || !newMessage.trim()}
            className="bg-[#FF6B35] text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#e55a2b] transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  )
}
