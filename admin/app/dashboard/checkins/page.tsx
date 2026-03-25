'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import StatsCard from '@/components/StatsCard';

interface CheckinRow {
  id: string;
  mood: string;
  checked_in_at: string;
  question_answer: string | null;
  checkin_time: string | null;
  users: { name: string; role: string; checkin_time: string | null } | null;
}

interface DailyCount {
  date: string;
  count: number;
  rate: number;
}

export default function CheckinsPage() {
  const [todayCheckins, setTodayCheckins] = useState<CheckinRow[]>([]);
  const [missedParents, setMissedParents] = useState<{ name: string; phone: string; checkin_time: string | null }[]>([]);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [checkinRate, setCheckinRate] = useState(0);
  const [totalParents, setTotalParents] = useState(0);
  const [moodDist, setMoodDist] = useState({ great: 0, ok: 0, not_great: 0 });
  const [avgDelayMin, setAvgDelayMin] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        // Today's check-ins with user info
        const { data: todayData } = await supabaseAdmin
          .from('checkins')
          .select('id, mood, checked_in_at, question_answer, users(name, role, checkin_time)')
          .gte('checked_in_at', todayStart)
          .order('checked_in_at', { ascending: false });
        const todayRows = (todayData as unknown as CheckinRow[]) ?? [];
        setTodayCheckins(todayRows);

        // Mood distribution for today
        const todayMoods = { great: 0, ok: 0, not_great: 0 };
        todayRows.forEach((c) => {
          if (c.mood in todayMoods) todayMoods[c.mood as keyof typeof todayMoods]++;
        });
        setMoodDist(todayMoods);

        // All parents
        const { data: allParents } = await supabaseAdmin
          .from('users')
          .select('id, name, phone, checkin_time')
          .eq('role', 'parent');
        const parentsList = (allParents ?? []) as { id: string; name: string; phone: string; checkin_time: string | null }[];
        setTotalParents(parentsList.length);

        // Checked-in user_ids today
        const { data: checkedInToday } = await supabaseAdmin
          .from('checkins')
          .select('user_id')
          .gte('checked_in_at', todayStart);
        const checkedInUserIds = new Set(
          (checkedInToday ?? []).map((c: { user_id: string }) => c.user_id)
        );

        // Missed parents
        const missed = parentsList.filter((p) => !checkedInUserIds.has(p.id));
        setMissedParents(missed);

        // Check-in rate
        const parentCount = Math.max(parentsList.length, 1);
        setCheckinRate(Math.round((checkedInUserIds.size / parentCount) * 100));

        // Average delay: compare checked_in_at with user's checkin_time
        const delays: number[] = [];
        todayRows.forEach((c) => {
          if (c.users?.checkin_time && c.checked_in_at) {
            const scheduledParts = c.users.checkin_time.split(':');
            if (scheduledParts.length >= 2) {
              const scheduled = new Date(c.checked_in_at);
              scheduled.setHours(parseInt(scheduledParts[0]), parseInt(scheduledParts[1]), 0, 0);
              const actual = new Date(c.checked_in_at);
              const diffMin = (actual.getTime() - scheduled.getTime()) / (1000 * 60);
              if (diffMin >= 0 && diffMin < 1440) {
                delays.push(diffMin);
              }
            }
          }
        });
        setAvgDelayMin(delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : null);

        // Daily counts for last 30 days
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: allRecent } = await supabaseAdmin
          .from('checkins')
          .select('checked_in_at, user_id')
          .gte('checked_in_at', thirtyDaysAgo)
          .order('checked_in_at', { ascending: true });

        const countMap: Record<string, { count: number; users: Set<string> }> = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          countMap[key] = { count: 0, users: new Set() };
        }
        (allRecent ?? []).forEach((c: { checked_in_at: string; user_id: string }) => {
          const key = c.checked_in_at.slice(0, 10);
          if (countMap[key]) {
            countMap[key].count++;
            countMap[key].users.add(c.user_id);
          }
        });
        setDailyCounts(
          Object.entries(countMap).map(([date, v]) => ({
            date,
            count: v.count,
            rate: Math.round((v.users.size / parentCount) * 100),
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load check-ins');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const moodEmoji: Record<string, string> = { great: '😊', ok: '😐', not_great: '😟' };
  const maxCount = Math.max(1, ...dailyCounts.map((d) => d.count));
  const moodTotal = moodDist.great + moodDist.ok + moodDist.not_great || 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading check-ins...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-xl p-6">
        <h3 className="text-red-400 font-medium">Error loading check-ins</h3>
        <p className="text-red-400/70 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Check-in Monitoring</h2>
        <p className="text-gray-400 text-sm mt-1">Daily check-in overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon="✅" value={todayCheckins.length} label="Check-ins Today" />
        <StatsCard icon="📊" value={`${checkinRate}%`} label="Check-in Rate" />
        <StatsCard icon="⚠️" value={missedParents.length} label={`Missed (of ${totalParents})`} />
        <StatsCard
          icon="⏱️"
          value={avgDelayMin !== null ? `${avgDelayMin}m` : 'N/A'}
          label="Avg Check-in Delay"
        />
      </div>

      {/* 30-Day Check-in Trend (bar chart) */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Check-ins Per Day (Last 30 Days)</h3>
        <div className="flex items-end gap-1 h-40">
          {dailyCounts.map((d) => (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center gap-1 group relative"
              title={`${d.date}: ${d.count} check-ins (${d.rate}% rate)`}
            >
              <div
                className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-t min-h-[2px] transition-colors"
                style={{ height: `${(d.count / maxCount) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-600">
          <span>{dailyCounts[0]?.date.slice(5)}</span>
          <span>{dailyCounts[Math.floor(dailyCounts.length / 2)]?.date.slice(5)}</span>
          <span>{dailyCounts[dailyCounts.length - 1]?.date.slice(5)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Check-ins */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Today&apos;s Check-ins ({todayCheckins.length})
          </h3>
          {todayCheckins.length === 0 ? (
            <p className="text-gray-500 text-sm">No check-ins today yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {todayCheckins.map((c) => {
                // Calculate delay if possible
                let delayStr = '';
                if (c.users?.checkin_time && c.checked_in_at) {
                  const parts = c.users.checkin_time.split(':');
                  if (parts.length >= 2) {
                    const scheduled = new Date(c.checked_in_at);
                    scheduled.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
                    const actual = new Date(c.checked_in_at);
                    const diffMin = Math.round((actual.getTime() - scheduled.getTime()) / (1000 * 60));
                    if (diffMin >= 0 && diffMin < 1440) {
                      delayStr = diffMin > 0 ? `+${diffMin}m` : 'on time';
                    }
                  }
                }

                return (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{moodEmoji[c.mood] ?? '?'}</span>
                      <div>
                        <div className="text-sm text-white">{c.users?.name ?? 'Unknown'}</div>
                        {c.question_answer && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{c.question_answer}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {delayStr && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            delayStr === 'on time'
                              ? 'bg-green-900/50 text-green-400'
                              : 'bg-yellow-900/50 text-yellow-400'
                          }`}
                        >
                          {delayStr}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(c.checked_in_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mood Distribution (today) */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Mood Distribution</h3>
          <div className="space-y-4">
            {[
              { key: 'great', label: 'Great', color: 'bg-green-500', emoji: '😊' },
              { key: 'ok', label: 'OK', color: 'bg-yellow-500', emoji: '😐' },
              { key: 'not_great', label: 'Not Great', color: 'bg-red-500', emoji: '😟' },
            ].map((m) => {
              const count = moodDist[m.key as keyof typeof moodDist];
              const pct = Math.round((count / moodTotal) * 100);
              return (
                <div key={m.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">
                      {m.emoji} {m.label}
                    </span>
                    <span className="text-sm text-gray-400">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className={`${m.color} h-3 rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {todayCheckins.length === 0 && (
            <p className="text-gray-600 text-xs mt-3">No data for today yet</p>
          )}
        </div>
      </div>

      {/* Missed Check-ins */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Missed Check-ins Today ({missedParents.length})
        </h3>
        {missedParents.length === 0 ? (
          <p className="text-green-400 text-sm">All parents have checked in today!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {missedParents.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg"
              >
                <div>
                  <span className="text-sm text-white">{p.name}</span>
                  {p.checkin_time && (
                    <span className="text-xs text-gray-500 ml-2">scheduled: {p.checkin_time}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{p.phone}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
