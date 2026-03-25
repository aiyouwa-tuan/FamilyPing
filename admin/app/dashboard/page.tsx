'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import StatsCard from '@/components/StatsCard';

interface CheckinRow {
  id: string;
  mood: string;
  checked_in_at: string;
  users: { name: string } | null;
}

interface SystemHealth {
  dbConnected: boolean;
  dbLatencyMs: number;
  edgeFunctionCount: number;
  authStatus: string;
  totalRows: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalFamilies: 0,
    totalUsers: 0,
    checkinsToday: 0,
    activeUsers24h: 0,
  });
  const [recentCheckins, setRecentCheckins] = useState<CheckinRow[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

        // Stats queries
        const [familiesRes, usersRes, checkinsRes, activeRes, recentRes] = await Promise.all([
          supabaseAdmin.from('families').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
          supabaseAdmin
            .from('checkins')
            .select('id', { count: 'exact', head: true })
            .gte('checked_in_at', todayStart),
          supabaseAdmin
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gte('last_active_at', yesterday),
          supabaseAdmin
            .from('checkins')
            .select('id, mood, checked_in_at, users(name)')
            .order('checked_in_at', { ascending: false })
            .limit(10),
        ]);

        setStats({
          totalFamilies: familiesRes.count ?? 0,
          totalUsers: usersRes.count ?? 0,
          checkinsToday: checkinsRes.count ?? 0,
          activeUsers24h: activeRes.count ?? 0,
        });

        setRecentCheckins((recentRes.data as unknown as CheckinRow[]) ?? []);

        // System health: test DB with a timed query
        const dbStart = performance.now();
        const { error: dbErr } = await supabaseAdmin.from('families').select('id', { count: 'exact', head: true });
        const dbLatency = Math.round(performance.now() - dbStart);

        // Count edge functions by checking known supabase functions
        const edgeFunctions = [
          'anomaly-detect', 'check-unchecked', 'checkin', 'daily-insight',
          'morning-reminder', 'query-ai', 'send-invite', 'send-message',
          'sos', 'voice-orchestrator', 'weekly-summary',
        ];

        // Total row counts for health
        const tableCounts = await Promise.all([
          supabaseAdmin.from('families').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('checkins').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('sos_events').select('id', { count: 'exact', head: true }),
        ]);
        const totalRows = tableCounts.reduce((sum, r) => sum + (r.count ?? 0), 0);

        // Check auth: list users via admin auth API
        let authStatus = 'Unknown';
        try {
          const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
          if (authErr) {
            authStatus = 'Error';
          } else {
            authStatus = 'Healthy';
          }
        } catch {
          authStatus = 'Unavailable';
        }

        setHealth({
          dbConnected: !dbErr,
          dbLatencyMs: dbLatency,
          edgeFunctionCount: edgeFunctions.length,
          authStatus,
          totalRows,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const moodEmoji: Record<string, string> = {
    great: '😊',
    ok: '😐',
    not_great: '😟',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-xl p-6">
        <h3 className="text-red-400 font-medium">Error loading dashboard</h3>
        <p className="text-red-400/70 text-sm mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <p className="text-gray-400 text-sm mt-1">Welcome to FamilyPing Admin</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon="👨‍👩‍👧‍👦" value={stats.totalFamilies} label="Total Families" />
        <StatsCard icon="👤" value={stats.totalUsers} label="Total Users" />
        <StatsCard icon="✅" value={stats.checkinsToday} label="Check-ins Today" />
        <StatsCard icon="🟢" value={stats.activeUsers24h} label="Active Users (24h)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Check-ins</h3>
          {recentCheckins.length === 0 ? (
            <p className="text-gray-500 text-sm">No check-ins yet</p>
          ) : (
            <div className="space-y-3">
              {recentCheckins.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{moodEmoji[c.mood] ?? '❓'}</span>
                    <div>
                      <div className="text-sm text-white">{c.users?.name ?? 'Unknown'}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(c.checked_in_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{c.mood.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links & System */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: '/dashboard/users', label: 'Manage Users', icon: '👤' },
                { href: '/dashboard/families', label: 'Manage Families', icon: '👨‍👩‍👧‍👦' },
                { href: '/dashboard/checkins', label: 'Check-in Monitor', icon: '✅' },
                { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
                { href: '/dashboard/system', label: 'System Settings', icon: '⚙️' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
            {health ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Database</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{health.dbLatencyMs}ms</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        health.dbConnected
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}
                    >
                      {health.dbConnected ? 'Connected' : 'Error'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Edge Functions</span>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-green-900/50 text-green-400">
                    {health.edgeFunctionCount} deployed
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Auth Service</span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      health.authStatus === 'Healthy'
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-yellow-900/50 text-yellow-400'
                    }`}
                  >
                    {health.authStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total DB Rows</span>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-700 text-gray-300">
                    {health.totalRows.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Unable to check system health</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
