'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import StatsCard from '@/components/StatsCard';

interface DailyPoint {
  date: string;
  value: number;
}

interface FamilyActivity {
  name: string;
  checkin_count: number;
}

export default function AnalyticsPage() {
  const [userGrowth, setUserGrowth] = useState<DailyPoint[]>([]);
  const [checkinRates, setCheckinRates] = useState<DailyPoint[]>([]);
  const [moodDist, setMoodDist] = useState({ great: 0, ok: 0, not_great: 0 });
  const [topFamilies, setTopFamilies] = useState<FamilyActivity[]>([]);
  const [planDist, setPlanDist] = useState<Record<string, number>>({});
  const [activeFamiliesPerDay, setActiveFamiliesPerDay] = useState<DailyPoint[]>([]);
  const [avgDelay, setAvgDelay] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // ---- User Growth (cumulative, last 30 days) ----
        const { data: allUsers } = await supabaseAdmin
          .from('users')
          .select('created_at')
          .order('created_at', { ascending: true });

        const userList = (allUsers ?? []) as { created_at: string }[];
        setTotalUsers(userList.length);

        const growthMap: Record<string, number> = {};
        let cumulative = 0;
        userList.forEach((u) => {
          const day = u.created_at.slice(0, 10);
          cumulative++;
          growthMap[day] = cumulative;
        });
        const growthPoints: DailyPoint[] = [];
        let lastVal = 0;
        // Find the cumulative count before the 30-day window
        for (const [day, val] of Object.entries(growthMap)) {
          if (day < new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)) {
            lastVal = val;
          }
        }
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          if (growthMap[key] !== undefined) lastVal = growthMap[key];
          growthPoints.push({ date: key, value: lastVal });
        }
        setUserGrowth(growthPoints);

        // ---- Check-in Rate Trend (daily rate, 30 days) ----
        const { data: allParents } = await supabaseAdmin
          .from('users')
          .select('id, family_id, checkin_time')
          .eq('role', 'parent');
        const parentCount = Math.max((allParents?.length ?? 0), 1);

        const { data: recentCheckins } = await supabaseAdmin
          .from('checkins')
          .select('user_id, checked_in_at')
          .gte('checked_in_at', thirtyDaysAgo);

        const dailyCheckers: Record<string, Set<string>> = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
          dailyCheckers[d.toISOString().slice(0, 10)] = new Set();
        }
        (recentCheckins ?? []).forEach((c: { user_id: string; checked_in_at: string }) => {
          const day = c.checked_in_at.slice(0, 10);
          if (dailyCheckers[day]) dailyCheckers[day].add(c.user_id);
        });
        setCheckinRates(
          Object.entries(dailyCheckers).map(([date, s]) => ({
            date,
            value: Math.round((s.size / parentCount) * 100),
          }))
        );

        // ---- Active Families Per Day ----
        const { data: userFamilyData } = await supabaseAdmin.from('users').select('id, family_id');
        const ufMap: Record<string, string> = {};
        (userFamilyData ?? []).forEach((u: { id: string; family_id: string }) => {
          if (u.family_id) ufMap[u.id] = u.family_id;
        });

        const dailyFamilies: Record<string, Set<string>> = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
          dailyFamilies[d.toISOString().slice(0, 10)] = new Set();
        }
        (recentCheckins ?? []).forEach((c: { user_id: string; checked_in_at: string }) => {
          const day = c.checked_in_at.slice(0, 10);
          const fid = ufMap[c.user_id];
          if (fid && dailyFamilies[day]) dailyFamilies[day].add(fid);
        });
        setActiveFamiliesPerDay(
          Object.entries(dailyFamilies).map(([date, s]) => ({
            date,
            value: s.size,
          }))
        );

        // ---- Mood Distribution (all time) ----
        const { data: moods } = await supabaseAdmin.from('checkins').select('mood');
        const moodList = (moods ?? []) as { mood: string }[];
        setTotalCheckins(moodList.length);
        const dist = { great: 0, ok: 0, not_great: 0 };
        moodList.forEach((m) => {
          if (m.mood in dist) dist[m.mood as keyof typeof dist]++;
        });
        setMoodDist(dist);

        // ---- Most Active Families (30 days) ----
        const { data: families } = await supabaseAdmin.from('families').select('id, name');
        const familyCheckins: Record<string, { name: string; count: number }> = {};
        (families ?? []).forEach((f: { id: string; name: string }) => {
          familyCheckins[f.id] = { name: f.name, count: 0 };
        });

        (recentCheckins ?? []).forEach((c: { user_id: string }) => {
          const fid = ufMap[c.user_id];
          if (fid && familyCheckins[fid]) familyCheckins[fid].count++;
        });

        const sorted = Object.values(familyCheckins)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setTopFamilies(sorted.map((f) => ({ name: f.name, checkin_count: f.count })));

        // ---- Plan Distribution ----
        const { data: allFamilies } = await supabaseAdmin.from('families').select('plan');
        const plans: Record<string, number> = {};
        (allFamilies ?? []).forEach((f: { plan: string }) => {
          plans[f.plan] = (plans[f.plan] ?? 0) + 1;
        });
        setPlanDist(plans);

        // ---- Average Check-in Delay ----
        // Get recent checkins with user's scheduled time
        const { data: delayCheckins } = await supabaseAdmin
          .from('checkins')
          .select('checked_in_at, user_id')
          .gte('checked_in_at', thirtyDaysAgo)
          .limit(500);

        const parentSchedules: Record<string, string> = {};
        (allParents ?? []).forEach((p: { id: string; checkin_time: string | null }) => {
          if (p.checkin_time) parentSchedules[p.id] = p.checkin_time;
        });

        const delays: number[] = [];
        (delayCheckins ?? []).forEach((c: { checked_in_at: string; user_id: string }) => {
          const scheduled = parentSchedules[c.user_id];
          if (scheduled) {
            const parts = scheduled.split(':');
            if (parts.length >= 2) {
              const checkinDate = new Date(c.checked_in_at);
              const scheduledDate = new Date(c.checked_in_at);
              scheduledDate.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
              const diffMin = (checkinDate.getTime() - scheduledDate.getTime()) / (1000 * 60);
              if (diffMin >= 0 && diffMin < 1440) {
                delays.push(diffMin);
              }
            }
          }
        });
        setAvgDelay(delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const moodTotal = moodDist.great + moodDist.ok + moodDist.not_great || 1;
  const maxGrowth = Math.max(1, ...userGrowth.map((d) => d.value));
  const maxRate = Math.max(1, ...checkinRates.map((d) => d.value));
  const maxFamilyCount = Math.max(1, ...topFamilies.map((f) => f.checkin_count));
  const maxActiveFamilies = Math.max(1, ...activeFamiliesPerDay.map((d) => d.value));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-xl p-6">
        <h3 className="text-red-400 font-medium">Error loading analytics</h3>
        <p className="text-red-400/70 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-gray-400 text-sm mt-1">Usage trends and insights</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon="👤" value={totalUsers} label="Total Users" />
        <StatsCard icon="✅" value={totalCheckins} label="Total Check-ins" />
        <StatsCard
          icon="📊"
          value={checkinRates.length > 0 ? `${checkinRates[checkinRates.length - 1].value}%` : '0%'}
          label="Today's Rate"
        />
        <StatsCard
          icon="⏱️"
          value={avgDelay !== null ? `${avgDelay}m` : 'N/A'}
          label="Avg Check-in Delay"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth (30 Days)</h3>
          <div className="flex items-end gap-1 h-40">
            {userGrowth.map((d) => (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center"
                title={`${d.date}: ${d.value} users`}
              >
                <div
                  className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-t min-h-[2px] transition-colors"
                  style={{ height: `${(d.value / maxGrowth) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-600">
            <span>{userGrowth[0]?.date.slice(5)}</span>
            <span>{userGrowth[userGrowth.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        {/* Check-in Rate Trend */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Check-in Rate Trend (30 Days)</h3>
          <div className="flex items-end gap-1 h-40">
            {checkinRates.map((d) => (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center"
                title={`${d.date}: ${d.value}%`}
              >
                <div
                  className="w-full bg-green-600 hover:bg-green-500 rounded-t min-h-[2px] transition-colors"
                  style={{ height: `${(d.value / maxRate) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-600">
            <span>{checkinRates[0]?.date.slice(5)}</span>
            <span>{checkinRates[checkinRates.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Mood Distribution (All Time)</h3>
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
        </div>

        {/* Active Families Per Day */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Active Families Per Day (30 Days)</h3>
          <div className="flex items-end gap-1 h-40">
            {activeFamiliesPerDay.map((d) => (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center"
                title={`${d.date}: ${d.value} families`}
              >
                <div
                  className="w-full bg-purple-600 hover:bg-purple-500 rounded-t min-h-[2px] transition-colors"
                  style={{ height: `${(d.value / maxActiveFamilies) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-600">
            <span>{activeFamiliesPerDay[0]?.date.slice(5)}</span>
            <span>{activeFamiliesPerDay[activeFamiliesPerDay.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        {/* Most Active Families */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Most Active Families (30 Days)</h3>
          {topFamilies.length === 0 ? (
            <p className="text-gray-500 text-sm">No data</p>
          ) : (
            <div className="space-y-3">
              {topFamilies.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{f.name}</span>
                      <span className="text-xs text-gray-500">{f.checkin_count} check-ins</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${(f.checkin_count / maxFamilyCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan Distribution */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Plan Distribution</h3>
          {Object.keys(planDist).length === 0 ? (
            <p className="text-gray-500 text-sm">No families</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(planDist)
                .sort((a, b) => b[1] - a[1])
                .map(([plan, count]) => {
                  const totalFamilies = Object.values(planDist).reduce((a, b) => a + b, 0);
                  const pct = Math.round((count / Math.max(totalFamilies, 1)) * 100);
                  const colors: Record<string, { bar: string; text: string }> = {
                    free: { bar: 'bg-gray-500', text: 'text-gray-300' },
                    family: { bar: 'bg-blue-500', text: 'text-blue-400' },
                    smart: { bar: 'bg-purple-500', text: 'text-purple-400' },
                    premium: { bar: 'bg-amber-500', text: 'text-amber-400' },
                  };
                  const c = colors[plan] ?? colors.free;
                  return (
                    <div key={plan}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm capitalize ${c.text}`}>{plan}</span>
                        <span className="text-sm text-gray-400">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className={`${c.bar} h-2 rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
