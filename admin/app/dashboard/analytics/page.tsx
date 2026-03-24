'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // User growth (cumulative)
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('created_at')
        .order('created_at', { ascending: true });

      const growthMap: Record<string, number> = {};
      let cumulative = 0;
      (allUsers ?? []).forEach((u: { created_at: string }) => {
        const day = u.created_at.slice(0, 10);
        cumulative++;
        growthMap[day] = cumulative;
      });
      // Fill in gaps for last 30 days
      const growthPoints: DailyPoint[] = [];
      let lastVal = 0;
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        if (growthMap[key] !== undefined) lastVal = growthMap[key];
        growthPoints.push({ date: key, value: lastVal });
      }
      setUserGrowth(growthPoints);

      // Check-in rate trend
      const { data: allParents } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'parent');
      const parentCount = allParents?.length ?? 1;

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
          value: Math.round((s.size / Math.max(parentCount, 1)) * 100),
        }))
      );

      // Mood distribution (all time)
      const { data: moods } = await supabaseAdmin.from('checkins').select('mood');
      const dist = { great: 0, ok: 0, not_great: 0 };
      (moods ?? []).forEach((m: { mood: string }) => {
        if (m.mood in dist) dist[m.mood as keyof typeof dist]++;
      });
      setMoodDist(dist);

      // Most active families
      const { data: families } = await supabaseAdmin.from('families').select('id, name');
      const familyCheckins: Record<string, { name: string; count: number }> = {};
      (families ?? []).forEach((f: { id: string; name: string }) => {
        familyCheckins[f.id] = { name: f.name, count: 0 };
      });

      const { data: allCheckins } = await supabaseAdmin
        .from('checkins')
        .select('user_id')
        .gte('checked_in_at', thirtyDaysAgo);

      const { data: userFamilyMap } = await supabaseAdmin.from('users').select('id, family_id');
      const ufMap: Record<string, string> = {};
      (userFamilyMap ?? []).forEach((u: { id: string; family_id: string }) => {
        ufMap[u.id] = u.family_id;
      });

      (allCheckins ?? []).forEach((c: { user_id: string }) => {
        const fid = ufMap[c.user_id];
        if (fid && familyCheckins[fid]) familyCheckins[fid].count++;
      });

      const sorted = Object.values(familyCheckins)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setTopFamilies(sorted.map((f) => ({ name: f.name, checkin_count: f.count })));

      // Plan distribution
      const { data: allFamilies } = await supabaseAdmin.from('families').select('plan');
      const plans: Record<string, number> = {};
      (allFamilies ?? []).forEach((f: { plan: string }) => {
        plans[f.plan] = (plans[f.plan] ?? 0) + 1;
      });
      setPlanDist(plans);

      setLoading(false);
    }
    load();
  }, []);

  const moodTotal = moodDist.great + moodDist.ok + moodDist.not_great || 1;
  const maxGrowth = Math.max(1, ...userGrowth.map((d) => d.value));
  const maxRate = Math.max(1, ...checkinRates.map((d) => d.value));
  const maxFamilyCount = Math.max(1, ...topFamilies.map((f) => f.checkin_count));

  if (loading) return <div className="text-gray-500">Loading analytics...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-gray-400 text-sm mt-1">Usage trends and insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth (30 Days)</h3>
          <div className="flex items-end gap-1 h-40">
            {userGrowth.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center" title={`${d.date}: ${d.value} users`}>
                <div
                  className="w-full bg-indigo-600 rounded-t min-h-[2px]"
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
              <div key={d.date} className="flex-1 flex flex-col items-center" title={`${d.date}: ${d.value}%`}>
                <div
                  className="w-full bg-green-600 rounded-t min-h-[2px]"
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
                    <div className={`${m.color} h-3 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
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
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${(f.checkin_count / maxFamilyCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Revenue: Plan Distribution</h3>
        <div className="flex gap-4 flex-wrap">
          {Object.entries(planDist).map(([plan, count]) => {
            const colors: Record<string, string> = {
              free: 'bg-gray-600',
              family: 'bg-blue-600',
              smart: 'bg-purple-600',
              premium: 'bg-amber-600',
            };
            return (
              <div key={plan} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                <div className={`w-3 h-3 rounded-full ${colors[plan] ?? 'bg-gray-500'}`} />
                <div>
                  <div className="text-sm font-medium text-white capitalize">{plan}</div>
                  <div className="text-xs text-gray-400">{count} families</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
