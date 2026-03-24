'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import StatsCard from '@/components/StatsCard';

interface CheckinRow {
  id: string;
  mood: string;
  checked_in_at: string;
  question_answer: string | null;
  users: { name: string; role: string } | null;
}

interface DailyCount {
  date: string;
  count: number;
}

export default function CheckinsPage() {
  const [todayCheckins, setTodayCheckins] = useState<CheckinRow[]>([]);
  const [missedParents, setMissedParents] = useState<{ name: string; phone: string }[]>([]);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [checkinRate, setCheckinRate] = useState(0);
  const [totalParents, setTotalParents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Today's check-ins
      const { data: todayData } = await supabaseAdmin
        .from('checkins')
        .select('id, mood, checked_in_at, question_answer, users(name, role)')
        .gte('checked_in_at', todayStart)
        .order('checked_in_at', { ascending: false });
      setTodayCheckins((todayData as unknown as CheckinRow[]) ?? []);

      // All parents
      const { data: allParents } = await supabaseAdmin
        .from('users')
        .select('id, name, phone')
        .eq('role', 'parent');
      setTotalParents(allParents?.length ?? 0);

      // For missed parents, get user_ids from checkins today
      const { data: checkedInToday } = await supabaseAdmin
        .from('checkins')
        .select('user_id')
        .gte('checked_in_at', todayStart);
      const checkedInUserIds = new Set((checkedInToday ?? []).map((c: { user_id: string }) => c.user_id));

      const missed = (allParents ?? []).filter((p: { id: string }) => !checkedInUserIds.has(p.id));
      setMissedParents(missed as { name: string; phone: string }[]);

      // Check-in rate
      const parentCount = allParents?.length ?? 1;
      setCheckinRate(Math.round((checkedInUserIds.size / Math.max(parentCount, 1)) * 100));

      // Daily counts for last 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: allRecent } = await supabaseAdmin
        .from('checkins')
        .select('checked_in_at')
        .gte('checked_in_at', thirtyDaysAgo)
        .order('checked_in_at', { ascending: true });

      const countMap: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        countMap[key] = 0;
      }
      (allRecent ?? []).forEach((c: { checked_in_at: string }) => {
        const key = c.checked_in_at.slice(0, 10);
        if (countMap[key] !== undefined) countMap[key]++;
      });
      setDailyCounts(Object.entries(countMap).map(([date, count]) => ({ date, count })));

      setLoading(false);
    }
    load();
  }, []);

  const moodEmoji: Record<string, string> = { great: '😊', ok: '😐', not_great: '😟' };
  const maxCount = Math.max(1, ...dailyCounts.map((d) => d.count));

  if (loading) return <div className="text-gray-500">Loading check-ins...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Check-in Monitoring</h2>
        <p className="text-gray-400 text-sm mt-1">Daily check-in overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard icon="✅" value={todayCheckins.length} label="Check-ins Today" />
        <StatsCard icon="📊" value={`${checkinRate}%`} label="Check-in Rate" />
        <StatsCard icon="⚠️" value={missedParents.length} label={`Missed (of ${totalParents} parents)`} />
      </div>

      {/* Chart: check-ins per day */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Check-ins Per Day (Last 30 Days)</h3>
        <div className="flex items-end gap-1 h-40">
          {dailyCounts.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
              <div
                className="w-full bg-indigo-600 rounded-t min-h-[2px]"
                style={{ height: `${(d.count / maxCount) * 100}%` }}
              />
              {dailyCounts.length <= 15 && (
                <span className="text-[10px] text-gray-600 rotate-45 origin-left">{d.date.slice(5)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Check-ins */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Today&apos;s Check-ins ({todayCheckins.length})
          </h3>
          {todayCheckins.length === 0 ? (
            <p className="text-gray-500 text-sm">No check-ins today yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {todayCheckins.map((c) => (
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
                  <span className="text-xs text-gray-500">{new Date(c.checked_in_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missed Check-ins */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Missed Check-ins ({missedParents.length})
          </h3>
          {missedParents.length === 0 ? (
            <p className="text-green-400 text-sm">All parents have checked in!</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {missedParents.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg">
                  <span className="text-sm text-white">{p.name}</span>
                  <span className="text-xs text-gray-500">{p.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
