'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@/lib/types'

type VideoCategory = 'exercise' | 'meditation' | 'cooking' | 'nature' | 'faith'

interface VideoItem {
  id: string
  youtubeId: string
  title: string
  duration: string
  category: VideoCategory
}

const CATEGORY_META: Record<VideoCategory, { emoji: string; label: string; gradient: string }> = {
  exercise: { emoji: '🪑', label: 'Chair Exercise', gradient: 'linear-gradient(135deg, #FF6B35, #FF8F65)' },
  meditation: { emoji: '😌', label: 'Relaxation', gradient: 'linear-gradient(135deg, #4ECDC4, #7EDDD6)' },
  cooking: { emoji: '🍲', label: 'Easy Cooking', gradient: 'linear-gradient(135deg, #FFD166, #FFE0A0)' },
  nature: { emoji: '🌿', label: 'Nature', gradient: 'linear-gradient(135deg, #66BB6A, #81C784)' },
  faith: { emoji: '⛪', label: 'Faith', gradient: 'linear-gradient(135deg, #7E57C2, #B39DDB)' },
}

const VIDEOS: VideoItem[] = [
  // Seated Exercise — all chair-based for seniors
  { id: 'v1', youtubeId: '7Ao-w9wF4ek', title: 'Seated Chair Exercises for Seniors', duration: '15 min', category: 'exercise' },
  { id: 'v2', youtubeId: 'SVPi0MvYOqQ', title: '20 Min Chair Exercise for Seniors', duration: '20 min', category: 'exercise' },
  { id: 'v3', youtubeId: '0r8P2fwGoxE', title: 'Gentle Seated Stretches for Over 60s', duration: '12 min', category: 'exercise' },
  { id: 'v4', youtubeId: 'fJq4JRxZ8Pc', title: 'Chair Tai Chi for Seniors', duration: '18 min', category: 'exercise' },
  { id: 'v5', youtubeId: 'Y0J3SPdP18Q', title: 'Seated Balance Exercises for Elderly', duration: '10 min', category: 'exercise' },
  // Relaxation & Sleep
  { id: 'v6', youtubeId: '1ZYbU82GVz4', title: 'Calming Music for Elderly', duration: '60 min', category: 'meditation' },
  { id: 'v7', youtubeId: 'USbJ0VUcPb4', title: 'Gentle Guided Relaxation for Seniors', duration: '20 min', category: 'meditation' },
  { id: 'v8', youtubeId: 'aXItOY0sLRY', title: 'Sleep Music for Older Adults', duration: '45 min', category: 'meditation' },
  { id: 'v9', youtubeId: 'eKFTSSKCzWA', title: 'Nature Sounds for Relaxation', duration: '30 min', category: 'meditation' },
  // Easy Cooking
  { id: 'v10', youtubeId: 'GtL1huin9EE', title: 'Easy One-Pot Meals for Seniors', duration: '12 min', category: 'cooking' },
  { id: 'v11', youtubeId: '21ofoREnXbM', title: 'Simple Healthy Meals for One Person', duration: '15 min', category: 'cooking' },
  { id: 'v12', youtubeId: 'sXEnGkx5gMQ', title: 'No-Fuss Breakfast Ideas for Seniors', duration: '10 min', category: 'cooking' },
  { id: 'v13', youtubeId: 'I0t8ZAhb8e4', title: 'Easy Slow Cooker Recipes', duration: '20 min', category: 'cooking' },
  // Nature & Scenery
  { id: 'v14', youtubeId: 'Qm846KdZN_c', title: 'Beautiful Garden Tour', duration: '60 min', category: 'nature' },
  { id: 'v15', youtubeId: 'WHPEKLQID4U', title: 'Relaxing Ocean Waves', duration: '45 min', category: 'nature' },
  { id: 'v16', youtubeId: 'xNN7iTA57jM', title: 'Bird Watching Documentary', duration: '30 min', category: 'nature' },
  { id: 'v17', youtubeId: 'FkMWHmpOr48', title: 'Peaceful Countryside Walk', duration: '20 min', category: 'nature' },
  // Faith & Inspiration
  { id: 'v18', youtubeId: 'Q5HCYi0Tz8U', title: 'Morning Devotional for Seniors', duration: '15 min', category: 'faith' },
  { id: 'v19', youtubeId: 'pJLdJlSdCKc', title: 'Classic Hymns Collection', duration: '60 min', category: 'faith' },
  { id: 'v20', youtubeId: '0_YJqMiQZKs', title: 'Uplifting Stories of Hope', duration: '45 min', category: 'faith' },
]

const CATEGORIES: VideoCategory[] = ['exercise', 'meditation', 'cooking', 'nature', 'faith']

export default function WatchPage() {
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<VideoCategory>('exercise')
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        window.location.href = '/auth/login'
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .limit(1)
        .single()

      if (userData) setCurrentUser(userData)
      setLoading(false)
    }
    init()
  }, [supabase])

  const filteredVideos = VIDEOS.filter(v => v.category === activeCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-[#FF6B35] text-[24px] font-bold">Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-6">
        <p className="text-[24px] text-gray-500">User not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-24">
      <div className="max-w-lg mx-auto px-5 pt-8 space-y-6">

        {/* Greeting */}
        <div className="text-center">
          <h1 className="text-[32px] font-bold text-gray-900 leading-tight">
            {'\uD83D\uDCFA'} Watch Something Nice
          </h1>
          <p className="text-[20px] text-[#8D7B6E] mt-2">
            Videos picked just for you, {currentUser.name}
          </p>
        </div>

        {/* Now Watching Bar */}
        {playingVideo && (
          <div
            className="rounded-[24px] overflow-hidden"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            {/* YouTube Embed */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${playingVideo.youtubeId}?autoplay=1&rel=0`}
                title={playingVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {/* Now Watching Info */}
            <div className="bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-[#FF6B35] font-bold uppercase tracking-wide">Now Watching</p>
                  <p className="text-[20px] font-bold text-gray-900 mt-1 truncate">{playingVideo.title}</p>
                  <p className="text-[16px] text-[#8D7B6E] mt-1">
                    {CATEGORY_META[playingVideo.category].emoji} {CATEGORY_META[playingVideo.category].label} &middot; {playingVideo.duration}
                  </p>
                </div>
                <button
                  onClick={() => setPlayingVideo(null)}
                  className="ml-4 w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center text-[24px] hover:bg-gray-200 transition-colors flex-shrink-0"
                  aria-label="Close video"
                >
                  {'\u2715'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const meta = CATEGORY_META[cat]
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-6 py-4 rounded-full text-[18px] font-bold transition-colors min-h-[56px] ${
                  activeCategory === cat
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#FF6B35]'
                }`}
              >
                {meta.emoji} {meta.label}
              </button>
            )
          })}
        </div>

        {/* Video Cards */}
        <div className="space-y-4">
          {filteredVideos.map(video => {
            const meta = CATEGORY_META[video.category]
            const isPlaying = playingVideo?.id === video.id
            return (
              <button
                key={video.id}
                onClick={() => setPlayingVideo(video)}
                className={`w-full text-left rounded-[24px] overflow-hidden transition-all ${
                  isPlaying
                    ? 'ring-3 ring-[#FF6B35] shadow-lg'
                    : 'shadow-sm hover:shadow-md'
                }`}
                style={{ boxShadow: isPlaying ? '0 4px 16px rgba(255, 107, 53, 0.3)' : undefined }}
              >
                {/* Thumbnail placeholder */}
                <div
                  className="w-full h-[180px] flex items-center justify-center relative"
                  style={{ background: meta.gradient }}
                >
                  <span className="text-[64px] opacity-80">{meta.emoji}</span>
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-[72px] h-[72px] rounded-full bg-[#FF6B35] flex items-center justify-center"
                      style={{ boxShadow: '0 4px 16px rgba(255, 107, 53, 0.5)' }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <polygon points="8,4 20,12 8,20" />
                      </svg>
                    </div>
                  </div>
                  {/* Duration badge */}
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[14px] font-bold px-3 py-1 rounded-full">
                    {video.duration}
                  </div>
                </div>
                {/* Title area */}
                <div className="bg-white p-5">
                  <p className="text-[20px] font-bold text-gray-900 leading-snug">
                    {video.title}
                  </p>
                  <p className="text-[16px] text-[#8D7B6E] mt-1">
                    {meta.emoji} {meta.label}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

      </div>
    </div>
  )
}
