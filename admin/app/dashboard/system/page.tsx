'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface TableSize {
  table_name: string;
  row_count: number;
  total_size: string;
}

export default function SystemPage() {
  const [tableSizes, setTableSizes] = useState<TableSize[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Get table stats via RPC or direct count
      const tables = ['families', 'users', 'checkins', 'sos_events', 'messages'];
      const sizes: TableSize[] = [];

      for (const table of tables) {
        const { count } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true });
        sizes.push({
          table_name: table,
          row_count: count ?? 0,
          total_size: '-',
        });
      }

      // Try pg_stat query for actual sizes
      const { data: pgData } = await supabaseAdmin.rpc('exec_sql', {
        query: `
          SELECT
            relname as table_name,
            n_live_tup as row_count,
            pg_size_pretty(pg_total_relation_size(relid)) as total_size
          FROM pg_stat_user_tables
          WHERE schemaname = 'public'
          ORDER BY pg_total_relation_size(relid) DESC
        `,
      });

      if (pgData && Array.isArray(pgData)) {
        setTableSizes(pgData as TableSize[]);
      } else {
        setTableSizes(sizes);
      }

      setLoading(false);
    }
    load();
  }, []);

  const edgeFunctions = [
    { name: 'send-checkin-reminder', status: 'deployed', lastDeploy: '2026-03-20' },
    { name: 'process-sos-alert', status: 'deployed', lastDeploy: '2026-03-18' },
    { name: 'daily-digest', status: 'deployed', lastDeploy: '2026-03-15' },
    { name: 'push-notification', status: 'deployed', lastDeploy: '2026-03-20' },
  ];

  const envVars = [
    { name: 'SUPABASE_URL', configured: true },
    { name: 'SUPABASE_ANON_KEY', configured: true },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', configured: true },
    { name: 'EXPO_PUSH_TOKEN', configured: true },
    { name: 'TWILIO_SID', configured: false },
    { name: 'TWILIO_AUTH_TOKEN', configured: false },
    { name: 'STRIPE_SECRET_KEY', configured: false },
    { name: 'SENTRY_DSN', configured: false },
  ];

  if (loading) return <div className="text-gray-500">Loading system info...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">System Settings</h2>
        <p className="text-gray-400 text-sm mt-1">Database, functions, and configuration</p>
      </div>

      {/* Database Tables */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Database Tables</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Row Count</th>
                <th className="px-4 py-3">Total Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tableSizes.map((t) => (
                <tr key={t.table_name} className="hover:bg-gray-800">
                  <td className="px-4 py-3 text-white font-mono">{t.table_name}</td>
                  <td className="px-4 py-3 text-gray-300">{t.row_count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{t.total_size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edge Functions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Edge Functions</h3>
        <div className="space-y-3">
          {edgeFunctions.map((fn) => (
            <div key={fn.name} className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-white font-mono">{fn.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">Deployed: {fn.lastDeploy}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-green-900/50 text-green-400">
                  {fn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Environment Variables</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {envVars.map((v) => (
            <div key={v.name} className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-300 font-mono">{v.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  v.configured
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-red-900/50 text-red-400'
                }`}
              >
                {v.configured ? 'Set' : 'Missing'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Maintenance Mode</h3>
            <p className="text-sm text-gray-400 mt-1">
              When enabled, the app shows a maintenance message to all users.
            </p>
          </div>
          <button
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              maintenanceMode ? 'bg-red-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                maintenanceMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {maintenanceMode && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">
              Maintenance mode is ON (mock). In production, this would toggle a flag in the database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
